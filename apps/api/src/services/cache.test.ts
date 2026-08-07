import { describe, expect, it, beforeEach } from "vitest";
import { cacheGet, cacheSet, cacheKey, resetCacheForTests } from "./cache.js";

describe("cache", () => {
  beforeEach(() => {
    resetCacheForTests();
    delete process.env.GRAPHSCOPE_REDIS_URL;
  });

  it("returns null when Redis is not configured", async () => {
    expect(await cacheGet("missing")).toBeNull();
    await cacheSet("missing", "value");
    expect(await cacheGet("missing")).toBeNull();
  });

  it("builds stable cache keys", () => {
    const a = cacheKey("test", ["a", "b"]);
    const b = cacheKey("test", ["a", "b"]);
    expect(a).toBe(b);
    expect(a.startsWith("graphscope:test:")).toBe(true);
  });
});
