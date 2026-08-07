import { getSecret, setSecret, deleteSecret } from "./secrets.js";

const NOTIFY_ACCOUNT = "webhook_url";

export async function getNotifyWebhookUrl(): Promise<string | null> {
  try {
    const keytar = await import("keytar");
    return await keytar.default.getPassword("GraphScope", NOTIFY_ACCOUNT);
  } catch {
    return process.env.GRAPHSCOPE_NOTIFY_WEBHOOK_URL ?? null;
  }
}

export async function setNotifyWebhookUrl(url: string): Promise<void> {
  const keytar = await import("keytar");
  await keytar.default.setPassword("GraphScope", NOTIFY_ACCOUNT, url);
}

export async function deleteNotifyWebhookUrl(): Promise<void> {
  try {
    const keytar = await import("keytar");
    await keytar.default.deletePassword("GraphScope", NOTIFY_ACCOUNT);
  } catch {
    // ignore
  }
}

export async function postJobWebhook(event: {
  jobType: string;
  status: string;
  message: string;
  workspaceId: string;
}): Promise<void> {
  const url = await getNotifyWebhookUrl();
  if (!url?.trim()) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[GraphScope] ${event.status}: ${event.jobType} — ${event.message}`,
        ...event,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // outbound webhook is best-effort
  }
}
