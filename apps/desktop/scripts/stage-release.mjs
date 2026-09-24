#!/usr/bin/env node
/**
 * Stage built web + API + compiled migrations into apps/desktop/resources
 * for electron-builder extraResources.
 *
 * Usage:
 *   node apps/desktop/scripts/stage-release.mjs
 *   node apps/desktop/scripts/stage-release.mjs --check   # verify prerequisites only
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const resourcesRoot = path.join(desktopRoot, "resources");
const checkOnly = process.argv.includes("--check");

const require = createRequire(import.meta.url);

function mustExist(filePath, label) {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => {
      throw new Error(`Missing ${label}: ${filePath}`);
    });
}

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const webDist = path.join(repoRoot, "apps/web/dist");
  const apiDist = path.join(repoRoot, "apps/api/dist");
  const migrationsSrc = path.join(repoRoot, "database/migrations");
  const desktopDist = path.join(desktopRoot, "dist/main.js");

  await mustExist(webDist, "web build (apps/web/dist)");
  await mustExist(path.join(webDist, "index.html"), "web index.html");
  await mustExist(apiDist, "api build (apps/api/dist)");
  await mustExist(path.join(apiDist, "index.js"), "api index.js");
  await mustExist(migrationsSrc, "database/migrations");
  await mustExist(desktopDist, "desktop build (apps/desktop/dist/main.js)");

  if (checkOnly) {
    console.log("stage-release check ok");
    return;
  }

  let esbuild;
  try {
    esbuild = require("esbuild");
  } catch {
    throw new Error("esbuild is required — install @graphscope/desktop deps (electron-builder / esbuild)");
  }

  await rmrf(resourcesRoot);
  await fs.mkdir(resourcesRoot, { recursive: true });

  const webOut = path.join(resourcesRoot, "web");
  const apiOut = path.join(resourcesRoot, "api");
  const migrationsOut = path.join(resourcesRoot, "database/migrations");

  console.log("Copying web dist…");
  await copyDir(webDist, webOut);

  console.log("Bundling API…");
  await fs.mkdir(apiOut, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(apiDist, "index.js")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile: path.join(apiOut, "index.js"),
    packages: "bundle",
    external: [
      "keytar",
      "fsevents",
      // knex optional dialect drivers — we only use pg
      "better-sqlite3",
      "sqlite3",
      "mysql",
      "mysql2",
      "mariadb",
      "mariadb/callback",
      "tedious",
      "oracledb",
      "pg-query-stream",
      "pg-native",
    ],
  });
  // Ship keytar next to the bundle so native bindings resolve.
  const keytarSrc = path.dirname(require.resolve("keytar/package.json"));
  await copyDir(keytarSrc, path.join(apiOut, "node_modules/keytar"));

  console.log("Compiling migrations to JS…");
  await fs.mkdir(migrationsOut, { recursive: true });
  const migrationFiles = (await fs.readdir(migrationsSrc)).filter((name) => name.endsWith(".ts"));
  for (const file of migrationFiles) {
    const infile = path.join(migrationsSrc, file);
    const outfile = path.join(migrationsOut, file.replace(/\.ts$/, ".js"));
    await esbuild.build({
      entryPoints: [infile],
      bundle: false,
      platform: "node",
      format: "esm",
      target: "node20",
      outfile,
    });
  }

  // Marker for packaged path resolution
  await fs.writeFile(
    path.join(resourcesRoot, "packaged.json"),
    `${JSON.stringify({ stagedAt: new Date().toISOString() }, null, 2)}\n`,
  );

  console.log(`Staged resources → ${resourcesRoot}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
