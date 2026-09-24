import { buildSchema, introspectionFromSchema } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./execute-operation.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./execute-operation.js")>();
  return {
    ...actual,
    executeOperation: vi.fn(),
  };
});

import { executeOperation } from "./execute-operation.js";
import { introspectEnvironmentSchema } from "./schema-introspect.js";

const executeOperationMock = vi.mocked(executeOperation);

describe("introspectEnvironmentSchema", () => {
  const saveIntrospectedSdl = vi.fn().mockResolvedValue(undefined);
  const repos = {
    environments: { saveIntrospectedSdl },
  } as never;

  beforeEach(() => {
    executeOperationMock.mockReset();
    saveIntrospectedSdl.mockClear();
  });

  it("succeeds when __schema is present despite GraphQL errors", async () => {
    const schema = buildSchema("type Query { hello: String }");
    const introspection = introspectionFromSchema(schema);
    executeOperationMock.mockResolvedValue({
      status: "GRAPHQL_ERROR",
      responseBody: JSON.stringify({
        data: introspection,
        errors: [{ message: "Some field warning" }],
      }),
      responsePreview: "GRAPHQL_ERROR",
    } as never);

    const result = await introspectEnvironmentSchema(repos, "ws-1", "env-1");
    expect(result.ok).toBe(true);
    expect(result.typeCount).toBeGreaterThan(0);
    expect(saveIntrospectedSdl).toHaveBeenCalledWith("env-1", "ws-1", expect.any(String));
  });

  it("fails clearly when __schema is missing", async () => {
    executeOperationMock.mockResolvedValue({
      status: "GRAPHQL_ERROR",
      responseBody: JSON.stringify({ errors: [{ message: "unauthorized" }] }),
      responsePreview: "unauthorized",
    } as never);

    const result = await introspectEnvironmentSchema(repos, "ws-1", "env-1");
    expect(result.ok).toBe(false);
    expect(result.title).toBe("GraphQL error");
    expect(saveIntrospectedSdl).not.toHaveBeenCalled();
  });
});
