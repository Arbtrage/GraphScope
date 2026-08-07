import type { Repositories } from "@graphscope/db";
import { readSdlFile } from "../schema-publish.js";
import { getOpenAiKey } from "../secrets.js";
import type { AiProvider } from "./provider.js";
import { resolveAiProvider } from "./provider.js";
import { parseCitations, redactSecrets, subsetSchemaSdl } from "./schema-utils.js";
import { cacheGet, cacheSet, cacheKey } from "../cache.js";

export interface ExplainOperationInput {
  workspaceId: string;
  userId: string;
  operationId?: string | null;
  operationContent?: string | null;
  schemaVersionId?: string | null;
  projectId?: string | null;
  provider?: AiProvider;
}

export interface AiExplanationResult {
  markdown: string;
  citations: Array<{ typeName: string; fieldName: string | null }>;
  usage: { promptTokens: number; completionTokens: number };
}

async function resolveSchemaSdl(
  repos: Repositories,
  workspaceId: string,
  schemaVersionId?: string | null,
  projectId?: string | null,
): Promise<string> {
  try {
    if (schemaVersionId) {
      const version = await repos.schemas.findVersionById(schemaVersionId, workspaceId);
      if (version) return readSdlFile(version.sdlPath);
    }
    if (projectId) {
      const schemas = await repos.schemas.listForProject(projectId, workspaceId);
      const schema = schemas[0];
      if (schema) {
        const versions = await repos.schemas.listVersions(schema.id, workspaceId);
        const latest = versions[0];
        if (latest) {
          const full = await repos.schemas.findVersionById(latest.id, workspaceId);
          if (full) return readSdlFile(full.sdlPath);
        }
      }
    }
  } catch {
    // fall through to minimal schema
  }
  return "type Query { _empty: String }";
}

export async function explainOperation(
  repos: Repositories,
  input: ExplainOperationInput,
): Promise<AiExplanationResult> {
  const settings = await repos.ai.getOrCreateSettings(input.workspaceId, await hasKeyFlag());
  if (!settings.enabled) {
    throw new Error("AI is disabled for this workspace");
  }
  if (settings.tokensUsed >= settings.monthlyTokenBudget) {
    throw new Error("BUDGET_EXCEEDED");
  }

  let operationContent = input.operationContent?.trim() ?? "";
  if (input.operationId) {
    const op = await repos.operations.findById(input.operationId, input.workspaceId);
    if (!op) throw new Error("Operation not found");
    operationContent = op.content;
  }
  if (!operationContent) throw new Error("Operation content required");

  const fullSdl = await resolveSchemaSdl(repos, input.workspaceId, input.schemaVersionId, input.projectId);
  const schemaSubset = subsetSchemaSdl(fullSdl, operationContent, settings.redactionMode);
  const sanitizedOp = redactSecrets(operationContent);

  const provider = input.provider ?? resolveAiProvider(await getOpenAiKey());
  const system = [
    "You are a GraphQL expert. Explain the given operation using the schema context.",
    "Use markdown. Cite types and fields with backticks like `Query.users`.",
    "Do not invent fields not present in the schema subset.",
  ].join(" ");

  const user = `Schema subset:\n${schemaSubset}\n\nOperation:\n${sanitizedOp}\n\nExplain this operation.`;

  const explainCacheKey = cacheKey("ai:explain", [
    settings.redactionMode,
    schemaSubset,
    sanitizedOp,
  ]);
  const cached = await cacheGet(explainCacheKey);
  if (cached) {
    return JSON.parse(cached) as AiExplanationResult;
  }

  const result = await provider.complete({ system, user });
  const citations = parseCitations(result.content);

  await repos.ai.recordInvocation({
    workspaceId: input.workspaceId,
    userId: input.userId,
    kind: "EXPLAIN",
    redactionMode: settings.redactionMode,
    schemaVersionId: input.schemaVersionId ?? null,
    operationId: input.operationId ?? null,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    status: "SUCCESS",
  });

  const output: AiExplanationResult = {
    markdown: result.content,
    citations,
    usage: result.usage,
  };
  await cacheSet(explainCacheKey, JSON.stringify(output), 3600);
  return output;
}

async function hasKeyFlag(): Promise<boolean> {
  const key = await getOpenAiKey();
  return !!key?.trim();
}
