import net from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { allocatePort, LOOPBACK_HOST, probePort } from "./ports.js";

const servers: net.Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

async function occupy(port: number): Promise<net.Server> {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, LOOPBACK_HOST, () => resolve());
  });
  servers.push(server);
  return server;
}

describe("allocatePort", () => {
  it("returns preferred when free", async () => {
    const preferred = 47111;
    expect(await probePort(preferred)).toBe(true);
    await expect(allocatePort(preferred, LOOPBACK_HOST, 5)).resolves.toBe(preferred);
  });

  it("falls back to next free port when preferred is taken", async () => {
    const preferred = 47121;
    await occupy(preferred);
    const allocated = await allocatePort(preferred, LOOPBACK_HOST, 5);
    expect(allocated).toBeGreaterThan(preferred);
    expect(allocated).toBeLessThanOrEqual(preferred + 5);
    expect(await probePort(allocated)).toBe(true);
  });
});
