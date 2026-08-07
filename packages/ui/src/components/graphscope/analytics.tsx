"use client";

import { Badge } from "../ui/badge.js";
import { EmptyState } from "./empty-state.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.js";

const SEVERITY_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function FindingSeverityBadge({ severity }: { severity: string }) {
  return <Badge variant={SEVERITY_VARIANT[severity] ?? "secondary"}>{severity}</Badge>;
}

export function FindingsList({
  findings,
}: {
  findings: Array<{ id: string; ruleId: string; severity: string; message: string; path?: string | null }>;
}) {
  if (!findings.length) {
    return <EmptyState title="No findings" description="This operation passed all GS001–GS007 checks." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rule</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.ruleId}</TableCell>
              <TableCell>
                <FindingSeverityBadge severity={f.severity} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{f.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function LatencyChart({ p50Ms, p95Ms }: { p50Ms?: number | null; p95Ms?: number | null }) {
  const p50 = p50Ms ?? 0;
  const p95 = p95Ms ?? 0;
  const max = Math.max(p50, p95, 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-12 rounded-t bg-primary/80"
            style={{ height: `${Math.max(8, (p50 / max) * 120)}px` }}
            title={`p50: ${Math.round(p50)}ms`}
          />
          <span className="text-xs text-muted-foreground">p50</span>
          <span className="text-sm font-medium">{p50 ? `${Math.round(p50)}ms` : "—"}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-12 rounded-t bg-warning/80"
            style={{ height: `${Math.max(8, (p95 / max) * 120)}px` }}
            title={`p95: ${Math.round(p95)}ms`}
          />
          <span className="text-xs text-muted-foreground">p95</span>
          <span className="text-sm font-medium">{p95 ? `${Math.round(p95)}ms` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

export function CompositionBadge({
  ok,
  errors,
  schemaCount,
}: {
  ok: boolean;
  errors: string[];
  schemaCount: number;
}) {
  if (schemaCount < 2) {
    return <Badge variant="secondary">Single schema</Badge>;
  }
  if (ok) {
    return <Badge variant="success">{schemaCount} schemas composed</Badge>;
  }
  return (
    <div className="space-y-1">
      <Badge variant="destructive">Composition failed</Badge>
      <ul className="text-xs text-destructive">
        {errors.slice(0, 3).map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
