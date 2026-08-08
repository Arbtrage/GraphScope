"use client";

import { StatusBadge } from "../status-badge.js";

export function SyncStatusChip({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
