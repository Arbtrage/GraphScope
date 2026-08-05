import { getDefaultDataDir } from "@graphscope/config";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

export interface PostgresHandle {
  port: number;
  stop: () => Promise<void>;
}

const EMBEDDED_PG_PORT = 55432;

async function isPostgresInitialized(databaseDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(databaseDir, "PG_VERSION"));
    return true;
  } catch {
    return false;
  }
}

async function ensurePostgresInitialized(
  pg: { initialise: () => Promise<void> },
  databaseDir: string,
): Promise<void> {
  if (await isPostgresInitialized(databaseDir)) {
    console.log("Using existing PostgreSQL data directory");
    return;
  }

  try {
    const entries = await fs.readdir(databaseDir);
    if (entries.length > 0) {
      console.warn("Removing incomplete PostgreSQL data directory…");
      await fs.rm(databaseDir, { recursive: true, force: true });
    }
  } catch {
    // Directory does not exist yet — initdb will create it.
  }

  await pg.initialise();
}

export async function startEmbeddedPostgres(dataDir: string): Promise<PostgresHandle> {
  const pgDataDir = path.join(dataDir, "data", "pg");
  const embeddedModule = await import("embedded-postgres");
  const EmbeddedPostgres = embeddedModule.default;

  const pg = new EmbeddedPostgres({
    databaseDir: pgDataDir,
    user: "graphscope",
    password: "graphscope",
    port: EMBEDDED_PG_PORT,
    persistent: true,
  });

  await ensurePostgresInitialized(pg, pgDataDir);
  await pg.start();

  try {
    await pg.createDatabase("graphscope");
  } catch {
    // database may already exist
  }

  const port = EMBEDDED_PG_PORT;

  process.env.GRAPHSCOPE_DB_PROFILE = "embedded";
  process.env.GRAPHSCOPE_DB_HOST = "127.0.0.1";
  process.env.GRAPHSCOPE_DB_PORT = String(port);
  process.env.GRAPHSCOPE_DB_USER = "graphscope";
  process.env.GRAPHSCOPE_DB_PASSWORD = "graphscope";
  process.env.GRAPHSCOPE_DB_NAME = "graphscope";

  return {
    port,
    stop: async () => {
      await pg.stop();
    },
  };
}

export function spawnApi(): ChildProcess {
  const apiEntry = path.join(repoRoot, "apps/api/src/index.ts");
  return spawn("pnpm", ["exec", "tsx", apiEntry], {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: "inherit",
  });
}

export async function waitForHealth(url: string, maxMs?: number): Promise<void> {
  const timeout = maxMs ?? 30000;
  const started = Date.now();
  for (;;) {
    if (Date.now() - started >= timeout) {
      throw new Error(`Health check failed: ${url}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export function resolveDataDir(): string {
  return process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
}
