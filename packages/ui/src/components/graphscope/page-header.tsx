"use client";

import * as React from "react";
import { cn } from "../../lib/utils.js";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 space-y-3", className)}>
      {breadcrumbs}
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
