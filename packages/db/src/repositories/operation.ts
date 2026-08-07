import type { Knex } from "knex";
import type { OperationDocument, OperationSourceLocation, OperationType } from "@graphscope/shared-types";

export interface ParsedOperation {
  filePath: string;
  operationName: string | null;
  operationType: OperationType;
  content: string;
  contentHash: string;
  confidence: number;
  startLine: number;
  endLine: number;
}

function mapOperation(row: Record<string, unknown>): OperationDocument {
  return {
    id: String(row.operation_id),
    projectId: String(row.project_id),
    workspaceId: String(row.workspace_id),
    name: (row.name as string | null) ?? null,
    operationType: row.operation_type as OperationType,
    contentHash: row.content_hash as string,
    content: row.content as string,
    confidence: Number(row.confidence),
    isManual: Boolean(row.is_manual),
    locations: [],
  };
}

export class OperationRepository {
  constructor(private readonly db: Knex) {}

  async insertStaging(
    workspaceId: string,
    projectId: string,
    repositoryLinkId: string | null,
    jobId: string | null,
    op: ParsedOperation,
  ): Promise<void> {
    await this.db("stg_parse_result").insert({
      workspace_id: workspaceId,
      project_id: projectId,
      repository_link_id: repositoryLinkId,
      job_id: jobId,
      file_path: op.filePath,
      operation_name: op.operationName,
      operation_type: op.operationType,
      content: op.content,
      content_hash: op.contentHash,
      confidence: op.confidence,
      start_line: op.startLine,
      end_line: op.endLine,
    });
  }

  async clearStaging(projectId: string, workspaceId: string): Promise<void> {
    await this.db("stg_parse_result").where({ project_id: projectId, workspace_id: workspaceId }).del();
  }

  async promoteFromStaging(
    workspaceId: string,
    projectId: string,
    repositoryLinkId: string | null,
    githubBaseUrl: string | null,
  ): Promise<number> {
    const rows = await this.db("stg_parse_result").where({ project_id: projectId, workspace_id: workspaceId });
    let count = 0;
    for (const row of rows) {
      const existing = await this.db("core_operation")
        .where({ project_id: projectId, content_hash: row.content_hash })
        .first();
      let operationId: string;
      if (existing) {
        operationId = String(existing.operation_id);
        await this.db("core_operation").where({ operation_id: operationId }).update({
          name: row.operation_name,
          content: row.content,
          confidence: row.confidence,
          repository_link_id: repositoryLinkId,
          updated_at: this.db.fn.now(),
        });
      } else {
        const [inserted] = await this.db("core_operation")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            repository_link_id: repositoryLinkId,
            name: row.operation_name,
            operation_type: row.operation_type,
            content: row.content,
            content_hash: row.content_hash,
            confidence: row.confidence,
          })
          .returning("*");
        operationId = String(inserted.operation_id);
        count++;
      }
      await this.db("core_operation_source")
        .where({ operation_id: operationId, file_path: row.file_path })
        .del();
      const githubUrl =
        githubBaseUrl && row.start_line
          ? `${githubBaseUrl}/${row.file_path}#L${row.start_line}-L${row.end_line}`
          : null;
      await this.db("core_operation_source").insert({
        operation_id: operationId,
        file_path: row.file_path,
        start_line: row.start_line,
        end_line: row.end_line,
        github_url: githubUrl,
      });
    }
    await this.clearStaging(projectId, workspaceId);
    return count;
  }

  async listForWorkspace(
    workspaceId: string,
    filter?: { projectId?: string; operationType?: string; search?: string },
    limit = 100,
  ): Promise<(OperationDocument & { projectName?: string })[]> {
    let query = this.db("core_operation as o")
      .join("core_project as p", "p.project_id", "o.project_id")
      .where("o.workspace_id", workspaceId)
      .select("o.*", "p.name as project_name");

    if (filter?.projectId) query = query.andWhere("o.project_id", filter.projectId);
    if (filter?.operationType) query = query.andWhere("o.operation_type", filter.operationType);
    if (filter?.search) {
      query = query.andWhere((qb) => {
        qb.whereILike("o.name", `%${filter.search}%`).orWhereILike("o.content", `%${filter.search}%`);
      });
    }

    const rows = await query.orderBy("o.updated_at", "desc").limit(limit);
    const ops = rows.map((row) => ({
      ...mapOperation(row),
      projectName: row.project_name as string,
    }));
    for (const op of ops) {
      op.locations = await this.getSources(op.id);
    }
    return ops;
  }

  async countForWorkspace(workspaceId: string): Promise<number> {
    const result = await this.db("core_operation").where({ workspace_id: workspaceId }).count("* as count").first();
    return Number(result?.count ?? 0);
  }

  async listForProject(
    projectId: string,
    workspaceId: string,
    limit = 50,
  ): Promise<OperationDocument[]> {
    const rows = await this.db("core_operation")
      .where({ project_id: projectId, workspace_id: workspaceId })
      .orderBy("updated_at", "desc")
      .limit(limit);
    const ops = rows.map(mapOperation);
    for (const op of ops) {
      op.locations = await this.getSources(op.id);
    }
    return ops;
  }

  async findById(operationId: string, workspaceId: string): Promise<(OperationDocument & { projectName?: string }) | null> {
    const row = await this.db("core_operation as o")
      .join("core_project as p", "p.project_id", "o.project_id")
      .where({ "o.operation_id": operationId, "o.workspace_id": workspaceId })
      .select("o.*", "p.name as project_name")
      .first();
    if (!row) return null;
    const op = { ...mapOperation(row), projectName: row.project_name as string };
    op.locations = await this.getSources(op.id);
    return op;
  }

  async getSources(operationId: string): Promise<OperationSourceLocation[]> {
    const rows = await this.db("core_operation_source").where({ operation_id: operationId });
    return rows.map((r) => ({
      path: r.file_path as string,
      startLine: Number(r.start_line),
      endLine: Number(r.end_line),
      githubUrl: (r.github_url as string | null) ?? null,
    }));
  }

  async setManualFlag(operationId: string, workspaceId: string, isManual: boolean): Promise<OperationDocument | null> {
    const [row] = await this.db("core_operation")
      .where({ operation_id: operationId, workspace_id: workspaceId })
      .update({ is_manual: isManual, updated_at: this.db.fn.now() })
      .returning("*");
    if (!row) return null;
    const op = mapOperation(row);
    op.locations = await this.getSources(op.id);
    return op;
  }
}
