"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils.js";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  renderLink,
  className,
}: {
  items: BreadcrumbItem[];
  renderLink?: (props: { href: string; children: React.ReactNode }) => React.ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <ChevronRight className="h-4 w-4 shrink-0" />}
          {item.href ? (
            renderLink ? (
              renderLink({ href: item.href, children: <span className="hover:text-foreground">{item.label}</span> })
            ) : (
              <a href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            )
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
