import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

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
  if (BLOCKED_HOSTS.has(host)) {
    throw new Error("Blocked host");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private IP addresses are blocked");
    return parsed;
  }
  const records = await dns.lookup(host, { all: true });
  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error("URL resolves to private IP");
    }
  }
  return parsed;
}
