import type { Env } from "@graphscope/config";
import type { Repositories } from "@graphscope/db";

export interface GraphContext {
  env: Env;
  repos: Repositories;
  sessionToken: string | null;
  userId: string | null;
  workspaceId: string | null;
}

export interface DeviceFlowState {
  deviceCode: string;
  interval: number;
  expiresAt: number;
}

const deviceFlowStore = new Map<string, DeviceFlowState>();

export function storeDeviceFlow(deviceCode: string, state: DeviceFlowState): void {
  deviceFlowStore.set(deviceCode, state);
}

export function getDeviceFlow(deviceCode: string): DeviceFlowState | undefined {
  return deviceFlowStore.get(deviceCode);
}

export function clearDeviceFlow(deviceCode: string): void {
  deviceFlowStore.delete(deviceCode);
}

export function createContext(
  base: { env: Env; repos: Repositories },
  auth: { sessionToken: string | null; userId: string | null; workspaceId: string | null },
): GraphContext {
  return { ...base, ...auth };
}
