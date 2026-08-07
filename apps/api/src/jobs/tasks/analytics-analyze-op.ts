import type { Repositories } from "@graphscope/db";
import { analyzeOperation } from "../../services/analytics/rules/index.js";

export async function runAnalyticsAnalyzeOpTask(
  repos: Repositories,
  payload: { workspaceId: string; operationId: string },
): Promise<void> {
  const op = await repos.operations.findById(payload.operationId, payload.workspaceId);
  if (!op) {
    console.warn(`analytics.analyze_op: operation ${payload.operationId} not found`);
    return;
  }

  const result = analyzeOperation(op.content);
  await repos.analytics.updateOperationMetrics(payload.operationId, payload.workspaceId, result.depth, result.complexity);
  await repos.analytics.replaceFindingsForOperation(payload.operationId, payload.workspaceId, result.findings);
}

export async function enqueueAnalyzeOp(
  repos: Repositories,
  db: import("@graphscope/db").Knex,
  workspaceId: string,
  operationId: string,
): Promise<void> {
  const { enqueueJob } = await import("../worker.js");
  await enqueueJob(db, "analytics.analyze_op", { workspaceId, operationId }).catch(async () => {
    await runAnalyticsAnalyzeOpTask(repos, { workspaceId, operationId });
  });
}
