"use client";

import { Badge } from "../../ui/badge.js";
import { StatusBadge } from "../status-badge.js";

export function ResponsePanel({
  result,
  status,
  durationMs,
  httpStatus,
}: {
  result?: string;
  status?: string;
  durationMs?: number;
  httpStatus?: number | null;
}) {
  let formatted = result;
  if (result) {
    try {
      formatted = JSON.stringify(JSON.parse(result), null, 2);
    } catch {
      formatted = result;
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status && <StatusBadge status={status} />}
        {httpStatus != null && <Badge variant="outline">HTTP {httpStatus}</Badge>}
        {durationMs != null && <Badge variant="secondary">{durationMs}ms</Badge>}
        {!status && <span className="text-xs text-muted-foreground">Response</span>}
      </div>
      <pre className="min-h-[280px] flex-1 overflow-auto rounded-[calc(1.75rem-0.75rem)] bg-muted/30 p-3 font-mono text-xs">
        {formatted ?? "Run a query to see the response."}
      </pre>
    </div>
  );
}
