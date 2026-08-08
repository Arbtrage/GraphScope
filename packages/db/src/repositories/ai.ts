import type { Knex } from "knex";
import type {
  AiInvocationKind,
  AiInvocationStatus,
  AiRedactionMode,
  AiSettings,
} from "@graphscope/shared-types";

export type { AiRedactionMode, AiInvocationKind, AiInvocationStatus, AiSettings };

export interface AiInvocationRecord {
  id: string;
  workspaceId: string;
  userId: string;
  kind: AiInvocationKind;
  redactionMode: AiRedactionMode;
  schemaVersionId: string | null;
  operationId: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  status: AiInvocationStatus;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function mapSettings(row: Record<string, unknown>, hasOpenAiKey: boolean): AiSettings {
  return {
    id: String(row.ai_settings_id),
    workspaceId: String(row.workspace_id),
    redactionMode: row.redaction_mode as AiRedactionMode,
    enabled: Boolean(row.enabled),
    monthlyTokenBudget: Number(row.monthly_token_budget),
    tokensUsed: Number(row.tokens_used),
    hasOpenAiKey,
  };
}

function mapInvocation(row: Record<string, unknown>): AiInvocationRecord {
  return {
    id: String(row.ai_invocation_id),
    workspaceId: String(row.workspace_id),
    userId: String(row.user_id),
    kind: row.kind as AiInvocationKind,
    redactionMode: row.redaction_mode as AiRedactionMode,
    schemaVersionId: row.schema_version_id ? String(row.schema_version_id) : null,
    operationId: row.operation_id ? String(row.operation_id) : null,
    promptTokens: Number(row.prompt_tokens),
    completionTokens: Number(row.completion_tokens),
    totalTokens: Number(row.total_tokens),
    status: row.status as AiInvocationStatus,
    errorMessage: (row.error_message as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export class AiRepository {
  constructor(private readonly db: Knex) {}

  async getOrCreateSettings(workspaceId: string, hasOpenAiKey = false): Promise<AiSettings> {
    const existing = await this.db("core_ai_settings").where({ workspace_id: workspaceId }).first();
    if (existing) return mapSettings(existing, hasOpenAiKey);
    const [row] = await this.db("core_ai_settings")
      .insert({ workspace_id: workspaceId })
      .returning("*");
    return mapSettings(row, hasOpenAiKey);
  }

  async updateSettings(
    workspaceId: string,
    patch: Partial<{ redactionMode: AiRedactionMode; enabled: boolean; monthlyTokenBudget: number }>,
    hasOpenAiKey = false,
  ): Promise<AiSettings> {
    await this.getOrCreateSettings(workspaceId, hasOpenAiKey);
    const update: Record<string, unknown> = { updated_at: this.db.fn.now() };
    if (patch.redactionMode !== undefined) update.redaction_mode = patch.redactionMode;
    if (patch.enabled !== undefined) update.enabled = patch.enabled;
    if (patch.monthlyTokenBudget !== undefined) update.monthly_token_budget = patch.monthlyTokenBudget;
    const [row] = await this.db("core_ai_settings")
      .where({ workspace_id: workspaceId })
      .update(update)
      .returning("*");
    return mapSettings(row, hasOpenAiKey);
  }

  async addTokensUsed(workspaceId: string, tokens: number): Promise<void> {
    await this.getOrCreateSettings(workspaceId);
    await this.db("core_ai_settings")
      .where({ workspace_id: workspaceId })
      .increment("tokens_used", tokens)
      .update({ updated_at: this.db.fn.now() });
  }

  async recordInvocation(input: {
    workspaceId: string;
    userId: string;
    kind: AiInvocationKind;
    redactionMode: AiRedactionMode;
    schemaVersionId?: string | null;
    operationId?: string | null;
    promptTokens: number;
    completionTokens: number;
    status: AiInvocationStatus;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<AiInvocationRecord> {
    const totalTokens = input.promptTokens + input.completionTokens;
    const [row] = await this.db("core_ai_invocation")
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        kind: input.kind,
        redaction_mode: input.redactionMode,
        schema_version_id: input.schemaVersionId ?? null,
        operation_id: input.operationId ?? null,
        prompt_tokens: input.promptTokens,
        completion_tokens: input.completionTokens,
        total_tokens: totalTokens,
        status: input.status,
        error_message: input.errorMessage ?? null,
        metadata: input.metadata ?? {},
      })
      .returning("*");
    if (input.status === "SUCCESS" && totalTokens > 0) {
      await this.addTokensUsed(input.workspaceId, totalTokens);
    }
    return mapInvocation(row);
  }

  async listInvocations(workspaceId: string, limit = 50): Promise<AiInvocationRecord[]> {
    const rows = await this.db("core_ai_invocation")
      .where({ workspace_id: workspaceId })
      .orderBy("created_at", "desc")
      .limit(limit);
    return rows.map(mapInvocation);
  }
}
