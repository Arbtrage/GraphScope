import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "./app.js";

function testDbConfig() {
  const profile = (process.env.GRAPHSCOPE_DB_PROFILE ?? "development") as "development" | "test";
  return {
    host: process.env.GRAPHSCOPE_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.GRAPHSCOPE_DB_PORT ?? 5432),
    database: process.env.GRAPHSCOPE_DB_NAME ?? (profile === "test" ? "graphscope_test" : "graphscope"),
    user: process.env.GRAPHSCOPE_DB_USER ?? "graphscope",
    password: process.env.GRAPHSCOPE_DB_PASSWORD ?? "graphscope",
  };
}

describe("API integration", () => {
  let close: () => Promise<void>;

  beforeAll(async () => {
    const result = await createApp({
      skipListen: false,
      port: 47399,
      host: "127.0.0.1",
      dbOverrides: testDbConfig(),
    });
    close = result.close;
  });

  afterAll(async () => {
    await close();
  });

  it("returns health", async () => {
    const res = await fetch("http://127.0.0.1:47399/healthz");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns graphql health query", async () => {
    const res = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ health { ok version } }" }),
    });
    const json = await res.json();
    expect(json.data.health.ok).toBe(true);
  });

  it("signs in locally without GitHub", async () => {
    const res = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { signInLocal(input: { displayName: "Local Tester" }) { sessionToken user { id name githubLogin } } }`,
      }),
    });
    const json = await res.json();
    expect(json.errors).toBeUndefined();
    expect(json.data.signInLocal.sessionToken).toBeTruthy();
    expect(json.data.signInLocal.user.name).toBe("Local Tester");
    expect(json.data.signInLocal.user.githubLogin).toBeNull();
  });

  it("returns workspaces for authenticated session", async () => {
    const { createKnex, createRepositories } = await import("@graphscope/db");
    const db = createKnex({ profile: "development", ...testDbConfig() });
    const repos = createRepositories(db);
    const user = await repos.users.upsertFromGithub("integration-user", "Integration");
    const { token } = await repos.sessions.create(user.id, null);
    const ws = await repos.workspaces.create(
      { name: "Integration WS", slug: `integration-ws-${Date.now()}` },
      user.id,
    );

    const res = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: "{ workspaces { id name slug } }" }),
    });
    const json = await res.json();
    expect(json.errors).toBeUndefined();
    expect(json.data.workspaces.some((w: { id: string }) => w.id === ws.id)).toBe(true);
    await db.destroy();
  });
});
