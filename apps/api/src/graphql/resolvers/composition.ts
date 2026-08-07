import type { GraphContext } from "../../context.js";
import { GraphQLError } from "graphql";
import { requireWorkspace } from "../../auth/rbac.js";
import { readSdlFile } from "../../services/schema-publish.js";
import { validateComposition } from "../../services/composition-check.js";

export const resolvers = {
  Query: {
    workspaceComposition: async (_: unknown, args: { projectId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const project = await ctx.repos.projects.findByIdForWorkspace(args.projectId, workspaceId);
      if (!project) throw new GraphQLError("Project not found", { extensions: { code: "NOT_FOUND" } });

      const schemas = await ctx.repos.schemas.listForProject(args.projectId, workspaceId);
      const sdls: string[] = [];
      for (const schema of schemas) {
        const versions = await ctx.repos.schemas.listVersions(schema.id, workspaceId);
        const latest = versions[0];
        if (!latest) continue;
        const full = await ctx.repos.schemas.findVersionById(latest.id, workspaceId);
        if (full?.sdlPath) {
          try {
            sdls.push(await readSdlFile(full.sdlPath));
          } catch {
            // skip unreadable
          }
        }
      }

      const result = validateComposition(sdls);
      return {
        ok: result.ok,
        errors: result.errors,
        schemaCount: sdls.length,
        mergedSdl: result.mergedSdl ?? null,
      };
    },
  },
};
