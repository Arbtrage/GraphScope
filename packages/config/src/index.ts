import { z } from "zod";

export const dbProfileSchema = z.enum(["embedded", "development", "test"]);

export const envSchema = z.object({
  GRAPHSCOPE_API_PORT: z.coerce.number().default(47321),
  GRAPHSCOPE_DATA_DIR: z.string().optional(),
  GRAPHSCOPE_DB_PROFILE: dbProfileSchema.default("development"),
  GRAPHSCOPE_DB_HOST: z.string().default("127.0.0.1"),
  GRAPHSCOPE_DB_PORT: z.coerce.number().default(5432),
  GRAPHSCOPE_DB_USER: z.string().default("graphscope"),
  GRAPHSCOPE_DB_PASSWORD: z.string().default("graphscope"),
  GRAPHSCOPE_DB_NAME: z.string().default("graphscope"),
  GRAPHSCOPE_GITHUB_CLIENT_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(overrides: Partial<Record<keyof Env, string | number>> = {}): Env {
  const raw = {
    GRAPHSCOPE_API_PORT: process.env.GRAPHSCOPE_API_PORT,
    GRAPHSCOPE_DATA_DIR: process.env.GRAPHSCOPE_DATA_DIR,
    GRAPHSCOPE_DB_PROFILE: process.env.GRAPHSCOPE_DB_PROFILE,
    GRAPHSCOPE_DB_HOST: process.env.GRAPHSCOPE_DB_HOST,
    GRAPHSCOPE_DB_PORT: process.env.GRAPHSCOPE_DB_PORT,
    GRAPHSCOPE_DB_USER: process.env.GRAPHSCOPE_DB_USER,
    GRAPHSCOPE_DB_PASSWORD: process.env.GRAPHSCOPE_DB_PASSWORD,
    GRAPHSCOPE_DB_NAME: process.env.GRAPHSCOPE_DB_NAME,
    GRAPHSCOPE_GITHUB_CLIENT_ID: process.env.GRAPHSCOPE_GITHUB_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV,
    ...overrides,
  };
  return envSchema.parse(raw);
}

export function getDefaultDataDir(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "/tmp";
  return `${home}/Library/Application Support/GraphScope`;
}
