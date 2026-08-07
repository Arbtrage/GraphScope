import type { Knex } from "knex";
import type { Job, JobStatus, RepoSourceType, RepoSyncStatus, RepositoryLink } from "@graphscope/shared-types";

function mapJobStatus(status: string): JobStatus {
  const upper = status.toUpperCase();
  if (upper === "PENDING" || upper === "RUNNING" || upper === "COMPLETED" || upper === "FAILED") {
    return upper;
  }
  return "PENDING";
}

function mapJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.job_id),
    workspaceId: String(row.workspace_id),
    jobType: row.job_type as string,
    status: mapJobStatus(row.status as string),
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    attempts: row.attempts != null ? Number(row.attempts) : 0,
    lastError: (row.last_error as string | null) ?? null,
    lockedAt: row.locked_at ? String(row.locked_at) : null,
  };
}

function mapRepo(row: Record<string, unknown>): RepositoryLink {
  return {
    id: String(row.repository_link_id),
    projectId: String(row.project_id),
    workspaceId: String(row.workspace_id),
    sourceType: row.source_type as RepoSourceType,
    localPath: (row.local_path as string | null) ?? null,
    githubRepo: (row.github_repo as string | null) ?? null,
    defaultBranch: row.default_branch as string,
    status: row.status as RepoSyncStatus,
    lastIndexedSha: (row.last_indexed_sha as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
  };
}

export interface EnableRepositoryInput {
  projectId: string;
  workspaceId: string;
  sourceType: RepoSourceType;
  localPath?: string | null;
  githubRepo?: string | null;
  defaultBranch?: string;
}

export class RepositoryLinkRepository {
  constructor(private readonly db: Knex) {}

  async create(input: EnableRepositoryInput): Promise<RepositoryLink> {
    const [row] = await this.db("core_repository_link")
      .insert({
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        source_type: input.sourceType,
        local_path: input.localPath ?? null,
        github_repo: input.githubRepo ?? null,
        default_branch: input.defaultBranch ?? "main",
        status: "CONNECTED",
      })
      .returning("*");
    return mapRepo(row);
  }

  async listForProject(projectId: string, workspaceId: string): Promise<RepositoryLink[]> {
    const rows = await this.db("core_repository_link")
      .where({ project_id: projectId, workspace_id: workspaceId })
      .orderBy("created_at", "desc");
    return rows.map(mapRepo);
  }

  async findById(id: string, workspaceId: string): Promise<RepositoryLink | null> {
    const row = await this.db("core_repository_link")
      .where({ repository_link_id: id, workspace_id: workspaceId })
      .first();
    return row ? mapRepo(row) : null;
  }

  async updateStatus(
    id: string,
    workspaceId: string,
    status: RepoSyncStatus,
    patch?: { lastIndexedSha?: string; lastError?: string | null },
  ): Promise<void> {
    await this.db("core_repository_link")
      .where({ repository_link_id: id, workspace_id: workspaceId })
      .update({
        status,
        last_indexed_sha: patch?.lastIndexedSha,
        last_error: patch?.lastError ?? null,
        updated_at: this.db.fn.now(),
      });
  }
}

export class JobRepository {
  constructor(private readonly db: Knex) {}

  async create(workspaceId: string, jobType: string, payload: Record<string, unknown>): Promise<string> {
    const [row] = await this.db("core_job")
      .insert({ workspace_id: workspaceId, job_type: jobType, status: "pending", payload })
      .returning("*");
    return String(row.job_id);
  }

  async setStatus(jobId: string, status: string, patch?: { lastError?: string | null; incrementAttempts?: boolean }): Promise<void> {
    const update: Record<string, unknown> = { status, updated_at: this.db.fn.now() };
    if (patch?.lastError !== undefined) update.last_error = patch.lastError;
    if (patch?.incrementAttempts) {
      await this.db("core_job").where({ job_id: jobId }).increment("attempts", 1);
    }
    if (patch?.incrementAttempts && status === "running") {
      update.locked_at = this.db.fn.now();
    }
    await this.db("core_job").where({ job_id: jobId }).update(update);
  }

  async findById(jobId: string, workspaceId: string): Promise<Job | null> {
    const row = await this.db("core_job").where({ job_id: jobId, workspace_id: workspaceId }).first();
    return row ? mapJob(row) : null;
  }

  async listForWorkspace(workspaceId: string, limit = 50): Promise<Job[]> {
    const rows = await this.db("core_job")
      .where({ workspace_id: workspaceId })
      .orderBy("created_at", "desc")
      .limit(limit);
    return rows.map(mapJob);
  }
}
