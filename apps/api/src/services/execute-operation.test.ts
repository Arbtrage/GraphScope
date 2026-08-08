import { describe, expect, it } from "vitest";
import { mergeExecuteHeaders, resolveExecuteQueryContent, substituteSecrets } from "./execute-operation.js";

describe("substituteSecrets", () => {
  it("replaces {{name}} placeholders", () => {
    expect(substituteSecrets("Bearer {{API_TOKEN}}", { API_TOKEN: "abc" })).toBe("Bearer abc");
  });
});

describe("mergeExecuteHeaders", () => {
  it("starts with Content-Type and env headers", () => {
    const headers = mergeExecuteHeaders({
      envHeaders: { Authorization: "Bearer env" },
      requestHeaders: null,
      secrets: {},
    });
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Authorization).toBe("Bearer env");
  });

  it("lets request overrides win on collision", () => {
    const headers = mergeExecuteHeaders({
      envHeaders: { Authorization: "Bearer env", "X-Env": "1" },
      requestHeaders: { Authorization: "Bearer override" },
      secrets: {},
    });
    expect(headers.Authorization).toBe("Bearer override");
    expect(headers["X-Env"]).toBe("1");
  });

  it("substitutes secrets in env and override values", () => {
    const headers = mergeExecuteHeaders({
      envHeaders: { Authorization: "Bearer {{TOKEN}}" },
      requestHeaders: { "X-Custom": "{{TOKEN}}" },
      secrets: { TOKEN: "secret" },
    });
    expect(headers.Authorization).toBe("Bearer secret");
    expect(headers["X-Custom"]).toBe("secret");
  });

  it("drops forbidden hop-by-hop headers from overrides", () => {
    const headers = mergeExecuteHeaders({
      envHeaders: {},
      requestHeaders: { Host: "evil.example", Authorization: "Bearer ok" },
      secrets: {},
    });
    expect(headers.Host).toBeUndefined();
    expect(headers.Authorization).toBe("Bearer ok");
  });
});

describe("resolveExecuteQueryContent", () => {
  it("prefers non-empty adhoc over operation content", () => {
    expect(
      resolveExecuteQueryContent({
        adhocQuery: "query { draft }",
        operationContent: "query { stored }",
      }),
    ).toBe("query { draft }");
  });

  it("falls back to operation when adhoc empty", () => {
    expect(
      resolveExecuteQueryContent({
        adhocQuery: "   ",
        operationContent: "query { stored }",
      }),
    ).toBe("query { stored }");
  });
});
