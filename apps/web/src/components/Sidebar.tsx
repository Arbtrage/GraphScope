import { BrandMark, Button } from "@/components/ui";
import type { ViewId } from "@/data/types";
import { useExplorer } from "@/store/explorer-store";
import {
  ArrowsClockwise,
  CaretUpDown,
  Check,
  ClockCounterClockwise,
  Cube,
  FolderSimple,
  GitBranch,
  Graph,
  ListBullets,
  MagnifyingGlass,
  Plugs,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ComponentType } from "react";

type NavIcon = ComponentType<{ size?: number; weight?: "fill" | "regular"; className?: string }>;

const NAV: Array<{
  label: string;
  items: Array<{ id: ViewId; label: string; icon: NavIcon; shortcut?: string }>;
}> = [
  {
    label: "Explore",
    items: [
      { id: "operations", label: "Operations", icon: ListBullets, shortcut: "⌘1" },
      { id: "graph", label: "Graph", icon: Graph, shortcut: "⌘2" },
      { id: "schema", label: "Schema", icon: Cube, shortcut: "⌘3" },
    ],
  },
  {
    label: "Codebase",
    items: [
      { id: "files", label: "Files", icon: FolderSimple },
      { id: "endpoints", label: "Environments", icon: Plugs },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "search", label: "Search", icon: MagnifyingGlass },
      { id: "history", label: "History", icon: ClockCounterClockwise },
    ],
  },
];

export function Sidebar() {
  const view = useExplorer((s) => s.view);
  const setView = useExplorer((s) => s.setView);
  const catalog = useExplorer((s) => s.catalog);
  const repositories = useExplorer((s) => s.repositories);
  const activeRepositoryId = useExplorer((s) => s.activeRepositoryId);
  const switchRepository = useExplorer((s) => s.switchRepository);
  const resyncRepository = useExplorer((s) => s.resyncRepository);
  const scanActive = useExplorer((s) => s.scan.active);
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const current =
    repositories.find((repo) => repo.id === (activeRepositoryId || catalog.repository.id)) ?? catalog.repository;

  return (
    <aside className="flex h-full w-[var(--nav-w)] shrink-0 flex-col border-r border-line bg-sidebar">
      <div className="px-3 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <BrandMark size={22} />
          <div className="relative min-w-0 flex-1" ref={switcherRef}>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">Project</p>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex w-full min-w-0 items-center gap-1 text-left"
            >
              <p className="truncate text-[13px] font-medium text-ink">{current.name}</p>
              <CaretUpDown size={12} className="shrink-0 text-faint" />
            </button>
            <p className="flex items-center gap-1 font-mono text-[11px] text-mute">
              <GitBranch size={11} />
              {current.branch}
            </p>
            {open ? (
              <div className="absolute z-40 mt-2 w-[calc(var(--nav-w)-24px)] rounded-[10px] bg-elevated p-1 shadow-[var(--shadow-overlay)] ring-1 ring-line">
                {repositories.length ? (
                  repositories.map((repo) => {
                    const active = repo.id === current.id;
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          if (!active) void switchRepository(repo.id);
                        }}
                        className={`flex w-full items-start gap-2 rounded-[7px] px-2 py-1.5 text-left hover:bg-hover ${
                          active ? "bg-active" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] text-ink">{repo.name}</p>
                          <p className="truncate font-mono text-[10px] text-faint">{repo.localPath ?? repo.branch}</p>
                        </div>
                        {active ? <Check size={12} className="mt-0.5 shrink-0 text-accent" /> : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-2 text-[12px] text-mute">No projects yet</p>
                )}
                {current.id ? (
                  <>
                    <div className="my-1 h-px bg-line" />
                    <button
                      type="button"
                      disabled={scanActive}
                      onClick={() => {
                        setOpen(false);
                        void resyncRepository();
                      }}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-ink hover:bg-hover disabled:opacity-40"
                    >
                      <ArrowsClockwise size={13} className={scanActive ? "animate-spin" : ""} />
                      Resync index
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {NAV.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{section.label}</p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = view === item.id;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-[12.5px] transition-colors ${
                        active ? "bg-active text-ink" : "text-mute hover:bg-hover hover:text-ink"
                      }`}
                    >
                      <Icon size={14} weight={active ? "fill" : "regular"} className={active ? "text-accent" : ""} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut ? <span className="font-mono text-[10px] text-faint">{item.shortcut}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <p className="text-[12.5px] font-medium text-ink">{current.name}</p>
        <p className="font-mono text-[11px] text-mute">{current.branch}</p>
        <p className="mt-1 text-[11px] text-faint">{catalog.stats.operations} operations</p>
        {current.id ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            disabled={scanActive}
            onClick={() => void resyncRepository()}
          >
            <ArrowsClockwise size={12} className={scanActive ? "animate-spin" : ""} />
            {scanActive ? "Syncing…" : "Resync"}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
