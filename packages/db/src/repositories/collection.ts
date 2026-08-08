import type { Knex } from "knex";
import type { Collection, CollectionItem, Execution, ExecutionStatus } from "@graphscope/shared-types";

function mapCollection(row: Record<string, unknown>): Collection {
  return {
    id: String(row.collection_id),
    workspaceId: String(row.workspace_id),
    name: row.name as string,
  };
}

function mapItem(row: Record<string, unknown>): CollectionItem {
  return {
    id: String(row.collection_item_id),
    collectionId: String(row.collection_id),
    workspaceId: String(row.workspace_id),
    name: row.name as string,
    queryContent: row.query_content as string,
    variablesJson: row.variables_json as string,
    operationId: row.operation_id ? String(row.operation_id) : null,
  };
}

function mapExecution(row: Record<string, unknown>): Execution {
  return {
    id: String(row.execution_id),
    workspaceId: String(row.workspace_id),
    status: row.status as ExecutionStatus,
    httpStatus: row.http_status != null ? Number(row.http_status) : null,
    durationMs: Number(row.duration_ms),
    responseBytes: row.response_bytes != null ? Number(row.response_bytes) : null,
    graphqlErrorsCount: Number(row.graphql_errors_count),
    createdAt: String(row.created_at),
    operationId: row.operation_id ? String(row.operation_id) : null,
    environmentId: row.environment_id ? String(row.environment_id) : null,
    responsePreview: (row.response_preview as string | null) ?? null,
  };
}

export class CollectionRepository {
  constructor(private readonly db: Knex) {}

  async create(workspaceId: string, name: string): Promise<Collection> {
    const [row] = await this.db("core_collection").insert({ workspace_id: workspaceId, name }).returning("*");
    return mapCollection(row);
  }

  async listForWorkspace(workspaceId: string): Promise<Collection[]> {
    const rows = await this.db("core_collection").where({ workspace_id: workspaceId }).orderBy("name");
    return rows.map(mapCollection);
  }

  async findById(id: string, workspaceId: string): Promise<Collection | null> {
    const row = await this.db("core_collection").where({ collection_id: id, workspace_id: workspaceId }).first();
    return row ? mapCollection(row) : null;
  }

  async rename(id: string, workspaceId: string, name: string): Promise<Collection | null> {
    const [row] = await this.db("core_collection")
      .where({ collection_id: id, workspace_id: workspaceId })
      .update({ name, updated_at: this.db.fn.now() })
      .returning("*");
    return row ? mapCollection(row) : null;
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const n = await this.db("core_collection").where({ collection_id: id, workspace_id: workspaceId }).del();
    return n > 0;
  }

  async addItem(
    workspaceId: string,
    collectionId: string,
    input: { name: string; queryContent: string; variablesJson: string; operationId?: string | null },
  ): Promise<CollectionItem> {
    const [row] = await this.db("core_collection_item")
      .insert({
        workspace_id: workspaceId,
        collection_id: collectionId,
        name: input.name,
        query_content: input.queryContent,
        variables_json: input.variablesJson,
        operation_id: input.operationId ?? null,
      })
      .returning("*");
    return mapItem(row);
  }

  async listItems(collectionId: string, workspaceId: string): Promise<CollectionItem[]> {
    const rows = await this.db("core_collection_item")
      .where({ collection_id: collectionId, workspace_id: workspaceId })
      .orderBy("created_at", "desc");
    return rows.map(mapItem);
  }

  async findItemById(id: string, workspaceId: string): Promise<CollectionItem | null> {
    const row = await this.db("core_collection_item")
      .where({ collection_item_id: id, workspace_id: workspaceId })
      .first();
    return row ? mapItem(row) : null;
  }

  async deleteItem(id: string, workspaceId: string): Promise<boolean> {
    const n = await this.db("core_collection_item")
      .where({ collection_item_id: id, workspace_id: workspaceId })
      .del();
    return n > 0;
  }

  /** Idempotent: create default named collection when workspace has none. */
  async ensureDefault(workspaceId: string, name = "Saved requests"): Promise<Collection> {
    const existing = await this.listForWorkspace(workspaceId);
    if (existing[0]) return existing[0];
    try {
      return await this.create(workspaceId, name);
    } catch {
      const after = await this.listForWorkspace(workspaceId);
      if (after[0]) return after[0];
      throw new Error("Failed to ensure default collection");
    }
  }
}

export class ExecutionRepository {
  constructor(private readonly db: Knex) {}

  async create(
    workspaceId: string,
    input: {
      operationId?: string | null;
      environmentId?: string | null;
      queryContent: string;
      variablesJson: string;
      status: ExecutionStatus;
      httpStatus?: number | null;
      durationMs: number;
      responseBytes?: number | null;
      graphqlErrorsCount?: number;
      responsePreview?: string | null;
    },
  ): Promise<Execution> {
    const [row] = await this.db("core_execution")
      .insert({
        workspace_id: workspaceId,
        operation_id: input.operationId ?? null,
        environment_id: input.environmentId ?? null,
        query_content: input.queryContent,
        variables_json: input.variablesJson,
        status: input.status,
        http_status: input.httpStatus ?? null,
        duration_ms: input.durationMs,
        response_bytes: input.responseBytes ?? null,
        graphql_errors_count: input.graphqlErrorsCount ?? 0,
        response_preview: input.responsePreview ?? null,
      })
      .returning("*");
    return mapExecution(row);
  }

  async listForWorkspace(workspaceId: string, limit = 50): Promise<Execution[]> {
    const rows = await this.db("core_execution")
      .where({ workspace_id: workspaceId })
      .orderBy("created_at", "desc")
      .limit(limit);
    return rows.map(mapExecution);
  }
}
