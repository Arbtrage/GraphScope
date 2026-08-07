"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  CompositionBadge,
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
        description={`Anti-pattern findings and execution metrics for ${data?.activeWorkspace?.name ?? "your workspace"}.`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dashboard?.operationCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">High findings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-destructive">{dashboard?.openHighFindings ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed checks (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{dashboard?.checksFailed7d ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Exec p50</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {dashboard?.execP50Ms != null ? `${Math.round(dashboard.execP50Ms)}ms` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Exec p95</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {dashboard?.execP95Ms != null ? `${Math.round(dashboard.execP95Ms)}ms` : "—"}
            </p>
          </CardContent>
        </Card>
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
