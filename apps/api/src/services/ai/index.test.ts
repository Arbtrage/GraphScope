import { describe, expect, it } from "vitest";
import { MockAiProvider } from "./provider.js";
import { explainOperation } from "./explain.js";
import { generateOperation } from "./generate.js";
import {
  parseCitations,
  redactSecrets,
  sanitizeGeneratedOperation,
  subsetSchemaSdl,
  validateOperationAgainstSchema,
} from "./schema-utils.js";
import type { Repositories } from "@graphscope/db";

const SAMPLE_SDL = `
type Query {
  users: [User!]!
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  email: String
}
`;

const SAMPLE_OP = `query GetUsers {
  users {
    id
    name
  }
}`;

function mockRepos(overrides: Partial<Repositories> = {}): Repositories {
  const baseSettings = {
    id: "1",
    workspaceId: "ws1",
    redactionMode: "STANDARD" as const,
    enabled: true,
    monthlyTokenBudget: 100_000,
    tokensUsed: 0,
    hasOpenAiKey: false,
  };

  const ai = {
    getOrCreateSettings: async () => baseSettings,
    updateSettings: async () => baseSettings,
    addTokensUsed: async () => {},
    recordInvocation: async () => ({
      id: "inv1",
      workspaceId: "ws1",
      userId: "u1",
      kind: "EXPLAIN" as const,
      redactionMode: "STANDARD" as const,
      schemaVersionId: null,
      operationId: null,
      promptTokens: 42,
      completionTokens: 18,
      totalTokens: 60,
      status: "SUCCESS" as const,
      errorMessage: null,
      metadata: {},
      createdAt: new Date().toISOString(),
    }),
    listInvocations: async () => [],
  };

  const schemas = {
    findVersionById: async () => ({ id: "sv1", schemaId: "s1", workspaceId: "ws1", contentHash: "h", sdl: "", gitSha: null, createdAt: "", sdlPath: "/tmp/schema.graphql" }),
    listForProject: async () => [{ id: "s1", workspaceId: "ws1", projectId: "p1", name: "main" }],
    listVersions: async () => [{ id: "sv1", schemaId: "s1", workspaceId: "ws1", contentHash: "h", sdl: "", gitSha: null, createdAt: "" }],
  };

  const operations = {
    findById: async () => ({
      id: "op1",
      projectId: "p1",
      workspaceId: "ws1",
      name: "GetUsers",
      operationType: "QUERY" as const,
      contentHash: "abc",
      content: SAMPLE_OP,
      confidence: 1,
      isManual: false,
      locations: [],
    }),
  };

  return {
    ai,
    schemas,
    operations,
    ...overrides,
  } as unknown as Repositories;
}

describe("ai schema-utils", () => {
  it("redacts secret-like patterns", () => {
    const text = "authorization: Bearer sk-secret-token";
    expect(redactSecrets(text)).toContain("[REDACTED]");
  });

  it("subsets schema in strict mode", () => {
    const subset = subsetSchemaSdl(SAMPLE_SDL, SAMPLE_OP, "STRICT");
    expect(subset).toContain("Query");
    expect(subset).toContain("User");
    expect(subset.length).toBeLessThanOrEqual(2000);
  });

  it("parses citations from markdown", () => {
    const cites = parseCitations("Uses `Query.users` and `User.name` fields.");
    expect(cites).toEqual(
      expect.arrayContaining([
        { typeName: "Query", fieldName: "users" },
        { typeName: "User", fieldName: "name" },
      ]),
    );
  });

  it("validates operation against schema", () => {
    const result = validateOperationAgainstSchema(SAMPLE_OP, SAMPLE_SDL);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid fields", () => {
    const bad = "query { users { id unknownField } }";
    const result = validateOperationAgainstSchema(bad, SAMPLE_SDL);
    expect(result.valid).toBe(false);
  });

  it("extracts fenced graphql blocks", () => {
    const raw = "Here:\n```graphql\nquery { users { id } }\n```";
    expect(sanitizeGeneratedOperation(raw)).toBe("query { users { id } }");
  });
});

describe("MockAiProvider", () => {
  it("returns deterministic explain content", async () => {
    const provider = new MockAiProvider();
    const result = await provider.complete({ system: "sys", user: "explain this operation" });
    expect(result.content).toContain("Explanation");
    expect(result.usage.promptTokens).toBeGreaterThan(0);
  });

  it("returns query document for generate prompts", async () => {
    const provider = new MockAiProvider();
    const result = await provider.complete({ system: "sys", user: "generate a query" });
    expect(result.content).toContain("query");
  });
});

describe("explainOperation", () => {
  it("returns markdown and citations with mock provider", async () => {
    const repos = mockRepos();
    const result = await explainOperation(repos, {
      workspaceId: "ws1",
      userId: "u1",
      operationContent: SAMPLE_OP,
      projectId: "p1",
      provider: new MockAiProvider(),
    });
    expect(result.markdown).toBeTruthy();
    expect(result.citations.length).toBeGreaterThan(0);
  });
});

describe("generateOperation", () => {
  it("validates mock output against schema", async () => {
    const sdlPath = "/tmp/schema.graphql";
    const repos = mockRepos({
      schemas: {
        findVersionById: async () => ({
          id: "sv1",
          schemaId: "s1",
          workspaceId: "ws1",
          contentHash: "h",
          sdl: SAMPLE_SDL,
          gitSha: null,
          createdAt: "",
          sdlPath,
        }),
        listVersions: async () => [],
        listForProject: async () => [],
      } as unknown as Repositories["schemas"],
    });

    const fs = await import("node:fs/promises");
    await fs.writeFile(sdlPath, SAMPLE_SDL, "utf-8");

    const mockProvider = {
      complete: async () => ({
        content: SAMPLE_OP,
        usage: { promptTokens: 10, completionTokens: 20 },
      }),
    };

    const result = await generateOperation(repos, {
      workspaceId: "ws1",
      userId: "u1",
      prompt: "list users",
      schemaVersionId: "sv1",
      provider: mockProvider,
    });

    expect(result.document).toContain("users");
    expect(validateOperationAgainstSchema(result.document, SAMPLE_SDL).valid).toBe(true);
  });
});
