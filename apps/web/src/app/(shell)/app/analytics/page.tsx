"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Badge,
  ErrorState,
  PageHeader,
  PageSkeleton,
  SectionCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  LatencyChart,
} from "@graphscope/ui";
import Link from "next/link";

const ANALYTICS_DASHBOARD = gql`
  query AnalyticsDashboard($workspaceId: ID!) {
    activeWorkspace {
      id
      name
    }
    workspaceDashboard(workspaceId: $workspaceId) {
      operationCount
      openHighFindings
      checksFailed7d
      execP50Ms
      execP95Ms
    }
    operationsForWorkspace(limit: 10) {
      id
      name
      operationType
      projectName
    }
  }
`;

const SEVERITY_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

function SeverityBadge({ severity }: { severity: string }) {
  return <Badge variant={SEVERITY_VARIANT[severity] ?? "secondary"}>{severity}</Badge>;
}

function AnalyticsContent() {
  const { data: meData, loading: meLoading } = useQuery(gql`
    query ActiveWorkspace {
      activeWorkspace {
        id
        name
      }
    }
  `);

  const workspaceId = meData?.activeWorkspace?.id;
  const { data, loading, error, refetch } = useQuery(ANALYTICS_DASHBOARD, {
    skip: !workspaceId,
    variables: { workspaceId: workspaceId ?? "" },
  });

  if (meLoading || loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!workspaceId) return <ErrorState title="No active workspace" />;

  const dashboard = data?.workspaceDashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Findings and latency for ${data?.activeWorkspace?.name ?? "this workspace"}.`}
      />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-border/60 pb-6">
        {[
          { label: "Operations", value: dashboard?.operationCount ?? 0 },
          { label: "High findings", value: dashboard?.openHighFindings ?? 0, danger: true },
          { label: "Failed checks (7d)", value: dashboard?.checksFailed7d ?? 0 },
          {
            label: "Exec p50",
            value: dashboard?.execP50Ms != null ? `${Math.round(dashboard.execP50Ms)}ms` : "—",
          },
          {
            label: "Exec p95",
            value: dashboard?.execP95Ms != null ? `${Math.round(dashboard.execP95Ms)}ms` : "—",
          },
        ].map((stat) => (
          <div key={stat.label} className="min-w-[6.5rem]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p
              className={`mt-1 text-3xl font-semibold tracking-tight font-tabular ${
                "danger" in stat && stat.danger ? "text-destructive" : ""
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <SectionCard title="Execution latency" description="p50 and p95 from recent executions in this workspace.">
        <LatencyChart p50Ms={dashboard?.execP50Ms} p95Ms={dashboard?.execP95Ms} />
      </SectionCard>

      <SectionCard title="Rule reference" description="GS001–GS007 static analysis rules applied to discovered operations.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["GS001_UNBOUNDED_LIST", "HIGH", "Nested list selections without pagination arguments"],
              ["GS002_DEPTH_LIMIT", "HIGH", "Query depth exceeds recommended limit (12)"],
              ["GS003_INTROSPECTION_QUERY", "HIGH", "Introspection fields in operation"],
              ["GS004_HIGH_COMPLEXITY", "HIGH", "Estimated complexity exceeds limit (1000)"],
              ["GS005_FRAGMENT_OVERLOAD", "MEDIUM", "Too many fragment spreads (>10)"],
              ["GS006_ALIAS_OVERLOAD", "LOW", "Too many field aliases (>5)"],
              ["GS007_MULTIPLE_OPERATIONS", "MEDIUM", "Multiple operations in one document"],
            ].map(([rule, severity, desc]) => (
              <TableRow key={rule}>
                <TableCell className="font-mono text-xs">{rule}</TableCell>
                <TableCell>
                  <SeverityBadge severity={String(severity)} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Recent operations" description="Open an operation to view its findings.">
        {(data?.operationsForWorkspace ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No operations indexed yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.operationsForWorkspace.map(
              (op: { id: string; name: string | null; operationType: string; projectName?: string }) => (
                <li key={op.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <Link href={`/app/operations/${op.id}`} className="font-medium hover:underline">
                      {op.name ?? "Anonymous"}
                    </Link>
                    <span className="ml-2 text-muted-foreground">{op.projectName}</span>
                  </div>
                  <StatusBadge status={op.operationType} />
                </li>
              ),
            )}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}
