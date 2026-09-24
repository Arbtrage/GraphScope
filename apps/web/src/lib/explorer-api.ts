import { indexCatalog } from "@/data/catalog";
import type {
  Endpoint,
  ExecutionKind,
  ExecutionResult,
  HistoryEntry,
  IndexedCatalog,
  OperationKind,
  Repository,
} from "@/data/types";
import { graphqlRequest, hydrateSessionFromKeychain, setSessionToken } from "@/lib/api";

const SIGN_IN = `
  mutation SignInLocal($input: LocalSignInInput!) {
    signInLocal(input: $input) {
      sessionToken
      activeWorkspace { id }
    }
  }
`;

const BOOTSTRAP = `
  mutation BootstrapExplorer {
    bootstrapWorkspace(input: { projectName: "Repository", createDefaultEnvironment: false }) {
      workspace { id name }
      project { id name }
    }
  }
`;

const OPEN_REPO = `
  mutation OpenRepository($localPath: String!) {
    openRepository(localPath: $localPath) {
      jobId
      repositoryLinkId
    }
  }
`;

const REINDEX_REPO = `
  mutation ReindexRepository($id: ID!) {
    reindexRepository(id: $id) {
      jobId
      repositoryLinkId
    }
  }
`;

const SCAN_STATUS = `
  query ScanStatus($jobId: ID!) {
    scanStatus(jobId: $jobId) {
      jobId
      status
      step
      done
      error
      stats {
        operations
        fragments
        types
        endpoints
        files
      }
      ignoredCount
      skippedFiles
      parseErrors { path message }
    }
  }
`;

const REPO_FIELDS = `
  id name branch scannedAtLabel localPath status lastError operationCount
`;

const CATALOG = `
  query ExplorerCatalog($repositoryLinkId: ID) {
    explorerCatalog(repositoryLinkId: $repositoryLinkId) {
      repository { ${REPO_FIELDS} }
      stats {
        operations queries mutations subscriptions fragments types endpoints files
      }
      operations {
        id name kind description document unused lastChanged
        variables
        fragmentIds typeIds usageIds endpointId
        source { fileId path line }
      }
      fragments {
        id name document typeIds operationIds fileIds duplicateOf
        source { fileId path line }
      }
      types { id name kind sdl source fieldIds operationIds fragmentIds fileIds }
      fields { id name typeId typeName returnType deprecated deprecationReason }
      files { id path kind operationIds fragmentIds referenceCount }
      endpoints { id name url environment operationCount schemaDate latency headers schemaPulled schemaPulledAt }
      usages { id fileId path line kind }
      attention { id label count severity }
      recentOperationIds
      graphEdges { id source target relation }
      surfaceNodeIds
      history { id operationId operationName kind at day }
    }
  }
`;

const REPOSITORIES = `
  query ExplorerRepositories {
    explorerRepositories {
      ${REPO_FIELDS}
    }
  }
`;

const EXECUTE = `
  mutation ExecuteOperation($input: ExecuteOperationInput!) {
    executeOperation(input: $input) {
      responseBody
      execution {
        id status durationMs httpStatus graphqlErrorsCount createdAt operationId responsePreview
      }
    }
  }
`;

export interface ScanParseError {
  path: string;
  message: string;
}

export interface ScanReport {
  ignoredCount: number;
  skippedFiles: string[];
  parseErrors: ScanParseError[];
}

export interface ScanStatus {
  jobId: string;
  status: string;
  step: string | null;
  done: boolean;
  error: string | null;
  stats: {
    operations: number;
    fragments: number;
    types: number;
    endpoints: number;
    files: number;
  } | null;
  ignoredCount?: number | null;
  skippedFiles?: string[] | null;
  parseErrors?: ScanParseError[] | null;
}

export function reportFromScanStatus(status: ScanStatus): ScanReport {
  return {
    ignoredCount: status.ignoredCount ?? 0,
    skippedFiles: status.skippedFiles ?? [],
    parseErrors: status.parseErrors ?? [],
  };
}

export function isUnreachableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /failed to fetch|networkerror|load failed|econnrefused|network request failed/i.test(message);
}

export async function ensureLocalSession(): Promise<void> {
  const existing = await hydrateSessionFromKeychain();
  if (!existing) {
    const data = await graphqlRequest<{
      signInLocal: { sessionToken: string };
    }>(SIGN_IN, { input: { displayName: "Local" } });
    setSessionToken(data.signInLocal.sessionToken);
  }
  await graphqlRequest(BOOTSTRAP);
}

export async function openRepository(localPath: string): Promise<{ jobId: string; repositoryLinkId: string }> {
  const data = await graphqlRequest<{ openRepository: { jobId: string; repositoryLinkId: string } }>(
    OPEN_REPO,
    { localPath },
  );
  return data.openRepository;
}

export async function reindexRepository(id: string): Promise<{ jobId: string; repositoryLinkId: string }> {
  const data = await graphqlRequest<{ reindexRepository: { jobId: string; repositoryLinkId: string } }>(
    REINDEX_REPO,
    { id },
  );
  return data.reindexRepository;
}

export async function fetchScanStatus(jobId: string): Promise<ScanStatus> {
  const data = await graphqlRequest<{ scanStatus: ScanStatus }>(SCAN_STATUS, { jobId });
  return data.scanStatus;
}

export async function fetchExplorerRepositories(): Promise<Repository[]> {
  const data = await graphqlRequest<{ explorerRepositories: Repository[] }>(REPOSITORIES);
  return data.explorerRepositories ?? [];
}

export async function fetchExplorerCatalog(repositoryLinkId?: string | null): Promise<IndexedCatalog | null> {
  const data = await graphqlRequest<{ explorerCatalog: IndexedCatalog | null }>(CATALOG, {
    repositoryLinkId: repositoryLinkId || null,
  });
  if (!data.explorerCatalog?.repository?.id) return null;
  const cat = data.explorerCatalog;
  return indexCatalog({
    ...cat,
    operations: cat.operations.map((op) => ({
      ...op,
      variables: op.variables ?? {},
    })),
    types: cat.types.map((type) => ({
      ...type,
      source: type.source ?? "inferred",
    })),
    endpoints: cat.endpoints.map((endpoint) => ({
      ...endpoint,
      headers: endpoint.headers ?? {},
      schemaPulled: Boolean(endpoint.schemaPulled),
      schemaPulledAt: endpoint.schemaPulledAt ?? null,
    })),
  });
}

const CATALOG_REVISION = `
  query CatalogRevision($repositoryLinkId: ID!) {
    catalogRevision(repositoryLinkId: $repositoryLinkId)
  }
`;

export async function fetchCatalogRevision(repositoryLinkId: string): Promise<number> {
  const data = await graphqlRequest<{ catalogRevision: number }>(CATALOG_REVISION, { repositoryLinkId });
  return Number(data.catalogRevision) || 0;
}

const ENV_FIELDS = `
  id name endpointUrl isProduction headers
`;

const CREATE_ENV = `
  mutation CreateEnvironment($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) { ${ENV_FIELDS} }
  }
`;

const UPDATE_ENV = `
  mutation UpdateEnvironment($id: ID!, $input: UpdateEnvironmentInput!) {
    updateEnvironment(id: $id, input: $input) { ${ENV_FIELDS} }
  }
`;

const DELETE_ENV = `
  mutation DeleteEnvironment($id: ID!) {
    deleteEnvironment(id: $id)
  }
`;

export interface EnvironmentRecord {
  id: string;
  name: string;
  endpointUrl: string;
  isProduction: boolean;
  headers: Record<string, string>;
}

export function stripIdPrefix(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

export function endpointFromEnvironment(env: EnvironmentRecord, operationCount = 0): Endpoint {
  return {
    id: env.id.startsWith("ep:") ? env.id : `ep:${env.id}`,
    name: env.name,
    url: env.endpointUrl,
    environment: env.isProduction ? "production" : "development",
    operationCount,
    schemaDate: "Just now",
    latency: "—",
    headers: env.headers ?? {},
    schemaPulled: false,
    schemaPulledAt: null,
  };
}

export async function createEnvironment(input: {
  name: string;
  endpointUrl: string;
  isProduction?: boolean;
  headers?: Record<string, string>;
}): Promise<EnvironmentRecord> {
  const data = await graphqlRequest<{ createEnvironment: EnvironmentRecord }>(CREATE_ENV, { input });
  return data.createEnvironment;
}

export async function updateEnvironment(
  id: string,
  input: {
    name?: string;
    endpointUrl?: string;
    isProduction?: boolean;
    headers?: Record<string, string>;
  },
): Promise<EnvironmentRecord> {
  const data = await graphqlRequest<{ updateEnvironment: EnvironmentRecord }>(UPDATE_ENV, {
    id: stripIdPrefix(id, "ep:"),
    input,
  });
  return data.updateEnvironment;
}

export async function deleteEnvironment(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteEnvironment: boolean }>(DELETE_ENV, {
    id: stripIdPrefix(id, "ep:"),
  });
  return data.deleteEnvironment;
}

const LIST_SECRETS = `
  query EnvironmentSecrets($environmentId: ID!) {
    secrets(environmentId: $environmentId) {
      id name lastFour updatedAt
    }
  }
`;

const UPSERT_SECRET = `
  mutation UpsertSecret($input: UpsertSecretInput!) {
    upsertSecret(input: $input) { id name lastFour updatedAt }
  }
`;

const DELETE_SECRET = `
  mutation DeleteSecret($id: ID!) {
    deleteSecret(id: $id)
  }
`;

export interface SecretRecord {
  id: string;
  name: string;
  lastFour: string;
  updatedAt: string;
}

export async function fetchEnvironmentSecrets(environmentId: string): Promise<SecretRecord[]> {
  const data = await graphqlRequest<{ secrets: SecretRecord[] }>(LIST_SECRETS, {
    environmentId: stripIdPrefix(environmentId, "ep:"),
  });
  return data.secrets ?? [];
}

export async function upsertEnvironmentSecret(
  environmentId: string,
  name: string,
  value: string,
): Promise<SecretRecord> {
  const data = await graphqlRequest<{ upsertSecret: SecretRecord }>(UPSERT_SECRET, {
    input: { environmentId: stripIdPrefix(environmentId, "ep:"), name, value },
  });
  return data.upsertSecret;
}

export async function deleteEnvironmentSecret(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteSecret: boolean }>(DELETE_SECRET, { id });
  return data.deleteSecret;
}

const INTROSPECT_ENV = `
  mutation IntrospectEnvironment($environmentId: ID!) {
    introspectEnvironment(environmentId: $environmentId) {
      ok
      typeCount
      title
      detail
    }
  }
`;

export async function introspectEnvironment(environmentId: string): Promise<{
  ok: boolean;
  typeCount: number;
  title: string | null;
  detail: string | null;
}> {
  const data = await graphqlRequest<{
    introspectEnvironment: { ok: boolean; typeCount: number; title?: string | null; detail?: string | null };
  }>(INTROSPECT_ENV, { environmentId: stripIdPrefix(environmentId, "ep:") });
  return {
    ok: data.introspectEnvironment.ok,
    typeCount: data.introspectEnvironment.typeCount ?? 0,
    title: data.introspectEnvironment.title ?? null,
    detail: data.introspectEnvironment.detail ?? null,
  };
}

const REPO_TREE = `
  query RepositoryTree($repositoryLinkId: ID!) {
    repositoryTree(repositoryLinkId: $repositoryLinkId) {
      path
    }
  }
`;

const REPO_FILE = `
  query RepositoryFile($repositoryLinkId: ID!, $path: String!) {
    repositoryFile(repositoryLinkId: $repositoryLinkId, path: $path) {
      path
      content
      truncated
      byteSize
      binary
    }
  }
`;

export async function fetchRepositoryTree(repositoryLinkId: string): Promise<string[]> {
  const data = await graphqlRequest<{ repositoryTree: Array<{ path: string }> }>(REPO_TREE, {
    repositoryLinkId,
  });
  return (data.repositoryTree ?? []).map((item) => item.path);
}

export async function fetchRepositoryFile(
  repositoryLinkId: string,
  path: string,
): Promise<{ path: string; content: string; truncated: boolean; byteSize: number; binary: boolean }> {
  const data = await graphqlRequest<{
    repositoryFile: {
      path: string;
      content: string;
      truncated: boolean;
      byteSize: number;
      binary: boolean;
    };
  }>(REPO_FILE, { repositoryLinkId, path });
  return data.repositoryFile;
}

export async function executeExistingOperation(input: {
  environmentId: string;
  operationId: string;
  query: string;
  variables: Record<string, unknown>;
  headers?: Record<string, string>;
}): Promise<ExecutionResult> {
  const data = await graphqlRequest<{
    executeOperation: {
      responseBody: string;
      execution: {
        status: ExecutionKind;
        durationMs: number;
        httpStatus?: number | null;
        graphqlErrorsCount: number;
        responsePreview?: string | null;
      };
    };
  }>(EXECUTE, {
    input: {
      environmentId: stripIdPrefix(input.environmentId, "ep:"),
      operationId: stripIdPrefix(input.operationId, "op:"),
      adhocQuery: input.query,
      variables: input.variables,
      headers: input.headers && Object.keys(input.headers).length ? input.headers : undefined,
    },
  });
  return mapExecutionResult(data.executeOperation);
}

function mapExecutionResult(payload: {
  responseBody: string;
  execution: {
    status: ExecutionKind;
    durationMs: number;
    httpStatus?: number | null;
    graphqlErrorsCount: number;
    responsePreview?: string | null;
  };
}): ExecutionResult {
  let body: unknown = {};
  try {
    body = payload.responseBody ? JSON.parse(payload.responseBody) : {};
  } catch {
    body = { raw: payload.responseBody };
  }
  const parsed = body as {
    errors?: unknown[];
    data?: unknown;
    error?: { title?: string; detail?: string; code?: string };
  };
  const kind = payload.execution.status;
  const httpStatus = payload.execution.httpStatus ?? 0;
  const envelope = parsed.error;
  const title = envelope?.title ?? titleForExecution(kind, httpStatus);
  const detail = envelope?.detail ?? payload.execution.responsePreview ?? undefined;
  const graphqlErrors = Array.isArray(parsed.errors) ? parsed.errors : [];
  const errors =
    graphqlErrors.length > 0
      ? graphqlErrors
      : title && kind !== "SUCCESS"
        ? [{ message: detail ?? title, title }]
        : [];
  return {
    status: httpStatus,
    statusText: kind === "SUCCESS" && errors.length === 0 ? "OK" : kind.replaceAll("_", " "),
    kind,
    title: kind === "SUCCESS" && errors.length === 0 ? undefined : title,
    detail,
    durationMs: payload.execution.durationMs,
    body: parsed.data != null ? { data: parsed.data, ...(parsed.errors ? { errors: parsed.errors } : {}) } : body,
    headers: { "content-type": "application/json" },
    errors,
    timing: {
      dns: 0,
      connect: 0,
      ttfb: Math.max(0, payload.execution.durationMs - 8),
      total: payload.execution.durationMs,
    },
  };
}

function titleForExecution(kind: ExecutionKind, httpStatus: number): string {
  if (kind === "TIMEOUT") return "Request timed out";
  if (kind === "BLOCKED") return "Request blocked";
  if (kind === "GRAPHQL_ERROR") return "GraphQL error";
  if (kind === "API_ERROR") return "Could not run request";
  if (!httpStatus) return "Server not reachable";
  if (httpStatus === 401) return "Unauthorized — check headers";
  if (httpStatus === 403) return "Forbidden";
  if (httpStatus === 404) return "Endpoint not found";
  if (httpStatus >= 500) return "Server error";
  return "Request failed";
}

export function historyDay(iso: string): HistoryEntry["day"] {
  const created = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const t = created.getTime();
  if (t >= startToday) return "today";
  if (t >= startYesterday) return "yesterday";
  return "older";
}

export function toHistoryEntry(op: { id: string; name: string; kind: OperationKind }, at = new Date()): HistoryEntry {
  return {
    id: `h-${at.getTime()}`,
    operationId: op.id,
    operationName: op.name,
    kind: op.kind,
    at: at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    day: historyDay(at.toISOString()),
  };
}
