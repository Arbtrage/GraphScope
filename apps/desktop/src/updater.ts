import { BrowserWindow, dialog } from "electron";
import { autoUpdater } from "electron-updater";

export function initAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;

  autoUpdater
    .checkForUpdates()
    .then((result) => {
      if (result?.updateInfo) {
        console.log("Update check:", result.updateInfo.version ?? "none");
      }
    })
    .catch((err) => {
      console.log("Update check skipped (unsigned dev build):", err?.message ?? err);
    });
}

export async function checkForUpdatesInteractive(win: BrowserWindow): Promise<void> {
  try {
    const result = await autoUpdater.checkForUpdates();
    const version = result?.updateInfo?.version;
    if (!version) {
      await dialog.showMessageBox(win, {
        type: "info",
        title: "GraphScope",
        message: "You are up to date.",
      });
      return;
    }
    const { response } = await dialog.showMessageBox(win, {
      type: "info",
      title: "Update available",
      message: `Version ${version} is available.`,
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) {
      await autoUpdater.downloadUpdate();
      await dialog.showMessageBox(win, {
        type: "info",
        title: "Update downloaded",
        message: "Restart GraphScope to install the update.",
        buttons: ["Restart", "Later"],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response: r }) => {
        if (r === 0) autoUpdater.quitAndInstall();
      });
    }
  } catch (err) {
    await dialog.showMessageBox(win, {
      type: "warning",
      title: "Update check",
      message: err instanceof Error ? err.message : "Could not check for updates (dev builds are often unsigned).",
    });
  }
}
