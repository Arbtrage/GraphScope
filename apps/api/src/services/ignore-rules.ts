import fs from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";

export const HARD_IGNORE_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  "out",
  "generated",
  ".pnpm-store",
  ".cache",
  "target",
  "vendor",
];

export type IgnoreMatcher = {
  ignores: (relativePath: string) => boolean;
};

export async function createIgnoreMatcher(rootDir: string): Promise<IgnoreMatcher> {
  const ig = ignore();
  ig.add(HARD_IGNORE_DIRS.map((dir) => `${dir}/`));
  ig.add(HARD_IGNORE_DIRS);

  for (const name of [".gitignore", ".graphscopeignore"]) {
    try {
      const raw = await fs.readFile(path.join(rootDir, name), "utf-8");
      ig.add(raw);
    } catch {
      /* optional */
    }
  }

  return {
    ignores(relativePath: string) {
      const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
      if (!normalized) return false;
      if (normalized.split("/").some((part) => HARD_IGNORE_DIRS.includes(part))) return true;
      return ig.ignores(normalized);
    },
  };
}
