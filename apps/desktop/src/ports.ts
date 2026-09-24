import net from "node:net";

export const PREFERRED_PORTS = {
  api: 47321,
  pg: 55432,
  web: 5173,
} as const;

export const LOOPBACK_HOST = "127.0.0.1";

/** Returns true if `port` can be bound on `host`. */
export function probePort(port: number, host = LOOPBACK_HOST): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });
}

/**
 * Prefer `preferred` when free; otherwise scan preferred+1 … preferred+scanRange.
 * Throws if no free port is found.
 */
export async function allocatePort(
  preferred: number,
  host = LOOPBACK_HOST,
  scanRange = 50,
): Promise<number> {
  if (await probePort(preferred, host)) return preferred;
  for (let offset = 1; offset <= scanRange; offset += 1) {
    const candidate = preferred + offset;
    if (await probePort(candidate, host)) return candidate;
  }
  throw new Error(`No free port near ${preferred} on ${host}`);
}

export async function allocateServicePorts(options?: {
  api?: number;
  pg?: number;
  web?: number;
  host?: string;
}): Promise<{ apiPort: number; pgPort: number; webPort: number }> {
  const host = options?.host ?? LOOPBACK_HOST;
  const [apiPort, pgPort, webPort] = await Promise.all([
    allocatePort(options?.api ?? PREFERRED_PORTS.api, host),
    allocatePort(options?.pg ?? PREFERRED_PORTS.pg, host),
    allocatePort(options?.web ?? PREFERRED_PORTS.web, host),
  ]);
  return { apiPort, pgPort, webPort };
}
