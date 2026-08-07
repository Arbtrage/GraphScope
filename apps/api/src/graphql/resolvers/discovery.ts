import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireRole, requireWorkspace } from "../../auth/rbac.js";
import { enqueueJob } from "../../jobs/worker.js";
import { runParseRepoTask } from "../../jobs/tasks/parse-repo.js";

export const resolvers = {
  Query: {
    repositoryLinks: async (_: unknown, args: { projectId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.repositoryLinks.listForProject(args.projectId, workspaceId);
    },

    operations: async (_: unknown, args: { projectId: string; limit?: number }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.operations.listForProject(args.projectId, workspaceId, args.limit ?? 50);
    },

    operation: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const op = await ctx.repos.operations.findById(args.id, workspaceId);
      if (!op) throw new GraphQLError("Operation not found", { extensions: { code: "NOT_FOUND" } });
      return op;
    },

    operationsForWorkspace: async (
      _: unknown,
      args: { filter?: { projectId?: string; operationType?: string; search?: string }; limit?: number },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.operations.listForWorkspace(workspaceId, args.filter, args.limit ?? 100);
    },

    workspaceStats: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const projects = await ctx.repos.projects.listForWorkspace(workspaceId);
      const operationCount = await ctx.repos.operations.countForWorkspace(workspaceId);
      const environments = await ctx.repos.environments.listForWorkspace(workspaceId);
      const executions = await ctx.repos.executions.listForWorkspace(workspaceId, 1);
      return {
        projectCount: projects.length,
        operationCount,
        environmentCount: environments.length,
        lastExecutionAt: executions[0]?.createdAt ?? null,
      };
    },
  },

  Mutation: {
    enableRepository: async (
      _: unknown,
      args: {
        input: {
          projectId: string;
          sourceType: "LOCAL" | "GITHUB";
          localPath?: string;
          githubRepo?: string;
          defaultBranch?: string;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const project = await ctx.repos.projects.findByIdForWorkspace(args.input.projectId, workspaceId);
      if (!project) throw new GraphQLError("Project not found", { extensions: { code: "NOT_FOUND" } });
      const link = await ctx.repos.repositoryLinks.create({
        workspaceId,
        projectId: args.input.projectId,
        sourceType: args.input.sourceType,
        localPath: args.input.localPath ?? null,
        githubRepo: args.input.githubRepo ?? null,
        defaultBranch: args.input.defaultBranch ?? "main",
      });
      const jobId = await ctx.repos.jobs.create(workspaceId, "parse.repo", {
        repositoryLinkId: link.id,
        projectId: args.input.projectId,
      });
      await enqueueJob(ctx.db, "parse.repo", {
        jobId,
        workspaceId,
        projectId: args.input.projectId,
        repositoryLinkId: link.id,
      }).catch(async () => {
        await runParseRepoTask(ctx.repos, {
          jobId,
          workspaceId,
          projectId: args.input.projectId,
          repositoryLinkId: link.id,
        });
      });
      return link;
    },

    reindexRepository: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const link = await ctx.repos.repositoryLinks.findById(args.id, workspaceId);
      if (!link) throw new GraphQLError("Repository not found", { extensions: { code: "NOT_FOUND" } });
      const jobId = await ctx.repos.jobs.create(workspaceId, "parse.repo", {
        repositoryLinkId: link.id,
        projectId: link.projectId,
      });
      await enqueueJob(ctx.db, "parse.repo", {
        jobId,
        workspaceId,
        projectId: link.projectId,
        repositoryLinkId: link.id,
      }).catch(async () => {
        await runParseRepoTask(ctx.repos, {
          jobId,
          workspaceId,
          projectId: link.projectId,
          repositoryLinkId: link.id,
        });
      });
      return (await ctx.repos.repositoryLinks.findById(args.id, workspaceId))!;
    },

    disableRepository: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      await ctx.repos.repositoryLinks.updateStatus(args.id, workspaceId, "DISABLED");
      const link = await ctx.repos.repositoryLinks.findById(args.id, workspaceId);
      if (!link) throw new GraphQLError("Repository not found", { extensions: { code: "NOT_FOUND" } });
      return link;
    },

    setOperationManualFlag: async (
      _: unknown,
      args: { id: string; isOperation: boolean },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const op = await ctx.repos.operations.setManualFlag(args.id, workspaceId, args.isOperation);
      if (!op) throw new GraphQLError("Operation not found", { extensions: { code: "NOT_FOUND" } });
      return op;
    },
  },
};
