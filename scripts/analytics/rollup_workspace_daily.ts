#!/usr/bin/env tsx
import { createKnex, createRepositories } from "@graphscope/db";

const profile = process.env.GRAPHSCOPE_DB_PROFILE ?? "development";

async function main() {
  const workspaceId = process.argv[2];
  const day = process.argv[3];
  const db = createKnex({ profile: profile as "embedded" | "development" | "test" });
  const repos = createRepositories(db);

  if (workspaceId) {
    await repos.analytics.rollupWorkspaceDaily(workspaceId, day);
    console.log(`Rolled up workspace ${workspaceId}${day ? ` for ${day}` : ""}.`);
  } else {
    const count = await repos.analytics.rollupAllWorkspaces(day);
    console.log(`Rolled up ${count} workspaces${day ? ` for ${day}` : ""}.`);
  }

  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
