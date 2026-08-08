import { buildSchema, parse, visit } from "graphql";
import type { SchemaCheckResult } from "@graphscope/shared-types";

export function validateSdl(sdl: string): void {
  buildSchema(sdl);
}

function extractRootFields(sdl: string, typeName: string): Set<string> {
  const fields = new Set<string>();
  const doc = parse(sdl);
  visit(doc, {
    ObjectTypeDefinition(node) {
      if (node.name.value === typeName) {
        for (const field of node.fields ?? []) {
          fields.add(field.name.value);
        }
      }
    },
  });
  return fields;
}

export async function compareSchemas(
  oldSdl: string,
  newSdl: string,
): Promise<{
  result: SchemaCheckResult;
  breakingCount: number;
  dangerousCount: number;
  changes: unknown[];
}> {
  const oldQuery = extractRootFields(oldSdl, "Query");
  const newQuery = extractRootFields(newSdl, "Query");
  const changes: unknown[] = [];

  let breakingCount = 0;
  for (const field of oldQuery) {
    if (!newQuery.has(field)) {
      breakingCount++;
      changes.push({ type: "FIELD_REMOVED", field, criticality: "BREAKING" });
    }
  }

  for (const field of newQuery) {
    if (!oldQuery.has(field)) {
      changes.push({ type: "FIELD_ADDED", field, criticality: "SAFE" });
    }
  }

  let result: SchemaCheckResult = "SAFE";
  if (breakingCount > 0) result = "BREAKING";

  return { result, breakingCount, dangerousCount: 0, changes };
}

export function getOperationType(content: string): "QUERY" | "MUTATION" | "SUBSCRIPTION" {
  const doc = parse(content);
  for (const def of doc.definitions) {
    if (def.kind === "OperationDefinition") {
      if (def.operation === "mutation") return "MUTATION";
      if (def.operation === "subscription") return "SUBSCRIPTION";
      return "QUERY";
    }
  }
  return "QUERY";
}

export function getOperationName(content: string): string | null {
  const doc = parse(content);
  for (const def of doc.definitions) {
    if (def.kind === "OperationDefinition" && def.name) {
      return def.name.value;
    }
  }
  return null;
}
