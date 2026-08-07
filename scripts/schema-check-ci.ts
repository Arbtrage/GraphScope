#!/usr/bin/env tsx
/**
 * Emit GitHub Actions annotations for schema breaking changes.
 * Usage: pnpm schema:check:ci -- old.graphql new.graphql
 */
import fs from "node:fs/promises";
import { compareSchemas } from "../apps/api/src/services/schema-check.js";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  if (args.length < 2) {
    console.error("Usage: pnpm schema:check:ci -- <old.graphql> <new.graphql>");
    process.exit(2);
  }
  const [oldPath, newPath] = args;
  const oldSdl = await fs.readFile(oldPath!, "utf-8");
  const newSdl = await fs.readFile(newPath!, "utf-8");
  const result = await compareSchemas(oldSdl, newSdl);

  if (result.result === "SAFE") {
    console.log("::notice title=Schema check::No breaking changes detected");
    process.exit(0);
  }

  console.log(`::error file=${newPath},title=Schema check (${result.result})::breaking=${result.breakingCount} dangerous=${result.dangerousCount}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
