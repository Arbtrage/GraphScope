#!/usr/bin/env tsx
import { createKnex, runMigrations } from "@graphscope/db";
import { resetDemo } from "../database/seeds/dev_seed.js";

const profile = process.env.GRAPHSCOPE_DB_PROFILE ?? "development";

async function main() {
  console.log(`Resetting demo data (profile: ${profile})...`);
  const db = createKnex({ profile: profile as "embedded" | "development" | "test" });
  await runMigrations(db);
  await resetDemo(db);
  console.log("Demo reset complete.");
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
