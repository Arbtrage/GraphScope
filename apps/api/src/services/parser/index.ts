import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  Kind,
  parse,
  print,
  visit,
  type DocumentNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type InlineFragmentNode,
  type OperationDefinitionNode,
} from "graphql";
import type { OperationType } from "@graphscope/shared-types";
import { createIgnoreMatcher, type IgnoreMatcher } from "../ignore-rules.js";

const execFileAsync = promisify(execFile);

export const PARSE_EXTENSIONS = new Set([".graphql", ".gql", ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);

export const SCAN_STEPS = [
  "Detecting GraphQL clients",
  "Indexing .graphql files",
  "Finding embedded operations",
  "Resolving fragments",
  "Building schema relationships",
  "Mapping source references",
] as const;

export type ScanStep = (typeof SCAN_STEPS)[number];

export interface ScanParseError {
  path: string;
  message: string;
}

export interface ScanReport {
  ignoredCount: number;
  skippedFiles: string[];
  parseErrors: ScanParseError[];
}

export interface ScanProgress {
  step: ScanStep;
  stats: {
    operations: number;
    fragments: number;
    types: number;
    endpoints: number;
    files: number;
  };
  report?: ScanReport;
}

export interface ParsedOp {
  name: string | null;
  operationType: OperationType;
  content: string;
  contentHash: string;
  filePath: string;
  startLine: number;
  endLine: number;
  confidence: number;
  fragmentSpreads: string[];
  namedTypes: string[];
  fields: Array<{ typeHint: string; name: string }>;
  variables: Record<string, unknown>;
  unused: boolean;
}

export interface ParsedFrag {
  name: string;
  content: string;
  contentHash: string;
  filePath: string;
  startLine: number;
  endLine: number;
  typeCondition: string | null;
  spreads: string[];
  duplicateOf?: string;
}

export interface ParsedType {
  name: string;
  kind: "OBJECT" | "INPUT" | "ENUM" | "INTERFACE" | "CONNECTION";
  fields: Array<{ name: string; returnType: string; deprecated?: boolean; reason?: string }>;
}

export interface ParsedFile {
  path: string;
  kind: "graphql" | "tsx" | "ts" | "test";
  operationNames: string[];
  fragmentNames: string[];
  referenceCount: number;
}

export interface ParsedUsage {
  operationName: string;
  filePath: string;
  line: number;
  kind: "component" | "page" | "test" | "hook";
}

export interface ParsedEndpoint {
  name: string;
  url: string;
  environment: string;
}

export interface ParsedEdge {
  source: string;
  target: string;
  relation: "uses" | "spreads" | "has" | "defined-in" | "used-by" | "executes";
}

export interface FileFingerprint {
  path: string;
  mtimeMs: number;
  sizeBytes: number;
  contentHash: string;
}

export interface ParsedSymbol {
  symbol: string;
  filePath: string;
  line: number;
  kind: ParsedUsage["kind"];
}

export interface FileParseResult {
  relativePath: string;
  fingerprint: FileFingerprint;
  operations: ParsedOp[];
  fragments: ParsedFrag[];
  symbols: ParsedSymbol[];
  parseErrors: ScanParseError[];
}

export interface IncrementalParseResult {
  operations: ParsedOp[];
  fragments: ParsedFrag[];
  types: ParsedType[];
  files: ParsedFile[];
  usages: ParsedUsage[];
  edges: ParsedEdge[];
  fingerprints: FileFingerprint[];
  symbols: ParsedSymbol[];
  changedPaths: string[];
  deletedPaths: string[];
  parseErrors: ScanParseError[];
}

export interface RepoParseResult {
  repoName: string;
  branch: string;
  clients: string[];
  operations: ParsedOp[];
  fragments: ParsedFrag[];
  types: ParsedType[];
  files: ParsedFile[];
  usages: ParsedUsage[];
  endpoints: ParsedEndpoint[];
  edges: ParsedEdge[];
  fingerprints: FileFingerprint[];
  symbols: ParsedSymbol[];
  ignoredCount: number;
  skippedFiles: string[];
  parseErrors: ScanParseError[];
}

function hashContent(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

export function hashFileContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function loadIgnorePatterns(rootDir: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(rootDir, ".graphscopeignore"), "utf-8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function walkDir(dir: string, root: string, matcher: IgnoreMatcher, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (matcher.ignores(rel)) continue;
    if (entry.isDirectory()) await walkDir(full, root, matcher, files);
    else if (PARSE_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
}

async function listParseCandidates(
  rootDir: string,
  matcher: IgnoreMatcher,
): Promise<{ files: string[]; ignoredCount: number; skippedFiles: string[] }> {
  const skippedFiles: string[] = [];
  try {
    await fs.access(path.join(rootDir, ".git"));
    const { stdout } = await execFileAsync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { cwd: rootDir, maxBuffer: 32 * 1024 * 1024, timeout: 30_000 },
    );
    const files: string[] = [];
    let ignoredCount = 0;
    for (const line of stdout.split("\0")) {
      const rel = line.trim().replace(/\\/g, "/");
      if (!rel || !PARSE_EXTENSIONS.has(path.extname(rel))) continue;
      if (matcher.ignores(rel)) {
        ignoredCount += 1;
        if (skippedFiles.length < 8) skippedFiles.push(rel);
        continue;
      }
      files.push(path.join(rootDir, rel));
    }
    return { files, ignoredCount, skippedFiles };
  } catch {
    const files: string[] = [];
    await walkDir(rootDir, rootDir, matcher, files);
    return { files, ignoredCount: 0, skippedFiles };
  }
}

function lineOf(source: string, index: number): number {
  return source.slice(0, Math.max(0, index)).split("\n").length;
}

function extractDocuments(content: string): Array<{ text: string; start: number; confidence: number }> {
  const found: Array<{ text: string; start: number; confidence: number }> = [];
  // Require a real tag identifier — avoid JSDoc/URL false positives like `/graphql`.
  const tagged = /(?<![\w$/])(?:gql|graphql)\s*`([\s\S]*?)`/gim;
  let match: RegExpExecArray | null;
  while ((match = tagged.exec(content)) !== null) {
    if (match[1] != null) {
      found.push({
        text: expandInterpolations(content, match[1]),
        start: match.index,
        confidence: 0.85,
      });
    }
  }
  const fn = /(?<![\w$/])graphql\s*\(\s*(['"`])([\s\S]*?)\1\s*\)/gim;
  while ((match = fn.exec(content)) !== null) {
    if (match[2] != null) {
      found.push({
        text: expandInterpolations(content, match[2]),
        start: match.index,
        confidence: 0.8,
      });
    }
  }
  return found;
}

/** Inline `${CONST}` from same-file string / gql template constants when possible. */
function expandInterpolations(fileContent: string, docText: string, depth = 0): string {
  if (!docText.includes("${") || depth > 4) return docText;
  return docText.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_full, name: string) => {
    const resolved = lookupTemplateConstant(fileContent, name, depth + 1);
    return resolved ?? "";
  });
}

function lookupTemplateConstant(content: string, name: string, depth = 0): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:export\\s+)?(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:(?:gql|graphql)\\s*)?\`([\\s\\S]*?)\``,
    "m",
  );
  const match = re.exec(content);
  if (!match?.[1]) return null;
  return expandInterpolations(content, match[1], depth);
}

function collectFromAst(
  ast: DocumentNode,
  filePath: string,
  source: string,
  confidence: number,
  ops: ParsedOp[],
  frags: ParsedFrag[],
) {
  for (const def of ast.definitions) {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      ops.push(operationFromDef(def, filePath, source, confidence));
    } else if (def.kind === Kind.FRAGMENT_DEFINITION) {
      frags.push(fragmentFromDef(def, filePath, source));
    }
  }
}

function operationFromDef(
  def: OperationDefinitionNode,
  filePath: string,
  source: string,
  confidence: number,
): ParsedOp {
  const content = print(def);
  const startLine = def.loc ? lineOf(source, def.loc.start) : 1;
  const endLine = def.loc ? lineOf(source, def.loc.end) : startLine;
  const opType = def.operation.toUpperCase() as OperationType;
  const fragmentSpreads: string[] = [];
  const namedTypes: string[] = [];
  const fields: Array<{ typeHint: string; name: string }> = [];
  const rootHint = opType === "MUTATION" ? "Mutation" : opType === "SUBSCRIPTION" ? "Subscription" : "Query";
  walkSelections(def, rootHint, fragmentSpreads, namedTypes, fields);
  const variables: Record<string, unknown> = {};
  for (const variable of def.variableDefinitions ?? []) {
    const name = variable.variable.name.value;
    variables[name] = defaultForType(print(variable.type));
  }
  return {
    name: def.name?.value ?? null,
    operationType: opType,
    content,
    contentHash: hashContent(content),
    filePath,
    startLine,
    endLine,
    confidence,
    fragmentSpreads: [...new Set(fragmentSpreads)],
    namedTypes: [...new Set(namedTypes)],
    fields,
    variables,
    unused: false,
  };
}

function fragmentFromDef(def: FragmentDefinitionNode, filePath: string, source: string): ParsedFrag {
  const content = print(def);
  const startLine = def.loc ? lineOf(source, def.loc.start) : 1;
  const endLine = def.loc ? lineOf(source, def.loc.end) : startLine;
  const spreads: string[] = [];
  visit(def, {
    FragmentSpread(node) {
      spreads.push(node.name.value);
    },
  });
  return {
    name: def.name.value,
    content,
    contentHash: hashContent(content),
    filePath,
    startLine,
    endLine,
    typeCondition: def.typeCondition.name.value,
    spreads: [...new Set(spreads)],
  };
}

function walkSelections(
  node: OperationDefinitionNode | FragmentDefinitionNode | FieldNode | InlineFragmentNode,
  typeHint: string,
  spreads: string[],
  namedTypes: string[],
  fields: Array<{ typeHint: string; name: string }>,
) {
  const selections =
    "selectionSet" in node && node.selectionSet
      ? node.selectionSet.selections
      : [];
  for (const sel of selections) {
    if (sel.kind === Kind.FIELD) {
      fields.push({ typeHint, name: sel.name.value });
      if (sel.selectionSet) walkSelections(sel, typeHint, spreads, namedTypes, fields);
    } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
      spreads.push(sel.name.value);
    } else if (sel.kind === Kind.INLINE_FRAGMENT) {
      const hint = sel.typeCondition?.name.value ?? typeHint;
      namedTypes.push(hint);
      if (sel.selectionSet) walkSelections(sel, hint, spreads, namedTypes, fields);
    }
  }
}

function defaultForType(typeName: string): unknown {
  const inner = typeName.replace(/[!\[\]]/g, "");
  if (inner === "Int" || inner === "Float") return 0;
  if (inner === "Boolean") return false;
  if (inner === "ID") return "";
  return "";
}

function tryParse(text: string): DocumentNode | null {
  try {
    return parse(text);
  } catch {
    return null;
  }
}

function fileKind(filePath: string): ParsedFile["kind"] {
  if (filePath.endsWith(".graphql") || filePath.endsWith(".gql")) return "graphql";
  if (/\.(test|spec)\.[jt]sx?$/.test(filePath) || filePath.includes("/__tests__/")) return "test";
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) return "tsx";
  return "ts";
}

function usageKind(filePath: string): ParsedUsage["kind"] {
  const lower = filePath.toLowerCase();
  if (/\.(test|spec)\.[jt]sx?$/.test(lower) || lower.includes("/__tests__/")) return "test";
  if (lower.includes("/hooks/") || /(^|\/)use[a-z0-9]+\.[jt]sx?$/.test(lower)) return "hook";
  if (lower.includes("/pages/") || lower.includes("/app/") || lower.includes("/routes/")) return "page";
  return "component";
}

async function detectClients(rootDir: string, files: string[]): Promise<string[]> {
  const clients = new Set<string>();
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["@apollo/client"] || deps.apollo) clients.add("Apollo");
    if (deps["relay-runtime"] || deps["react-relay"]) clients.add("Relay");
    if (deps["graphql-tag"]) clients.add("graphql-tag");
    if (deps.urql || deps["@urql/core"]) clients.add("urql");
    if (deps["graphql-request"]) clients.add("graphql-request");
    if (deps["@graphql-codegen/cli"]) clients.add("GraphQL Code Generator");
  } catch {
    /* no package.json */
  }
  for (const file of files) {
    if (file.endsWith(".graphql") || file.endsWith(".gql")) {
      clients.add(".graphql files");
      break;
    }
  }
  return [...clients];
}

async function detectEndpoints(rootDir: string, files: string[]): Promise<ParsedEndpoint[]> {
  const found = new Map<string, ParsedEndpoint>();
  const urlRe = /https?:\/\/[^\s"'`]+graphql[^\s"'`]*/gi;
  const assignRe = /(?:GRAPHQL_URL|GRAPHQL_ENDPOINT|VITE_GRAPHQL|NEXT_PUBLIC_GRAPHQL\w*)\s*=\s*['"]([^'"]+)['"]/g;
  const uriRe = /(?:uri|url)\s*:\s*['"]([^'"]*graphql[^'"]*)['"]/gi;
  const inspect = async (abs: string) => {
    let content: string;
    try {
      content = await fs.readFile(abs, "utf-8");
    } catch {
      return;
    }
    for (const re of [urlRe, assignRe, uriRe]) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(content)) !== null) {
        const url = (match[1] ?? match[0]).replace(/[),;]+$/, "");
        if (!url.includes("graphql") && !url.startsWith("http")) continue;
        const normalized = url.startsWith("http") ? url : `http://${url}`;
        if (found.has(normalized)) continue;
        const lower = normalized.toLowerCase();
        const environment = lower.includes("prod")
          ? "production"
          : lower.includes("stag")
            ? "staging"
            : "development";
        const name =
          environment === "production" ? "Production" : environment === "staging" ? "Staging" : "Development";
        found.set(normalized, { name, url: normalized, environment });
      }
    }
  };
  const extras = [".env", ".env.local", ".env.development", ".env.example"].map((name) => path.join(rootDir, name));
  for (const extra of extras) await inspect(extra);
  for (const file of files.slice(0, 400)) {
    if (CODE_EXTENSIONS.has(path.extname(file)) || file.endsWith(".env")) await inspect(file);
  }
  if (!found.size) {
    found.set("http://127.0.0.1:4000/graphql", {
      name: "Development",
      url: "http://127.0.0.1:4000/graphql",
      environment: "development",
    });
  }
  return [...found.values()];
}

async function gitBranch(rootDir: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: rootDir, timeout: 4000 });
    return stdout.trim() || "main";
  } catch {
    return "main";
  }
}

function extractSymbols(content: string, relativePath: string): ParsedSymbol[] {
  if (!CODE_EXTENSIONS.has(path.extname(relativePath))) return [];
  const symbols: ParsedSymbol[] = [];
  const re = /\b([A-Z][A-Za-z0-9_]{2,})\b/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = re.exec(content)) !== null) {
    const symbol = match[1]!;
    const key = `${symbol}:${lineOf(content, match.index)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    symbols.push({
      symbol,
      filePath: relativePath,
      line: lineOf(content, match.index),
      kind: usageKind(relativePath),
    });
  }
  return symbols;
}

export async function fingerprintPath(
  rootDir: string,
  relativePath: string,
): Promise<FileFingerprint | null> {
  const abs = path.join(rootDir, relativePath);
  try {
    const [stat, content] = await Promise.all([fs.stat(abs), fs.readFile(abs)]);
    if (!stat.isFile()) return null;
    return {
      path: relativePath.replace(/\\/g, "/"),
      mtimeMs: Math.trunc(stat.mtimeMs),
      sizeBytes: stat.size,
      contentHash: hashFileContent(content.toString("utf8")),
    };
  } catch {
    return null;
  }
}

export async function selectDirtyPaths(
  rootDir: string,
  candidates: string[],
  known: FileFingerprint[],
): Promise<{ dirty: string[]; deleted: string[]; clean: string[] }> {
  const knownByPath = new Map(known.map((item) => [item.path.replace(/\\/g, "/"), item]));
  const dirty: string[] = [];
  const clean: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const rel = candidate.replace(/\\/g, "/");
    seen.add(rel);
    const next = await fingerprintPath(rootDir, rel);
    if (!next) {
      dirty.push(rel);
      continue;
    }
    const prev = knownByPath.get(rel);
    if (
      prev &&
      prev.mtimeMs === next.mtimeMs &&
      prev.sizeBytes === next.sizeBytes &&
      prev.contentHash === next.contentHash
    ) {
      clean.push(rel);
    } else if (prev && prev.contentHash === next.contentHash) {
      clean.push(rel);
    } else {
      dirty.push(rel);
    }
  }

  const deleted = [...knownByPath.keys()].filter((pathKey) => !seen.has(pathKey));
  return { dirty, deleted, clean };
}

export async function parseFile(rootDir: string, relativePath: string): Promise<FileParseResult | null> {
  const abs = path.join(rootDir, relativePath);
  let content: string;
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    [content, stat] = await Promise.all([fs.readFile(abs, "utf-8"), fs.stat(abs)]);
  } catch {
    return null;
  }
  const rel = relativePath.replace(/\\/g, "/");
  const fingerprint: FileFingerprint = {
    path: rel,
    mtimeMs: Math.trunc(stat.mtimeMs),
    sizeBytes: stat.size,
    contentHash: hashFileContent(content),
  };
  const operations: ParsedOp[] = [];
  const fragments: ParsedFrag[] = [];
  const parseErrors: ScanParseError[] = [];
  const ext = path.extname(rel);
  if (ext === ".graphql" || ext === ".gql") {
    const ast = tryParse(content);
    if (ast) collectFromAst(ast, rel, content, 1, operations, fragments);
    else parseErrors.push({ path: rel, message: "Could not parse GraphQL document" });
  } else if (CODE_EXTENSIONS.has(ext)) {
    for (const doc of extractDocuments(content)) {
      const ast = tryParse(doc.text);
      if (!ast) {
        // Unresolved `${...}` or non-document templates — soft skip, not a hard repo error.
        if (/\$\{/.test(doc.text) || !/\b(query|mutation|subscription|fragment)\b/i.test(doc.text)) {
          continue;
        }
        parseErrors.push({ path: rel, message: "Could not parse embedded GraphQL" });
        continue;
      }
      collectFromAst(ast, rel, doc.text, doc.confidence, operations, fragments);
    }
  }
  return {
    relativePath: rel,
    fingerprint,
    operations,
    fragments,
    symbols: extractSymbols(content, rel),
    parseErrors,
  };
}

function buildTypes(operations: ParsedOp[], fragments: ParsedFrag[]): ParsedType[] {
  const typeMap = new Map<string, ParsedType>();
  const ensureType = (name: string, kind: ParsedType["kind"] = "OBJECT") => {
    let type = typeMap.get(name);
    if (!type) {
      type = { name, kind: name.endsWith("Connection") ? "CONNECTION" : kind, fields: [] };
      typeMap.set(name, type);
    }
    return type;
  };
  for (const hint of ["Query", "Mutation", "Subscription"]) ensureType(hint);
  for (const fragment of fragments) {
    if (fragment.typeCondition) ensureType(fragment.typeCondition);
  }
  for (const op of operations) {
    const root =
      op.operationType === "MUTATION" ? "Mutation" : op.operationType === "SUBSCRIPTION" ? "Subscription" : "Query";
    const type = ensureType(root);
    for (const field of op.fields) {
      const host = ensureType(field.typeHint || root);
      if (!host.fields.some((item) => item.name === field.name)) {
        host.fields.push({ name: field.name, returnType: "String" });
      }
      if (field.typeHint === root && !type.fields.some((item) => item.name === field.name)) {
        type.fields.push({ name: field.name, returnType: "String" });
      }
    }
    for (const named of op.namedTypes) ensureType(named);
  }
  return [...typeMap.values()];
}

function buildFilesOut(
  operations: ParsedOp[],
  fragments: ParsedFrag[],
  usages: ParsedUsage[],
): ParsedFile[] {
  const byPath = new Map<string, ParsedFile>();
  const touch = (filePath: string) => {
    let row = byPath.get(filePath);
    if (!row) {
      row = { path: filePath, kind: fileKind(filePath), operationNames: [], fragmentNames: [], referenceCount: 0 };
      byPath.set(filePath, row);
    }
    return row;
  };
  for (const op of operations) {
    const row = touch(op.filePath);
    if (op.name) row.operationNames.push(op.name);
  }
  for (const fragment of fragments) {
    touch(fragment.filePath).fragmentNames.push(fragment.name);
  }
  for (const usage of usages) {
    touch(usage.filePath).referenceCount += 1;
  }
  return [...byPath.values()];
}

function buildEdges(operations: ParsedOp[], fragments: ParsedFrag[], types: ParsedType[], usages: ParsedUsage[]): ParsedEdge[] {
  const edges: ParsedEdge[] = [];
  for (const op of operations) {
    if (!op.name) continue;
    const opKey = `op:${op.name}`;
    edges.push({ source: opKey, target: `file:${op.filePath}`, relation: "defined-in" });
    for (const spread of op.fragmentSpreads) {
      edges.push({ source: opKey, target: `frag:${spread}`, relation: "spreads" });
    }
    for (const named of op.namedTypes) {
      edges.push({ source: opKey, target: `type:${named}`, relation: "uses" });
    }
    const root =
      op.operationType === "MUTATION" ? "Mutation" : op.operationType === "SUBSCRIPTION" ? "Subscription" : "Query";
    edges.push({ source: opKey, target: `type:${root}`, relation: "uses" });
  }
  for (const fragment of fragments) {
    const fragKey = `frag:${fragment.name}`;
    if (fragment.typeCondition) {
      edges.push({ source: fragKey, target: `type:${fragment.typeCondition}`, relation: "uses" });
      for (const field of types.find((item) => item.name === fragment.typeCondition)?.fields ?? []) {
        edges.push({
          source: `type:${fragment.typeCondition}`,
          target: `field:${fragment.typeCondition}-${field.name}`,
          relation: "has",
        });
      }
    }
    for (const spread of fragment.spreads) {
      edges.push({ source: fragKey, target: `frag:${spread}`, relation: "spreads" });
    }
  }
  for (const type of types) {
    for (const field of type.fields) {
      edges.push({ source: `type:${type.name}`, target: `field:${type.name}-${field.name}`, relation: "has" });
    }
  }
  for (const usage of usages) {
    edges.push({ source: `op:${usage.operationName}`, target: `file:${usage.filePath}`, relation: "used-by" });
  }
  return edges;
}

export async function parseFiles(
  rootDir: string,
  relativePaths: string[],
  knownOpNames: string[] = [],
): Promise<IncrementalParseResult> {
  const operations: ParsedOp[] = [];
  const fragments: ParsedFrag[] = [];
  const fingerprints: FileFingerprint[] = [];
  const symbols: ParsedSymbol[] = [];
  const changedPaths: string[] = [];
  const parseErrors: ScanParseError[] = [];

  for (const rel of relativePaths) {
    const parsed = await parseFile(rootDir, rel);
    if (!parsed) continue;
    changedPaths.push(parsed.relativePath);
    fingerprints.push(parsed.fingerprint);
    operations.push(...parsed.operations);
    fragments.push(...parsed.fragments);
    symbols.push(...parsed.symbols);
    parseErrors.push(...parsed.parseErrors);
  }

  const fragByName = new Map<string, ParsedFrag>();
  for (const fragment of fragments) {
    const existing = fragByName.get(fragment.name);
    if (existing && existing.contentHash !== fragment.contentHash) {
      fragment.duplicateOf = existing.name;
    }
    if (!existing) fragByName.set(fragment.name, fragment);
  }

  const opNameSet = new Set([...knownOpNames, ...operations.map((op) => op.name).filter(Boolean)] as string[]);
  const usages: ParsedUsage[] = [];
  for (const symbol of symbols) {
    if (!opNameSet.has(symbol.symbol)) continue;
    if (operations.some((op) => op.name === symbol.symbol && op.filePath === symbol.filePath)) continue;
    usages.push({
      operationName: symbol.symbol,
      filePath: symbol.filePath,
      line: symbol.line,
      kind: symbol.kind,
    });
  }

  const usedNames = new Set(usages.map((item) => item.operationName));
  for (const op of operations) {
    if (op.name) op.unused = !usedNames.has(op.name);
  }

  const types = buildTypes(operations, fragments);
  const files = buildFilesOut(operations, fragments, usages);
  const edges = buildEdges(operations, fragments, types, usages);

  return {
    operations,
    fragments,
    types,
    files,
    usages,
    edges,
    fingerprints,
    symbols,
    changedPaths,
    deletedPaths: [],
    parseErrors,
  };
}

export async function parseRepository(
  rootDir: string,
  onProgress?: (progress: ScanProgress) => Promise<void> | void,
): Promise<RepoParseResult> {
  const matcher = await createIgnoreMatcher(rootDir);
  const candidates = await listParseCandidates(rootDir, matcher);
  const files = candidates.files;
  const repoName = path.basename(rootDir);
  const branch = await gitBranch(rootDir);
  let parseErrors: ScanParseError[] = [];

  const report = async (step: ScanStep, ops: ParsedOp[], frags: ParsedFrag[], types = 0, endpoints = 0, fileCount = 0) => {
    await onProgress?.({
      step,
      stats: {
        operations: ops.length,
        fragments: frags.length,
        types,
        endpoints,
        files: fileCount,
      },
      report: {
        ignoredCount: candidates.ignoredCount,
        skippedFiles: candidates.skippedFiles,
        parseErrors,
      },
    });
  };

  const clients = await detectClients(rootDir, files);
  await report("Detecting GraphQL clients", [], [], 0, 0, files.length);

  const relativePaths = files.map((file) => path.relative(rootDir, file).replace(/\\/g, "/"));
  const sliced = await parseFiles(rootDir, relativePaths);
  parseErrors = sliced.parseErrors;
  await report("Indexing .graphql files", sliced.operations, sliced.fragments, 0, 0, files.length);
  await report("Finding embedded operations", sliced.operations, sliced.fragments, 0, 0, files.length);
  await report("Resolving fragments", sliced.operations, sliced.fragments, 0, 0, files.length);
  await report(
    "Building schema relationships",
    sliced.operations,
    sliced.fragments,
    sliced.types.length,
    0,
    files.length,
  );

  // Full-repo usage pass for cold scan (more complete than symbol heuristic alone)
  const namedOps = sliced.operations.filter((op) => op.name);
  const usages: ParsedUsage[] = [...sliced.usages];
  const fileContents = new Map<string, string>();
  for (const file of files) {
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;
    const rel = path.relative(rootDir, file).replace(/\\/g, "/");
    const content = await fs.readFile(file, "utf-8");
    fileContents.set(rel, content);
  }
  for (const op of namedOps) {
    const name = op.name!;
    const ident = new RegExp(`\\b${name}\\b`);
    for (const [rel, content] of fileContents) {
      if (rel === op.filePath) continue;
      const idx = content.search(ident);
      if (idx === -1) continue;
      if (usages.some((u) => u.operationName === name && u.filePath === rel)) continue;
      usages.push({
        operationName: name,
        filePath: rel,
        line: lineOf(content, idx),
        kind: usageKind(rel),
      });
    }
  }
  const usedNames = new Set(usages.map((item) => item.operationName));
  for (const op of sliced.operations) {
    if (op.name) op.unused = !usedNames.has(op.name);
  }

  const endpoints = await detectEndpoints(rootDir, files);
  const filesOut = buildFilesOut(sliced.operations, sliced.fragments, usages);
  const edges = buildEdges(sliced.operations, sliced.fragments, sliced.types, usages);

  await report(
    "Mapping source references",
    sliced.operations,
    sliced.fragments,
    sliced.types.length,
    endpoints.length,
    filesOut.length,
  );

  return {
    repoName,
    branch,
    clients,
    operations: sliced.operations,
    fragments: sliced.fragments,
    types: sliced.types,
    files: filesOut,
    usages,
    endpoints,
    edges,
    ignoredCount: candidates.ignoredCount,
    skippedFiles: candidates.skippedFiles,
    parseErrors,
    fingerprints: sliced.fingerprints,
    symbols: sliced.symbols,
  };
}
