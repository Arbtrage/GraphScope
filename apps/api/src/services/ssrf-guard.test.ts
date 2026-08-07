import { describe, expect, it } from "vitest";
import { assertSafeUrl } from "./ssrf-guard.js";

describe("ssrf-guard", () => {
  it("allows public https URLs", async () => {
    const url = await assertSafeUrl("https://example.com/graphql");
    expect(url.hostname).toBe("example.com");
  });

  it("blocks localhost", async () => {
    await expect(assertSafeUrl("http://localhost/graphql")).rejects.toThrow();
  });

  it("blocks private IP literals", async () => {
    await expect(assertSafeUrl("http://192.168.1.1/graphql")).rejects.toThrow();
  });

  it("blocks metadata IP", async () => {
    await expect(assertSafeUrl("http://169.254.169.254/latest")).rejects.toThrow();
  });

  it("blocks file scheme", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow();
  });
});
