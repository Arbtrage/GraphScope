import type { Knex } from "knex";
import type { WorkspaceRole } from "@graphscope/shared-types";

export class MembershipRepository {
  constructor(private readonly db: Knex) {}

  async getRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const row = await this.db("core_membership")
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    return row ? (row.role as WorkspaceRole) : null;
  }
}
