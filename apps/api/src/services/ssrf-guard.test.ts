import { afterEach, describe, expect, it } from "vitest";
import { allowPrivateUrls, assertSafeUrl } from "./ssrf-guard.js";

describe("ssrf-guard", () => {
  const prevProfile = process.env.GRAPHSCOPE_DB_PROFILE;
  const prevAllow = process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS;

  afterEach(() => {
    if (prevProfile === undefined) delete process.env.GRAPHSCOPE_DB_PROFILE;
    else process.env.GRAPHSCOPE_DB_PROFILE = prevProfile;
    if (prevAllow === undefined) delete process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS;
    else process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS = prevAllow;
  });

  it("allows public https URLs", async () => {
    process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS = "0";
    process.env.GRAPHSCOPE_DB_PROFILE = "test";
    const url = await assertSafeUrl("https://8.8.8.8/graphql");
    expect(url.hostname).toBe("8.8.8.8");
  });

  it("blocks localhost when private URLs disallowed", async () => {
    process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS = "0";
    process.env.GRAPHSCOPE_DB_PROFILE = "test";
    await expect(assertSafeUrl("http://localhost/graphql")).rejects.toThrow();
  });

  it("allows localhost and private IPs in embedded/dev", async () => {
    process.env.GRAPHSCOPE_DB_PROFILE = "embedded";
    delete process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS;
    expect(allowPrivateUrls()).toBe(true);
    await expect(assertSafeUrl("http://127.0.0.1:4000/graphql")).resolves.toBeTruthy();
    await expect(assertSafeUrl("http://localhost:4000/graphql")).resolves.toBeTruthy();
    await expect(assertSafeUrl("http://192.168.1.1/graphql")).resolves.toBeTruthy();
  });

  it("blocks metadata IP even when private allowed", async () => {
    process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS = "1";
    await expect(assertSafeUrl("http://169.254.169.254/latest")).rejects.toThrow(/Blocked/);
  });

  it("blocks file scheme", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow();
  });
});
