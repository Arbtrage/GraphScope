"use client";

import * as React from "react";
import { cn } from "../../lib/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.js";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
