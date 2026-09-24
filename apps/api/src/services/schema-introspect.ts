import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  printSchema,
  type GraphQLNamedType,
  type IntrospectionQuery,
} from "graphql";
import type { Repositories } from "@graphscope/db";
import type { ExplorerCatalogPayload } from "@graphscope/shared-types";
import { classifyExecuteFailure, executeOperation } from "./execute-operation.js";

export interface IntrospectResult {
  ok: boolean;
  sdl?: string;
  typeCount: number;
  title?: string;
  detail?: string;
}

export async function introspectEnvironmentSchema(
  repos: Repositories,
  workspaceId: string,
  environmentId: string,
): Promise<IntrospectResult> {
  const result = await executeOperation(repos, {
    workspaceId,
    environmentId,
    queryContent: getIntrospectionQuery(),
    variablesJson: "{}",
  });

  let payload: { data?: IntrospectionQuery; errors?: unknown[]; error?: { title?: string; detail?: string } };
  try {
    payload = JSON.parse(result.responseBody || "{}") as typeof payload;
  } catch {
    return {
      ok: false,
      typeCount: 0,
      title: "Could not pull schema",
      detail: result.responsePreview ?? "Response was not JSON",
    };
  }

  // Prefer data.__schema even when the server also returned GraphQL errors.
  if (payload.data?.__schema) {
    try {
      const schema = buildClientSchema(payload.data);
      const sdl = printSchema(schema);
      const typeCount = Object.keys(schema.getTypeMap()).filter((name) => !name.startsWith("__")).length;
      await repos.environments.saveIntrospectedSdl(environmentId, workspaceId, sdl);
      return { ok: true, sdl, typeCount };
    } catch (err) {
      const classified = classifyExecuteFailure(err);
      return { ok: false, typeCount: 0, title: classified.title, detail: classified.detail };
    }
  }

  if (result.status !== "SUCCESS") {
    let title = "Could not pull schema";
    let detail = result.responsePreview ?? result.status;
    if (payload.error?.title) title = payload.error.title;
    if (payload.error?.detail) detail = payload.error.detail;
    else if (result.status === "GRAPHQL_ERROR") title = "GraphQL error";
    return { ok: false, typeCount: 0, title, detail };
  }

  return { ok: false, typeCount: 0, title: "Could not pull schema", detail: "No introspection data returned" };
}

type CatalogType = {
  id: string;
  name: string;
  kind: string;
  sdl: string;
  source?: string;
  fieldIds: string[];
  operationIds: string[];
  fragmentIds: string[];
  fileIds: string[];
};

type CatalogField = {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  returnType: string;
  deprecated?: boolean;
  deprecationReason?: string;
};

function asCatalogType(row: Record<string, unknown>): CatalogType {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    kind: String(row.kind ?? "OBJECT"),
    sdl: String(row.sdl ?? ""),
    source: typeof row.source === "string" ? row.source : undefined,
    fieldIds: Array.isArray(row.fieldIds) ? row.fieldIds.map(String) : [],
    operationIds: Array.isArray(row.operationIds) ? row.operationIds.map(String) : [],
    fragmentIds: Array.isArray(row.fragmentIds) ? row.fragmentIds.map(String) : [],
    fileIds: Array.isArray(row.fileIds) ? row.fileIds.map(String) : [],
  };
}

function asCatalogField(row: Record<string, unknown>): CatalogField {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    typeId: String(row.typeId ?? ""),
    typeName: String(row.typeName ?? ""),
    returnType: String(row.returnType ?? ""),
    deprecated: Boolean(row.deprecated),
    deprecationReason: typeof row.deprecationReason === "string" ? row.deprecationReason : undefined,
  };
}

export function applyIntrospectedSchema(catalog: ExplorerCatalogPayload): ExplorerCatalogPayload {
  const endpoints = catalog.endpoints ?? [];
  const sdl =
    endpoints
      .map((item) => (typeof item.introspectedSdl === "string" ? item.introspectedSdl : null))
      .find((item) => item) ?? null;
  const types = catalog.types.map(asCatalogType);
  const fields = catalog.fields.map(asCatalogField);
  if (!sdl) {
    return {
      ...catalog,
      types: types.map((type) => ({ ...type, source: type.source ?? "inferred" })),
    };
  }

  let pulled: ReturnType<typeof typesFromSdl>;
  try {
    pulled = typesFromSdl(sdl);
  } catch {
    return {
      ...catalog,
      types: types.map((type) => ({ ...type, source: type.source ?? "inferred" })),
    };
  }

  const byName = new Map(types.map((type) => [type.name, type]));
  const nextFields = [...fields];
  const nextTypes: CatalogType[] = [];

  for (const intro of pulled) {
    const existing = byName.get(intro.name);
    if (existing) {
      const replacedFields = intro.fields.map((field) => {
        const previous = nextFields.find((item) => item.typeId === existing.id && item.name === field.name);
        const id = previous?.id ?? `field:intro:${intro.name}:${field.name}`;
        return {
          id,
          name: field.name,
          typeId: existing.id,
          typeName: intro.name,
          returnType: field.returnType,
          deprecated: field.deprecated,
          deprecationReason: field.deprecationReason,
        };
      });
      nextFields.splice(0, nextFields.length, ...nextFields.filter((item) => item.typeId !== existing.id), ...replacedFields);
      nextTypes.push({
        ...existing,
        kind: intro.kind,
        sdl: intro.sdl,
        source: "introspected",
        fieldIds: replacedFields.map((item) => item.id),
      });
      byName.delete(intro.name);
    } else {
      const typeId = `type:intro:${intro.name}`;
      const replacedFields = intro.fields.map((field) => ({
        id: `field:intro:${intro.name}:${field.name}`,
        name: field.name,
        typeId,
        typeName: intro.name,
        returnType: field.returnType,
        deprecated: field.deprecated,
        deprecationReason: field.deprecationReason,
      }));
      nextFields.push(...replacedFields);
      nextTypes.push({
        id: typeId,
        name: intro.name,
        kind: intro.kind,
        sdl: intro.sdl,
        source: "introspected",
        fieldIds: replacedFields.map((item) => item.id),
        operationIds: [],
        fragmentIds: [],
        fileIds: [],
      });
    }
  }

  for (const leftover of byName.values()) {
    nextTypes.push({ ...leftover, source: leftover.source ?? "inferred" });
  }

  return { ...catalog, types: nextTypes, fields: nextFields };
}

function typesFromSdl(sdl: string): Array<{
  name: string;
  kind: string;
  sdl: string;
  fields: Array<{ name: string; returnType: string; deprecated?: boolean; deprecationReason?: string }>;
}> {
  const schema = buildSchema(sdl);
  const out: Array<{
    name: string;
    kind: string;
    sdl: string;
    fields: Array<{ name: string; returnType: string; deprecated?: boolean; deprecationReason?: string }>;
  }> = [];
  for (const type of Object.values(schema.getTypeMap())) {
    if (type.name.startsWith("__")) continue;
    if (!isObjectType(type) && !isInputObjectType(type) && !isInterfaceType(type) && !isEnumType(type)) continue;
    out.push({
      name: type.name,
      kind: kindOf(type),
      sdl: printNamedType(type),
      fields: fieldsOf(type),
    });
  }
  return out;
}

function kindOf(type: GraphQLNamedType): string {
  if (isInputObjectType(type)) return "INPUT";
  if (isEnumType(type)) return "ENUM";
  if (isInterfaceType(type)) return "INTERFACE";
  if (type.name.endsWith("Connection")) return "CONNECTION";
  return "OBJECT";
}

function fieldsOf(type: GraphQLNamedType): Array<{ name: string; returnType: string; deprecated?: boolean; deprecationReason?: string }> {
  if (isEnumType(type)) {
    return type.getValues().map((value) => ({ name: value.name, returnType: "EnumValue" }));
  }
  if (!isObjectType(type) && !isInputObjectType(type) && !isInterfaceType(type)) return [];
  return Object.values(type.getFields()).map((field) => ({
    name: field.name,
    returnType: field.type.toString(),
    deprecated: Boolean("deprecationReason" in field && field.deprecationReason),
    deprecationReason: "deprecationReason" in field ? field.deprecationReason ?? undefined : undefined,
  }));
}

function printNamedType(type: GraphQLNamedType): string {
  if (isEnumType(type)) {
    return `enum ${type.name} {\n${type.getValues().map((value) => `  ${value.name}`).join("\n")}\n}`;
  }
  if (isInputObjectType(type) || isObjectType(type) || isInterfaceType(type)) {
    const keyword = isInputObjectType(type) ? "input" : isInterfaceType(type) ? "interface" : "type";
    const fields = Object.values(type.getFields())
      .map((field) => `  ${field.name}: ${field.type.toString()}`)
      .join("\n");
    return `${keyword} ${type.name} {\n${fields}\n}`;
  }
  return `type ${type.name}`;
}
