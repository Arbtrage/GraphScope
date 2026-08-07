import * as React from "react";
import { Sidebar, SidebarContent, SidebarNav, SidebarNavItem } from "../ui/sidebar.js";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface AppShellProps {
  workspaceSwitcher?: React.ReactNode;
  topBarActions?: React.ReactNode;
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  renderLink?: (props: { href: string; className?: string; children: React.ReactNode }) => React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({
  item,
  renderLink,
}: {
  item: NavItem;
  renderLink?: AppShellProps["renderLink"];
}) {
  const inner = (
    <>
      {item.icon}
      {item.label}
    </>
  );

  if (renderLink) {
    return (
      <SidebarNavItem active={item.active} asChild>
        {renderLink({ href: item.href, children: inner })}
      </SidebarNavItem>
    );
  }

  return (
    <SidebarNavItem active={item.active} asChild>
      <a href={item.href}>{inner}</a>
    </SidebarNavItem>
  );
}

export function AppShell({
  workspaceSwitcher,
  topBarActions,
  navItems = [],
  navGroups,
  renderLink,
  rightPanel,
  children,
}: AppShellProps) {
  const groups = navGroups ?? [{ label: "Navigation", items: navItems }];

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          {renderLink ? (
            renderLink({
              href: "/app",
              className: "text-lg font-semibold text-primary",
              children: "GraphScope",
            })
          ) : (
            <a href="/app" className="text-lg font-semibold text-primary">
              GraphScope
            </a>
          )}
          {workspaceSwitcher}
        </div>
        <div className="flex items-center gap-2">{topBarActions}</div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar>
          <SidebarContent className="pt-4">
            {groups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <SidebarNav>
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} renderLink={renderLink} />
                  ))}
                </SidebarNav>
              </div>
            ))}
          </SidebarContent>
        </Sidebar>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
        {rightPanel}
      </div>
    </div>
  );
}
