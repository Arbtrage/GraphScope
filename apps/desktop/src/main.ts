import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerKeychainHandlers } from "./keychain.js";
import { startNotificationWatcher } from "./notifications.js";
import { initAutoUpdater } from "./updater.js";
import { resolveDataDir, spawnApi, startEmbeddedPostgres, waitForHealth } from "./postgres.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEB_URL = process.env.GRAPHSCOPE_WEB_URL ?? "http://localhost:3000";
const API_HEALTH = process.env.GRAPHSCOPE_API_HEALTH ?? "http://127.0.0.1:47321/healthz";

let apiProcess: ReturnType<typeof spawnApi> | null = null;
let pgHandle: Awaited<ReturnType<typeof startEmbeddedPostgres>> | null = null;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "GraphScope",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadURL(WEB_URL);
}

async function bootstrap() {
  registerKeychainHandlers();

  const dataDir = resolveDataDir();
  process.env.GRAPHSCOPE_DATA_DIR = dataDir;

  console.log("Starting embedded PostgreSQL…");
  pgHandle = await startEmbeddedPostgres(dataDir);

  console.log(`PostgreSQL ready on port ${pgHandle.port}`);

  apiProcess = spawnApi();
  apiProcess.on("exit", (code) => {
    console.log(`API process exited with code ${code}`);
  });

  console.log("Waiting for API and web…");
  await waitForHealth(API_HEALTH);
  await waitForHealth(WEB_URL.replace(/\/$/, "") + "/login", 120000);

  startNotificationWatcher(dataDir);
  initAutoUpdater();

  await createWindow();
}

app.whenReady().then(bootstrap).catch((err) => {
  console.error("GraphScope failed to start:", err);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async () => {
  if (apiProcess) {
    apiProcess.kill("SIGTERM");
    apiProcess = null;
  }
  if (pgHandle) {
    await pgHandle.stop();
    pgHandle = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error);
  }
});
