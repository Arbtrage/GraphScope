#!/usr/bin/env node
/**
 * Allocates preferred-or-free ports, writes runtime.json, then starts Vite + Electron
 * with matching env so desktop:dev survives occupied 5173/47321/55432.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PREFERRED = { api: 47321, pg: 55432, web: 5173 };
const HOST = "127.0.0.1";

function probePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, HOST, () => {
      server.close(() => resolve(true));
    });
  });
}

async function allocatePort(preferred, scanRange = 50) {
  if (await probePort(preferred)) return preferred;
  for (let offset = 1; offset <= scanRange; offset += 1) {
    const candidate = preferred + offset;
    if (await probePort(candidate)) return candidate;
  }
  throw new Error(`No free port near ${preferred} on ${HOST}`);
}

function defaultDataDir() {
  if (process.env.GRAPHSCOPE_DATA_DIR) return process.env.GRAPHSCOPE_DATA_DIR;
  const home = process.env.HOME ?? process.env.USERPROFILE ?? os.tmpdir();
  return path.join(home, "Library", "Application Support", "GraphScope");
}

async function main() {
  const [apiPort, pgPort, webPort] = await Promise.all([
    allocatePort(PREFERRED.api),
    allocatePort(PREFERRED.pg),
    allocatePort(PREFERRED.web),
  ]);

  const dataDir = defaultDataDir();
  const config = {
    apiHost: HOST,
    apiPort,
    pgPort,
    webPort,
    webUrl: `http://${HOST}:${webPort}`,
    apiUrl: `http://${HOST}:${apiPort}`,
    createdAt: new Date().toISOString(),
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, "runtime.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const env = {
    ...process.env,
    GRAPHSCOPE_DATA_DIR: dataDir,
    GRAPHSCOPE_DESKTOP_PORTS_LOCKED: "1",
    GRAPHSCOPE_DB_PROFILE: "embedded",
    GRAPHSCOPE_DB_HOST: HOST,
    GRAPHSCOPE_DB_PORT: String(pgPort),
    GRAPHSCOPE_API_PORT: String(apiPort),
    GRAPHSCOPE_WEB_PORT: String(webPort),
    GRAPHSCOPE_WEB_URL: config.webUrl,
    GRAPHSCOPE_API_HEALTH: `${config.apiUrl}/healthz`,
    GRAPHSCOPE_API_READY: `${config.apiUrl}/readyz`,
  };

  console.log(
    `[desktop-dev] ports api=${apiPort} pg=${pgPort} web=${webPort} → ${path.join(dataDir, "runtime.json")}`,
  );

  const children = [];
  const killAll = (signal = "SIGTERM") => {
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
  };

  process.on("SIGINT", () => {
    killAll("SIGTERM");
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    killAll("SIGTERM");
    process.exit(143);
  });

  const web = spawn(
    "pnpm",
    ["--filter", "@graphscope/web", "exec", "vite", "--port", String(webPort), "--strictPort", "--host", HOST],
    { cwd: repoRoot, env, stdio: "inherit" },
  );
  children.push(web);

  const desktop = spawn("pnpm", ["--filter", "@graphscope/desktop", "dev"], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
  children.push(desktop);

  const onExit = (code, source) => {
    killAll();
    process.exit(code ?? (source === "web" || source === "desktop" ? 1 : 0));
  };
  web.on("exit", (code) => onExit(code, "web"));
  desktop.on("exit", (code) => onExit(code, "desktop"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
