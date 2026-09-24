import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";
import type { Repositories } from "@graphscope/db";
import { parseRepository, type ScanProgress } from "../../services/parser/index.js";
import { getSecret } from "../../services/secrets.js";
import { postJobWebhook } from "../../services/notify.js";
import { startRepoWatcher } from "../../services/repo-watcher.js";

async function emitJobNotification(event: {
  jobId: string;
  jobType: string;
  status: string;
  message: string;
  workspaceId: string;
  projectId: string;
}): Promise<void> {
  const payload = { ...event, at: new Date().toISOString() };
  console.log(`[graphscope:notification] ${event.status} ${event.jobType}: ${event.message}`);

  const dataDir = process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
  const notifyDir = path.join(dataDir, "notifications");
  await fs.mkdir(notifyDir, { recursive: true });
  const notifyPath = path.join(notifyDir, `${event.jobId}.json`);
  await fs.writeFile(notifyPath, JSON.stringify(payload), "utf-8");
}

async function resolveRepoRoot(
  repos: Repositories,
  repositoryLinkId: string,
  workspaceId: string,
): Promise<{ root: string; githubBaseUrl: string | null }> {
  const link = await repos.repositoryLinks.findById(repositoryLinkId, workspaceId);
  if (!link) throw new Error("Repository link not found");
  if (link.sourceType === "LOCAL" && link.localPath) {
    return { root: link.localPath, githubBaseUrl: null };
  }
  if (link.sourceType === "GITHUB" && link.githubRepo) {
    const dataDir = process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
    const root = path.join(dataDir, "repos", link.projectId, link.githubRepo.replace("/", "_"));
    await fs.mkdir(root, { recursive: true });
    const pat = await getSecret("github", "pat");
    const cloneUrl = pat
      ? `https://${pat}@github.com/${link.githubRepo}.git`
      : `https://github.com/${link.githubRepo}.git`;
    try {
      await fs.access(path.join(root, ".git"));
    } catch {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execFileAsync = promisify(execFile);
      await execFileAsync("git", ["clone", "--depth", "1", "--branch", link.defaultBranch, cloneUrl, root], {
        timeout: 120_000,
      });
    }
    return {
      root,
      githubBaseUrl: `https://github.com/${link.githubRepo}/blob/${link.defaultBranch}`,
    };
  }
  throw new Error("Invalid repository configuration");
}

export async function runParseRepoTask(
  repos: Repositories,
  payload: {
    jobId: string;
    workspaceId: string;
    projectId: string;
    repositoryLinkId: string;
  },
): Promise<void> {
  await repos.jobs.setStatus(payload.jobId, "running");
  await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "SYNCING");
  try {
    const { root } = await resolveRepoRoot(repos, payload.repositoryLinkId, payload.workspaceId);
    const parsed = await parseRepository(root, async (progress: ScanProgress) => {
      await repos.jobs.updatePayload(payload.jobId, {
        scanStep: progress.step,
        scanStats: progress.stats,
        scanReport: progress.report ?? null,
      });
    });
    await repos.explorer.persistCatalog({
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      repositoryLinkId: payload.repositoryLinkId,
      parsed,
    });
    await repos.explorer.upsertInferredEnvironments(payload.workspaceId, parsed.endpoints);
    await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "INDEXED", {
      lastIndexedSha: String(Date.now()),
      lastError: null,
    });
    await repos.jobs.updatePayload(payload.jobId, {
      scanStep: "Mapping source references",
      scanStats: {
        operations: parsed.operations.length,
        fragments: parsed.fragments.length,
        types: parsed.types.length,
        endpoints: parsed.endpoints.length,
        files: parsed.files.length,
      },
      scanReport: {
        ignoredCount: parsed.ignoredCount,
        skippedFiles: parsed.skippedFiles,
        parseErrors: parsed.parseErrors,
      },
    });
    await repos.jobs.setStatus(payload.jobId, "completed");
    console.log(`parse.repo completed: ${parsed.operations.length} operations`);
    try {
      const { getKnex } = await import("@graphscope/db");
      await startRepoWatcher(getKnex(), {
        workspaceId: payload.workspaceId,
        projectId: payload.projectId,
        repositoryLinkId: payload.repositoryLinkId,
        rootDir: root,
      });
    } catch (err) {
      console.warn("Failed to start repo watcher", err);
    }
    await emitJobNotification({
      jobId: payload.jobId,
      jobType: "parse.repo",
      status: "completed",
      message: `Indexed ${parsed.operations.length} operations`,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
    });
    await postJobWebhook({
      jobType: "parse.repo",
      status: "completed",
      message: `Indexed ${parsed.operations.length} operations`,
      workspaceId: payload.workspaceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const friendly =
      message.includes("bind message") || message.includes("32767")
        ? "Scan found too many relationships to save. Update GraphScope and retry."
        : message.includes("unique") || message.includes("duplicate key")
          ? `Could not save scan results (${message}). Retrying often fixes this after an update.`
          : message;
    await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "ERROR", {
      lastError: friendly,
    });
    await repos.jobs.setStatus(payload.jobId, "failed", { lastError: friendly });
    await emitJobNotification({
      jobId: payload.jobId,
      jobType: "parse.repo",
      status: "failed",
      message: friendly,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
    });
    await postJobWebhook({
      jobType: "parse.repo",
      status: "failed",
      message: friendly,
      workspaceId: payload.workspaceId,
    });
    throw err;
  }
}
