import { describe, expect, it } from "vitest";
import { compareSchemas, validateSdl } from "./schema-check.js";

describe("schema-check", () => {
  it("validates valid SDL", () => {
    expect(() => validateSdl("type Query { hello: String }")).not.toThrow();
  });

  it("detects breaking field removal", async () => {
    const oldSdl = "type Query { hello: String user: String }";
    const newSdl = "type Query { hello: String }";
    const result = await compareSchemas(oldSdl, newSdl);
    expect(result.result).toBe("BREAKING");
    expect(result.breakingCount).toBeGreaterThan(0);
  });

  it("passes safe additive change", async () => {
    const oldSdl = "type Query { hello: String }";
    const newSdl = "type Query { hello: String world: String }";
    const result = await compareSchemas(oldSdl, newSdl);
    expect(result.result).toBe("SAFE");
  });
});
