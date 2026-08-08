"use client";

import { Button } from "../../ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table.js";
import { EmptyState } from "../empty-state.js";
import { SyncStatusChip } from "./sync-status-chip.js";

export function RepoList({
  repos,
  onReindex,
}: {
  repos: Array<{ id: string; sourceType: string; localPath?: string | null; githubRepo?: string | null; status: string }>;
  onReindex?: (id: string) => void;
}) {
  if (!repos.length) return <EmptyState title="No repositories connected" description="Connect a local folder or GitHub repo to discover operations." />;
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repos.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{r.githubRepo ?? r.localPath ?? r.sourceType}</p>
              </TableCell>
              <TableCell>
                <SyncStatusChip status={r.status} />
              </TableCell>
              <TableCell className="text-right">
                {onReindex && (
                  <Button size="sm" variant="outline" onClick={() => onReindex(r.id)}>
                    Reindex
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
