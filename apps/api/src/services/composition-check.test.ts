import { describe, expect, it } from "vitest";
import { mergeSdls, validateComposition } from "./composition-check.js";

describe("composition-check", () => {
  it("merges compatible subgraph SDLs", () => {
    const a = "type Query { users: [User!]! } type User { id: ID! name: String! }";
    const b = "extend type Query { posts: [Post!]! } type Post { id: ID! title: String! }";
    const result = validateComposition([a, b]);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports duplicate type conflicts", () => {
    const a = "type Query { hello: String! }";
    const b = "type Query { world: String! }";
    const result = validateComposition([a, b]);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports invalid SDL", () => {
    const result = validateComposition(["type Query {"]);
    expect(result.ok).toBe(false);
  });

  it("mergeSdls joins non-empty documents", () => {
    expect(mergeSdls(["type Query { a: String }", "", "type User { id: ID! }"])).toContain("type User");
  });
});
