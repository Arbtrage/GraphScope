import type { Knex } from "knex";
import type { ExplorerCatalogPayload, OperationType, ScanStatusPayload } from "@graphscope/shared-types";

export interface ExplorerParseInput {
  repoName: string;
  branch: string;
  clients: string[];
  operations: Array<{
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
  }>;
  fragments: Array<{
    name: string;
    content: string;
    contentHash: string;
    filePath: string;
    startLine: number;
    endLine: number;
    typeCondition: string | null;
    spreads: string[];
    duplicateOf?: string;
  }>;
  types: Array<{
    name: string;
    kind: "OBJECT" | "INPUT" | "ENUM" | "INTERFACE" | "CONNECTION";
    fields: Array<{ name: string; returnType: string; deprecated?: boolean; reason?: string }>;
  }>;
  files: Array<{
    path: string;
    kind: "graphql" | "tsx" | "ts" | "test";
    operationNames: string[];
    fragmentNames: string[];
    referenceCount: number;
  }>;
  usages: Array<{
    operationName: string;
    filePath: string;
    line: number;
    kind: "component" | "page" | "test" | "hook";
  }>;
  endpoints: Array<{ name: string; url: string; environment: string }>;
  edges: Array<{
    source: string;
    target: string;
    relation: "uses" | "spreads" | "has" | "defined-in" | "used-by" | "executes";
  }>;
  fingerprints?: Array<{
    path: string;
    mtimeMs: number;
    sizeBytes: number;
    contentHash: string;
  }>;
  symbols?: Array<{
    symbol: string;
    filePath: string;
    line: number;
    kind: "component" | "page" | "test" | "hook";
  }>;
}

export interface IncrementalCatalogInput {
  workspaceId: string;
  projectId: string;
  repositoryLinkId: string;
  changedPaths: string[];
  deletedPaths: string[];
  operations: ExplorerParseInput["operations"];
  fragments: ExplorerParseInput["fragments"];
  types: ExplorerParseInput["types"];
  files: ExplorerParseInput["files"];
  usages: ExplorerParseInput["usages"];
  edges: ExplorerParseInput["edges"];
  fingerprints: NonNullable<ExplorerParseInput["fingerprints"]>;
  symbols: NonNullable<ExplorerParseInput["symbols"]>;
}

function prefixed(kind: string, id: string): string {
  return `${kind}:${id}`;
}

function parseEnvHeaders(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function sdlForType(name: string, fields: Array<{ name: string; returnType: string }>): string {
  if (!fields.length) return `type ${name}`;
  return `type ${name} {\n${fields.map((field) => `  ${field.name}: ${field.returnType}`).join("\n")}\n}`;
}

function relativeLabel(value: Date | string | null | undefined): string {
  if (!value) return "Just now";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function historyDay(iso: string): "today" | "yesterday" | "older" {
  const created = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const t = created.getTime();
  if (t >= startToday) return "today";
  if (t >= startYesterday) return "yesterday";
  return "older";
}

function opKind(type: string): "query" | "mutation" | "subscription" {
  if (type === "MUTATION") return "mutation";
  if (type === "SUBSCRIPTION") return "subscription";
  return "query";
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

function folderName(localPath: string | null | undefined): string | null {
  if (!localPath) return null;
  const parts = localPath.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function remapEdgeKey(
  key: string,
  maps: {
    ops: Map<string, string>;
    frags: Map<string, string>;
    types: Map<string, string>;
    fields: Map<string, string>;
    files: Map<string, string>;
  },
): string {
  const idx = key.indexOf(":");
  if (idx === -1) return key;
  const kind = key.slice(0, idx);
  const raw = key.slice(idx + 1);
  if (kind === "op") return maps.ops.get(raw) ?? key;
  if (kind === "frag") return maps.frags.get(raw) ?? key;
  if (kind === "type") return maps.types.get(raw) ?? key;
  if (kind === "field") return maps.fields.get(raw) ?? key;
  if (kind === "file") return maps.files.get(raw) ?? key;
  return key;
}

export class ExplorerRepository {
  constructor(private readonly db: Knex) {}

  async persistCatalog(input: {
    workspaceId: string;
    projectId: string;
    repositoryLinkId: string;
    parsed: ExplorerParseInput;
  }): Promise<void> {
    const { workspaceId, projectId, repositoryLinkId, parsed } = input;
    await this.db.transaction(async (trx) => {
      const existingOps = await trx("core_operation").where({
        project_id: projectId,
        workspace_id: workspaceId,
      });
      const existingIds = existingOps.map((row) => String(row.operation_id));

      if (existingIds.length) {
        await trx("core_usage").whereIn("operation_id", existingIds).del();
        await trx("core_fragment_usage").whereIn("operation_id", existingIds).del();
        await trx("core_file_operation").whereIn("operation_id", existingIds).del();
        await trx("core_operation_source").whereIn("operation_id", existingIds).del();
      }
      await trx("core_graph_edge").where({ project_id: projectId, workspace_id: workspaceId }).del();
      await trx("core_detected_client").where({ project_id: projectId, workspace_id: workspaceId }).del();
      await trx("core_fragment").where({ project_id: projectId, workspace_id: workspaceId }).del();
      await trx("core_graphql_type").where({ project_id: projectId, workspace_id: workspaceId }).del();
      await trx("core_source_file").where({ project_id: projectId, workspace_id: workspaceId }).del();

      const opByHash = new Map(existingOps.map((row) => [String(row.content_hash), row]));
      const kept = new Set<string>();
      const opIdByName = new Map<string, string>();
      const opIdByHash = new Map<string, string>();

      for (const op of parsed.operations) {
        const displayName =
          op.name ?? `Unnamed${op.operationType.charAt(0)}${op.operationType.slice(1).toLowerCase()}${op.startLine}`;
        let existing = opByHash.get(op.contentHash);
        if (!existing) {
          existing = await trx("core_operation")
            .where({ project_id: projectId, content_hash: op.contentHash })
            .first();
          if (existing) opByHash.set(op.contentHash, existing);
        }
        let operationId: string;
        if (existing) {
          operationId = String(existing.operation_id);
          await trx("core_operation")
            .where({ operation_id: operationId })
            .update({
              name: displayName,
              operation_type: op.operationType,
              content: op.content,
              content_hash: op.contentHash,
              confidence: op.confidence,
              unused: op.unused,
              variables_json: op.variables,
              description: "",
              repository_link_id: repositoryLinkId,
              updated_at: trx.fn.now(),
            });
        } else {
          try {
            const [inserted] = await trx("core_operation")
              .insert({
                workspace_id: workspaceId,
                project_id: projectId,
                repository_link_id: repositoryLinkId,
                name: displayName,
                operation_type: op.operationType,
                content: op.content,
                content_hash: op.contentHash,
                confidence: op.confidence,
                unused: op.unused,
                variables_json: op.variables,
                description: "",
              })
              .returning("*");
            operationId = String(inserted.operation_id);
            opByHash.set(op.contentHash, inserted);
          } catch (err) {
            const raced = await trx("core_operation")
              .where({ project_id: projectId, content_hash: op.contentHash })
              .first();
            if (!raced) throw err;
            operationId = String(raced.operation_id);
            opByHash.set(op.contentHash, raced);
            await trx("core_operation")
              .where({ operation_id: operationId })
              .update({
                name: displayName,
                operation_type: op.operationType,
                content: op.content,
                repository_link_id: repositoryLinkId,
                unused: op.unused,
                variables_json: op.variables,
                updated_at: trx.fn.now(),
              });
          }
        }
        kept.add(operationId);
        opIdByHash.set(op.contentHash, operationId);
        if (op.name) opIdByName.set(op.name, operationId);
        await trx("core_operation_source").insert({
          operation_id: operationId,
          file_path: op.filePath,
          start_line: op.startLine,
          end_line: op.endLine,
          github_url: null,
        });
      }

      const stale = existingIds.filter((id) => !kept.has(id));
      if (stale.length) {
        await trx("core_operation").whereIn("operation_id", stale).del();
      }

      const fragIdByName = new Map<string, string>();
      for (const fragment of parsed.fragments) {
        const [inserted] = await trx("core_fragment")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            repository_link_id: repositoryLinkId,
            name: fragment.name,
            content: fragment.content,
            content_hash: fragment.contentHash,
            file_path: fragment.filePath,
            start_line: fragment.startLine,
            end_line: fragment.endLine,
            type_condition: fragment.typeCondition,
            duplicate_of: fragment.duplicateOf ?? null,
          })
          .returning("*");
        const fragmentId = String(inserted.fragment_id);
        if (!fragIdByName.has(fragment.name)) fragIdByName.set(fragment.name, fragmentId);
        for (const opName of parsed.operations.filter((item) => item.fragmentSpreads.includes(fragment.name))) {
          const operationId = opName.name ? opIdByName.get(opName.name) : undefined;
          if (!operationId) continue;
          await trx("core_fragment_usage")
            .insert({ fragment_id: fragmentId, operation_id: operationId })
            .onConflict(["fragment_id", "operation_id"])
            .ignore();
        }
      }

      const typeIdByName = new Map<string, string>();
      const fieldIdByKey = new Map<string, string>();
      for (const type of parsed.types) {
        if (typeIdByName.has(type.name)) continue;
        const [inserted] = await trx("core_graphql_type")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            name: type.name,
            kind: type.kind,
            sdl: sdlForType(type.name, type.fields),
          })
          .returning("*");
        const typeId = String(inserted.type_id);
        typeIdByName.set(type.name, typeId);
        for (const field of type.fields) {
          const [fieldRow] = await trx("core_graphql_field")
            .insert({
              type_id: typeId,
              workspace_id: workspaceId,
              name: field.name,
              return_type: field.returnType,
              deprecated: Boolean(field.deprecated),
              deprecation_reason: field.reason ?? null,
            })
            .returning("*");
          fieldIdByKey.set(`${type.name}-${field.name}`, String(fieldRow.field_id));
        }
      }

      const fileIdByPath = new Map<string, string>();
      for (const file of parsed.files) {
        if (fileIdByPath.has(file.path)) continue;
        const [inserted] = await trx("core_source_file")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            path: file.path,
            kind: file.kind,
            reference_count: file.referenceCount,
          })
          .returning("*");
        const fileId = String(inserted.file_id);
        fileIdByPath.set(file.path, fileId);
        for (const name of file.operationNames) {
          const operationId = opIdByName.get(name);
          if (!operationId) continue;
          await trx("core_file_operation")
            .insert({ file_id: fileId, operation_id: operationId })
            .onConflict(["file_id", "operation_id"])
            .ignore();
        }
        for (const name of file.fragmentNames) {
          const fragmentId = fragIdByName.get(name);
          if (!fragmentId) continue;
          await trx("core_file_fragment")
            .insert({ file_id: fileId, fragment_id: fragmentId })
            .onConflict(["file_id", "fragment_id"])
            .ignore();
        }
      }

      for (const op of parsed.operations) {
        const fileId = fileIdByPath.get(op.filePath);
        const operationId = opIdByHash.get(op.contentHash);
        if (fileId && operationId) {
          await trx("core_file_operation")
            .insert({ file_id: fileId, operation_id: operationId })
            .onConflict(["file_id", "operation_id"])
            .ignore();
        }
      }

      for (const usage of parsed.usages) {
        const operationId = opIdByName.get(usage.operationName);
        if (!operationId) continue;
        let fileId = fileIdByPath.get(usage.filePath) ?? null;
        if (!fileId) {
          const existingFile = await trx("core_source_file")
            .where({ project_id: projectId, path: usage.filePath })
            .first();
          if (existingFile) {
            fileId = String(existingFile.file_id);
          } else {
            const [created] = await trx("core_source_file")
              .insert({
                workspace_id: workspaceId,
                project_id: projectId,
                path: usage.filePath,
                kind: usage.filePath.endsWith(".tsx") || usage.filePath.endsWith(".jsx") ? "tsx" : "ts",
                reference_count: 1,
              })
              .returning("*");
            fileId = String(created.file_id);
          }
          fileIdByPath.set(usage.filePath, fileId);
        }
        await trx("core_usage").insert({
          workspace_id: workspaceId,
          operation_id: operationId,
          file_id: fileId,
          file_path: usage.filePath,
          line: usage.line,
          kind: usage.kind,
        });
      }

      const maps = {
        ops: new Map([...opIdByName.entries()].map(([name, id]) => [name, prefixed("op", id)])),
        frags: new Map([...fragIdByName.entries()].map(([name, id]) => [name, prefixed("frag", id)])),
        types: new Map([...typeIdByName.entries()].map(([name, id]) => [name, prefixed("type", id)])),
        fields: new Map([...fieldIdByKey.entries()].map(([key, id]) => [key, prefixed("field", id)])),
        files: new Map([...fileIdByPath.entries()].map(([path, id]) => [path, prefixed("file", id)])),
      };
      const edgeRows = parsed.edges.map((edge) => ({
        workspace_id: workspaceId,
        project_id: projectId,
        source_id: remapEdgeKey(edge.source, maps),
        target_id: remapEdgeKey(edge.target, maps),
        relation: edge.relation,
      }));
      for (const batch of chunk(edgeRows, 400)) {
        await trx("core_graph_edge").insert(batch);
      }

      if (parsed.clients.length) {
        await trx("core_detected_client").insert(
          parsed.clients.map((name) => ({
            workspace_id: workspaceId,
            project_id: projectId,
            name,
          })),
        );
      }

      await trx("core_symbol_ref").where({ project_id: projectId, workspace_id: workspaceId }).del();
      if (parsed.symbols?.length) {
        for (const batch of chunk(parsed.symbols, 400)) {
          await trx("core_symbol_ref").insert(
            batch.map((symbol) => ({
              workspace_id: workspaceId,
              project_id: projectId,
              symbol: symbol.symbol,
              file_path: symbol.filePath,
              line: symbol.line,
              kind: symbol.kind,
            })),
          );
        }
      }

      const fingerprintByPath = new Map((parsed.fingerprints ?? []).map((item) => [item.path, item]));
      for (const [filePath, fileId] of fileIdByPath) {
        const fp = fingerprintByPath.get(filePath);
        if (!fp) continue;
        await trx("core_source_file")
          .where({ file_id: fileId })
          .update({
            mtime_ms: fp.mtimeMs,
            size_bytes: fp.sizeBytes,
            content_hash: fp.contentHash,
            indexed_at: trx.fn.now(),
          });
      }

      await trx("core_repository_link")
        .where({ repository_link_id: repositoryLinkId })
        .update({
          display_name: parsed.repoName,
          branch_name: parsed.branch,
          catalog_revision: trx.raw("catalog_revision + 1"),
          updated_at: trx.fn.now(),
        });
    });
  }

  async listFileFingerprints(projectId: string, workspaceId: string): Promise<
    Array<{ path: string; mtimeMs: number; sizeBytes: number; contentHash: string }>
  > {
    const rows = await this.db("core_source_file")
      .where({ project_id: projectId, workspace_id: workspaceId })
      .whereNotNull("content_hash");
    return rows.map((row) => ({
      path: String(row.path),
      mtimeMs: Number(row.mtime_ms) || 0,
      sizeBytes: Number(row.size_bytes) || 0,
      contentHash: String(row.content_hash ?? ""),
    }));
  }

  async listOperationNames(projectId: string, workspaceId: string): Promise<string[]> {
    const rows = await this.db("core_operation")
      .where({ project_id: projectId, workspace_id: workspaceId })
      .whereNotNull("name")
      .select("name");
    return rows.map((row) => String(row.name)).filter(Boolean);
  }

  async getCatalogRevision(repositoryLinkId: string, workspaceId: string): Promise<number> {
    const row = await this.db("core_repository_link")
      .where({ repository_link_id: repositoryLinkId, workspace_id: workspaceId })
      .first();
    return row ? Number(row.catalog_revision) || 0 : 0;
  }

  async bumpCatalogRevision(repositoryLinkId: string): Promise<number> {
    await this.db("core_repository_link")
      .where({ repository_link_id: repositoryLinkId })
      .update({
        catalog_revision: this.db.raw("catalog_revision + 1"),
        updated_at: this.db.fn.now(),
      });
    const row = await this.db("core_repository_link").where({ repository_link_id: repositoryLinkId }).first();
    return Number(row?.catalog_revision) || 0;
  }

  async persistCatalogIncremental(input: IncrementalCatalogInput): Promise<void> {
    const {
      workspaceId,
      projectId,
      repositoryLinkId,
      changedPaths,
      deletedPaths,
      operations,
      fragments,
      types,
      files,
      usages,
      edges,
      fingerprints,
      symbols,
    } = input;
    const ownedPaths = [...new Set([...changedPaths, ...deletedPaths])];
    if (!ownedPaths.length) {
      await this.bumpCatalogRevision(repositoryLinkId);
      return;
    }

    await this.db.transaction(async (trx) => {
      const ownedOpRows = await trx("core_operation_source")
        .whereIn("file_path", ownedPaths)
        .select("operation_id");
      const ownedOpIds = [...new Set(ownedOpRows.map((row) => String(row.operation_id)))];
      if (ownedOpIds.length) {
        await trx("core_usage").whereIn("operation_id", ownedOpIds).del();
        await trx("core_fragment_usage").whereIn("operation_id", ownedOpIds).del();
        await trx("core_file_operation").whereIn("operation_id", ownedOpIds).del();
        await trx("core_operation_source").whereIn("operation_id", ownedOpIds).del();
        await trx("core_operation").whereIn("operation_id", ownedOpIds).del();
      }

      const ownedFragRows = await trx("core_fragment").where({ project_id: projectId }).whereIn("file_path", ownedPaths);
      const ownedFragIds = ownedFragRows.map((row) => String(row.fragment_id));
      if (ownedFragIds.length) {
        await trx("core_file_fragment").whereIn("fragment_id", ownedFragIds).del();
        await trx("core_fragment_usage").whereIn("fragment_id", ownedFragIds).del();
        await trx("core_fragment").whereIn("fragment_id", ownedFragIds).del();
      }

      await trx("core_symbol_ref").where({ project_id: projectId }).whereIn("file_path", ownedPaths).del();
      await trx("core_usage").where({ workspace_id: workspaceId }).whereIn("file_path", ownedPaths).del();

      for (const deletedPath of deletedPaths) {
        await trx("core_source_file").where({ project_id: projectId, path: deletedPath }).del();
      }

      const opIdByName = new Map<string, string>();
      const opIdByHash = new Map<string, string>();
      for (const op of operations) {
        const displayName =
          op.name ?? `Unnamed${op.operationType.charAt(0)}${op.operationType.slice(1).toLowerCase()}${op.startLine}`;
        const [inserted] = await trx("core_operation")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            repository_link_id: repositoryLinkId,
            name: displayName,
            operation_type: op.operationType,
            content: op.content,
            content_hash: op.contentHash,
            confidence: op.confidence,
            unused: op.unused,
            variables_json: op.variables,
            description: "",
          })
          .onConflict(["project_id", "content_hash"])
          .merge({
            name: displayName,
            operation_type: op.operationType,
            content: op.content,
            confidence: op.confidence,
            unused: op.unused,
            variables_json: op.variables,
            repository_link_id: repositoryLinkId,
            updated_at: trx.fn.now(),
          })
          .returning("*");
        const operationId = String(inserted.operation_id);
        opIdByHash.set(op.contentHash, operationId);
        if (op.name) opIdByName.set(op.name, operationId);
        await trx("core_operation_source").insert({
          operation_id: operationId,
          file_path: op.filePath,
          start_line: op.startLine,
          end_line: op.endLine,
          github_url: null,
        });
      }

      // Load remaining op names for usage linking
      const allOps = await trx("core_operation").where({ project_id: projectId, workspace_id: workspaceId });
      for (const row of allOps) {
        if (row.name) opIdByName.set(String(row.name), String(row.operation_id));
      }

      const fragIdByName = new Map<string, string>();
      for (const fragment of fragments) {
        const [inserted] = await trx("core_fragment")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            repository_link_id: repositoryLinkId,
            name: fragment.name,
            content: fragment.content,
            content_hash: fragment.contentHash,
            file_path: fragment.filePath,
            start_line: fragment.startLine,
            end_line: fragment.endLine,
            type_condition: fragment.typeCondition,
            duplicate_of: fragment.duplicateOf ?? null,
          })
          .returning("*");
        fragIdByName.set(fragment.name, String(inserted.fragment_id));
      }
      const allFrags = await trx("core_fragment").where({ project_id: projectId });
      for (const row of allFrags) {
        if (!fragIdByName.has(String(row.name))) fragIdByName.set(String(row.name), String(row.fragment_id));
      }

      for (const type of types) {
        const existing = await trx("core_graphql_type").where({ project_id: projectId, name: type.name }).first();
        let typeId: string;
        if (existing) {
          typeId = String(existing.type_id);
          await trx("core_graphql_type")
            .where({ type_id: typeId })
            .update({ kind: type.kind, sdl: sdlForType(type.name, type.fields), updated_at: trx.fn.now() });
        } else {
          const [inserted] = await trx("core_graphql_type")
            .insert({
              workspace_id: workspaceId,
              project_id: projectId,
              name: type.name,
              kind: type.kind,
              sdl: sdlForType(type.name, type.fields),
            })
            .returning("*");
          typeId = String(inserted.type_id);
        }
        for (const field of type.fields) {
          await trx("core_graphql_field")
            .insert({
              type_id: typeId,
              workspace_id: workspaceId,
              name: field.name,
              return_type: field.returnType,
              deprecated: Boolean(field.deprecated),
              deprecation_reason: field.reason ?? null,
            })
            .onConflict(["type_id", "name"])
            .merge({
              return_type: field.returnType,
              deprecated: Boolean(field.deprecated),
              deprecation_reason: field.reason ?? null,
            });
        }
      }

      const fileIdByPath = new Map<string, string>();
      const fingerprintByPath = new Map(fingerprints.map((item) => [item.path, item]));
      for (const file of files) {
        const fp = fingerprintByPath.get(file.path);
        const existing = await trx("core_source_file").where({ project_id: projectId, path: file.path }).first();
        let fileId: string;
        if (existing) {
          fileId = String(existing.file_id);
          await trx("core_source_file")
            .where({ file_id: fileId })
            .update({
              kind: file.kind,
              reference_count: file.referenceCount,
              mtime_ms: fp?.mtimeMs ?? existing.mtime_ms,
              size_bytes: fp?.sizeBytes ?? existing.size_bytes,
              content_hash: fp?.contentHash ?? existing.content_hash,
              indexed_at: trx.fn.now(),
              updated_at: trx.fn.now(),
            });
        } else {
          const [inserted] = await trx("core_source_file")
            .insert({
              workspace_id: workspaceId,
              project_id: projectId,
              path: file.path,
              kind: file.kind,
              reference_count: file.referenceCount,
              mtime_ms: fp?.mtimeMs ?? null,
              size_bytes: fp?.sizeBytes ?? null,
              content_hash: fp?.contentHash ?? null,
              indexed_at: trx.fn.now(),
            })
            .returning("*");
          fileId = String(inserted.file_id);
        }
        fileIdByPath.set(file.path, fileId);
        await trx("core_file_operation").where({ file_id: fileId }).del();
        await trx("core_file_fragment").where({ file_id: fileId }).del();
        for (const name of file.operationNames) {
          const operationId = opIdByName.get(name);
          if (!operationId) continue;
          await trx("core_file_operation")
            .insert({ file_id: fileId, operation_id: operationId })
            .onConflict(["file_id", "operation_id"])
            .ignore();
        }
        for (const name of file.fragmentNames) {
          const fragmentId = fragIdByName.get(name);
          if (!fragmentId) continue;
          await trx("core_file_fragment")
            .insert({ file_id: fileId, fragment_id: fragmentId })
            .onConflict(["file_id", "fragment_id"])
            .ignore();
        }
      }

      for (const fp of fingerprints) {
        if (fileIdByPath.has(fp.path)) continue;
        const existing = await trx("core_source_file").where({ project_id: projectId, path: fp.path }).first();
        if (existing) {
          await trx("core_source_file")
            .where({ file_id: existing.file_id })
            .update({
              mtime_ms: fp.mtimeMs,
              size_bytes: fp.sizeBytes,
              content_hash: fp.contentHash,
              indexed_at: trx.fn.now(),
            });
        }
      }

      if (symbols.length) {
        await trx("core_symbol_ref").insert(
          symbols.map((symbol) => ({
            workspace_id: workspaceId,
            project_id: projectId,
            symbol: symbol.symbol,
            file_path: symbol.filePath,
            line: symbol.line,
            kind: symbol.kind,
          })),
        );
      }

      // Rebuild usages for affected operation names from symbol index + provided usages
      const affectedNames = [
        ...new Set([
          ...operations.map((op) => op.name).filter(Boolean),
          ...usages.map((u) => u.operationName),
          ...symbols.map((s) => s.symbol),
        ]),
      ] as string[];
      for (const name of affectedNames) {
        const operationId = opIdByName.get(name);
        if (!operationId) continue;
        await trx("core_usage").where({ operation_id: operationId }).del();
        const refs = await trx("core_symbol_ref").where({ project_id: projectId, symbol: name });
        for (const ref of refs) {
          let fileId = fileIdByPath.get(String(ref.file_path)) ?? null;
          if (!fileId) {
            const existingFile = await trx("core_source_file")
              .where({ project_id: projectId, path: ref.file_path })
              .first();
            fileId = existingFile ? String(existingFile.file_id) : null;
          }
          await trx("core_usage").insert({
            workspace_id: workspaceId,
            operation_id: operationId,
            file_id: fileId,
            file_path: String(ref.file_path),
            line: Number(ref.line) || 1,
            kind: String(ref.kind),
          });
        }
        const used = refs.length > 0;
        await trx("core_operation").where({ operation_id: operationId }).update({ unused: !used });
      }

      for (const usage of usages) {
        const operationId = opIdByName.get(usage.operationName);
        if (!operationId) continue;
        const exists = await trx("core_usage")
          .where({ operation_id: operationId, file_path: usage.filePath, line: usage.line })
          .first();
        if (exists) continue;
        let fileId = fileIdByPath.get(usage.filePath) ?? null;
        if (!fileId) {
          const existingFile = await trx("core_source_file")
            .where({ project_id: projectId, path: usage.filePath })
            .first();
          fileId = existingFile ? String(existingFile.file_id) : null;
        }
        await trx("core_usage").insert({
          workspace_id: workspaceId,
          operation_id: operationId,
          file_id: fileId,
          file_path: usage.filePath,
          line: usage.line,
          kind: usage.kind,
        });
      }

      // Replace graph edges that mention affected op/file keys
      const affectedKeys = [
        ...operations.filter((op) => op.name).map((op) => `op:${op.name}`),
        ...changedPaths.map((p) => `file:${p}`),
        ...deletedPaths.map((p) => `file:${p}`),
      ];
      if (affectedKeys.length) {
        await trx("core_graph_edge")
          .where({ project_id: projectId, workspace_id: workspaceId })
          .andWhere((qb) => {
            qb.whereIn("source_id", affectedKeys).orWhereIn("target_id", affectedKeys);
          })
          .del();
      }

      const typeRows = await trx("core_graphql_type").where({ project_id: projectId });
      const typeIdByName = new Map(typeRows.map((row) => [String(row.name), String(row.type_id)]));
      const fieldRows = typeRows.length
        ? await trx("core_graphql_field").whereIn(
            "type_id",
            typeRows.map((row) => row.type_id),
          )
        : [];
      const fieldIdByKey = new Map(
        fieldRows.map((row) => {
          const typeName = String(typeRows.find((t) => String(t.type_id) === String(row.type_id))?.name ?? "");
          return [`${typeName}-${row.name}`, String(row.field_id)];
        }),
      );
      const allFiles = await trx("core_source_file").where({ project_id: projectId });
      for (const row of allFiles) fileIdByPath.set(String(row.path), String(row.file_id));

      const maps = {
        ops: new Map([...opIdByName.entries()].map(([name, id]) => [name, prefixed("op", id)])),
        frags: new Map([...fragIdByName.entries()].map(([name, id]) => [name, prefixed("frag", id)])),
        types: new Map([...typeIdByName.entries()].map(([name, id]) => [name, prefixed("type", id)])),
        fields: new Map([...fieldIdByKey.entries()].map(([key, id]) => [key, prefixed("field", id)])),
        files: new Map([...fileIdByPath.entries()].map(([pathKey, id]) => [pathKey, prefixed("file", id)])),
      };
      const edgeRows = edges.map((edge) => ({
        workspace_id: workspaceId,
        project_id: projectId,
        source_id: remapEdgeKey(edge.source, maps),
        target_id: remapEdgeKey(edge.target, maps),
        relation: edge.relation,
      }));
      for (const batch of chunk(edgeRows, 400)) {
        if (batch.length) await trx("core_graph_edge").insert(batch);
      }

      await trx("core_repository_link")
        .where({ repository_link_id: repositoryLinkId })
        .update({
          catalog_revision: trx.raw("catalog_revision + 1"),
          updated_at: trx.fn.now(),
        });
    });
  }

  async upsertInferredEnvironments(
    workspaceId: string,
    endpoints: Array<{ name: string; url: string; environment: string }>,
  ): Promise<void> {
    for (const endpoint of endpoints) {
      const existing = await this.db("core_environment")
        .where({ workspace_id: workspaceId, endpoint_url: endpoint.url })
        .first();
      if (existing) {
        await this.db("core_environment")
          .where({ environment_id: existing.environment_id })
          .update({ updated_at: this.db.fn.now() });
        continue;
      }
      let name = endpoint.name;
      const nameTaken = await this.db("core_environment").where({ workspace_id: workspaceId, name }).first();
      if (nameTaken) {
        try {
          name = `${endpoint.name} (${new URL(endpoint.url).host})`;
        } catch {
          name = `${endpoint.name} ${endpoint.url.slice(-12)}`;
        }
      }
      await this.db("core_environment").insert({
        workspace_id: workspaceId,
        name,
        endpoint_url: endpoint.url,
        is_production: endpoint.environment === "production",
        headers_json: {},
      });
    }
  }

  async listRepositories(workspaceId: string): Promise<ExplorerCatalogPayload["repository"][]> {
    const links = await this.db("core_repository_link as rl")
      .leftJoin("core_project as p", "p.project_id", "rl.project_id")
      .where("rl.workspace_id", workspaceId)
      .whereNot("rl.status", "DISABLED")
      .select("rl.*", "p.name as project_name")
      .orderBy("rl.updated_at", "desc");
    const ids = links.map((row) => row.repository_link_id);
    const counts = ids.length
      ? await this.db("core_operation")
          .whereIn("repository_link_id", ids)
          .groupBy("repository_link_id")
          .select("repository_link_id")
          .count("* as n")
      : [];
    const countById = new Map(counts.map((row) => [String(row.repository_link_id), Number(row.n)]));
    return links.map((link) => {
      const localPath = (link.local_path as string | null) ?? null;
      return {
        id: String(link.repository_link_id),
        name:
          (link.display_name as string | null) ||
          (link.project_name as string | null) ||
          folderName(localPath) ||
          "Repository",
        branch: (link.branch_name as string | null) || (link.default_branch as string) || "main",
        scannedAtLabel: relativeLabel(link.updated_at as string),
        localPath,
        status: String(link.status ?? "CONNECTED"),
        lastError: (link.last_error as string | null) ?? null,
        operationCount: countById.get(String(link.repository_link_id)) ?? 0,
      };
    });
  }

  async assembleCatalog(workspaceId: string, repositoryLinkId?: string | null): Promise<ExplorerCatalogPayload | null> {
    const base = this.db("core_repository_link")
      .where({ workspace_id: workspaceId })
      .whereNot({ status: "DISABLED" });
    const link = repositoryLinkId
      ? await base.clone().where({ repository_link_id: repositoryLinkId }).first()
      : ((await base.clone().where({ status: "INDEXED" }).orderBy("updated_at", "desc").first()) ??
        (await base.clone().orderBy("updated_at", "desc").first()));
    if (!link) return null;

    const projectId = String(link.project_id);
    const repositoryId = String(link.repository_link_id);
    const scannedAt = link.updated_at ? String(link.updated_at) : new Date().toISOString();

    const opRows = await this.db("core_operation").where({
      workspace_id: workspaceId,
      project_id: projectId,
      repository_link_id: repositoryId,
    });
    const sourceRows = opRows.length
      ? await this.db("core_operation_source").whereIn(
          "operation_id",
          opRows.map((row) => row.operation_id),
        )
      : [];
    const sourceByOp = new Map<string, { path: string; line: number }>();
    for (const row of sourceRows) {
      const id = String(row.operation_id);
      if (!sourceByOp.has(id)) {
        sourceByOp.set(id, { path: String(row.file_path), line: Number(row.start_line) || 1 });
      }
    }

    const fragRows = await this.db("core_fragment").where({
      workspace_id: workspaceId,
      project_id: projectId,
      repository_link_id: repositoryId,
    });
    const fragUsageRows = fragRows.length
      ? await this.db("core_fragment_usage").whereIn(
          "fragment_id",
          fragRows.map((row) => row.fragment_id),
        )
      : [];
    const typeRows = await this.db("core_graphql_type").where({ workspace_id: workspaceId, project_id: projectId });
    const fieldRows = typeRows.length
      ? await this.db("core_graphql_field").whereIn(
          "type_id",
          typeRows.map((row) => row.type_id),
        )
      : [];
    const fileRows = await this.db("core_source_file").where({ workspace_id: workspaceId, project_id: projectId });
    const fileOpRows = fileRows.length
      ? await this.db("core_file_operation").whereIn(
          "file_id",
          fileRows.map((row) => row.file_id),
        )
      : [];
    const fileFragRows = fileRows.length
      ? await this.db("core_file_fragment").whereIn(
          "file_id",
          fileRows.map((row) => row.file_id),
        )
      : [];
    const usageRows = opRows.length
      ? await this.db("core_usage")
          .where({ workspace_id: workspaceId })
          .whereIn(
            "operation_id",
            opRows.map((row) => row.operation_id),
          )
      : [];
    const edgeRows = await this.db("core_graph_edge").where({ workspace_id: workspaceId, project_id: projectId });
    const envRows = await this.db("core_environment").where({ workspace_id: workspaceId }).orderBy("name");
    const execRows = await this.db("core_execution as e")
      .leftJoin("core_operation as o", "o.operation_id", "e.operation_id")
      .where("e.workspace_id", workspaceId)
      .select("e.*", "o.name as operation_name", "o.operation_type as operation_type")
      .orderBy("e.created_at", "desc")
      .limit(40);

    const fileIdByPath = new Map(fileRows.map((row) => [String(row.path), prefixed("file", String(row.file_id))]));
    const typeIdByName = new Map(typeRows.map((row) => [String(row.name), prefixed("type", String(row.type_id))]));
    const fragIdByName = new Map(fragRows.map((row) => [String(row.name), prefixed("frag", String(row.fragment_id))]));

    const opsForFrag = new Map<string, string[]>();
    const fragsForOp = new Map<string, string[]>();
    for (const row of fragUsageRows) {
      const fragId = prefixed("frag", String(row.fragment_id));
      const opId = prefixed("op", String(row.operation_id));
      opsForFrag.set(fragId, [...(opsForFrag.get(fragId) ?? []), opId]);
      fragsForOp.set(opId, [...(fragsForOp.get(opId) ?? []), fragId]);
    }

    const opsForFile = new Map<string, string[]>();
    for (const row of fileOpRows) {
      const fileId = prefixed("file", String(row.file_id));
      const opId = prefixed("op", String(row.operation_id));
      opsForFile.set(fileId, [...(opsForFile.get(fileId) ?? []), opId]);
    }
    const fragsForFile = new Map<string, string[]>();
    const filesForFrag = new Map<string, string[]>();
    for (const row of fileFragRows) {
      const fileId = prefixed("file", String(row.file_id));
      const fragId = prefixed("frag", String(row.fragment_id));
      fragsForFile.set(fileId, [...(fragsForFile.get(fileId) ?? []), fragId]);
      filesForFrag.set(fragId, [...(filesForFrag.get(fragId) ?? []), fileId]);
    }

    const usagesForOp = new Map<string, string[]>();
    const usages = usageRows.map((row) => {
      const id = prefixed("usage", String(row.usage_id));
      const opId = prefixed("op", String(row.operation_id));
      usagesForOp.set(opId, [...(usagesForOp.get(opId) ?? []), id]);
      return {
        id,
        fileId: row.file_id ? prefixed("file", String(row.file_id)) : (fileIdByPath.get(String(row.file_path)) ?? ""),
        path: String(row.file_path),
        line: Number(row.line) || 1,
        kind: String(row.kind),
      };
    });

    const fields = fieldRows.map((row) => {
      const typeId = prefixed("type", String(row.type_id));
      const typeName = String(typeRows.find((item) => String(item.type_id) === String(row.type_id))?.name ?? "");
      return {
        id: prefixed("field", String(row.field_id)),
        name: String(row.name),
        typeId,
        typeName,
        returnType: String(row.return_type),
        deprecated: Boolean(row.deprecated),
        deprecationReason: (row.deprecation_reason as string | null) ?? undefined,
      };
    });
    const fieldsForType = new Map<string, string[]>();
    for (const field of fields) {
      fieldsForType.set(field.typeId, [...(fieldsForType.get(field.typeId) ?? []), field.id]);
    }

    const typeIdsForOp = new Map<string, string[]>();
    for (const row of edgeRows) {
      const source = String(row.source_id);
      const target = String(row.target_id);
      if (row.relation === "uses" && source.startsWith("op:") && target.startsWith("type:")) {
        typeIdsForOp.set(source, [...new Set([...(typeIdsForOp.get(source) ?? []), target])]);
      }
    }

    const defaultEndpointId = envRows[0] ? prefixed("ep", String(envRows[0].environment_id)) : "";

    const operations = opRows.map((row) => {
      const id = prefixed("op", String(row.operation_id));
      const source = sourceByOp.get(String(row.operation_id)) ?? { path: "", line: 1 };
      const fileId = fileIdByPath.get(source.path) ?? "";
      const rootType =
        typeIdByName.get(row.operation_type === "MUTATION" ? "Mutation" : row.operation_type === "SUBSCRIPTION" ? "Subscription" : "Query") ??
        null;
      const typeIds = [...(typeIdsForOp.get(id) ?? [])];
      if (rootType && !typeIds.includes(rootType)) typeIds.unshift(rootType);
      return {
        id,
        name: String(row.name ?? "Unnamed"),
        kind: opKind(String(row.operation_type)),
        description: (row.description as string | null) ?? "",
        source: { fileId, path: source.path, line: source.line },
        document: String(row.content),
        variables: (row.variables_json as Record<string, unknown>) ?? {},
        fragmentIds: fragsForOp.get(id) ?? [],
        typeIds,
        usageIds: usagesForOp.get(id) ?? [],
        endpointId: defaultEndpointId,
        unused: Boolean(row.unused),
        lastChanged: relativeLabel(row.updated_at as string),
      };
    });

    const fragments = fragRows.map((row) => {
      const id = prefixed("frag", String(row.fragment_id));
      const typeIds = row.type_condition ? [typeIdByName.get(String(row.type_condition))].filter(Boolean) : [];
      const fileId = fileIdByPath.get(String(row.file_path)) ?? "";
      const duplicateName = row.duplicate_of as string | null;
      return {
        id,
        name: String(row.name),
        document: String(row.content),
        typeIds,
        operationIds: opsForFrag.get(id) ?? [],
        fileIds: filesForFrag.get(id) ?? (fileId ? [fileId] : []),
        duplicateOf: duplicateName ? (fragIdByName.get(duplicateName) ?? undefined) : undefined,
        source: { fileId, path: String(row.file_path), line: Number(row.start_line) || 1 },
      };
    });

    const types = typeRows.map((row) => {
      const id = prefixed("type", String(row.type_id));
      const operationIds = operations
        .filter((op) => op.typeIds.includes(id))
        .map((op) => op.id);
      const fragmentIds = fragments.filter((item) => item.typeIds.includes(id)).map((item) => item.id);
      return {
        id,
        name: String(row.name),
        kind: String(row.kind),
        sdl: String(row.sdl ?? ""),
        fieldIds: fieldsForType.get(id) ?? [],
        operationIds,
        fragmentIds,
        fileIds: [],
        source: "inferred",
      };
    });

    const files = fileRows.map((row) => {
      const id = prefixed("file", String(row.file_id));
      return {
        id,
        path: String(row.path),
        kind: String(row.kind),
        operationIds: opsForFile.get(id) ?? [],
        fragmentIds: fragsForFile.get(id) ?? [],
        referenceCount: Number(row.reference_count) || 0,
      };
    });

    const endpoints = envRows.map((row) => ({
      id: prefixed("ep", String(row.environment_id)),
      name: String(row.name),
      url: String(row.endpoint_url ?? ""),
      environment: Boolean(row.is_production) ? "production" : "development",
      operationCount: operations.length,
      schemaDate: relativeLabel(scannedAt),
      latency: "—",
      headers: parseEnvHeaders(row.headers_json),
      schemaPulled: Boolean(row.introspected_sdl),
      schemaPulledAt: row.introspected_at ? String(row.introspected_at) : null,
      introspectedSdl: typeof row.introspected_sdl === "string" ? row.introspected_sdl : null,
    }));

    const history = execRows
      .filter((row) => row.operation_id)
      .map((row) => {
        const createdAt = String(row.created_at);
        const kind = opKind(String(row.operation_type ?? "QUERY"));
        return {
          id: prefixed("h", String(row.execution_id)),
          operationId: prefixed("op", String(row.operation_id)),
          operationName: String(row.operation_name ?? "Unnamed"),
          kind,
          at: new Date(createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          day: historyDay(createdAt),
        };
      });

    const unusedCount = operations.filter((op) => op.unused).length;
    const duplicateCount = fragments.filter((item) => item.duplicateOf).length;
    const deprecatedCount = fields.filter((item) => item.deprecated).length;
    const attention: Array<{ id: string; label: string; count: number; severity: "warning" | "info" }> = [];
    if (unusedCount) attention.push({ id: "unused", label: "Unused operations", count: unusedCount, severity: "warning" });
    if (duplicateCount) {
      attention.push({ id: "duplicates", label: "Duplicate fragments", count: duplicateCount, severity: "warning" });
    }
    if (deprecatedCount) {
      attention.push({ id: "deprecated", label: "Deprecated fields", count: deprecatedCount, severity: "info" });
    }

    const queries = operations.filter((op) => op.kind === "query").length;
    const mutations = operations.filter((op) => op.kind === "mutation").length;
    const subscriptions = operations.filter((op) => op.kind === "subscription").length;
    const recentFromHistory = [...new Set(history.map((item) => item.operationId))].slice(0, 8);
    const recentOperationIds = recentFromHistory.length ? recentFromHistory : operations.slice(0, 8).map((op) => op.id);
    const graphEdges = edgeRows.map((row) => ({
      id: prefixed("e", String(row.edge_id)),
      source: String(row.source_id),
      target: String(row.target_id),
      relation: String(row.relation),
    }));
    const surfaceNodeIds = [
      ...operations.slice(0, 8).map((op) => op.id),
      ...fragments.slice(0, 4).map((item) => item.id),
      ...types.slice(0, 4).map((item) => item.id),
    ];

    return {
      repository: {
        id: repositoryId,
        name: (link.display_name as string | null) ?? folderName(link.local_path as string | null) ?? "Repository",
        branch: (link.branch_name as string | null) ?? (link.default_branch as string) ?? "main",
        scannedAtLabel: relativeLabel(scannedAt),
        localPath: (link.local_path as string | null) ?? null,
        status: String(link.status ?? "CONNECTED"),
        lastError: (link.last_error as string | null) ?? null,
        operationCount: operations.length,
      },
      stats: {
        operations: operations.length,
        queries,
        mutations,
        subscriptions,
        fragments: fragments.length,
        types: types.length,
        endpoints: endpoints.length,
        files: files.length,
      },
      operations,
      fragments,
      types,
      fields,
      files,
      endpoints,
      usages,
      attention,
      recentOperationIds,
      graphEdges,
      surfaceNodeIds,
      history,
    };
  }

  scanStatusFromJob(job: {
    id: string;
    status: string;
    lastError: string | null;
    payload: Record<string, unknown>;
  }): ScanStatusPayload {
    const payload = job.payload ?? {};
    const done = /^(completed|failed)$/i.test(job.status);
    const stats = payload.scanStats as ScanStatusPayload["stats"] | undefined;
    const report = (payload.scanReport ?? {}) as {
      ignoredCount?: unknown;
      skippedFiles?: unknown;
      parseErrors?: Array<{ path?: unknown; message?: unknown }>;
    };
    return {
      jobId: job.id,
      status: job.status,
      step: typeof payload.scanStep === "string" ? payload.scanStep : null,
      done,
      error: job.lastError,
      stats: stats ?? null,
      ignoredCount: Number(report.ignoredCount) || 0,
      skippedFiles: Array.isArray(report.skippedFiles) ? report.skippedFiles.map((item) => String(item)) : [],
      parseErrors: Array.isArray(report.parseErrors)
        ? report.parseErrors.map((item) => ({
            path: String(item.path ?? ""),
            message: String(item.message ?? "Parse error"),
          }))
        : [],
    };
  }
}
