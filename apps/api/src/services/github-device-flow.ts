import type { Env } from "@graphscope/config";

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface AccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export interface GithubUser {
  login: string;
  name: string | null;
}

export class GithubDeviceFlowService {
  constructor(private readonly clientId: string) {}

  async start(): Promise<DeviceCodeResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      scope: "read:user",
    });
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`GitHub device flow start failed: ${res.status}`);
    }
    return res.json() as Promise<DeviceCodeResponse>;
  }

  async poll(deviceCode: string): Promise<{ accessToken: string } | { pending: true } | { error: string }> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = (await res.json()) as AccessTokenResponse;
    if (data.access_token) {
      return { accessToken: data.access_token };
    }
    if (data.error === "authorization_pending") {
      return { pending: true };
    }
    if (data.error === "slow_down") {
      return { pending: true };
    }
    return { error: data.error_description ?? data.error ?? "unknown_error" };
  }

  async fetchUser(accessToken: string): Promise<GithubUser> {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "GraphScope-Local/0.1",
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub user fetch failed: ${res.status}`);
    }
    const data = (await res.json()) as GithubUser;
    return data;
  }
}

export function createGithubService(env: Env): GithubDeviceFlowService | null {
  const clientId = env.GRAPHSCOPE_GITHUB_CLIENT_ID;
  if (!clientId) return null;
  return new GithubDeviceFlowService(clientId);
}
