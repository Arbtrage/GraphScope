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
  activeWorkspace: Workspace | null;
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

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
}

export interface CreateProjectInput {
  name: string;
  slug: string;
}

export interface UpdateProjectInput {
  name?: string;
  slug?: string;
}

export interface Schema {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
}

export interface SchemaVersion {
  id: string;
  schemaId: string;
  workspaceId: string;
  contentHash: string;
  sdl: string;
  gitSha: string | null;
  createdAt: string;
}

export type SchemaCheckStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "ERROR";
export type SchemaCheckResult = "BREAKING" | "DANGEROUS" | "SAFE";

export interface SchemaCheck {
  id: string;
  schemaVersionId: string;
  status: SchemaCheckStatus;
  result: SchemaCheckResult | null;
  breakingCount: number;
  dangerousCount: number;
}

export type RepoSyncStatus = "CONNECTED" | "SYNCING" | "INDEXED" | "ERROR" | "DISABLED";
export type RepoSourceType = "LOCAL" | "GITHUB";
export type OperationType = "QUERY" | "MUTATION" | "SUBSCRIPTION";

export interface RepositoryLink {
  id: string;
  projectId: string;
  workspaceId: string;
  sourceType: RepoSourceType;
  localPath: string | null;
  githubRepo: string | null;
  defaultBranch: string;
  status: RepoSyncStatus;
  lastIndexedSha: string | null;
  lastError: string | null;
}

export interface OperationSourceLocation {
  path: string;
  startLine: number;
  endLine: number;
  githubUrl: string | null;
}

export interface OperationDocument {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string | null;
  operationType: OperationType;
  contentHash: string;
  content: string;
  confidence: number;
  isManual: boolean;
  locations: OperationSourceLocation[];
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  endpointUrl: string;
  isProduction: boolean;
  headers: Record<string, string>;
}

export interface SecretMeta {
  id: string;
  environmentId: string;
  name: string;
  lastFour: string;
  updatedAt: string;
}

export type ExecutionStatus = "SUCCESS" | "GRAPHQL_ERROR" | "TRANSPORT_ERROR" | "BLOCKED" | "TIMEOUT";

export interface Execution {
  id: string;
  workspaceId: string;
  status: ExecutionStatus;
  httpStatus: number | null;
  durationMs: number;
  responseBytes: number | null;
  graphqlErrorsCount: number;
  createdAt: string;
  operationId: string | null;
  environmentId: string | null;
  responsePreview: string | null;
}

export interface Collection {
  id: string;
  workspaceId: string;
  name: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  workspaceId: string;
  name: string;
  queryContent: string;
  variablesJson: string;
  operationId: string | null;
}

export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  workspaceId: string;
  jobType: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  attempts?: number;
  lastError?: string | null;
  lockedAt?: string | null;
}
