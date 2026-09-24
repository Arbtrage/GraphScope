#!/usr/bin/env node
/**
 * Build an unsigned macOS DMG:
 * 1. stage web/api/migrations into resources/
 * 2. pnpm deploy a self-contained pack (deps stay inside the pack tree)
 * 3. electron-builder --mac against the pack
 */
import { createRequire } from "node:module";
import { spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const packRoot = path.join(desktopRoot, ".release-pack");
const require = createRequire(path.join(desktopRoot, "package.json"));

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? desktopRoot,
    env: { ...process.env, ...(opts.env ?? {}) },
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  console.log("Staging resources…");
  run(process.execPath, [path.join(__dirname, "stage-release.mjs")]);

  console.log("Creating deploy pack…");
  await fs.rm(packRoot, { recursive: true, force: true });
  run("pnpm", ["--filter", "@graphscope/desktop", "deploy", "--prod", packRoot], { cwd: repoRoot });

  await copyDir(path.join(desktopRoot, "dist"), path.join(packRoot, "dist"));
  await copyDir(path.join(desktopRoot, "resources"), path.join(packRoot, "resources"));
  await copyDir(path.join(desktopRoot, "build"), path.join(packRoot, "build"));
  await fs.copyFile(
    path.join(desktopRoot, "electron-builder.yml"),
    path.join(packRoot, "electron-builder.yml"),
  );
  await fs.copyFile(path.join(desktopRoot, "package.json"), path.join(packRoot, "package.json"));

  const electronBuilderCli = require.resolve("electron-builder/cli.js");
  console.log("Running electron-builder…");
  run(process.execPath, [electronBuilderCli, "--mac", "--config", "electron-builder.yml"], {
    cwd: packRoot,
    env: { CSC_IDENTITY_AUTO_DISCOVERY: "false" },
  });

  const packRelease = path.join(packRoot, "dist/release");
  const outRelease = path.join(desktopRoot, "dist/release");
  await fs.mkdir(outRelease, { recursive: true });
  await fs.cp(packRelease, outRelease, { recursive: true });

  const artifacts = (await fs.readdir(outRelease)).filter((name) => name.endsWith(".dmg") || name.endsWith(".zip"));
  if (artifacts.length === 0) {
    throw new Error("electron-builder finished but no .dmg/.zip artifacts were produced");
  }

  // Sanity: @embedded-postgres natives must be unpacked (chmod fails inside asar).
  const archSuffix = process.arch === "arm64" ? "-arm64" : process.arch === "x64" ? "" : `-${process.arch}`;
  const appRoot = path.join(packRelease, `mac${archSuffix}`, "GraphScope.app");
  let postgresBin = "";
  try {
    postgresBin =
      execFileSync(
        "find",
        [path.join(appRoot, "Contents/Resources"), "-path", "*app.asar.unpacked*native/bin/postgres", "-type", "f"],
        { encoding: "utf8" },
      )
        .trim()
        .split("\n")
        .filter(Boolean)[0] ?? "";
  } catch {
    // ignore
  }
  if (!postgresBin || !fsSync.existsSync(postgresBin)) {
    throw new Error(
      `Packaged postgres binary missing under app.asar.unpacked (found: ${postgresBin || "none"}). asarUnpack may have failed.`,
    );
  }
  try {
    fsSync.chmodSync(postgresBin, 0o755);
  } catch (err) {
    throw new Error(`chmod failed on packaged postgres at ${postgresBin}: ${err instanceof Error ? err.message : err}`);
  }
  console.log(`OK: postgres binary unpacked + chmod → ${postgresBin}`);

  console.log(`Artifacts → ${outRelease}`);
  for (const name of artifacts) console.log(`  - ${name}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
