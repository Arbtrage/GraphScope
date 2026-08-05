import * as React from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from "../ui/sidebar.js";

export interface AppShellProps {
  workspaceSwitcher?: React.ReactNode;
  topBarActions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ workspaceSwitcher, topBarActions, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-primary">GraphScope</span>
          {workspaceSwitcher}
        </div>
        <div className="flex items-center gap-2">{topBarActions}</div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar>
          <SidebarHeader>
            <span className="text-sm font-medium text-muted-foreground">Navigation</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav>
              <SidebarNavItem active>Home</SidebarNavItem>
              <SidebarNavItem>Collections</SidebarNavItem>
              <SidebarNavItem>History</SidebarNavItem>
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
