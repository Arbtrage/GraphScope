import { BrowserWindow } from "electron";
import { runtime } from "./runtime.js";

function splashHtml(status: string): string {
  return `<!doctype html><html class="dark"><head><meta charset="utf-8"/><style>
  html,body{margin:0;height:100%;font-family:system-ui,sans-serif;background:#0a1214;color:#e8f2f0}
  .wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px}
  .mark{width:48px;height:48px;border-radius:12px;background:rgba(94,207,186,.15);display:grid;place-items:center}
  .mark svg{width:28px;height:28px;fill:#5ecfba}
  h1{font-size:18px;font-weight:600;margin:0;letter-spacing:-.02em}
  p{margin:0;font-size:13px;opacity:.65}
  </style></head><body><div class="wrap">
  <div class="mark"><svg viewBox="0 0 24 24"><path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7L12 2.5Z"/></svg></div>
  <h1>GraphScope</h1><p id="s">${status}</p></div></body></html>`;
}

export function createSplash() {
  runtime.splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    movable: true,
    center: true,
    backgroundColor: "#0a1214",
    show: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  void runtime.splashWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(splashHtml("Starting…"))}`,
  );
}

export async function setSplashStatus(status: string) {
  if (!runtime.splashWindow || runtime.splashWindow.isDestroyed()) return;
  await runtime.splashWindow.webContents.executeJavaScript(
    `document.getElementById('s').textContent = ${JSON.stringify(status)}`,
  );
}
