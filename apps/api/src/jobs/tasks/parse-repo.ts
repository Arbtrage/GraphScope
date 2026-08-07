import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";
import type { Repositories } from "@graphscope/db";
import { parseRepository } from "../../services/parser/index.js";
import { getSecret } from "../../services/secrets.js";
import { postJobWebhook } from "../../services/notify.js";
import { enqueueAnalyzeOp, runAnalyticsAnalyzeOpTask } from "./analytics-analyze-op.js";

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
  db?: import("@graphscope/db").Knex,
): Promise<void> {
  await repos.jobs.setStatus(payload.jobId, "running");
  await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "SYNCING");
  try {
    const { root, githubBaseUrl } = await resolveRepoRoot(repos, payload.repositoryLinkId, payload.workspaceId);
    await repos.operations.clearStaging(payload.projectId, payload.workspaceId);
    const parsed = await parseRepository(root);
    for (const op of parsed) {
      await repos.operations.insertStaging(
        payload.workspaceId,
        payload.projectId,
        payload.repositoryLinkId,
        payload.jobId,
        op,
      );
    }
    const count = await repos.operations.promoteFromStaging(
      payload.workspaceId,
      payload.projectId,
      payload.repositoryLinkId,
      githubBaseUrl,
    );
    await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "INDEXED", {
      lastIndexedSha: String(Date.now()),
      lastError: null,
    });
    await repos.jobs.setStatus(payload.jobId, "completed");
    console.log(`parse.repo completed: ${count} new operations`);

    const operations = await repos.operations.listForProject(payload.projectId, payload.workspaceId, 500);
    for (const op of operations) {
      if (db) {
        await enqueueAnalyzeOp(repos, db, payload.workspaceId, op.id);
      } else {
        await runAnalyticsAnalyzeOpTask(repos, { workspaceId: payload.workspaceId, operationId: op.id });
      }
    }
    await emitJobNotification({
      jobId: payload.jobId,
      jobType: "parse.repo",
      status: "completed",
      message: `Indexed ${count} operations`,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
    });
    await postJobWebhook({
      jobType: "parse.repo",
      status: "completed",
      message: `Indexed ${count} operations`,
      workspaceId: payload.workspaceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await repos.repositoryLinks.updateStatus(payload.repositoryLinkId, payload.workspaceId, "ERROR", {
      lastError: message,
    });
    await repos.jobs.setStatus(payload.jobId, "failed", { lastError: message });
    await emitJobNotification({
      jobId: payload.jobId,
      jobType: "parse.repo",
      status: "failed",
      message,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
    });
    await postJobWebhook({
      jobType: "parse.repo",
      status: "failed",
      message,
      workspaceId: payload.workspaceId,
    });
    throw err;
  }
}
