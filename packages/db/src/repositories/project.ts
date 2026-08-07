import type { Knex } from "knex";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@graphscope/shared-types";

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.project_id),
    workspaceId: String(row.workspace_id),
    name: row.name as string,
    slug: row.slug as string,
  };
}

export class ProjectRepository {
  constructor(private readonly db: Knex) {}

  async create(workspaceId: string, input: CreateProjectInput): Promise<Project> {
    const [row] = await this.db("core_project")
      .insert({ workspace_id: workspaceId, name: input.name, slug: input.slug })
      .returning("*");
    return mapProject(row);
  }

  async listForWorkspace(workspaceId: string): Promise<Project[]> {
    const rows = await this.db("core_project").where({ workspace_id: workspaceId }).orderBy("name");
    return rows.map(mapProject);
  }

  async findByIdForWorkspace(projectId: string, workspaceId: string): Promise<Project | null> {
    const row = await this.db("core_project").where({ project_id: projectId, workspace_id: workspaceId }).first();
    return row ? mapProject(row) : null;
  }

  async update(projectId: string, workspaceId: string, input: UpdateProjectInput): Promise<Project | null> {
    const patch: Record<string, unknown> = { updated_at: this.db.fn.now() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    const [row] = await this.db("core_project")
      .where({ project_id: projectId, workspace_id: workspaceId })
      .update(patch)
      .returning("*");
    return row ? mapProject(row) : null;
  }

  async delete(projectId: string, workspaceId: string): Promise<boolean> {
    const n = await this.db("core_project").where({ project_id: projectId, workspace_id: workspaceId }).del();
    return n > 0;
  }
}
