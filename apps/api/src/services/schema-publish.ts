import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultDataDir } from "@graphscope/config";

export function normalizeSdl(sdl: string): string {
  return sdl.trim().replace(/\r\n/g, "\n");
}

export function hashSdl(sdl: string): string {
  return createHash("sha256").update(normalizeSdl(sdl)).digest("hex");
}

export function resolveSchemasDir(dataDir?: string): string {
  const base = dataDir ?? process.env.GRAPHSCOPE_DATA_DIR ?? getDefaultDataDir();
  return path.join(base, "schemas");
}

export async function writeSdlFile(projectId: string, contentHash: string, sdl: string): Promise<string> {
  const dir = path.join(resolveSchemasDir(), projectId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${contentHash}.graphql`);
  await fs.writeFile(filePath, normalizeSdl(sdl), "utf-8");
  return filePath;
}

export async function readSdlFile(sdlPath: string): Promise<string> {
  return fs.readFile(sdlPath, "utf-8");
}
