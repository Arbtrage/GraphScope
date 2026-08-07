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
    process.env.GRAPHSCOPE_WORKER = "false";
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
  });

  it("signs in locally without GitHub", async () => {
    const res = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { signInLocal(input: { displayName: "Local Tester" }) { sessionToken user { id name } activeWorkspace { id } } }`,
      }),
    });
    const json = await res.json();
    expect(json.errors).toBeUndefined();
    expect(json.data.signInLocal.sessionToken).toBeTruthy();
    expect(json.data.signInLocal.activeWorkspace).toBeTruthy();
  });

  it("creates project and publishes schema when authenticated", async () => {
    const signIn = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { signInLocal(input: { displayName: "Project User" }) { sessionToken } }`,
      }),
    });
    const { data: auth } = await signIn.json();
    const token = auth.signInLocal.sessionToken;

    const projectRes = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `mutation { createProject(input: { name: "Demo", slug: "demo-${Date.now()}" }) { id } }`,
      }),
    });
    const projectJson = await projectRes.json();
    expect(projectJson.errors).toBeUndefined();
    const projectId = projectJson.data.createProject.id;

    const publishRes = await fetch("http://127.0.0.1:47399/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `mutation($input: PublishSchemaInput!) { publishSchema(input: $input) { id contentHash } }`,
        variables: {
          input: {
            projectId,
            name: "default",
            sdl: "type Query { hello: String }",
          },
        },
      }),
    });
    const publishJson = await publishRes.json();
    expect(publishJson.errors).toBeUndefined();
    expect(publishJson.data.publishSchema.contentHash).toBeTruthy();
  });
});
