import { runtime } from "./runtime.js";

export function handleDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    const route = parsed.hostname
      ? `/${parsed.hostname}${parsed.pathname}`.replace(/\/+/g, "/")
      : parsed.pathname || "/app";
    const pathOnly = route.startsWith("/app") ? route : `/app${route.startsWith("/") ? route : `/${route}`}`;
    if (runtime.mainWindow) {
      runtime.mainWindow.show();
      runtime.mainWindow.webContents.send("graphscope:open-route", pathOnly);
    }
  } catch (err) {
    console.warn("Invalid deep link", url, err);
  }
}
