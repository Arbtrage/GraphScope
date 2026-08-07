import keytar from "keytar";

const SERVICE = "GraphScope";

export function secretKey(environmentId: string, name: string): string {
  return `env/${environmentId}/${name}`;
}

export async function getSecret(environmentId: string, name: string): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE, secretKey(environmentId, name));
  } catch {
    const envKey = `GRAPHSCOPE_SECRET_${environmentId}_${name}`.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
    return process.env[envKey] ?? null;
  }
}

export async function setSecret(environmentId: string, name: string, value: string): Promise<void> {
  await keytar.setPassword(SERVICE, secretKey(environmentId, name), value);
}

export async function deleteSecret(environmentId: string, name: string): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE, secretKey(environmentId, name));
  } catch {
    // ignore in test env
  }
}

const OPENAI_SERVICE = "openai";
const OPENAI_ACCOUNT = "api_key";

export async function getOpenAiKey(): Promise<string | null> {
  try {
    return await keytar.getPassword(OPENAI_SERVICE, OPENAI_ACCOUNT);
  } catch {
    return process.env.OPENAI_API_KEY ?? process.env.GRAPHSCOPE_OPENAI_API_KEY ?? null;
  }
}

export async function setOpenAiKey(value: string): Promise<void> {
  await keytar.setPassword(OPENAI_SERVICE, OPENAI_ACCOUNT, value);
}

export async function deleteOpenAiKey(): Promise<void> {
  try {
    await keytar.deletePassword(OPENAI_SERVICE, OPENAI_ACCOUNT);
  } catch {
    // ignore in test env
  }
}

export async function hasOpenAiKey(): Promise<boolean> {
  const key = await getOpenAiKey();
  return !!key?.trim();
}
