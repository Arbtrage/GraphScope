import * as React from "react";
import { Sidebar, SidebarContent, SidebarNav, SidebarNavItem } from "../ui/sidebar.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.js";
import { Menu, X } from "lucide-react";

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
  fullBleed?: boolean;
  children: React.ReactNode;
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7L12 2.5Zm0 2.3L6.5 8.1v7.8L12 19.2l5.5-3.3V8.1L12 4.8Z" />
          <path d="M12 8.2 15.2 10v4L12 15.8 8.8 14v-4L12 8.2Z" opacity="0.7" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">GraphScope</span>
    </span>
  );
}

function NavLink({
  item,
  renderLink,
  onNavigate,
}: {
  item: NavItem;
  renderLink?: AppShellProps["renderLink"];
  onNavigate?: () => void;
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
        {renderLink({
          href: item.href,
          className: "block",
          children: (
            <span className="flex w-full items-center gap-2" onClick={onNavigate}>
              {inner}
            </span>
          ),
        })}
      </SidebarNavItem>
    );
  }

  return (
    <SidebarNavItem active={item.active} asChild>
      <a href={item.href} onClick={onNavigate}>
        {inner}
      </a>
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
  fullBleed = false,
  children,
}: AppShellProps) {
  const groups = navGroups ?? [{ label: "Navigation", items: navItems }];
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="relative flex h-dvh min-h-dvh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-nowrap focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-tinted-md focus:outline-none"
      >
        Skip to content
      </a>
      <header className="desktop-drag flex h-14 shrink-0 items-center justify-between border-b border-border px-4 desktop-titlebar-pad">
        <div className="desktop-no-drag flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
          </Button>
          {renderLink ? (
            renderLink({
              href: "/app",
              className: "transition-opacity hover:opacity-80",
              children: <BrandMark />,
            })
          ) : (
            <a href="/app" className="transition-opacity hover:opacity-80">
              <BrandMark />
            </a>
          )}
          {workspaceSwitcher}
        </div>
        <div className="desktop-no-drag flex items-center gap-2">{topBarActions}</div>
      </header>
      <div className="flex min-h-0 flex-1">
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            aria-label="Dismiss navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar
          className={cn(
            "fixed inset-y-0 left-0 z-40 mt-14 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:static md:mt-0 md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <SidebarContent className="pt-3">
            {groups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <SidebarNav>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      renderLink={renderLink}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </SidebarNav>
              </div>
            ))}
          </SidebarContent>
        </Sidebar>
        <main
          id="main-content"
          className={cn("min-w-0 flex-1 overflow-y-auto", fullBleed ? "p-0" : "p-4 md:p-6 lg:px-8")}
        >
          {fullBleed ? children : <div className="mx-auto w-full max-w-[1400px]">{children}</div>}
        </main>
        {rightPanel}
      </div>
      <div className="noise-overlay" aria-hidden />
    </div>
  );
}
