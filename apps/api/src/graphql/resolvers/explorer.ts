import { homedir } from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { GraphQLError } from "graphql";
import { getDefaultDataDir } from "@graphscope/config";
import type { GraphContext } from "../../context.js";
import { requireRole, requireWorkspace } from "../../auth/rbac.js";
import { enqueueJob } from "../../jobs/worker.js";
import { runParseRepoTask } from "../../jobs/tasks/parse-repo.js";
import { listRepositoryFiles, readRepositoryFile } from "../../services/repo-fs.js";
import { applyIntrospectedSchema, introspectEnvironmentSchema } from "../../services/schema-introspect.js";

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `repo-${Date.now()}`
  );
}

async function assertDirectory(localPath: string): Promise<void> {
  let stat;
  try {
    stat = await fs.stat(localPath);
  } catch {
    throw new GraphQLError(`Folder not found: ${localPath}`, { extensions: { code: "NOT_FOUND" } });
  }
  if (!stat.isDirectory()) {
    throw new GraphQLError(`Not a folder: ${localPath}`, { extensions: { code: "VALIDATION_ERROR" } });
  }
}

async function resolveLinkRoot(
  ctx: GraphContext,
  workspaceId: string,
  repositoryLinkId: string,
): Promise<string> {
  const link = await ctx.repos.repositoryLinks.findById(repositoryLinkId, workspaceId);
  if (!link) throw new GraphQLError("Repository not found", { extensions: { code: "NOT_FOUND" } });
  if (link.sourceType === "LOCAL" && link.localPath) return link.localPath;
  if (link.sourceType === "GITHUB" && link.githubRepo) {
    const dataDir = process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
    return path.join(dataDir, "repos", link.projectId, link.githubRepo.replace("/", "_"));
  }
  throw new GraphQLError("Repository has no browsable path", { extensions: { code: "VALIDATION_ERROR" } });
}

export const resolvers = {
  Query: {
    explorerCatalog: async (_: unknown, args: { repositoryLinkId?: string | null }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const catalog = await ctx.repos.explorer.assembleCatalog(workspaceId, args.repositoryLinkId);
      if (!catalog) return null;
      return applyIntrospectedSchema(catalog);
    },

    explorerRepositories: async (_: unknown, __: unknown, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.explorer.listRepositories(workspaceId);
    },

    scanStatus: async (_: unknown, args: { jobId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const job = await ctx.repos.jobs.findById(args.jobId, workspaceId);
      if (!job) throw new GraphQLError("Scan job not found", { extensions: { code: "NOT_FOUND" } });
      return ctx.repos.explorer.scanStatusFromJob({
        id: job.id,
        status: job.status,
        lastError: job.lastError ?? null,
        payload: job.payload ?? {},
      });
    },

    repositoryTree: async (_: unknown, args: { repositoryLinkId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      const root = await resolveLinkRoot(ctx, workspaceId, args.repositoryLinkId);
      await assertDirectory(root);
      const paths = await listRepositoryFiles(root);
      return paths.map((p) => ({ path: p.replace(/\\/g, "/") }));
    },

    repositoryFile: async (
      _: unknown,
      args: { repositoryLinkId: string; path: string },
      ctx: GraphContext,
    ) => {
      const workspaceId = await requireWorkspace(ctx);
      const root = await resolveLinkRoot(ctx, workspaceId, args.repositoryLinkId);
      try {
        const file = await readRepositoryFile(root, args.path);
        return {
          path: file.path,
          content: file.content,
          truncated: file.truncated,
          byteSize: file.byteSize,
          binary: file.content === "" && file.byteSize > 0,
        };
      } catch (err) {
        throw new GraphQLError(err instanceof Error ? err.message : "Unable to read file", {
          extensions: { code: "NOT_FOUND" },
        });
      }
    },

    catalogRevision: async (_: unknown, args: { repositoryLinkId: string }, ctx: GraphContext) => {
      const workspaceId = await requireWorkspace(ctx);
      return ctx.repos.explorer.getCatalogRevision(args.repositoryLinkId, workspaceId);
    },
  },

  Mutation: {
    openRepository: async (_: unknown, args: { localPath: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      let localPath = args.localPath.trim().replace(/^['"]|['"]$/g, "");
      if (localPath === "~") localPath = homedir();
      else if (localPath.startsWith("~/")) localPath = path.join(homedir(), localPath.slice(2));
      if (!localPath) {
        throw new GraphQLError("Repository path is required", { extensions: { code: "VALIDATION_ERROR" } });
      }
      await assertDirectory(localPath);

      let link = await ctx.repos.repositoryLinks.findByLocalPath(workspaceId, localPath);
      if (!link) {
        const folder = path.basename(localPath);
        const project = await ctx.repos.projects.create(workspaceId, {
          name: folder,
          slug: `${slugify(folder)}-${Date.now().toString(36)}`,
        });
        link = await ctx.repos.repositoryLinks.create({
          workspaceId,
          projectId: project.id,
          sourceType: "LOCAL",
          localPath,
          defaultBranch: "main",
        });
      }

      const jobId = await ctx.repos.jobs.create(workspaceId, "parse.repo", {
        repositoryLinkId: link.id,
        projectId: link.projectId,
        scanStep: "Detecting GraphQL clients",
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
      return { jobId, repositoryLinkId: link.id };
    },

    introspectEnvironment: async (_: unknown, args: { environmentId: string }, ctx: GraphContext) => {
      const workspaceId = await requireRole(ctx, "EDITOR");
      return introspectEnvironmentSchema(ctx.repos, workspaceId, args.environmentId);
    },
  },

  ExplorerEndpoint: {
    headers: (parent: { headers?: Record<string, string> | null }) => parent.headers ?? {},
    schemaPulled: (parent: { schemaPulled?: boolean; introspectedSdl?: string | null }) =>
      Boolean(parent.schemaPulled || parent.introspectedSdl),
    schemaPulledAt: (parent: { schemaPulledAt?: string | null }) => parent.schemaPulledAt ?? null,
  },

  ExplorerType: {
    source: (parent: { source?: string | null }) => parent.source ?? "inferred",
  },
};
