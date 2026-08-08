import type { BrowserWindow, Tray } from "electron";
import type { spawnApi, startEmbeddedPostgres } from "../postgres.js";

export const WEB_URL = process.env.GRAPHSCOPE_WEB_URL ?? "http://localhost:3000";
export const API_HEALTH = process.env.GRAPHSCOPE_API_HEALTH ?? "http://127.0.0.1:47321/healthz";
export const API_READY = process.env.GRAPHSCOPE_API_READY ?? "http://127.0.0.1:47321/readyz";
export const PROTOCOL = "graphscope";

export const runtime = {
  apiProcess: null as ReturnType<typeof spawnApi> | null,
  pgHandle: null as Awaited<ReturnType<typeof startEmbeddedPostgres>> | null,
  mainWindow: null as BrowserWindow | null,
  splashWindow: null as BrowserWindow | null,
  tray: null as Tray | null,
};
