"use client";

import { Badge } from "../ui/badge.js";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  SUCCESS: "success",
  PASSED: "success",
  INDEXED: "success",
  CONNECTED: "success",
  SAFE: "success",
  GRAPHQL_ERROR: "warning",
  DANGEROUS: "warning",
  SYNCING: "warning",
  RUNNING: "warning",
  PENDING: "secondary",
  COMPLETED: "success",
  FAILED: "destructive",
  ERROR: "destructive",
  TRANSPORT_ERROR: "destructive",
  BLOCKED: "destructive",
  TIMEOUT: "destructive",
  BREAKING: "destructive",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const variant = STATUS_VARIANT[status] ?? "secondary";
  return <Badge variant={variant}>{label ?? status}</Badge>;
}
