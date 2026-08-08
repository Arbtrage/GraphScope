"use client";

import { Button } from "../../ui/button.js";
import { Badge } from "../../ui/badge.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table.js";
import { EmptyState } from "../empty-state.js";

export function OperationTable({
  operations,
  onRun,
  onView,
  showProject = false,
}: {
  operations: Array<{
    id: string;
    name: string | null;
    operationType: string;
    confidence: number;
    projectName?: string | null;
  }>;
  onRun?: (id: string) => void;
  onView?: (id: string) => void;
  showProject?: boolean;
}) {
  if (!operations.length) {
    return <EmptyState title="No operations discovered yet" description="Connect a repository and run indexing to discover GraphQL operations." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations.map((op) => (
            <TableRow key={op.id}>
              <TableCell className="font-medium">{op.name ?? "Anonymous"}</TableCell>
              {showProject && <TableCell className="text-muted-foreground">{op.projectName ?? "—"}</TableCell>}
              <TableCell>
                <Badge variant="secondary">{op.operationType}</Badge>
              </TableCell>
              <TableCell>{Math.round(op.confidence * 100)}%</TableCell>
              <TableCell className="space-x-2 text-right">
                {onView && (
                  <Button size="sm" variant="ghost" onClick={() => onView(op.id)}>
                    View
                  </Button>
                )}
                {onRun && (
                  <Button size="sm" variant="outline" onClick={() => onRun(op.id)}>
                    Run
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
