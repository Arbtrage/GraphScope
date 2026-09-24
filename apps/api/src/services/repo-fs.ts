import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { createIgnoreMatcher } from "./ignore-rules.js";

const execFileAsync = promisify(execFile);

const MAX_TREE_ENTRIES = 25_000;
const MAX_FILE_BYTES = 512_000;

export interface RepoTreeEntry {
  path: string;
  isDirectory: boolean;
}

async function hasGit(rootDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(rootDir, ".git"));
    return true;
  } catch {
    return false;
  }
}

async function listViaGit(rootDir: string): Promise<string[]> {
  const matcher = await createIgnoreMatcher(rootDir);
  const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: rootDir,
    maxBuffer: 32 * 1024 * 1024,
    timeout: 30_000,
  });
  return stdout
    .split("\0")
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter((line) => line.length > 0 && !matcher.ignores(line))
    .slice(0, MAX_TREE_ENTRIES);
}

async function walkAll(dir: string, root: string, files: string[], matcher: Awaited<ReturnType<typeof createIgnoreMatcher>>): Promise<void> {
  if (files.length >= MAX_TREE_ENTRIES) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (files.length >= MAX_TREE_ENTRIES) return;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (matcher.ignores(rel)) continue;
    if (entry.isDirectory()) {
      await walkAll(full, root, files, matcher);
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
}

/** Full codebase paths for editor-style browsing (not GraphQL-only). */
export async function listRepositoryFiles(rootDir: string): Promise<string[]> {
  if (await hasGit(rootDir)) {
    try {
      return await listViaGit(rootDir);
    } catch {
      /* fall through to walk */
    }
  }
  const matcher = await createIgnoreMatcher(rootDir);
  const files: string[] = [];
  await walkAll(rootDir, rootDir, files, matcher);
  return files;
}

export function assertSafeRepoPath(rootDir: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0") || normalized.split("/").includes("..")) {
    throw new Error("Invalid file path");
  }
  const absolute = path.resolve(rootDir, normalized);
  const root = path.resolve(rootDir);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error("Path escapes repository root");
  }
  return absolute;
}

export async function readRepositoryFile(
  rootDir: string,
  relativePath: string,
): Promise<{ path: string; content: string; truncated: boolean; byteSize: number }> {
  const absolute = assertSafeRepoPath(rootDir, relativePath);
  const stat = await fs.stat(absolute);
  if (!stat.isFile()) throw new Error("Not a file");
  const handle = await fs.open(absolute, "r");
  try {
    const size = stat.size;
    const toRead = Math.min(size, MAX_FILE_BYTES);
    const buffer = Buffer.alloc(toRead);
    await handle.read(buffer, 0, toRead, 0);
    // Treat as binary if NUL present in sample
    if (buffer.includes(0)) {
      return {
        path: relativePath.replace(/\\/g, "/"),
        content: "",
        truncated: false,
        byteSize: size,
      };
    }
    return {
      path: relativePath.replace(/\\/g, "/"),
      content: buffer.toString("utf8"),
      truncated: size > MAX_FILE_BYTES,
      byteSize: size,
    };
  } finally {
    await handle.close();
  }
}
