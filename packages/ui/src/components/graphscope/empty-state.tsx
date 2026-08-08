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
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && <Icon className="mb-4 h-9 w-9 text-muted-foreground" strokeWidth={1.5} />}
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
