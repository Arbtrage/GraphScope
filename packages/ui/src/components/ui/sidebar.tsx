import * as React from "react";
import { Separator } from "@radix-ui/react-separator";
import { cn } from "../../lib/utils.js";

export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", className)}>{children}</div>;
}

export function SidebarContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-1 overflow-y-auto p-2", className)}>{children}</div>;
}

export function SidebarNav({ className, children }: { className?: string; children: React.ReactNode }) {
  return <nav className={cn("flex flex-col gap-1", className)}>{children}</nav>;
}

export function SidebarNavItem({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-muted font-medium" : "hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}

export function SidebarSeparator() {
  return <Separator className="my-2 bg-sidebar-border" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
