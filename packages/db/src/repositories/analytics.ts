import type { Knex } from "knex";

export type FindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OperationFinding {
  id: string;
  operationId: string;
  workspaceId: string;
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  path: string | null;
}

export interface FindingInput {
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  path?: string | null;
}

export interface WorkspaceDashboard {
  operationCount: number;
  openHighFindings: number;
  checksFailed7d: number;
  execP50Ms: number | null;
  execP95Ms: number | null;
}

function mapFinding(row: Record<string, unknown>): OperationFinding {
  return {
    id: String(row.operation_finding_id),
    operationId: String(row.operation_id),
    workspaceId: String(row.workspace_id),
    ruleId: row.rule_id as string,
    severity: row.severity as FindingSeverity,
    message: row.message as string,
    path: (row.path as string | null) ?? null,
  };
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? null;
}

export class AnalyticsRepository {
  constructor(private readonly db: Knex) {}

  async listFindingsForOperation(operationId: string, workspaceId: string): Promise<OperationFinding[]> {
    const rows = await this.db("core_operation_finding")
      .where({ operation_id: operationId, workspace_id: workspaceId })
      .orderBy("severity", "desc")
      .orderBy("rule_id");
    return rows.map(mapFinding);
  }

  async replaceFindingsForOperation(
    operationId: string,
    workspaceId: string,
    findings: FindingInput[],
  ): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("core_operation_finding").where({ operation_id: operationId, workspace_id: workspaceId }).del();
      if (findings.length === 0) return;
      await trx("core_operation_finding").insert(
        findings.map((f) => ({
          workspace_id: workspaceId,
          operation_id: operationId,
          rule_id: f.ruleId,
          severity: f.severity,
          message: f.message,
          path: f.path ?? null,
        })),
      );
    });
  }

  async updateOperationMetrics(operationId: string, workspaceId: string, depth: number, complexity: number): Promise<void> {
    await this.db("core_operation")
      .where({ operation_id: operationId, workspace_id: workspaceId })
      .update({ depth, complexity, updated_at: this.db.fn.now() });
  }

  async getWorkspaceDashboard(workspaceId: string): Promise<WorkspaceDashboard> {
    const today = new Date().toISOString().slice(0, 10);
    const mart = await this.db("mart_workspace_daily")
      .where({ workspace_id: workspaceId, day: today })
      .first();

    if (mart) {
      return {
        operationCount: Number(mart.operation_count),
        openHighFindings: Number(mart.open_high_findings),
        checksFailed7d: Number(mart.checks_failed_7d),
        execP50Ms: mart.exec_p50_ms != null ? Number(mart.exec_p50_ms) : null,
        execP95Ms: mart.exec_p95_ms != null ? Number(mart.exec_p95_ms) : null,
      };
    }

    return this.computeLiveDashboard(workspaceId);
  }

  async computeLiveDashboard(workspaceId: string): Promise<WorkspaceDashboard> {
    const operationCountResult = await this.db("core_operation")
      .where({ workspace_id: workspaceId })
      .count("* as count")
      .first();

    const openHighResult = await this.db("core_operation_finding")
      .where({ workspace_id: workspaceId })
      .whereIn("severity", ["HIGH", "CRITICAL"])
      .count("* as count")
      .first();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const checksFailedResult = await this.db("core_schema_check")
      .where({ workspace_id: workspaceId })
      .where("created_at", ">=", sevenDaysAgo)
      .whereIn("status", ["FAILED", "ERROR"])
      .count("* as count")
      .first();

    const execRows = await this.db("core_execution")
      .where({ workspace_id: workspaceId })
      .where("created_at", ">=", sevenDaysAgo)
      .select("duration_ms");
    const durations = execRows.map((r) => Number(r.duration_ms)).sort((a, b) => a - b);

    return {
      operationCount: Number(operationCountResult?.count ?? 0),
      openHighFindings: Number(openHighResult?.count ?? 0),
      checksFailed7d: Number(checksFailedResult?.count ?? 0),
      execP50Ms: percentile(durations, 50),
      execP95Ms: percentile(durations, 95),
    };
  }

  async rollupWorkspaceDaily(workspaceId: string, day?: string): Promise<void> {
    const targetDay = day ?? new Date().toISOString().slice(0, 10);
    const stats = await this.computeLiveDashboard(workspaceId);

    await this.db("mart_workspace_daily")
      .insert({
        workspace_id: workspaceId,
        day: targetDay,
        operation_count: stats.operationCount,
        open_high_findings: stats.openHighFindings,
        checks_failed_7d: stats.checksFailed7d,
        exec_p50_ms: stats.execP50Ms,
        exec_p95_ms: stats.execP95Ms,
        updated_at: this.db.fn.now(),
      })
      .onConflict(["workspace_id", "day"])
      .merge({
        operation_count: stats.operationCount,
        open_high_findings: stats.openHighFindings,
        checks_failed_7d: stats.checksFailed7d,
        exec_p50_ms: stats.execP50Ms,
        exec_p95_ms: stats.execP95Ms,
        updated_at: this.db.fn.now(),
      });
  }

  async rollupAllWorkspaces(day?: string): Promise<number> {
    const workspaces = await this.db("core_workspace").select("workspace_id");
    for (const ws of workspaces) {
      await this.rollupWorkspaceDaily(String(ws.workspace_id), day);
    }
    return workspaces.length;
  }
}
