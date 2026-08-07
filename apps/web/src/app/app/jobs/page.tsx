"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Button,
  EmptyState,
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
} from "@graphscope/ui";
import { useGraphMutation } from "@/hooks/use-graph-mutation";

const JOBS = gql`
  query Jobs {
    jobs(limit: 50) {
      id
      jobType
      status
      createdAt
      updatedAt
      attempts
      lastError
      payload
    }
  }
`;

const RETRY_JOB = gql`
  mutation RetryJob($id: ID!) {
    retryJob(id: $id) {
      id
      status
    }
  }
`;

type Job = {
  id: string;
  jobType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError?: string | null;
  payload: Record<string, unknown>;
};

function JobsTable({ jobs, onRetry }: { jobs: Job[]; onRetry: (id: string) => void }) {
  if (!jobs.length) {
    return <EmptyState title="No background jobs" description="Repository sync and schema checks appear here." />;
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-sm">{job.jobType}</TableCell>
              <TableCell>
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell>{job.attempts}</TableCell>
              <TableCell className="max-w-xs truncate text-xs text-destructive">{job.lastError ?? "—"}</TableCell>
              <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                {job.status === "FAILED" && (
                  <Button size="sm" variant="outline" onClick={() => onRetry(job.id)}>
                    Retry
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function JobsPage() {
  const { data, loading, error, refetch } = useQuery(JOBS);
  const [retryJob] = useGraphMutation(RETRY_JOB, {
    successMessage: "Job requeued",
    onCompleted: () => refetch(),
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Jobs" description="Background tasks for repository indexing and schema checks." />
      <SectionCard title="Recent jobs">
        <JobsTable
          jobs={data?.jobs ?? []}
          onRetry={async (id) => {
            await retryJob({ variables: { id } });
          }}
        />
      </SectionCard>
    </div>
  );
}
