import type { Repositories } from "@graphscope/db";
import { readSdlFile } from "../schema-publish.js";
import { getOpenAiKey } from "../secrets.js";
import type { AiProvider } from "./provider.js";
import { resolveAiProvider } from "./provider.js";
import { sanitizeGeneratedOperation, subsetSchemaSdl, validateOperationAgainstSchema } from "./schema-utils.js";

export interface GenerateOperationInput {
  workspaceId: string;
  userId: string;
  prompt: string;
  schemaVersionId: string;
  operationType?: "QUERY" | "MUTATION" | "SUBSCRIPTION";
  provider?: AiProvider;
}

export interface AiGeneratedOperationResult {
  document: string;
  warnings: string[];
  usage: { promptTokens: number; completionTokens: number };
}

export async function generateOperation(
  repos: Repositories,
  input: GenerateOperationInput,
): Promise<AiGeneratedOperationResult> {
  const settings = await repos.ai.getOrCreateSettings(input.workspaceId, !!(await getOpenAiKey())?.trim());
  if (!settings.enabled) {
    throw new Error("AI is disabled for this workspace");
  }
  if (settings.tokensUsed >= settings.monthlyTokenBudget) {
    throw new Error("BUDGET_EXCEEDED");
  }

  const version = await repos.schemas.findVersionById(input.schemaVersionId, input.workspaceId);
  if (!version) throw new Error("Schema version not found");

  const fullSdl = await readSdlFile(version.sdlPath);
  const schemaSubset = subsetSchemaSdl(fullSdl, input.prompt, settings.redactionMode);

  const provider = input.provider ?? resolveAiProvider(await getOpenAiKey());
  const opType = input.operationType ?? "QUERY";
  const system = [
    "You generate valid GraphQL operations constrained to the provided schema subset.",
    `Return only a ${opType.toLowerCase()} document. No prose outside the operation.`,
  ].join(" ");

  const user = `Schema subset:\n${schemaSubset}\n\nRequest:\n${input.prompt}\n\nGenerate a ${opType} operation.`;

  const result = await provider.complete({ system, user });
  const document = sanitizeGeneratedOperation(result.content);
  const validation = validateOperationAgainstSchema(document, fullSdl);
  const warnings: string[] = [];
  if (!validation.valid) {
    warnings.push(...validation.errors);
  }

  await repos.ai.recordInvocation({
    workspaceId: input.workspaceId,
    userId: input.userId,
    kind: "GENERATE",
    redactionMode: settings.redactionMode,
    schemaVersionId: input.schemaVersionId,
    operationId: null,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    status: validation.valid ? "SUCCESS" : "ERROR",
    errorMessage: validation.valid ? null : validation.errors.join("; "),
    metadata: { prompt: input.prompt.slice(0, 500) },
  });

  if (!validation.valid) {
    throw new Error(`Generated operation failed schema validation: ${validation.errors.join("; ")}`);
  }

  return {
    document,
    warnings,
    usage: result.usage,
  };
}
