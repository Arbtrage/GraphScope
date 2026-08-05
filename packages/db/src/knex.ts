import knex, { type Knex } from "knex";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../../database/migrations");

let instance: Knex | null = null;

export interface DbConnectionOptions {
  profile?: "embedded" | "development" | "test";
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export function createKnex(options: DbConnectionOptions = {}): Knex {
  const profile = options.profile ?? (process.env.GRAPHSCOPE_DB_PROFILE as DbConnectionOptions["profile"]) ?? "development";

  return knex({
    client: "pg",
    connection: {
      host: options.host ?? process.env.GRAPHSCOPE_DB_HOST ?? "127.0.0.1",
      port: options.port ?? Number(process.env.GRAPHSCOPE_DB_PORT ?? 5432),
      user: options.user ?? process.env.GRAPHSCOPE_DB_USER ?? "graphscope",
      password: options.password ?? process.env.GRAPHSCOPE_DB_PASSWORD ?? "graphscope",
      database: options.database ?? process.env.GRAPHSCOPE_DB_NAME ?? (profile === "test" ? "graphscope_test" : "graphscope"),
    },
    migrations: {
      directory: migrationsDir,
      extension: "ts",
      loadExtensions: [".ts", ".js"],
    },
    pool: { min: 1, max: 10 },
  });
}

export function getKnex(options?: DbConnectionOptions): Knex {
  if (!instance) {
    instance = createKnex(options);
  }
  return instance;
}

export function setKnex(db: Knex): void {
  instance = db;
}

export async function destroyKnex(): Promise<void> {
  if (instance) {
    await instance.destroy();
    instance = null;
  }
}

export async function runMigrations(db?: Knex): Promise<void> {
  const k = db ?? getKnex();
  await k.migrate.latest();
}
