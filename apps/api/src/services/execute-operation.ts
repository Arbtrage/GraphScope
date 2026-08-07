import type { ExecutionStatus } from "@graphscope/shared-types";
import type { Repositories } from "@graphscope/db";
import { assertSafeUrl } from "./ssrf-guard.js";
import { getSecret } from "./secrets.js";

const TIMEOUT_MS = 30_000;
const MAX_BODY = 5 * 1024 * 1024;

function redactPreview(body: string): string {
  if (body.length <= 2000) return body;
  return body.slice(0, 2000) + "…";
}

function substituteSecrets(text: string, secrets: Record<string, string>): string {
  let out = text;
  for (const [name, value] of Object.entries(secrets)) {
    out = out.replaceAll(`{{${name}}}`, value);
  }
  return out;
}

export interface ExecuteInput {
  workspaceId: string;
  environmentId: string;
  queryContent: string;
  variablesJson: string;
  operationId?: string | null;
}

export interface ExecuteResult {
  status: ExecutionStatus;
  httpStatus: number | null;
  durationMs: number;
  responseBytes: number | null;
  graphqlErrorsCount: number;
  responsePreview: string | null;
  responseBody: string;
}

export async function executeOperation(
  repos: Repositories,
  input: ExecuteInput,
): Promise<ExecuteResult> {
  const env = await repos.environments.findById(input.environmentId, input.workspaceId);
  if (!env) throw new Error("Environment not found");
  if (!env.endpointUrl) throw new Error("Environment has no endpoint URL");

  const secretMetas = await repos.environments.listSecrets(input.environmentId, input.workspaceId);
  const secrets: Record<string, string> = {};
  for (const meta of secretMetas) {
    const val = await getSecret(input.environmentId, meta.name);
    if (val) secrets[meta.name] = val;
  }

  let endpointUrl = substituteSecrets(env.endpointUrl, secrets);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...env.headers };
  for (const [k, v] of Object.entries(headers)) {
    headers[k] = substituteSecrets(v, secrets);
  }

  if (env.isProduction) {
    // production execute allowed for all authenticated roles in v1 local app
  }

  try {
    await assertSafeUrl(endpointUrl);
  } catch (err) {
    return {
      status: "BLOCKED",
      httpStatus: null,
      durationMs: 0,
      responseBytes: null,
      graphqlErrorsCount: 0,
      responsePreview: err instanceof Error ? err.message : "Blocked",
      responseBody: "",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: input.queryContent,
        variables: JSON.parse(input.variablesJson || "{}"),
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    clearTimeout(timer);
    const durationMs = Date.now() - started;
    const clipped = text.length > MAX_BODY ? text.slice(0, MAX_BODY) : text;
    let graphqlErrorsCount = 0;
    let status: ExecutionStatus = res.ok ? "SUCCESS" : "TRANSPORT_ERROR";
    try {
      const json = JSON.parse(clipped) as { errors?: unknown[] };
      if (json.errors?.length) {
        graphqlErrorsCount = json.errors.length;
        status = "GRAPHQL_ERROR";
      }
    } catch {
      if (res.ok) status = "TRANSPORT_ERROR";
    }
    return {
      status,
      httpStatus: res.status,
      durationMs,
      responseBytes: text.length,
      graphqlErrorsCount,
      responsePreview: redactPreview(clipped),
      responseBody: clipped,
    };
  } catch (err) {
    clearTimeout(timer);
    const durationMs = Date.now() - started;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      status: isTimeout ? "TIMEOUT" : "TRANSPORT_ERROR",
      httpStatus: null,
      durationMs,
      responseBytes: null,
      graphqlErrorsCount: 0,
      responsePreview: err instanceof Error ? err.message : "Request failed",
      responseBody: "",
    };
  }
}
