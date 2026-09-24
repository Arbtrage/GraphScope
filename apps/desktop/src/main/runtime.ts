import type { BrowserWindow, Tray } from "electron";
import type { DesktopRuntimeConfig } from "../runtime-config.js";
import type { spawnApi, startEmbeddedPostgres } from "../postgres.js";
import { defaultPreferredConfig } from "../runtime-config.js";

export const PROTOCOL = "graphscope";

export const runtime = {
  apiProcess: null as ReturnType<typeof spawnApi> | null,
  pgHandle: null as Awaited<ReturnType<typeof startEmbeddedPostgres>> | null,
  mainWindow: null as BrowserWindow | null,
  splashWindow: null as BrowserWindow | null,
  tray: null as Tray | null,
  ready: false,
  config: defaultPreferredConfig() as DesktopRuntimeConfig,
};

export function getWebUrl(): string {
  return runtime.config.webUrl;
}

export function getApiHealthUrl(): string {
  return `${runtime.config.apiUrl}/healthz`;
}

export function getApiReadyUrl(): string {
  return `${runtime.config.apiUrl}/readyz`;
}

export function setRuntimeConfig(config: DesktopRuntimeConfig): void {
  runtime.config = config;
}
