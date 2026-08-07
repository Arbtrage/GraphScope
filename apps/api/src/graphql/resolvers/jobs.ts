import type { GraphContext } from "../../context.js";
import { GraphQLError } from "graphql";
import { requireRole, requireWorkspace } from "../../auth/rbac.js";
import { enqueueJob } from "../../jobs/worker.js";
import { getCacheStatus } from "../../services/cache.js";
import { setNotifyWebhookUrl } from "../../services/notify.js";

const TASK_MAP: Record<string, string> = {
  "parse.repo": "parse.repo",
  "schema.check": "schema.check",
  "search.reindex": "search.reindex",
  "analytics.analyze_op": "analytics.analyze_op",
  "analytics.rollup": "analytics.rollup",
};

export const resolvers = {
  Query: {
    jobs: async (_: unknown, args: { limit?: number }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.jobs.listForWorkspace(workspaceId, args.limit ?? 50);
    },

    cacheStatus: async (_: unknown, __: unknown, ctx: GraphContext) => {
      await requireWorkspace(ctx);
      return getCacheStatus();
    },
  },

  Mutation: {
    retryJob: async (_: unknown, args: { id: ID }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const job = await ctx.repos.jobs.findById(args.id, workspaceId);
      if (!job) throw new GraphQLError("Job not found", { extensions: { code: "NOT_FOUND" } });
      if (job.status !== "FAILED") {
        throw new GraphQLError("Only failed jobs can be retried", { extensions: { code: "VALIDATION_ERROR" } });
      }
      const taskId = TASK_MAP[job.jobType];
      if (!taskId) {
        throw new GraphQLError(`Unknown job type: ${job.jobType}`, { extensions: { code: "VALIDATION_ERROR" } });
      }
      await ctx.repos.jobs.setStatus(job.id, "pending", { lastError: null, incrementAttempts: true });
      const payload = { ...(job.payload as Record<string, unknown>), jobId: job.id };
      await enqueueJob(ctx.db, taskId, payload);
      const updated = await ctx.repos.jobs.findById(job.id, workspaceId);
      return updated ?? job;
    },

    saveNotifyWebhook: async (_: unknown, args: { url: string }, ctx: GraphContext) => {
      await requireRole(ctx, "ADMIN");
      await setNotifyWebhookUrl(args.url);
      return true;
    },
  },
};

type ID = string;
