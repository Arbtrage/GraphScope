import { getDefaultDataDir } from "@graphscope/config";
import { app } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allocatePort, LOOPBACK_HOST, PREFERRED_PORTS } from "./ports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

export interface PostgresHandle {
  port: number;
  stop: () => Promise<void>;
}

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

export async function startEmbeddedPostgres(
  dataDir: string,
  preferredPort: number = PREFERRED_PORTS.pg,
): Promise<PostgresHandle> {
  const pgDataDir = path.join(dataDir, "data", "pg");
  const embeddedModule = await import("embedded-postgres");
  const EmbeddedPostgres = embeddedModule.default;

  let port: number = preferredPort;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      port = await allocatePort(PREFERRED_PORTS.pg + 1, LOOPBACK_HOST);
    } else {
      port = await allocatePort(preferredPort, LOOPBACK_HOST);
    }

    const pg = new EmbeddedPostgres({
      databaseDir: pgDataDir,
      user: "graphscope",
      password: "graphscope",
      port,
      persistent: true,
    });

    try {
      await ensurePostgresInitialized(pg, pgDataDir);
      await pg.start();

      try {
        await pg.createDatabase("graphscope");
      } catch {
        // database may already exist
      }

      process.env.GRAPHSCOPE_DB_PROFILE = "embedded";
      process.env.GRAPHSCOPE_DB_HOST = LOOPBACK_HOST;
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
    } catch (err) {
      lastError = err;
      try {
        await pg.stop();
      } catch {
        // ignore stop errors on failed start
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to start embedded PostgreSQL: ${String(lastError)}`);
}

export function spawnApi(): ChildProcess {
  if (app.isPackaged) {
    const entry = path.join(process.resourcesPath, "api", "index.js");
    return spawn(process.execPath, [entry], {
      cwd: path.join(process.resourcesPath, "api"),
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        GRAPHSCOPE_MIGRATIONS_DIR: path.join(process.resourcesPath, "database", "migrations"),
        GRAPHSCOPE_MIGRATIONS_EXT: "js",
        GRAPHSCOPE_ALLOW_PRIVATE_URLS: "1",
      },
      stdio: "inherit",
    });
  }

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
