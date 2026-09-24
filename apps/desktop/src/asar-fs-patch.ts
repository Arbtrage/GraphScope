import { createRequire } from "node:module";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const ASAR_SEG = `${path.sep}app.asar${path.sep}`;
const UNPACKED_SEG = `${path.sep}app.asar.unpacked${path.sep}`;

/** Rewrite app.asar → app.asar.unpacked for native binary paths. */
export function asarToUnpacked(filePath: string): string {
  if (!filePath.includes(ASAR_SEG)) return filePath;
  return filePath.replace(ASAR_SEG, UNPACKED_SEG);
}

function patchFn(target: object, key: string, original: (...args: any[]) => unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value: (...args: any[]) => {
      if (typeof args[0] === "string") args[0] = asarToUnpacked(args[0]);
      return original(...args);
    },
  });
}

/**
 * @embedded-postgres builds absolute paths via import.meta.url. Those still point
 * at app.asar even when asarUnpack put the files in app.asar.unpacked, and
 * fs.chmod then fails with ENOTDIR. Rewrite those paths before chmod/spawn.
 */
export function patchAsarFsForNatives(): void {
  const g = globalThis as { __graphscopeAsarPatched?: boolean };
  if (g.__graphscopeAsarPatched) return;
  g.__graphscopeAsarPatched = true;

  patchFn(fs, "chmodSync", fs.chmodSync.bind(fs));
  patchFn(fs, "accessSync", fs.accessSync.bind(fs));
  patchFn(fs, "statSync", fs.statSync.bind(fs));
  patchFn(fs, "lstatSync", fs.lstatSync.bind(fs));
  patchFn(fs, "existsSync", fs.existsSync.bind(fs));
  patchFn(fs, "openSync", fs.openSync.bind(fs));
  patchFn(fs, "readFileSync", fs.readFileSync.bind(fs));
  patchFn(fs, "realpathSync", fs.realpathSync.bind(fs));

  patchFn(fsp, "chmod", fsp.chmod.bind(fsp));
  patchFn(fsp, "access", fsp.access.bind(fsp));
  patchFn(fsp, "stat", fsp.stat.bind(fsp));
  patchFn(fsp, "lstat", fsp.lstat.bind(fsp));
  patchFn(fsp, "open", fsp.open.bind(fsp));
  patchFn(fsp, "readFile", fsp.readFile.bind(fsp));
  patchFn(fsp, "realpath", fsp.realpath.bind(fsp));

  const childProcess = require("node:child_process") as typeof import("node:child_process");
  const originalSpawn = childProcess.spawn.bind(childProcess);
  const originalExecFile = childProcess.execFile.bind(childProcess);
  Object.defineProperty(childProcess, "spawn", {
    configurable: true,
    writable: true,
    value: ((command: any, ...rest: any[]) => {
      if (typeof command === "string") command = asarToUnpacked(command);
      return (originalSpawn as any)(command, ...rest);
    }) as typeof childProcess.spawn,
  });
  Object.defineProperty(childProcess, "execFile", {
    configurable: true,
    writable: true,
    value: ((file: any, ...rest: any[]) => {
      if (typeof file === "string") file = asarToUnpacked(file);
      return (originalExecFile as any)(file, ...rest);
    }) as typeof childProcess.execFile,
  });
}
