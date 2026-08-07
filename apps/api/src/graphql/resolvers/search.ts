import type { GraphContext } from "../../context.js";
import { requireWorkspace } from "../../auth/rbac.js";
import { enqueueJob } from "../../jobs/worker.js";

export const resolvers = {
  Query: {
    search: async (
      _: unknown,
      args: { q: string; kinds?: string[]; limit?: number },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireWorkspace(ctx);
      const q = args.q?.trim();
      if (!q) return [];
      return ctx.repos.search.search(workspaceId, q, args.kinds as never, args.limit ?? 25);
    },
  },

  Mutation: {
    reindexSearch: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      await enqueueJob(ctx.db, "search.reindex", { workspaceId });
      const count = await ctx.repos.search.countDocuments(workspaceId);
      return { ok: true, documentCount: count };
    },
  },
};
