import fs from "node:fs/promises";
import path from "node:path";
import { LOOPBACK_HOST, PREFERRED_PORTS } from "./ports.js";

export type DesktopRuntimeConfig = {
  apiHost: string;
  apiPort: number;
  pgPort: number;
  webPort: number;
  webUrl: string;
  apiUrl: string;
  createdAt: string;
};

export function buildRuntimeConfig(ports: {
  apiPort: number;
  pgPort: number;
  webPort: number;
  apiHost?: string;
}): DesktopRuntimeConfig {
  const apiHost = ports.apiHost ?? LOOPBACK_HOST;
  return {
    apiHost,
    apiPort: ports.apiPort,
    pgPort: ports.pgPort,
    webPort: ports.webPort,
    webUrl: `http://${apiHost}:${ports.webPort}`,
    apiUrl: `http://${apiHost}:${ports.apiPort}`,
    createdAt: new Date().toISOString(),
  };
}

export function runtimeConfigPath(dataDir: string): string {
  return path.join(dataDir, "runtime.json");
}

export async function writeRuntimeConfig(
  dataDir: string,
  config: DesktopRuntimeConfig,
): Promise<string> {
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = runtimeConfigPath(dataDir);
  await fs.writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readRuntimeConfig(dataDir: string): Promise<DesktopRuntimeConfig | null> {
  try {
    const raw = await fs.readFile(runtimeConfigPath(dataDir), "utf8");
    const parsed = JSON.parse(raw) as Partial<DesktopRuntimeConfig>;
    if (
      typeof parsed.apiPort !== "number" ||
      typeof parsed.pgPort !== "number" ||
      typeof parsed.webPort !== "number"
    ) {
      return null;
    }
    return buildRuntimeConfig({
      apiPort: parsed.apiPort,
      pgPort: parsed.pgPort,
      webPort: parsed.webPort,
      apiHost: typeof parsed.apiHost === "string" ? parsed.apiHost : LOOPBACK_HOST,
    });
  } catch {
    return null;
  }
}

/** Apply runtime config into process.env for API child + health URLs. */
export function applyRuntimeEnv(config: DesktopRuntimeConfig): void {
  process.env.GRAPHSCOPE_DB_PROFILE = "embedded";
  process.env.GRAPHSCOPE_DB_HOST = config.apiHost;
  process.env.GRAPHSCOPE_DB_PORT = String(config.pgPort);
  process.env.GRAPHSCOPE_DB_USER = process.env.GRAPHSCOPE_DB_USER || "graphscope";
  process.env.GRAPHSCOPE_DB_PASSWORD = process.env.GRAPHSCOPE_DB_PASSWORD || "graphscope";
  process.env.GRAPHSCOPE_DB_NAME = process.env.GRAPHSCOPE_DB_NAME || "graphscope";
  process.env.GRAPHSCOPE_API_PORT = String(config.apiPort);
  process.env.GRAPHSCOPE_API_HEALTH = `${config.apiUrl}/healthz`;
  process.env.GRAPHSCOPE_API_READY = `${config.apiUrl}/readyz`;
  process.env.GRAPHSCOPE_WEB_URL = config.webUrl;
  process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS = "1";
}

export function defaultPreferredConfig(): DesktopRuntimeConfig {
  return buildRuntimeConfig({
    apiPort: PREFERRED_PORTS.api,
    pgPort: PREFERRED_PORTS.pg,
    webPort: PREFERRED_PORTS.web,
  });
}
