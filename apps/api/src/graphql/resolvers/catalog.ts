import { GraphQLError } from "graphql";
import type { GraphContext } from "../../context.js";
import { requireRole, requireWorkspace } from "../../auth/rbac.js";
import { enqueueJob } from "../../jobs/worker.js";
import { hashSdl, readSdlFile, writeSdlFile } from "../../services/schema-publish.js";
import { validateSdl } from "../../services/schema-check.js";

export const resolvers = {
  Query: {
    projects: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.projects.listForWorkspace(workspaceId);
    },

    project: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const project = await ctx.repos.projects.findByIdForWorkspace(args.id, workspaceId);
      if (!project) throw new GraphQLError("Project not found", { extensions: { code: "NOT_FOUND" } });
      return project;
    },

    schemas: async (_: unknown, args: { projectId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.schemas.listForProject(args.projectId, workspaceId);
    },

    schema: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const schema = await ctx.repos.schemas.findById(args.id, workspaceId);
      if (!schema) throw new GraphQLError("Schema not found", { extensions: { code: "NOT_FOUND" } });
      return schema;
    },

    schemaVersions: async (_: unknown, args: { schemaId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const versions = await ctx.repos.schemas.listVersions(args.schemaId, workspaceId);
      return Promise.all(
        versions.map(async (v) => {
          const full = await ctx.repos.schemas.findVersionById(v.id, workspaceId);
          const sdl = full ? await readSdlFile(full.sdlPath) : "";
          return { ...v, sdl };
        }),
      );
    },
  },

  SchemaVersion: {
    checks: async (parent: { id: string }, _: unknown, ctx: GraphContext) => {
      return ctx.repos.schemas.listChecks(parent.id);
    },
  },

  Mutation: {
    createProject: async (_: unknown, args: { input: { name: string; slug: string } }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.projects.create(workspaceId, args.input);
    },

    updateProject: async (
      _: unknown,
      args: { id: string; input: { name?: string; slug?: string } },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const project = await ctx.repos.projects.update(args.id, workspaceId, args.input);
      if (!project) throw new GraphQLError("Project not found", { extensions: { code: "NOT_FOUND" } });
      return project;
    },

    deleteProject: async (_: unknown, args: { id: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return ctx.repos.projects.delete(args.id, workspaceId);
    },

    publishSchema: async (
      _: unknown,
      args: { input: { projectId: string; name: string; sdl: string; gitSha?: string } },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const project = await ctx.repos.projects.findByIdForWorkspace(args.input.projectId, workspaceId);
      if (!project) throw new GraphQLError("Project not found", { extensions: { code: "NOT_FOUND" } });
      if (args.input.sdl.length > 5 * 1024 * 1024) {
        throw new GraphQLError("SDL exceeds 5MB limit", { extensions: { code: "VALIDATION_ERROR" } });
      }
      validateSdl(args.input.sdl);
      const contentHash = hashSdl(args.input.sdl);
      const sdlPath = await writeSdlFile(project.id, contentHash, args.input.sdl);
      const schema = await ctx.repos.schemas.findOrCreateSchema(workspaceId, project.id, args.input.name);
      const version = await ctx.repos.schemas.createVersion(
        schema.id,
        workspaceId,
        contentHash,
        sdlPath,
        args.input.gitSha ?? null,
      );
      const sdl = await readSdlFile(sdlPath);
      await enqueueJob(ctx.db, "search.reindex", { workspaceId }).catch(async () => {
        const { runSearchReindexTask } = await import("../../jobs/tasks/search-reindex.js");
        await runSearchReindexTask(ctx.repos, { workspaceId });
      });
      return { ...version, sdl };
    },

    runSchemaCheck: async (
      _: unknown,
      args: { schemaVersionId: string; previousVersionId?: string },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      const check = await ctx.repos.schemas.createCheck(args.schemaVersionId, workspaceId);
      await enqueueJob(ctx.db, "schema.check", {
        checkId: check.id,
        schemaVersionId: args.schemaVersionId,
        workspaceId,
        previousVersionId: args.previousVersionId,
      }).catch(async () => {
        // fallback: run inline if worker utils fail in test
        const { runSchemaCheckTask } = await import("../../jobs/tasks/schema-check.js");
        await runSchemaCheckTask(ctx.repos, {
          checkId: check.id,
          schemaVersionId: args.schemaVersionId,
          workspaceId,
          previousVersionId: args.previousVersionId,
        });
      });
      return check;
    },
  },
};
