import dns from "node:dns/promises";
import net from "node:net";

/** Always blocked — cloud metadata / SSRF classics. */
const ALWAYS_BLOCKED_HOSTS = new Set(["metadata.google.internal"]);

function isLinkLocalMetadata(ip: string): boolean {
  return ip === "169.254.169.254" || ip.startsWith("fe80:");
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

/** Local-first desktop/dev may call loopback and RFC1918 GraphQL endpoints. */
export function allowPrivateUrls(): boolean {
  if (process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS === "1") return true;
  if (process.env.GRAPHSCOPE_ALLOW_PRIVATE_URLS === "0") return false;
  const profile = process.env.GRAPHSCOPE_DB_PROFILE ?? "development";
  return profile === "embedded" || profile === "development";
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }
  const host = parsed.hostname.toLowerCase();
  if (ALWAYS_BLOCKED_HOSTS.has(host)) {
    throw new Error("Blocked host");
  }

  const allowPrivate = allowPrivateUrls();

  if (net.isIP(host)) {
    if (isLinkLocalMetadata(host)) throw new Error("Blocked host");
    if (!allowPrivate && isPrivateIp(host)) throw new Error("Private IP addresses are blocked");
    return parsed;
  }

  if (!allowPrivate && (host === "localhost" || host.endsWith(".localhost"))) {
    throw new Error("Blocked host");
  }

  const records = await dns.lookup(host, { all: true });
  for (const rec of records) {
    if (isLinkLocalMetadata(rec.address)) {
      throw new Error("Blocked host");
    }
    if (!allowPrivate && isPrivateIp(rec.address)) {
      throw new Error("URL resolves to private IP");
    }
  }
  return parsed;
}
