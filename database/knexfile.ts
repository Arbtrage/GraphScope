import type { Knex } from "knex";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface KnexConfigOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

function baseConnection(options: KnexConfigOptions = {}): Knex.Config {
  return {
    client: "pg",
    connection: {
      host: options.host ?? process.env.GRAPHSCOPE_DB_HOST ?? "127.0.0.1",
      port: options.port ?? Number(process.env.GRAPHSCOPE_DB_PORT ?? 5432),
      user: options.user ?? process.env.GRAPHSCOPE_DB_USER ?? "graphscope",
      password: options.password ?? process.env.GRAPHSCOPE_DB_PASSWORD ?? "graphscope",
      database: options.database ?? process.env.GRAPHSCOPE_DB_NAME ?? "graphscope",
    },
    migrations: {
      directory: path.join(__dirname, "migrations"),
      extension: "ts",
    },
    pool: { min: 1, max: 10 },
  };
}

const config: Record<string, Knex.Config> = {
  embedded: baseConnection(),
  development: baseConnection(),
  test: baseConnection({
    database: process.env.GRAPHSCOPE_DB_NAME ?? "graphscope_test",
  }),
};

export default config;
