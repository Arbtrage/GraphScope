import { GraphQLError } from "graphql";
import type { WorkspaceRole } from "@graphscope/shared-types";
import type { GraphContext } from "../context.js";

const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  RUNNER: 2,
  EDITOR: 3,
  ADMIN: 4,
  OWNER: 5,
};

export function requireAuth(ctx: GraphContext) {
  if (!ctx.userId || !ctx.sessionToken) {
    throw new GraphQLError("Unauthorized", { extensions: { code: "UNAUTHORIZED" } });
  }
  return { userId: ctx.userId, sessionToken: ctx.sessionToken, workspaceId: ctx.workspaceId };
}

export async function requireWorkspace(ctx: GraphContext): Promise<string> {
  const { userId, workspaceId } = requireAuth(ctx);
  if (!workspaceId) {
    throw new GraphQLError("No active workspace", { extensions: { code: "NO_WORKSPACE" } });
  }
  const hasAccess = await ctx.repos.workspaces.userHasAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new GraphQLError("Workspace not found", { extensions: { code: "NOT_FOUND" } });
  }
  return workspaceId;
}

export async function requireRole(ctx: GraphContext, minRole: WorkspaceRole): Promise<string> {
  const workspaceId = await requireWorkspace(ctx);
  const { userId } = requireAuth(ctx);
  const role = await ctx.repos.memberships.getRole(workspaceId, userId);
  if (!role || ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
  }
  return workspaceId;
}
