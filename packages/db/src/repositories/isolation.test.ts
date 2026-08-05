import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createKnex, createRepositories, runMigrations } from "../index.js";
import type { Knex } from "knex";

function testDbConfig() {
  const profile = (process.env.GRAPHSCOPE_DB_PROFILE ?? "development") as "development" | "test";
  return {
    profile,
    host: process.env.GRAPHSCOPE_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.GRAPHSCOPE_DB_PORT ?? 5432),
    database: process.env.GRAPHSCOPE_DB_NAME ?? (profile === "test" ? "graphscope_test" : "graphscope"),
    user: process.env.GRAPHSCOPE_DB_USER ?? "graphscope",
    password: process.env.GRAPHSCOPE_DB_PASSWORD ?? "graphscope",
  };
}

describe("workspace isolation", () => {
  let db: Knex;
  let repos: ReturnType<typeof createRepositories>;

  beforeAll(async () => {
    db = createKnex(testDbConfig());
    await runMigrations(db);
    repos = createRepositories(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("prevents user A from accessing user B workspace", async () => {
    const suffix = Date.now();
    const userA = await repos.users.upsertFromGithub(`user-a-${suffix}`, "User A");
    const userB = await repos.users.upsertFromGithub(`user-b-${suffix}`, "User B");

    const wsA = await repos.workspaces.create({ name: "Team A", slug: `team-a-${suffix}` }, userA.id);
    const wsB = await repos.workspaces.create({ name: "Team B", slug: `team-b-${suffix}` }, userB.id);

    const crossAccess = await repos.workspaces.findByIdForUser(wsB.id, userA.id);
    expect(crossAccess).toBeNull();

    const ownAccess = await repos.workspaces.findByIdForUser(wsA.id, userA.id);
    expect(ownAccess?.id).toBe(wsA.id);

    const hasAccessB = await repos.workspaces.userHasAccess(wsB.id, userA.id);
    expect(hasAccessB).toBe(false);
  });

  it("lists only workspaces for the authenticated user", async () => {
    const suffix = Date.now();
    const user = await repos.users.upsertFromGithub(`list-user-${suffix}`, "List User");
    await repos.workspaces.create({ name: "List User WS", slug: `list-user-ws-${suffix}` }, user.id);
    const list = await repos.workspaces.listForUser(user.id);
    expect(list.some((w: { slug: string }) => w.slug === `list-user-ws-${suffix}`)).toBe(true);
    expect(list.every((w: { slug: string }) => w.slug === `list-user-ws-${suffix}`)).toBe(true);
  });
});
