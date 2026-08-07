"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.js";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center", className)}>
      {Icon && <Icon className="mb-4 h-10 w-10 text-muted-foreground" />}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
