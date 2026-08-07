import { buildSchema, parse, validate, visit, type DocumentNode } from "graphql";
import type { AiRedactionMode } from "@graphscope/db";

export interface SchemaCitation {
  typeName: string;
  fieldName: string | null;
}

const SECRET_PATTERN = /(?:api[_-]?key|token|secret|password|authorization|bearer)\s*[:=]\s*\S+/gi;

export function redactSecrets(text: string): string {
  return text.replace(SECRET_PATTERN, "[REDACTED]");
}

export function extractReferencedTypes(doc: DocumentNode): Set<string> {
  const types = new Set<string>();
  visit(doc, {
    NamedType(node) {
      types.add(node.name.value);
    },
  });
  return types;
}

export function subsetSchemaSdl(fullSdl: string, operationContent: string, mode: AiRedactionMode): string {
  const sanitized = redactSecrets(fullSdl);
  if (mode === "FULL") return sanitized;

  let doc: DocumentNode;
  try {
    doc = parse(operationContent);
  } catch {
    return mode === "STRICT" ? "type Query { _empty: String }" : sanitized.slice(0, 4000);
  }

  const referenced = extractReferencedTypes(doc);
  referenced.add("Query");
  referenced.add("Mutation");
  referenced.add("Subscription");

  const lines = sanitized.split("\n");
  const kept: string[] = [];
  let inType = false;
  let currentType: string | null = null;

  for (const line of lines) {
    const typeMatch = line.match(/^(type|input|enum|interface|union|scalar)\s+(\w+)/);
    if (typeMatch) {
      currentType = typeMatch[2] ?? null;
      inType = currentType ? referenced.has(currentType) : false;
      if (inType) kept.push(line);
      continue;
    }
    if (inType) kept.push(line);
    if (line.trim() === "}") {
      inType = false;
      currentType = null;
    }
  }

  const subset = kept.join("\n").trim();
  if (mode === "STRICT") {
    return subset.slice(0, 2000);
  }
  return subset || sanitized.slice(0, 4000);
}

export function parseCitations(markdown: string): SchemaCitation[] {
  const citations: SchemaCitation[] = [];
  const re = /`([A-Z][A-Za-z0-9_]*)(?:\.([A-Za-z0-9_]+))?`/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    citations.push({ typeName: match[1]!, fieldName: match[2] ?? null });
  }
  const seen = new Set<string>();
  return citations.filter((c) => {
    const key = `${c.typeName}.${c.fieldName ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateOperationAgainstSchema(operation: string, sdl: string): { valid: boolean; errors: string[] } {
  try {
    const schema = buildSchema(sdl);
    const doc = parse(operation);
    const errors = validate(schema, doc);
    return {
      valid: errors.length === 0,
      errors: errors.map((e) => e.message),
    };
  } catch (err) {
    return { valid: false, errors: [(err as Error).message] };
  }
}

export function sanitizeGeneratedOperation(raw: string): string {
  const fenced = raw.match(/```(?:graphql)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? raw).trim();
}
