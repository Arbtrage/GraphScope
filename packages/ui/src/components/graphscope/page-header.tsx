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
    <div className={cn("mb-6 space-y-4", className)}>
      {breadcrumbs}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
