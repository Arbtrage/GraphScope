import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireWorkspace } from "../../auth/rbac.js";

export const resolvers = {
  Query: {
    operationFindings: async (_: unknown, args: { operationId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const op = await ctx.repos.operations.findById(args.operationId, workspaceId);
      if (!op) throw new GraphQLError("Operation not found", { extensions: { code: "NOT_FOUND" } });
      return ctx.repos.analytics.listFindingsForOperation(args.operationId, workspaceId);
    },

    workspaceDashboard: async (_: unknown, args: { workspaceId: string }, ctx: GraphContext) => {
      const activeWorkspaceId = await requireWorkspace(ctx);
      if (args.workspaceId !== activeWorkspaceId) {
        const hasAccess = await ctx.repos.workspaces.userHasAccess(args.workspaceId, ctx.userId!);
        if (!hasAccess) throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
      }
      return ctx.repos.analytics.getWorkspaceDashboard(args.workspaceId);
    },
  },
};
