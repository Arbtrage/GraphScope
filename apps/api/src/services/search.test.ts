import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createKnex, createRepositories, runMigrations } from "@graphscope/db";
import type { Knex } from "knex";
import { buildSearchDocuments } from "../jobs/tasks/search-reindex.js";

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

describe("search", () => {
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

  it("returns empty for blank query", async () => {
    const [ws] = await db("core_workspace").insert({ name: "Search WS", slug: `search-ws-${Date.now()}` }).returning("*");
    const workspaceId = String(ws.workspace_id);
    const results = await repos.search.search(workspaceId, "   ");
    expect(results).toEqual([]);
  });

  it("indexes and finds project by name", async () => {
    const suffix = Date.now();
    const [ws] = await db("core_workspace").insert({ name: "Search WS2", slug: `search-ws2-${suffix}` }).returning("*");
    const workspaceId = String(ws.workspace_id);
    await repos.projects.create(workspaceId, { name: "Acme GraphQL", slug: `acme-${suffix}` });
    const docs = await buildSearchDocuments(repos, workspaceId);
    for (const doc of docs) {
      await repos.search.upsertDocument(workspaceId, doc);
    }
    const hits = await repos.search.search(workspaceId, "Acme", ["PROJECT"]);
    expect(hits.some((h) => h.title === "Acme GraphQL")).toBe(true);
  });

  it("does not return hits from another workspace", async () => {
    const suffix = Date.now();
    const [wsA] = await db("core_workspace").insert({ name: "WS A", slug: `ws-a-${suffix}` }).returning("*");
    const [wsB] = await db("core_workspace").insert({ name: "WS B", slug: `ws-b-${suffix}` }).returning("*");
    const workspaceA = String(wsA.workspace_id);
    const workspaceB = String(wsB.workspace_id);
    await repos.projects.create(workspaceA, { name: "Secret Project Alpha", slug: `alpha-${suffix}` });
    const docs = await buildSearchDocuments(repos, workspaceA);
    for (const doc of docs) {
      await repos.search.upsertDocument(workspaceA, doc);
    }
    const hitsInB = await repos.search.search(workspaceB, "Secret Project Alpha");
    expect(hitsInB).toEqual([]);
  });
});
