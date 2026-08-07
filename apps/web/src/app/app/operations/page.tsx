"use client";

import { gql, useQuery } from "@apollo/client";
import { ErrorState, FilterBar, OperationTable, PageHeader, PageSkeleton, SectionCard } from "@graphscope/ui";
import { useAppRouter } from "@/components/navigation-provider";
import { useMemo, useState } from "react";

const OPS = gql`
  query OperationsBrowser($filter: OperationsFilter) {
    projects {
      id
      name
    }
    operationsForWorkspace(filter: $filter) {
      id
      name
      operationType
      confidence
      projectId
      projectName
    }
  }
`;

function OperationsContent() {
  const router = useAppRouter();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [operationType, setOperationType] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const filter = useMemo(
    () => ({
      projectId: projectId || undefined,
      operationType: operationType || undefined,
      search: search || undefined,
    }),
    [projectId, operationType, search],
  );

  const { data, loading, error, refetch } = useQuery(OPS, { variables: { filter } });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Operations" description="Browse discovered GraphQL operations across all projects." />
      <SectionCard title="Filters" className="mb-6">
        <FilterBar
          projects={data?.projects ?? []}
          projectId={projectId}
          operationType={operationType}
          search={search}
          onProjectChange={setProjectId}
          onTypeChange={setOperationType}
          onSearchChange={setSearch}
        />
      </SectionCard>
      <SectionCard title="Results">
        <OperationTable
          operations={data?.operationsForWorkspace ?? []}
          showProject
          onRun={(opId) => router.push(`/app/execute?operationId=${opId}`)}
          onView={(opId) => router.push(`/app/operations/${opId}`)}
        />
      </SectionCard>
    </div>
  );
}

export default function OperationsPage() {
  return <OperationsContent />;
}
