import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ParsedOperation } from "@graphscope/db";
import { getOperationName, getOperationType } from "../schema-check.js";

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const PARSE_EXTENSIONS = new Set([".graphql", ".gql", ".ts", ".tsx", ".js", ".jsx"]);

function hashContent(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

export async function loadIgnorePatterns(rootDir: string): Promise<string[]> {
  const ignorePath = path.join(rootDir, ".graphscopeignore");
  try {
    const raw = await fs.readFile(ignorePath, "utf-8");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function shouldIgnore(relativePath: string, patterns: string[]): boolean {
  for (const part of relativePath.split(path.sep)) {
    if (IGNORE_DIRS.has(part)) return true;
  }
  for (const pattern of patterns) {
    if (relativePath.includes(pattern.replace(/\*/g, ""))) return true;
  }
  return false;
}

async function walkDir(dir: string, root: string, patterns: string[], files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (shouldIgnore(rel, patterns)) continue;
    if (entry.isDirectory()) {
      await walkDir(full, root, patterns, files);
    } else if (PARSE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
}

function parseGraphqlFile(content: string, filePath: string): ParsedOperation[] {
  const ops: ParsedOperation[] = [];
  const trimmed = content.trim();
  if (!trimmed) return ops;
  try {
    const opType = getOperationType(trimmed);
    const opName = getOperationName(trimmed);
    ops.push({
      filePath,
      operationName: opName,
      operationType: opType,
      content: trimmed,
      contentHash: hashContent(trimmed),
      confidence: 1,
      startLine: 1,
      endLine: content.split("\n").length,
    });
  } catch {
    // skip invalid
  }
  return ops;
}

function parseTaggedTemplates(content: string, filePath: string): ParsedOperation[] {
  const ops: ParsedOperation[] = [];
  const regex = /(?:gql|graphql)\s*`([^`]+)`/gims;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const fragment = match[1]?.trim();
    if (!fragment || !fragment.includes("{")) continue;
    const before = content.slice(0, match.index);
    const startLine = before.split("\n").length;
    const endLine = startLine + fragment.split("\n").length - 1;
    try {
      const opType = getOperationType(fragment);
      const opName = getOperationName(fragment);
      ops.push({
        filePath,
        operationName: opName,
        operationType: opType,
        content: fragment,
        contentHash: hashContent(fragment),
        confidence: 0.85,
        startLine,
        endLine,
      });
    } catch {
      // skip
    }
  }
  return ops;
}

export async function parseRepository(rootDir: string): Promise<ParsedOperation[]> {
  const patterns = await loadIgnorePatterns(rootDir);
  const files: string[] = [];
  await walkDir(rootDir, rootDir, patterns, files);
  const results: ParsedOperation[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const rel = path.relative(rootDir, file);
    const ext = path.extname(file);
    if (ext === ".graphql" || ext === ".gql") {
      results.push(...parseGraphqlFile(content, rel));
    } else {
      results.push(...parseTaggedTemplates(content, rel));
    }
  }
  return results;
}
