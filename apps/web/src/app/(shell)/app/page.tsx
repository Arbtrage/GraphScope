"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Badge,
  Button,
  ErrorState,
  PageHeader,
  PageSkeleton,
  SectionCard,
  StatusBadge,
} from "@graphscope/ui";
import { ArrowRight, FolderKanban, Play, Zap } from "lucide-react";
import Link from "next/link";
import { useAppRouter } from "@/components/navigation-provider";

const DASHBOARD = gql`
  query DashboardHome {
    health {
      ok
      version
    }
    onboardingStatus {
      hasProject
      hasRepository
      hasPublishedSchema
      hasEnvironment
      hasExecution
      nextStep
      projectCount
      environmentCount
      operationCount
      lastExecutionAt
    }
    executions(limit: 8) {
      id
      status
      durationMs
      createdAt
      operationId
    }
  }
`;

const BOOTSTRAP = gql`
  mutation QuickStartBootstrap($input: BootstrapWorkspaceInput) {
    bootstrapWorkspace(input: $input) {
      onboardingStatus {
        nextStep
        projectCount
        environmentCount
      }
    }
  }
`;

const STEP_META: Record<
  string,
  { title: string; description: string; href: string; cta: string }
> = {
  CREATE_PROJECT: {
    title: "Create a project",
    description: "Group schemas, repos, and operations.",
    href: "/app/projects",
    cta: "Open projects",
  },
  CONNECT_REPO: {
    title: "Connect a repository",
    description: "Index GraphQL operations from source.",
    href: "/app/projects",
    cta: "Open projects",
  },
  PUBLISH_SCHEMA: {
    title: "Publish a schema",
    description: "Upload SDL so Schema Explorer and checks work.",
    href: "/app/projects",
    cta: "Open projects",
  },
  ADD_ENVIRONMENT: {
    title: "Add an environment",
    description: "Point GraphScope at a GraphQL endpoint.",
    href: "/app/environments",
    cta: "Add environment",
  },
  RUN_QUERY: {
    title: "Run a query",
    description: "Execute against your environment and keep history.",
    href: "/app/execute",
    cta: "Open execute",
  },
  DONE: {
    title: "You are set up",
    description: "Keep running queries and exploring your schema.",
    href: "/app/execute",
    cta: "Open execute",
  },
};

function HomeContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(DASHBOARD);
  const [bootstrap, { loading: bootstrapping }] = useMutation(BOOTSTRAP, {
    onCompleted: () => refetch(),
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const status = data?.onboardingStatus;
  const executions = data?.executions ?? [];
  const next =
    STEP_META[status?.nextStep ?? "CREATE_PROJECT"] ?? STEP_META.DONE!;
  const showChecklist = status && status.nextStep !== "DONE";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Home"
        description="Workspace overview and the next useful action."
        action={
          <Badge variant={data?.health?.ok ? "success" : "warning"}>
            API {data?.health?.ok ? `v${data.health.version}` : "checking…"}
          </Badge>
        }
      />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-border/60 pb-6">
        {[
          { label: "Projects", value: status?.projectCount ?? 0, href: "/app/projects", icon: FolderKanban },
          { label: "Operations", value: status?.operationCount ?? 0, href: "/app/operations", icon: Play },
          { label: "Environments", value: status?.environmentCount ?? 0, href: "/app/environments", icon: Zap },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="group min-w-[7rem]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground group-hover:text-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight font-tabular">{stat.value}</p>
          </Link>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {showChecklist && (
            <Button
              variant="ghost"
              size="sm"
              disabled={bootstrapping}
              onClick={() =>
                bootstrap({
                  variables: {
                    input: { projectName: "My project", createDefaultEnvironment: true },
                  },
                })
              }
            >
              Quick start
            </Button>
          )}
          <Button asChild size="sm" className="bg-execute text-execute-foreground hover:bg-execute/90">
            <Link href="/app/execute">
              <Play className="h-4 w-4" strokeWidth={1.5} />
              Run query
            </Link>
          </Button>
        </div>
      </div>

      {showChecklist && (
        <SectionCard
          title="Get started"
          description="Project → environment → execute"
          action={
            <Button asChild size="sm">
              <Link href={next.href}>
                {next.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          }
        >
          <ol className="space-y-3">
            {(
              [
                ["CREATE_PROJECT", status.hasProject],
                ["CONNECT_REPO", status.hasRepository],
                ["PUBLISH_SCHEMA", status.hasPublishedSchema],
                ["ADD_ENVIRONMENT", status.hasEnvironment],
                ["RUN_QUERY", status.hasExecution],
              ] as const
            ).map(([key, done], i) => {
              const meta = STEP_META[key]!;
              return (
                <li key={key} className="flex items-start gap-3 rounded-md bg-muted/40 px-3 py-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold font-tabular ${done ? "bg-primary/15 text-primary" : "bg-background text-muted-foreground"
                      }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{meta.title}</p>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                  {!done && (
                    <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary">
                      <Link href={meta.href}>{meta.cta}</Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </SectionCard>
      )}

      <SectionCard
        title="Recent executions"
        description={
          status?.lastExecutionAt
            ? `Last run ${new Date(status.lastExecutionAt).toLocaleString()}`
            : "No runs yet"
        }
        action={
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link href="/app/history">View history</Link>
          </Button>
        }
      >
        {executions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Run a query to populate history and reuse operations from here.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/app/execute">Open execute</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {executions.map(
              (e: {
                id: string;
                status: string;
                durationMs: number;
                createdAt: string;
                operationId?: string | null;
              }) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge status={e.status} />
                    <span className="truncate text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-tabular text-muted-foreground">{e.durationMs}ms</span>
                    {e.operationId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/app/execute?operationId=${e.operationId}`)}
                      >
                        Re-run
                      </Button>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default function AppPage() {
  return <HomeContent />;
}
