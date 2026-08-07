import type { Knex } from "knex";
import type { Environment, SecretMeta } from "@graphscope/shared-types";

function mapEnv(row: Record<string, unknown>): Environment {
  return {
    id: String(row.environment_id),
    workspaceId: String(row.workspace_id),
    name: row.name as string,
    endpointUrl: (row.endpoint_url as string) ?? "",
    isProduction: Boolean(row.is_production),
    headers: (row.headers_json as Record<string, string>) ?? {},
  };
}

function mapSecret(row: Record<string, unknown>): SecretMeta {
  return {
    id: String(row.secret_meta_id),
    environmentId: String(row.environment_id),
    name: row.name as string,
    lastFour: row.last_four as string,
    updatedAt: String(row.updated_at),
  };
}

export class EnvironmentRepository {
  constructor(private readonly db: Knex) {}

  async create(
    workspaceId: string,
    input: { name: string; endpointUrl: string; isProduction?: boolean; headers?: Record<string, string> },
  ): Promise<Environment> {
    const [row] = await this.db("core_environment")
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        endpoint_url: input.endpointUrl,
        is_production: input.isProduction ?? false,
        headers_json: input.headers ?? {},
      })
      .returning("*");
    return mapEnv(row);
  }

  async listForWorkspace(workspaceId: string): Promise<Environment[]> {
    const rows = await this.db("core_environment").where({ workspace_id: workspaceId }).orderBy("name");
    return rows.map(mapEnv);
  }

  async findById(id: string, workspaceId: string): Promise<Environment | null> {
    const row = await this.db("core_environment").where({ environment_id: id, workspace_id: workspaceId }).first();
    return row ? mapEnv(row) : null;
  }

  async update(
    id: string,
    workspaceId: string,
    patch: Partial<{ name: string; endpointUrl: string; isProduction: boolean; headers: Record<string, string> }>,
  ): Promise<Environment | null> {
    const update: Record<string, unknown> = { updated_at: this.db.fn.now() };
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.endpointUrl !== undefined) update.endpoint_url = patch.endpointUrl;
    if (patch.isProduction !== undefined) update.is_production = patch.isProduction;
    if (patch.headers !== undefined) update.headers_json = patch.headers;
    const [row] = await this.db("core_environment")
      .where({ environment_id: id, workspace_id: workspaceId })
      .update(update)
      .returning("*");
    return row ? mapEnv(row) : null;
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const n = await this.db("core_environment").where({ environment_id: id, workspace_id: workspaceId }).del();
    return n > 0;
  }

  async upsertSecretMeta(
    workspaceId: string,
    environmentId: string,
    name: string,
    lastFour: string,
  ): Promise<SecretMeta> {
    const existing = await this.db("core_secret_meta").where({ environment_id: environmentId, name }).first();
    if (existing) {
      const [row] = await this.db("core_secret_meta")
        .where({ secret_meta_id: existing.secret_meta_id })
        .update({ last_four: lastFour, updated_at: this.db.fn.now() })
        .returning("*");
      return mapSecret(row);
    }
    const [row] = await this.db("core_secret_meta")
      .insert({ workspace_id: workspaceId, environment_id: environmentId, name, last_four: lastFour })
      .returning("*");
    return mapSecret(row);
  }

  async listSecrets(environmentId: string, workspaceId: string): Promise<SecretMeta[]> {
    const rows = await this.db("core_secret_meta")
      .where({ environment_id: environmentId, workspace_id: workspaceId })
      .orderBy("name");
    return rows.map(mapSecret);
  }

  async findSecretById(id: string, workspaceId: string): Promise<SecretMeta | null> {
    const row = await this.db("core_secret_meta").where({ secret_meta_id: id, workspace_id: workspaceId }).first();
    return row ? mapSecret(row) : null;
  }

  async deleteSecret(id: string, workspaceId: string): Promise<boolean> {
    const n = await this.db("core_secret_meta").where({ secret_meta_id: id, workspace_id: workspaceId }).del();
    return n > 0;
  }
}
