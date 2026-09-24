import { BrowserWindow, Menu, Tray, app, nativeImage } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMenu } from "./menu.js";
import { getWebUrl, runtime } from "./runtime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hideNativeButtons(win: BrowserWindow) {
  if (process.platform !== "darwin") return;
  win.setWindowButtonVisibility(false);
}

export function createWindow() {
  runtime.mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1120,
    minHeight: 640,
    title: "GraphQL Explorer",
    backgroundColor: "#111214",
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload.cjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  hideNativeButtons(runtime.mainWindow);
  runtime.mainWindow.on("enter-full-screen", () => {
    if (!runtime.mainWindow) return;
    hideNativeButtons(runtime.mainWindow);
    runtime.mainWindow.webContents.send("window:state", { fullscreen: true });
  });
  runtime.mainWindow.on("maximize", () => {
    runtime.mainWindow?.webContents.send("window:state", { fullscreen: true });
  });
  runtime.mainWindow.on("unmaximize", () => {
    runtime.mainWindow?.webContents.send("window:state", { fullscreen: false });
  });

  buildMenu(runtime.mainWindow);
  app.setAboutPanelOptions({
    applicationName: "GraphScope",
    applicationVersion: app.getVersion(),
    copyright: "Copyright © GraphScope contributors",
    credits: "Local-first GraphQL workspace",
  });

  runtime.mainWindow.once("ready-to-show", () => {
    if (!runtime.mainWindow) return;
    hideNativeButtons(runtime.mainWindow);
    runtime.mainWindow.show();
    if (runtime.splashWindow && !runtime.splashWindow.isDestroyed()) {
      runtime.splashWindow.close();
      runtime.splashWindow = null;
    }
  });

  if (app.isPackaged) {
    void runtime.mainWindow.loadFile(path.join(process.resourcesPath, "web", "index.html"));
  } else {
    void runtime.mainWindow.loadURL(getWebUrl());
  }

  if (!runtime.tray) {
    const iconPath = path.join(__dirname, "../../build/trayTemplate.png");
    const fallbackPath = path.join(__dirname, "../../build/icon.png");
    const icon = nativeImage.createFromPath(fs.existsSync(iconPath) ? iconPath : fallbackPath);
    if (!icon.isEmpty()) icon.setTemplateImage(true);
    runtime.tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    runtime.tray.setToolTip("GraphScope");
    runtime.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show GraphScope",
          click: () => {
            runtime.mainWindow?.show();
            runtime.mainWindow?.focus();
          },
        },
        { type: "separator" },
        { label: "Quit", click: () => app.quit() },
      ]),
    );
  }

  return runtime.mainWindow;
}
