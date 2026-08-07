import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireAuth, requireRole, requireWorkspace } from "../../auth/rbac.js";
import { explainOperation } from "../../services/ai/explain.js";
import { generateOperation } from "../../services/ai/generate.js";
import { hasOpenAiKey, setOpenAiKey } from "../../services/secrets.js";
import type { AiRedactionMode } from "@graphscope/db";

export const resolvers = {
  Query: {
    aiSettings: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const hasKey = await hasOpenAiKey();
      return ctx.repos.ai.getOrCreateSettings(workspaceId, hasKey);
    },
  },

  Mutation: {
    explainOperation: async (
      _: unknown,
      args: {
        input: {
          operationId?: string;
          operationContent?: string;
          schemaVersionId?: string;
          projectId?: string;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "RUNNER");
      const { userId } = requireAuth(ctx);
      try {
        const result = await explainOperation(ctx.repos, {
          workspaceId,
          userId,
          operationId: args.input.operationId ?? null,
          operationContent: args.input.operationContent ?? null,
          schemaVersionId: args.input.schemaVersionId ?? null,
          projectId: args.input.projectId ?? null,
        });
        return {
          markdown: result.markdown,
          citations: result.citations,
        };
      } catch (err) {
        const message = (err as Error).message;
        if (message === "BUDGET_EXCEEDED") {
          throw new GraphQLError("AI token budget exceeded", { extensions: { code: "BUDGET_EXCEEDED" } });
        }
        throw new GraphQLError(message, { extensions: { code: "AI_ERROR" } });
      }
    },

    generateOperation: async (
      _: unknown,
      args: {
        input: {
          prompt: string;
          schemaVersionId: string;
          operationType?: "QUERY" | "MUTATION" | "SUBSCRIPTION";
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "RUNNER");
      const { userId } = requireAuth(ctx);
      try {
        const result = await generateOperation(ctx.repos, {
          workspaceId,
          userId,
          prompt: args.input.prompt,
          schemaVersionId: args.input.schemaVersionId,
          operationType: args.input.operationType,
        });
        return {
          document: result.document,
          warnings: result.warnings,
        };
      } catch (err) {
        const message = (err as Error).message;
        if (message === "BUDGET_EXCEEDED") {
          throw new GraphQLError("AI token budget exceeded", { extensions: { code: "BUDGET_EXCEEDED" } });
        }
        throw new GraphQLError(message, { extensions: { code: "AI_ERROR" } });
      }
    },

    updateAiSettings: async (
      _: unknown,
      args: {
        input: {
          redactionMode?: AiRedactionMode;
          enabled?: boolean;
          monthlyTokenBudget?: number;
        };
      },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "ADMIN");
      const hasKey = await hasOpenAiKey();
      return ctx.repos.ai.updateSettings(workspaceId, args.input, hasKey);
    },

    saveOpenAiKey: async (_: unknown, args: { apiKey: string }, ctx: GraphContext) => {
      await requireRole(ctx, "ADMIN");
      if (!args.apiKey.trim()) {
        throw new GraphQLError("API key required", { extensions: { code: "VALIDATION_ERROR" } });
      }
      await setOpenAiKey(args.apiKey.trim());
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.ai.getOrCreateSettings(workspaceId, true);
    },
  },
};
