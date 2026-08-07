import type { Knex } from "@graphscope/db";
import { run, type Runner } from "graphile-worker";
import { createRepositories } from "@graphscope/db";
import { runParseRepoTask } from "./tasks/parse-repo.js";
import { runSchemaCheckTask } from "./tasks/schema-check.js";
import { runSearchReindexTask } from "./tasks/search-reindex.js";
import { runAnalyticsAnalyzeOpTask } from "./tasks/analytics-analyze-op.js";
import { runAnalyticsRollupTask } from "./tasks/analytics-rollup.js";

export type WorkerHandle = { stop: () => Promise<void> };

let activeRunner: Runner | null = null;

export async function startWorker(db: Knex): Promise<WorkerHandle> {
  const connectionString = buildConnectionString(db);
  const runner = await run({
    connectionString,
    concurrency: 2,
    taskList: {
      "parse.repo": async (payload) => {
        const repos = createRepositories(db);
        const p = payload as Parameters<typeof runParseRepoTask>[1];
        await runParseRepoTask(repos, p, db);
        await runSearchReindexTask(repos, { workspaceId: p.workspaceId });
      },
      "schema.check": async (payload) => {
        const repos = createRepositories(db);
        await runSchemaCheckTask(repos, payload as Parameters<typeof runSchemaCheckTask>[1]);
      },
      "search.reindex": async (payload) => {
        const repos = createRepositories(db);
        await runSearchReindexTask(repos, payload as Parameters<typeof runSearchReindexTask>[1]);
      },
      "analytics.analyze_op": async (payload) => {
        const repos = createRepositories(db);
        await runAnalyticsAnalyzeOpTask(repos, payload as Parameters<typeof runAnalyticsAnalyzeOpTask>[1]);
      },
      "analytics.rollup": async (payload) => {
        const repos = createRepositories(db);
        await runAnalyticsRollupTask(repos, payload as Parameters<typeof runAnalyticsRollupTask>[1]);
      },
    },
  });
  activeRunner = runner;
  return {
    stop: async () => {
      if (activeRunner) {
        await activeRunner.stop();
        activeRunner = null;
      }
    },
  };
}

function buildConnectionString(db: Knex): string {
  const client = db.client.config.connection as {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };
  const user = encodeURIComponent(client.user ?? "graphscope");
  const password = encodeURIComponent(client.password ?? "graphscope");
  const host = client.host ?? "127.0.0.1";
  const port = client.port ?? 5432;
  const database = client.database ?? "graphscope";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export async function enqueueJob(
  db: Knex,
  taskIdentifier: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { makeWorkerUtils } = await import("graphile-worker");
  const utils = await makeWorkerUtils({ connectionString: buildConnectionString(db) });
  try {
    await utils.addJob(taskIdentifier, payload);
  } finally {
    await utils.release();
  }
}
