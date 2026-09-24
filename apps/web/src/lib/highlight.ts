import type { CodeLanguage } from "@/lib/format-code";

export type TokenKind =
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "comment"
  | "punct"
  | "text"
  | "property"
  | "operator";

export interface Token {
  kind: TokenKind;
  value: string;
}

const GRAPHQL_KEYWORDS = new Set([
  "query",
  "mutation",
  "subscription",
  "fragment",
  "on",
  "type",
  "input",
  "enum",
  "interface",
  "union",
  "scalar",
  "schema",
  "extend",
  "implements",
  "true",
  "false",
  "null",
  "directive",
  "repeatable",
]);

const JS_KEYWORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "async",
  "await",
  "of",
  "from",
  "as",
  "type",
  "interface",
  "enum",
  "implements",
  "readonly",
  "public",
  "private",
  "protected",
  "static",
  "abstract",
  "declare",
  "namespace",
  "module",
  "satisfies",
]);

const SHELL_KEYWORDS = new Set([
  "curl",
  "wget",
  "echo",
  "export",
  "cd",
  "ls",
  "cat",
  "grep",
  "sed",
  "awk",
  "if",
  "then",
  "else",
  "fi",
  "for",
  "do",
  "done",
  "while",
  "case",
  "esac",
  "function",
  "return",
  "true",
  "false",
  "sudo",
  "npm",
  "pnpm",
  "yarn",
  "node",
  "git",
]);

export function highlightCode(source: string, language: CodeLanguage = "text"): Token[][] {
  if (language === "graphql") return source.split("\n").map((line) => tokenizeGraphql(line));
  if (language === "json") return source.split("\n").map((line) => tokenizeJson(line));
  if (language === "javascript" || language === "typescript") {
    return source.split("\n").map((line) => tokenizeScript(line));
  }
  if (language === "shell") return source.split("\n").map((line) => tokenizeShell(line));
  return source.split("\n").map((line) => [{ kind: "text", value: line || " " }]);
}

/** @deprecated use highlightCode(..., "graphql") */
export function highlightGraphql(source: string): Token[][] {
  return highlightCode(source, "graphql");
}

/** @deprecated use highlightCode(..., "json") */
export function highlightJson(source: string): Token[][] {
  return highlightCode(source, "json");
}

function tokenizeGraphql(line: string): Token[] {
  return tokenizeGeneric(line, {
    keywords: GRAPHQL_KEYWORDS,
    lineComment: "#",
    capitalizeTypes: true,
  });
}

function tokenizeScript(line: string): Token[] {
  return tokenizeGeneric(line, {
    keywords: JS_KEYWORDS,
    lineComment: "//",
    capitalizeTypes: true,
  });
}

function tokenizeShell(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith("#")) {
      tokens.push({ kind: "comment", value: rest });
      break;
    }
    if (rest.startsWith("\\")) {
      tokens.push({ kind: "punct", value: rest[0]! });
      i += 1;
      continue;
    }
    const str = rest.match(/^(['"`])(?:\\.|(?!\1).)*\1/);
    if (str) {
      tokens.push({ kind: "string", value: str[0] });
      i += str[0].length;
      continue;
    }
    const flag = rest.match(/^--?[A-Za-z0-9][\w-]*/);
    if (flag) {
      tokens.push({ kind: "property", value: flag[0] });
      i += flag[0].length;
      continue;
    }
    const word = rest.match(/^[A-Za-z_][\w-]*/);
    if (word) {
      const value = word[0];
      tokens.push({
        kind: SHELL_KEYWORDS.has(value.toLowerCase()) ? "keyword" : "text",
        value,
      });
      i += value.length;
      continue;
    }
    const punct = rest.match(/^[:{}()[\]$!@=&,.|\\/;<>]+/);
    if (punct) {
      tokens.push({ kind: "punct", value: punct[0] });
      i += punct[0].length;
      continue;
    }
    tokens.push({ kind: "text", value: rest[0]! });
    i += 1;
  }
  return tokens.length ? tokens : [{ kind: "text", value: " " }];
}

function tokenizeJson(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    const str = rest.match(/^"(?:\\.|[^"\\])*"/);
    if (str) {
      const next = line.slice(i + str[0].length).match(/^\s*:/);
      tokens.push({ kind: next ? "property" : "string", value: str[0] });
      i += str[0].length;
      continue;
    }
    const num = rest.match(/^-?\d+\.?\d*(?:[eE][+-]?\d+)?/);
    if (num) {
      tokens.push({ kind: "number", value: num[0] });
      i += num[0].length;
      continue;
    }
    const word = rest.match(/^(true|false|null)/);
    if (word) {
      tokens.push({ kind: "keyword", value: word[0] });
      i += word[0].length;
      continue;
    }
    const ch = rest[0]!;
    tokens.push({
      kind: "{}[]:,".includes(ch) ? "punct" : "text",
      value: ch,
    });
    i += 1;
  }
  return tokens.length ? tokens : [{ kind: "text", value: " " }];
}

function tokenizeGeneric(
  line: string,
  options: { keywords: Set<string>; lineComment: string; capitalizeTypes: boolean },
): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith(options.lineComment)) {
      tokens.push({ kind: "comment", value: rest });
      break;
    }
    if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/", 2);
      const value = end === -1 ? rest : rest.slice(0, end + 2);
      tokens.push({ kind: "comment", value });
      i += value.length;
      continue;
    }
    const str = rest.match(/^(['"`])(?:\\.|(?!\1)[\s\S])*\1/);
    if (str) {
      tokens.push({ kind: "string", value: str[0] });
      i += str[0].length;
      continue;
    }
    const num = rest.match(/^-?\d+\.?\d*(?:[eE][+-]?\d+)?/);
    if (num) {
      tokens.push({ kind: "number", value: num[0] });
      i += num[0].length;
      continue;
    }
    const word = rest.match(/^[A-Za-z_$][\w$]*/);
    if (word) {
      const value = word[0];
      let kind: TokenKind = "text";
      if (options.keywords.has(value)) kind = "keyword";
      else if (options.capitalizeTypes && /^[A-Z]/.test(value)) kind = "type";
      tokens.push({ kind, value });
      i += value.length;
      continue;
    }
    const punct = rest.match(/^[:{}()[\]$!@=&,.|<>;*/%+\-\\]+/);
    if (punct) {
      tokens.push({ kind: "punct", value: punct[0] });
      i += punct[0].length;
      continue;
    }
    tokens.push({ kind: "text", value: rest[0]! });
    i += 1;
  }
  return tokens.length ? tokens : [{ kind: "text", value: " " }];
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-accent-text",
  type: "text-info",
  string: "text-success",
  number: "text-warning",
  comment: "text-faint",
  punct: "text-mute",
  text: "text-ink",
  property: "text-info",
  operator: "text-mute",
};
