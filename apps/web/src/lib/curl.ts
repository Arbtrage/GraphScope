import { pairsFromRecord, recordFromPairs } from "@/components/HeaderEditor";
import type { HeaderPair } from "@/data/types";

export type CurlBuildInput = {
  url: string;
  query: string;
  variablesJson: string;
  /** Merged headers already including Content-Type when desired. */
  headers: Record<string, string>;
};

export type CurlParseResult = {
  url: string;
  query: string;
  variableJson: string;
  headers: HeaderPair[];
};

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function parseVariables(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through */
  }
  return {};
}

function orderedHeaders(headers: Record<string, string>): Array<[string, string]> {
  const entries = Object.entries(headers).filter(([key]) => key.trim());
  entries.sort(([a], [b]) => {
    const aCt = a.toLowerCase() === "content-type" ? 0 : 1;
    const bCt = b.toLowerCase() === "content-type" ? 0 : 1;
    if (aCt !== bCt) return aCt - bCt;
    return a.localeCompare(b);
  });
  return entries;
}

/** Build a copy-pasteable, multiline-formatted curl for the GraphQL POST. */
export function buildGraphqlCurl(input: CurlBuildInput): string {
  const url = input.url.trim() || "http://127.0.0.1/graphql";
  const body = {
    query: input.query.replace(/\r\n/g, "\n").trim(),
    variables: parseVariables(input.variablesJson),
  };
  // Pretty JSON so --data is readable; GraphQL newlines become \n inside the string.
  const bodyJson = JSON.stringify(body, null, 2);
  const headers = { ...input.headers };
  if (!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  const lines: string[] = [
    `curl --request POST \\`,
    `  --url ${shellSingleQuote(url)} \\`,
  ];
  for (const [key, value] of orderedHeaders(headers)) {
    lines.push(`  --header ${shellSingleQuote(`${key}: ${value}`)} \\`);
  }
  // Final arg: multiline pretty JSON inside single quotes (valid bash).
  lines.push(`  --data ${shellSingleQuote(bodyJson)}`);
  return lines.join("\n");
}

export function mergePreviewHeaders(
  envHeaders: Record<string, string> | undefined,
  draft: HeaderPair[],
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(envHeaders ?? {}),
    ...recordFromPairs(draft),
  };
}

/**
 * Best-effort parse of a curl command into GraphQL editor fields.
 * Supports classic -H/-d and long --header/--data/--url forms, including multiline bodies.
 */
export function parseGraphqlCurl(curl: string): CurlParseResult | null {
  const trimmed = curl.trim();
  if (!/^curl\b/i.test(trimmed)) return null;

  // Keep newlines inside quotes; only join line-continuations.
  const normalized = trimmed.replace(/\\\r?\n/g, "\n");

  const url =
    extractOption(normalized, ["--url", "-url"]) ??
    extractCurlPositionalUrl(normalized) ??
    "";
  if (!url) return null;

  const headers: Record<string, string> = {};
  for (const raw of extractAllOptions(normalized, ["--header", "-H"])) {
    const colon = raw.indexOf(":");
    if (colon <= 0) continue;
    const key = raw.slice(0, colon).trim();
    const value = raw.slice(colon + 1).trim();
    if (key) headers[key] = value;
  }

  const data =
    extractOption(normalized, ["--data-raw", "--data-binary", "--data", "-d"]) ?? null;
  if (data == null) return null;

  let query = "";
  let variableJson = "{}";
  try {
    const parsed = JSON.parse(data) as { query?: unknown; variables?: unknown };
    if (typeof parsed.query === "string") query = parsed.query;
    if (parsed.variables && typeof parsed.variables === "object" && !Array.isArray(parsed.variables)) {
      variableJson = JSON.stringify(parsed.variables, null, 2);
    }
  } catch {
    return null;
  }

  const cleanedHeaders = { ...headers };
  for (const key of Object.keys(cleanedHeaders)) {
    if (key.toLowerCase() === "content-type") delete cleanedHeaders[key];
  }

  return {
    url: url.trim(),
    query,
    variableJson,
    headers: pairsFromRecord(cleanedHeaders),
  };
}

function extractCurlPositionalUrl(input: string): string | null {
  // curl [flags] 'url'  OR  curl --request POST 'url'
  const match = input.match(/\bcurl\b[\s\S]*?(?:--request|-X)\s+\w+\s+(['"])([\s\S]*?)\1/i)
    ?? input.match(/\bcurl\s+(?:(?:--request|-X)\s+\w+\s+)?(['"])([\s\S]*?)\1/i);
  if (match?.[2]) return match[2];
  const bare = input.match(/\bcurl\s+(?!-)(\S+)/i);
  return bare?.[1] ?? null;
}

function extractOption(input: string, names: string[]): string | null {
  const values = extractAllOptions(input, names);
  return values.length ? values[values.length - 1]! : null;
}

function extractAllOptions(input: string, names: string[]): string[] {
  const found: string[] = [];
  const nameAlt = names.map(escapeRegExp).join("|");
  // Match: --header 'value' | --header "value" | --data 'multi\nline'
  const re = new RegExp(`(?:${nameAlt})\\s+(?:(['"])([\\s\\S]*?)\\1|(\\S+))`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    const value = match[2] ?? match[3];
    if (value != null) found.push(value);
  }
  return found;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
