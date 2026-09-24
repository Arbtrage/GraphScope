import { BrowserWindow, app, dialog } from "electron";
import { patchAsarFsForNatives } from "./asar-fs-patch.js";
import { bootstrap } from "./main/bootstrap.js";
import { handleDeepLink } from "./main/deep-link.js";
import { createWindow } from "./main/window.js";
import { PROTOCOL, runtime } from "./main/runtime.js";

// Before any embedded-postgres import — rewrite asar paths for native chmod/exec.
patchAsarFsForNatives();

app.setName("GraphScope");
if (process.platform === "win32") {
  app.setAppUserModelId("com.graphscope.desktop");
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const url = argv.find((a) => a.startsWith(`${PROTOCOL}://`));
    if (url) handleDeepLink(url);

    if (runtime.mainWindow) {
      if (runtime.mainWindow.isMinimized()) runtime.mainWindow.restore();
      runtime.mainWindow.show();
      runtime.mainWindow.focus();
      return;
    }

    if (runtime.splashWindow && !runtime.splashWindow.isDestroyed()) {
      runtime.splashWindow.show();
      runtime.splashWindow.focus();
    }
  });

  app
    .whenReady()
    .then(bootstrap)
    .catch(async (err) => {
      console.error("GraphScope failed to start:", err);
      await dialog.showMessageBox({
        type: "error",
        title: "GraphScope failed to start",
        message: err instanceof Error ? err.message : String(err),
      });
      app.exit(1);
    });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async () => {
  runtime.ready = false;
  if (runtime.apiProcess) {
    runtime.apiProcess.kill("SIGTERM");
    runtime.apiProcess = null;
  }
  if (runtime.pgHandle) {
    await runtime.pgHandle.stop();
    runtime.pgHandle = null;
  }
});

app.on("activate", () => {
  if (!runtime.ready) return;
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    runtime.mainWindow?.show();
    runtime.mainWindow?.focus();
  }
});
