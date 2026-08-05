#!/usr/bin/env tsx
import { createKnex, runMigrations } from "@graphscope/db";

const profile = process.env.GRAPHSCOPE_DB_PROFILE ?? "development";

async function main() {
  console.log(`Running migrations (profile: ${profile})...`);
  const db = createKnex({ profile: profile as "embedded" | "development" | "test" });
  await runMigrations(db);
  console.log("Migrations complete.");
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
