import { parse, print } from "graphql";

export type CodeLanguage = "graphql" | "json" | "javascript" | "typescript" | "shell" | "text";

/** Best-effort Prettier-like formatting. Returns original text if parsing fails. */
export function formatCode(code: string, language: CodeLanguage = "text"): string {
  const source = code.replace(/\r\n/g, "\n");
  if (!source.trim()) return source;

  try {
    switch (language) {
      case "graphql":
        return formatGraphql(source);
      case "json":
        return formatJson(source);
      case "javascript":
      case "typescript":
        return formatLooseScript(source);
      case "shell":
        return formatShell(source);
      default:
        return source;
    }
  } catch {
    return source;
  }
}

function formatGraphql(source: string): string {
  const doc = parse(source, { noLocation: true });
  return `${print(doc).trimEnd()}\n`;
}

function formatJson(source: string): string {
  return `${JSON.stringify(JSON.parse(source), null, 2)}\n`;
}

/** Light indent normalization when full JS parsers aren't available. */
function formatLooseScript(source: string): string {
  const lines = source.split("\n");
  let depth = 0;
  const out: string[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (/^[}\])]/.test(trimmed)) depth = Math.max(0, depth - 1);
    out.push(`${"  ".repeat(depth)}${trimmed}`);
    const opens = (trimmed.match(/[{[(]/g) ?? []).length;
    const closes = (trimmed.match(/[}\])]/g) ?? []).length;
    depth = Math.max(0, depth + opens - closes);
  }
  return `${out.join("\n").trimEnd()}\n`;
}

function formatShell(source: string): string {
  // Preserve intentional curl multiline style; just normalize line endings / trailing space.
  return `${source
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trimEnd()}\n`;
}

export function languageForPath(filePath: string): CodeLanguage {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".graphql") || lower.endsWith(".gql")) return "graphql";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) {
    return "javascript";
  }
  if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".zsh")) return "shell";
  return "text";
}
