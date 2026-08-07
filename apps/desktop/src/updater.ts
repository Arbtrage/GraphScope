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
