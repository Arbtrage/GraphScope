export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "RUNNER" | "VIEWER";

export interface User {
  id: string;
  githubLogin: string | null;
  name: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export interface Health {
  ok: boolean;
  version: string;
}

export interface DeviceFlowPayload {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface AuthPayload {
  sessionToken: string;
  user: User;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface AuditAction {
  action: string;
  actorId: string | null;
  workspaceId: string | null;
  metadata?: Record<string, unknown>;
}
