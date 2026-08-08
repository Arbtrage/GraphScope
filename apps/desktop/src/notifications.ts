import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";
import { BrowserWindow, Notification } from "electron";

const seen = new Set<string>();

export function startNotificationWatcher(
  dataDir?: string,
  getWindow?: () => BrowserWindow | null,
): () => void {
  const base = dataDir ?? process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
  const notifyDir = path.join(base, "notifications");

  const poll = async () => {
    try {
      await fs.mkdir(notifyDir, { recursive: true });
      const files = await fs.readdir(notifyDir);
      for (const file of files) {
        if (!file.endsWith(".json") || seen.has(file)) continue;
        const raw = await fs.readFile(path.join(notifyDir, file), "utf-8");
        const event = JSON.parse(raw) as {
          jobType?: string;
          status?: string;
          message?: string;
        };
        seen.add(file);
        if (Notification.isSupported()) {
          const n = new Notification({
            title: `GraphScope — ${event.jobType ?? "Job"}`,
            body: `${event.status ?? "update"}: ${event.message ?? ""}`,
          });
          n.on("click", () => {
            const win = getWindow?.();
            if (win) {
              win.show();
              win.focus();
              win.webContents.send("graphscope:open-route", "/app/jobs");
            }
          });
          n.show();
        }
      }
    } catch {
      // ignore poll errors
    }
  };

  void poll();
  const timer = setInterval(() => void poll(), 3000);
  return () => clearInterval(timer);
}
