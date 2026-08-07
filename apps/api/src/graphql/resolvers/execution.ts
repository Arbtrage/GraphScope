import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireRole, requireWorkspace } from "../../auth/rbac.js";
import { executeOperation } from "../../services/execute-operation.js";
import { deleteSecret, setSecret } from "../../services/secrets.js";
import { enqueueAnalyzeOp } from "../../jobs/tasks/analytics-analyze-op.js";

export const resolvers = {
  Query: {
    environments: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.environments.listForWorkspace(workspaceId);
    },

    environment: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const env = await ctx.repos.environments.findById(args.id, workspaceId);
      if (!env) throw new GraphQLError("Environment not found", { extensions: { code: "NOT_FOUND" } });
      return env;
    },

    secrets: async (_: unknown, args: { environmentId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.environments.listSecrets(args.environmentId, workspaceId);
    },

    executions: async (_: unknown, args: { limit?: number }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.executions.listForWorkspace(workspaceId, args.limit ?? 50);
    },

    collections: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.collections.listForWorkspace(workspaceId);
    },

    collection: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const collection = await ctx.repos.collections.findById(args.id, workspaceId);
      if (!collection) throw new GraphQLError("Collection not found", { extensions: { code: "NOT_FOUND" } });
      return collection;
    },
  },

  Collection: {
    items: async (parent: { id: string; workspaceId: string }, _: unknown, ctx: GraphContext) => {
      return ctx.repos.collections.listItems(parent.id, parent.workspaceId);
    },
  },

  Mutation: {
    createEnvironment: async (
      _: unknown,
      args: {
        input: {
          name: string;
          endpointUrl: string;
          isProduction?: boolean;
          headers?: Record<string, string>;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.environments.create(workspaceId, args.input);
    },

    updateEnvironment: async (
      _: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          endpointUrl?: string;
          isProduction?: boolean;
          headers?: Record<string, string>;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const env = await ctx.repos.environments.update(args.id, workspaceId, args.input);
      if (!env) throw new GraphQLError("Environment not found", { extensions: { code: "NOT_FOUND" } });
      return env;
    },

    deleteEnvironment: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.environments.delete(args.id, workspaceId);
    },

    upsertSecret: async (
      _: unknown,
      args: { input: { environmentId: string; name: string; value: string } },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const env = await ctx.repos.environments.findById(args.input.environmentId, workspaceId);
      if (!env) throw new GraphQLError("Environment not found", { extensions: { code: "NOT_FOUND" } });
      await setSecret(args.input.environmentId, args.input.name, args.input.value);
      const lastFour = args.input.value.slice(-4);
      return ctx.repos.environments.upsertSecretMeta(
        workspaceId,
        args.input.environmentId,
        args.input.name,
        lastFour,
      );
    },

    deleteSecret: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const meta = await ctx.repos.environments.findSecretById(args.id, workspaceId);
      if (meta) await deleteSecret(meta.environmentId, meta.name);
      return ctx.repos.environments.deleteSecret(args.id, workspaceId);
    },

    executeOperation: async (
      _: unknown,
      args: {
        input: {
          environmentId: string;
          operationId?: string;
          adhocQuery?: string;
          variables?: Record<string, unknown>;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "RUNNER");
      let queryContent = args.input.adhocQuery ?? "";
      if (args.input.operationId) {
        const op = await ctx.repos.operations.findById(args.input.operationId, workspaceId);
        if (!op) throw new GraphQLError("Operation not found", { extensions: { code: "NOT_FOUND" } });
        queryContent = op.content;
      }
      if (!queryContent.trim()) {
        throw new GraphQLError("Query required", { extensions: { code: "VALIDATION_ERROR" } });
      }
      const variablesJson = JSON.stringify(args.input.variables ?? {});
      const result = await executeOperation(ctx.repos, {
        workspaceId,
        environmentId: args.input.environmentId,
        queryContent,
        variablesJson,
        operationId: args.input.operationId ?? null,
      });
      const execution = await ctx.repos.executions.create(workspaceId, {
        operationId: args.input.operationId ?? null,
        environmentId: args.input.environmentId,
        queryContent,
        variablesJson,
        status: result.status,
        httpStatus: result.httpStatus,
        durationMs: result.durationMs,
        responseBytes: result.responseBytes,
        graphqlErrorsCount: result.graphqlErrorsCount,
        responsePreview: result.responsePreview,
      });
      if (args.input.operationId) {
        await enqueueAnalyzeOp(ctx.repos, ctx.db, workspaceId, args.input.operationId);
      }
      return { execution, responseBody: result.responseBody };
    },

    createCollection: async (_: unknown, args: { name: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.collections.create(workspaceId, args.name);
    },

    renameCollection: async (_: unknown, args: { id: string; name: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const collection = await ctx.repos.collections.rename(args.id, workspaceId, args.name);
      if (!collection) throw new GraphQLError("Collection not found", { extensions: { code: "NOT_FOUND" } });
      return collection;
    },

    deleteCollection: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.collections.delete(args.id, workspaceId);
    },

    saveToCollection: async (
      _: unknown,
      args: {
        input: {
          collectionId: string;
          name: string;
          queryContent: string;
          variablesJson?: string;
          operationId?: string;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const collection = await ctx.repos.collections.findById(args.input.collectionId, workspaceId);
      if (!collection) throw new GraphQLError("Collection not found", { extensions: { code: "NOT_FOUND" } });
      return ctx.repos.collections.addItem(workspaceId, args.input.collectionId, {
        name: args.input.name,
        queryContent: args.input.queryContent,
        variablesJson: args.input.variablesJson ?? "{}",
        operationId: args.input.operationId ?? null,
      });
    },
  },
};
