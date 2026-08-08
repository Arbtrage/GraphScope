import { app, ipcMain, nativeTheme } from "electron";
import path from "node:path";
import { registerKeychainHandlers } from "../keychain.js";
import { startNotificationWatcher } from "../notifications.js";
import { initAutoUpdater } from "../updater.js";
import { resolveDataDir, spawnApi, startEmbeddedPostgres, waitForHealth } from "../postgres.js";
import { createSplash, setSplashStatus } from "./splash.js";
import { createWindow } from "./window.js";
import { API_HEALTH, API_READY, PROTOCOL, WEB_URL, runtime } from "./runtime.js";

function registerIpc() {
  ipcMain.on("graphscope:set-theme", (_event, theme: string) => {
    if (theme === "light") nativeTheme.themeSource = "light";
    else if (theme === "dark") nativeTheme.themeSource = "dark";
    else nativeTheme.themeSource = "system";
  });
}

async function pollReadyz(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(API_READY);
      const body = (await res.json()) as { ok?: boolean; postgres?: boolean; migrations?: boolean };
      if (body.postgres === false) await setSplashStatus("Starting database…");
      else if (!body.ok) await setSplashStatus("Starting API…");
      else {
        await setSplashStatus("Loading interface…");
        return;
      }
    } catch {
      await setSplashStatus("Waiting for API…");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("API readiness timed out");
}

export async function bootstrap() {
  registerKeychainHandlers();
  registerIpc();

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1]!)]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  createSplash();
  const dataDir = resolveDataDir();
  process.env.GRAPHSCOPE_DATA_DIR = dataDir;

  await setSplashStatus("Starting database…");
  runtime.pgHandle = await startEmbeddedPostgres(dataDir);
  await setSplashStatus("Starting API…");

  runtime.apiProcess = spawnApi();
  runtime.apiProcess.on("exit", (code: number | null) => {
    console.log(`API process exited with code ${code}`);
  });

  await pollReadyz().catch(async () => {
    await waitForHealth(API_HEALTH);
  });
  await setSplashStatus("Loading interface…");
  await waitForHealth(WEB_URL.replace(/\/$/, "") + "/login", 120000);

  startNotificationWatcher(dataDir, () => runtime.mainWindow);
  initAutoUpdater();
  createWindow();
}
