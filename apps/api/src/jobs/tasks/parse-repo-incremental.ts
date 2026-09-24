import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";
import type { Repositories } from "@graphscope/db";
import {
  parseFiles,
  selectDirtyPaths,
  type FileFingerprint,
} from "../../services/parser/index.js";

async function resolveRepoRoot(
  repos: Repositories,
  repositoryLinkId: string,
  workspaceId: string,
): Promise<string> {
  const link = await repos.repositoryLinks.findById(repositoryLinkId, workspaceId);
  if (!link) throw new Error("Repository link not found");
  if (link.sourceType === "LOCAL" && link.localPath) return link.localPath;
  if (link.sourceType === "GITHUB" && link.githubRepo) {
    const dataDir = process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
    return path.join(dataDir, "repos", link.projectId, link.githubRepo.replace("/", "_"));
  }
  throw new Error("Invalid repository configuration");
}

export async function runParseRepoIncrementalTask(
  repos: Repositories,
  payload: {
    jobId: string;
    workspaceId: string;
    projectId: string;
    repositoryLinkId: string;
    changedPaths: string[];
    deletedPaths: string[];
  },
): Promise<void> {
  await repos.jobs.setStatus(payload.jobId, "running");
  try {
    const root = await resolveRepoRoot(repos, payload.repositoryLinkId, payload.workspaceId);
    const known = await repos.explorer.listFileFingerprints(payload.projectId, payload.workspaceId);
    const knownFingerprints: FileFingerprint[] = known.map((item) => ({
      path: item.path,
      mtimeMs: item.mtimeMs,
      sizeBytes: item.sizeBytes,
      contentHash: item.contentHash,
    }));

    const candidatePaths = payload.changedPaths.map((p) => p.replace(/\\/g, "/"));
    const deletedPaths = [...new Set(payload.deletedPaths.map((p) => p.replace(/\\/g, "/")))];
    const { dirty } = await selectDirtyPaths(root, candidatePaths, knownFingerprints);

    if (!dirty.length && !deletedPaths.length) {
      await repos.jobs.setStatus(payload.jobId, "completed");
      return;
    }

    const knownOpNames = await repos.explorer.listOperationNames(payload.projectId, payload.workspaceId);
    const parsed = await parseFiles(root, dirty, knownOpNames);
    parsed.deletedPaths = deletedPaths;

    await repos.explorer.persistCatalogIncremental({
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      repositoryLinkId: payload.repositoryLinkId,
      changedPaths: parsed.changedPaths,
      deletedPaths,
      operations: parsed.operations,
      fragments: parsed.fragments,
      types: parsed.types,
      files: parsed.files,
      usages: parsed.usages,
      edges: parsed.edges,
      fingerprints: parsed.fingerprints,
      symbols: parsed.symbols,
    });

    await repos.jobs.setStatus(payload.jobId, "completed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await repos.jobs.setStatus(payload.jobId, "failed", { lastError: message });
    throw err;
  }
}
