import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Redis = require("ioredis") as new (url: string, opts?: { maxRetriesPerRequest?: number; lazyConnect?: boolean }) => {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, ttlSeconds: number): Promise<unknown>;
  ping(): Promise<string>;
  quit(): Promise<string>;
};

type RedisClient = InstanceType<typeof Redis>;

let client: RedisClient | null = null;
let connectAttempted = false;

async function getClient(): Promise<RedisClient | null> {
  const url = process.env.GRAPHSCOPE_REDIS_URL?.trim();
  if (!url) return null;
  if (client) return client;
  if (connectAttempted) return null;
  connectAttempted = true;
  try {
    const redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    await redis.connect();
    client = redis;
    return client;
  } catch {
    client = null;
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getClient();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    // graceful degrade
  }
}

export function cacheKey(prefix: string, parts: string[]): string {
  const hash = createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 32);
  return `graphscope:${prefix}:${hash}`;
}

export async function getCacheStatus(): Promise<{ enabled: boolean; connected: boolean }> {
  const url = process.env.GRAPHSCOPE_REDIS_URL?.trim();
  if (!url) return { enabled: false, connected: false };
  const redis = await getClient();
  if (!redis) return { enabled: true, connected: false };
  try {
    await redis.ping();
    return { enabled: true, connected: true };
  } catch {
    return { enabled: true, connected: false };
  }
}

export async function closeCache(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
  connectAttempted = false;
}

/** @internal test helper */
export function resetCacheForTests(): void {
  client = null;
  connectAttempted = false;
}
