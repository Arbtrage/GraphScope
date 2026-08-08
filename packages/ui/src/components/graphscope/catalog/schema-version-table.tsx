"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table.js";
import { EmptyState } from "../empty-state.js";
import { CheckBadge } from "./check-badge.js";

export function SchemaVersionTable({
  versions,
}: {
  versions: Array<{ id: string; contentHash: string; createdAt: string; checks?: Array<{ status: string; result?: string | null }> }>;
}) {
  if (!versions.length) {
    return <EmptyState title="No versions yet" description="Publish a schema to create the first version." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hash</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Check</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-mono text-xs">{v.contentHash.slice(0, 12)}…</TableCell>
              <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <CheckBadge status={v.checks?.[0]?.status ?? "PENDING"} result={v.checks?.[0]?.result} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
