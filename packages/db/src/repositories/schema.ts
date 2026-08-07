import type { Knex } from "knex";
import type { Schema, SchemaCheck, SchemaCheckResult, SchemaCheckStatus, SchemaVersion } from "@graphscope/shared-types";

function mapSchema(row: Record<string, unknown>): Schema {
  return {
    id: String(row.schema_id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    name: row.name as string,
  };
}

function mapVersion(row: Record<string, unknown>, sdl?: string): SchemaVersion {
  return {
    id: String(row.schema_version_id),
    schemaId: String(row.schema_id),
    workspaceId: String(row.workspace_id),
    contentHash: row.content_hash as string,
    sdl: sdl ?? "",
    gitSha: (row.git_sha as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function mapCheck(row: Record<string, unknown>): SchemaCheck {
  return {
    id: String(row.schema_check_id),
    schemaVersionId: String(row.schema_version_id),
    status: row.status as SchemaCheckStatus,
    result: (row.result as SchemaCheckResult | null) ?? null,
    breakingCount: Number(row.breaking_count),
    dangerousCount: Number(row.dangerous_count),
  };
}

export class SchemaRepository {
  constructor(private readonly db: Knex) {}

  async findOrCreateSchema(workspaceId: string, projectId: string, name: string): Promise<Schema> {
    const existing = await this.db("core_schema").where({ project_id: projectId, name }).first();
    if (existing) return mapSchema(existing);
    const [row] = await this.db("core_schema")
      .insert({ workspace_id: workspaceId, project_id: projectId, name })
      .returning("*");
    return mapSchema(row);
  }

  async listForProject(projectId: string, workspaceId: string): Promise<Schema[]> {
    const rows = await this.db("core_schema").where({ project_id: projectId, workspace_id: workspaceId }).orderBy("name");
    return rows.map(mapSchema);
  }

  async findById(schemaId: string, workspaceId: string): Promise<Schema | null> {
    const row = await this.db("core_schema").where({ schema_id: schemaId, workspace_id: workspaceId }).first();
    return row ? mapSchema(row) : null;
  }

  async createVersion(
    schemaId: string,
    workspaceId: string,
    contentHash: string,
    sdlPath: string,
    gitSha: string | null,
  ): Promise<SchemaVersion> {
    const existing = await this.db("core_schema_version")
      .where({ schema_id: schemaId, content_hash: contentHash })
      .first();
    if (existing) return mapVersion(existing);
    const [row] = await this.db("core_schema_version")
      .insert({
        schema_id: schemaId,
        workspace_id: workspaceId,
        content_hash: contentHash,
        sdl_path: sdlPath,
        git_sha: gitSha,
      })
      .returning("*");
    return mapVersion(row);
  }

  async listVersions(schemaId: string, workspaceId: string): Promise<SchemaVersion[]> {
    const rows = await this.db("core_schema_version")
      .where({ schema_id: schemaId, workspace_id: workspaceId })
      .orderBy("created_at", "desc");
    return rows.map((r) => mapVersion(r));
  }

  async findVersionById(versionId: string, workspaceId: string): Promise<(SchemaVersion & { sdlPath: string }) | null> {
    const row = await this.db("core_schema_version")
      .where({ schema_version_id: versionId, workspace_id: workspaceId })
      .first();
    if (!row) return null;
    return { ...mapVersion(row), sdlPath: row.sdl_path as string };
  }

  async createCheck(schemaVersionId: string, workspaceId: string): Promise<SchemaCheck> {
    const [row] = await this.db("core_schema_check")
      .insert({ schema_version_id: schemaVersionId, workspace_id: workspaceId, status: "PENDING" })
      .returning("*");
    return mapCheck(row);
  }

  async updateCheck(
    checkId: string,
    patch: {
      status: SchemaCheckStatus;
      result?: SchemaCheckResult | null;
      breakingCount?: number;
      dangerousCount?: number;
      resultJson?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.db("core_schema_check")
      .where({ schema_check_id: checkId })
      .update({
        status: patch.status,
        result: patch.result ?? null,
        breaking_count: patch.breakingCount ?? 0,
        dangerous_count: patch.dangerousCount ?? 0,
        result_json: patch.resultJson ?? {},
      });
  }

  async listChecks(schemaVersionId: string): Promise<SchemaCheck[]> {
    const rows = await this.db("core_schema_check")
      .where({ schema_version_id: schemaVersionId })
      .orderBy("created_at", "desc");
    return rows.map(mapCheck);
  }
}
