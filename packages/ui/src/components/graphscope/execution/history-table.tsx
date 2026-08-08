"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table.js";
import { StatusBadge } from "../status-badge.js";
import { EmptyState } from "../empty-state.js";

export function HistoryTable({
  executions,
  onRowClick,
}: {
  executions: Array<{
    id: string;
    status: string;
    durationMs: number;
    createdAt: string;
    httpStatus?: number | null;
    operationId?: string | null;
    responsePreview?: string | null;
  }>;
  onRowClick?: (execution: (typeof executions)[number]) => void;
}) {
  if (!executions.length) {
    return <EmptyState title="No executions yet" description="Run a query from Execute to see history here." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>HTTP</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((e) => (
            <TableRow key={e.id} className={onRowClick ? "cursor-pointer" : undefined} onClick={() => onRowClick?.(e)}>
              <TableCell>
                <StatusBadge status={e.status} />
              </TableCell>
              <TableCell>{e.httpStatus ?? "—"}</TableCell>
              <TableCell>{e.durationMs}ms</TableCell>
              <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
