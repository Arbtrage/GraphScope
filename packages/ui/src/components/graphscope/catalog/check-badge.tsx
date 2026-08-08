"use client";

import { StatusBadge } from "../status-badge.js";

export function CheckBadge({ status, result }: { status: string; result?: string | null }) {
  return <StatusBadge status={status} label={result ?? status} />;
}
