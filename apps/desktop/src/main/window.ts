import { BrowserWindow, Menu, Tray, app, nativeImage } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMenu } from "./menu.js";
import { WEB_URL, runtime } from "./runtime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createWindow() {
  runtime.mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "GraphScope",
    backgroundColor: "#0a1214",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 16, y: 18 } : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  buildMenu(runtime.mainWindow);
  app.setAboutPanelOptions({
    applicationName: "GraphScope",
    applicationVersion: app.getVersion(),
    copyright: "Copyright © GraphScope contributors",
    credits: "Local-first GraphQL workspace",
  });

  runtime.mainWindow.once("ready-to-show", () => {
    runtime.mainWindow?.show();
    if (runtime.splashWindow && !runtime.splashWindow.isDestroyed()) {
      runtime.splashWindow.close();
      runtime.splashWindow = null;
    }
  });

  void runtime.mainWindow.loadURL(WEB_URL);

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
