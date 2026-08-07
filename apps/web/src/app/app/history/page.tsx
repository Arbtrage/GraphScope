"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Button,
  ErrorState,
  HistoryTable,
  PageHeader,
  PageSkeleton,
  SectionCard,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  StatusBadge,
} from "@graphscope/ui";
import { useAppRouter } from "@/components/navigation-provider";
import { useState } from "react";

const HISTORY = gql`
  query History {
    executions(limit: 50) {
      id
      status
      durationMs
      createdAt
      httpStatus
      operationId
      responsePreview
    }
  }
`;

type Execution = {
  id: string;
  status: string;
  durationMs: number;
  createdAt: string;
  httpStatus?: number | null;
  operationId?: string | null;
  responsePreview?: string | null;
};

function HistoryContent() {
  const router = useAppRouter();
  const { data, loading, error, refetch } = useQuery(HISTORY);
  const [selected, setSelected] = useState<Execution | null>(null);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="History" description="Recent GraphQL execution results." />
      <SectionCard title="Executions">
        <HistoryTable executions={data?.executions ?? []} onRowClick={setSelected} />
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Execution detail</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                {selected.httpStatus != null && <span className="text-sm text-muted-foreground">HTTP {selected.httpStatus}</span>}
                <span className="text-sm text-muted-foreground">{selected.durationMs}ms</span>
              </div>
              <pre className="max-h-[60vh] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                {selected.responsePreview ?? "No preview available."}
              </pre>
              {selected.operationId && (
                <Button onClick={() => router.push(`/app/execute?operationId=${selected.operationId}`)}>
                  Re-run
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function HistoryPage() {
  return <HistoryContent />;
}
