import path from "node:path";
import chokidar, { type FSWatcher } from "chokidar";
import type { Knex } from "@graphscope/db";
import { createRepositories } from "@graphscope/db";
import { createIgnoreMatcher, type IgnoreMatcher } from "./ignore-rules.js";
import { PARSE_EXTENSIONS } from "./parser/index.js";

type WatchEntry = {
  watcher: FSWatcher;
  workspaceId: string;
  projectId: string;
  repositoryLinkId: string;
  rootDir: string;
  matcher: IgnoreMatcher;
  pendingChanged: Set<string>;
  pendingDeleted: Set<string>;
  timer: NodeJS.Timeout | null;
  running: boolean;
  rerun: boolean;
};

const watches = new Map<string, WatchEntry>();

function isParseCandidate(rel: string): boolean {
  return PARSE_EXTENSIONS.has(path.extname(rel));
}

function scheduleFlush(entry: WatchEntry, db: Knex) {
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    entry.timer = null;
    void flushEntry(entry, db);
  }, 100);
}

async function flushEntry(entry: WatchEntry, db: Knex) {
  if (entry.running) {
    entry.rerun = true;
    return;
  }
  const changedPaths = [...entry.pendingChanged];
  const deletedPaths = [...entry.pendingDeleted];
  entry.pendingChanged.clear();
  entry.pendingDeleted.clear();
  if (!changedPaths.length && !deletedPaths.length) return;

  entry.running = true;
  try {
    const repos = createRepositories(db);
    const jobId = await repos.jobs.create(entry.workspaceId, "parse.repo.incremental", {
      repositoryLinkId: entry.repositoryLinkId,
      projectId: entry.projectId,
      changedPaths,
      deletedPaths,
    });
    const { enqueueJob } = await import("../jobs/worker.js");
    await enqueueJob(db, "parse.repo.incremental", {
      jobId,
      workspaceId: entry.workspaceId,
      projectId: entry.projectId,
      repositoryLinkId: entry.repositoryLinkId,
      changedPaths,
      deletedPaths,
    }).catch(async () => {
      const { runParseRepoIncrementalTask } = await import("../jobs/tasks/parse-repo-incremental.js");
      await runParseRepoIncrementalTask(repos, {
        jobId,
        workspaceId: entry.workspaceId,
        projectId: entry.projectId,
        repositoryLinkId: entry.repositoryLinkId,
        changedPaths,
        deletedPaths,
      });
    });
  } finally {
    entry.running = false;
    if (entry.rerun || entry.pendingChanged.size || entry.pendingDeleted.size) {
      entry.rerun = false;
      scheduleFlush(entry, db);
    }
  }
}

export async function startRepoWatcher(
  db: Knex,
  input: {
    workspaceId: string;
    projectId: string;
    repositoryLinkId: string;
    rootDir: string;
  },
): Promise<void> {
  await stopRepoWatcher(input.repositoryLinkId);
  const matcher = await createIgnoreMatcher(input.rootDir);
  const watcher = chokidar.watch(input.rootDir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 40 },
    ignored: (watchPath) => {
      const rel = path.relative(input.rootDir, watchPath).replace(/\\/g, "/");
      if (!rel || rel === ".") return false;
      return matcher.ignores(rel);
    },
  });

  const entry: WatchEntry = {
    watcher,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    repositoryLinkId: input.repositoryLinkId,
    rootDir: input.rootDir,
    matcher,
    pendingChanged: new Set(),
    pendingDeleted: new Set(),
    timer: null,
    running: false,
    rerun: false,
  };

  const onChange = (absPath: string) => {
    const rel = path.relative(input.rootDir, absPath).replace(/\\/g, "/");
    if (!rel || matcher.ignores(rel) || !isParseCandidate(rel)) return;
    entry.pendingDeleted.delete(rel);
    entry.pendingChanged.add(rel);
    scheduleFlush(entry, db);
  };
  const onUnlink = (absPath: string) => {
    const rel = path.relative(input.rootDir, absPath).replace(/\\/g, "/");
    if (!rel || !isParseCandidate(rel)) return;
    entry.pendingChanged.delete(rel);
    entry.pendingDeleted.add(rel);
    scheduleFlush(entry, db);
  };

  watcher.on("add", onChange);
  watcher.on("change", onChange);
  watcher.on("unlink", onUnlink);
  watches.set(input.repositoryLinkId, entry);
}

export async function stopRepoWatcher(repositoryLinkId: string): Promise<void> {
  const entry = watches.get(repositoryLinkId);
  if (!entry) return;
  if (entry.timer) clearTimeout(entry.timer);
  watches.delete(repositoryLinkId);
  await entry.watcher.close();
}

export function listActiveWatchers(): string[] {
  return [...watches.keys()];
}

/** Test helper: coalesce paths into a watcher's pending sets. */
export function enqueueWatcherPathsForTests(
  repositoryLinkId: string,
  changed: string[],
  deleted: string[],
): { changed: string[]; deleted: string[] } | null {
  const entry = watches.get(repositoryLinkId);
  if (!entry) return null;
  for (const pathKey of changed) entry.pendingChanged.add(pathKey);
  for (const pathKey of deleted) {
    entry.pendingChanged.delete(pathKey);
    entry.pendingDeleted.add(pathKey);
  }
  return {
    changed: [...entry.pendingChanged],
    deleted: [...entry.pendingDeleted],
  };
}
