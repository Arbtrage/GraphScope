"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  PageSkeleton,
  SectionCard,
  StatusBadge,
} from "@graphscope/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppRouter } from "@/components/navigation-provider";

const DASHBOARD = gql`
  query Dashboard {
    health {
      ok
      version
    }
    workspaceStats {
      projectCount
      operationCount
      environmentCount
      lastExecutionAt
    }
    executions(limit: 5) {
      id
      status
      durationMs
      createdAt
      operationId
    }
  }
`;

function HomeContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(DASHBOARD);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const stats = data?.workspaceStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your GraphScope workspace at a glance."
        action={
          <Badge variant={data?.health?.ok ? "success" : "warning"}>
            API {data?.health?.ok ? `v${data.health.version}` : "checking…"}
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.projectCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.operationCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Environments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.environmentCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Quick actions">
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/app/projects">Create project</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/projects">Connect repo</Link>
          </Button>
          <Button variant="outline" className="bg-execute text-execute-foreground hover:bg-execute/90" asChild>
            <Link href="/app/execute">Run query</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Recent executions" description={stats?.lastExecutionAt ? `Last run: ${new Date(stats.lastExecutionAt).toLocaleString()}` : undefined}>
        {(data?.executions ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No executions yet. Run a query to get started.</p>
        ) : (
          <ul className="space-y-2">
            {data.executions.map((e: { id: string; status: string; durationMs: number; createdAt: string; operationId?: string | null }) => (
              <li key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.status} />
                  <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{e.durationMs}ms</span>
                  {e.operationId && (
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/app/execute?operationId=${e.operationId}`)}>
                      Re-run
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default function AppPage() {
  return <HomeContent />;
}
