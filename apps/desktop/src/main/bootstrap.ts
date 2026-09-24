import { app, dialog, ipcMain, nativeTheme, shell, BrowserWindow } from "electron";
import path from "node:path";
import { registerKeychainHandlers } from "../keychain.js";
import { startNotificationWatcher } from "../notifications.js";
import { allocatePort, LOOPBACK_HOST, PREFERRED_PORTS } from "../ports.js";
import {
  applyRuntimeEnv,
  buildRuntimeConfig,
  writeRuntimeConfig,
  type DesktopRuntimeConfig,
} from "../runtime-config.js";
import { resolveDataDir, spawnApi, startEmbeddedPostgres, waitForHealth } from "../postgres.js";
import { initAutoUpdater } from "../updater.js";
import { createSplash, setSplashStatus } from "./splash.js";
import { createWindow } from "./window.js";
import {
  getApiHealthUrl,
  getApiReadyUrl,
  getWebUrl,
  PROTOCOL,
  runtime,
  setRuntimeConfig,
} from "./runtime.js";

function windowFromEvent(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function registerIpc() {
  ipcMain.handle("graphscope:get-runtime", () => runtime.config);

  ipcMain.on("graphscope:set-theme", (_event, theme: string) => {
    if (theme === "light") nativeTheme.themeSource = "light";
    else if (theme === "dark") nativeTheme.themeSource = "dark";
    else nativeTheme.themeSource = "system";
  });

  ipcMain.handle("graphscope:open-directory", async () => {
    const win = runtime.mainWindow;
    const options = {
      properties: ["openDirectory" as const],
      title: "Open repository",
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled) return null;
    return result.filePaths[0] ?? null;
  });

  ipcMain.handle("graphscope:open-in-source", async (_event, input: { path: string; line?: number }) => {
    const filePath = input.path;
    const line = input.line ?? 1;
    const vscode = `vscode://file${filePath.startsWith("/") ? filePath : `/${filePath}`}:${line}`;
    try {
      await shell.openExternal(vscode);
      return true;
    } catch {
      await shell.openPath(filePath);
      return true;
    }
  });

  ipcMain.handle("window:minimize", (event) => {
    windowFromEvent(event)?.minimize();
  });

  ipcMain.handle("window:close", (event) => {
    windowFromEvent(event)?.close();
  });

  ipcMain.handle("window:toggle-fullscreen", (event) => {
    const win = windowFromEvent(event);
    if (!win) return { fullscreen: false };
    if (process.platform === "darwin") {
      win.setFullScreen(!win.isFullScreen());
    } else if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return { fullscreen: win.isFullScreen() || win.isMaximized() };
  });

  ipcMain.handle("window:state", (event) => {
    const win = windowFromEvent(event);
    return { fullscreen: Boolean(win?.isFullScreen() || win?.isMaximized()) };
  });
}

async function pollReadyz(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(getApiReadyUrl());
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

async function allocateDesktopPorts(): Promise<DesktopRuntimeConfig> {
  const envWebPort = Number(process.env.GRAPHSCOPE_WEB_PORT);
  const locked = process.env.GRAPHSCOPE_DESKTOP_PORTS_LOCKED === "1";
  const envApiPort = Number(process.env.GRAPHSCOPE_API_PORT);
  const envPgPort = Number(process.env.GRAPHSCOPE_DB_PORT);

  const webPort =
    Number.isFinite(envWebPort) && envWebPort > 0
      ? envWebPort
      : await allocatePort(PREFERRED_PORTS.web, LOOPBACK_HOST);

  // Ignore developer .env API/DB ports unless the desktop-dev orchestrator locked them.
  // Desktop always prefers embedded defaults (47321 / 55432).
  const apiPort =
    locked && Number.isFinite(envApiPort) && envApiPort > 0
      ? envApiPort
      : await allocatePort(PREFERRED_PORTS.api, LOOPBACK_HOST);

  const pgPort =
    locked && Number.isFinite(envPgPort) && envPgPort > 0
      ? envPgPort
      : await allocatePort(PREFERRED_PORTS.pg, LOOPBACK_HOST);

  return buildRuntimeConfig({ apiPort, pgPort, webPort });
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

  let config = await allocateDesktopPorts();
  setRuntimeConfig(config);
  applyRuntimeEnv(config);
  await writeRuntimeConfig(dataDir, config);

  await setSplashStatus("Starting database…");
  runtime.pgHandle = await startEmbeddedPostgres(dataDir, config.pgPort);

  // PG may have fallen back to another port on race; sync config.
  if (runtime.pgHandle.port !== config.pgPort) {
    config = buildRuntimeConfig({
      apiPort: config.apiPort,
      pgPort: runtime.pgHandle.port,
      webPort: config.webPort,
    });
    setRuntimeConfig(config);
    applyRuntimeEnv(config);
    await writeRuntimeConfig(dataDir, config);
  }

  await setSplashStatus("Starting API…");
  runtime.apiProcess = spawnApi();
  runtime.apiProcess.on("exit", (code: number | null) => {
    console.log(`API process exited with code ${code}`);
  });

  await pollReadyz().catch(async () => {
    await waitForHealth(getApiHealthUrl());
  });
  await setSplashStatus("Loading interface…");
  if (!app.isPackaged) {
    await waitForHealth(`${getWebUrl().replace(/\/$/, "")}/`, 120000);
  }

  startNotificationWatcher(dataDir, () => runtime.mainWindow);
  initAutoUpdater();
  createWindow();
  runtime.ready = true;
}
