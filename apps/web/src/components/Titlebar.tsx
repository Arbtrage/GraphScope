import { BrandMark, Button, Input, Kbd } from "@/components/ui";
import { useExplorer } from "@/store/explorer-store";
import { ArrowsClockwise, CaretDown, FolderOpen, MagnifyingGlass, SidebarSimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

export function Titlebar() {
  const openPalette = useExplorer((s) => s.openPalette);
  const toggleInspector = useExplorer((s) => s.toggleInspector);
  const inspectorOpen = useExplorer((s) => s.inspectorOpen);
  const view = useExplorer((s) => s.view);
  const catalog = useExplorer((s) => s.catalog);
  const pickAndOpenRepository = useExplorer((s) => s.pickAndOpenRepository);
  const openRepositoryPath = useExplorer((s) => s.openRepositoryPath);
  const resyncRepository = useExplorer((s) => s.resyncRepository);
  const scanActive = useExplorer((s) => s.scan.active);
  const hasRepository = useExplorer((s) => s.hasRepository);
  const desktop = Boolean(window.graphscope);
  const [openMenu, setOpenMenu] = useState(false);
  const [pathValue, setPathValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const titles: Record<string, string> = {
    operations: "Operations",
    graph: "Graph",
    schema: "Schema",
    files: "Files",
    endpoints: "Environments",
    search: "Search",
    history: "History",
  };

  const submitPath = (event: FormEvent) => {
    event.preventDefault();
    const next = pathValue.trim();
    if (!next) return;
    setOpenMenu(false);
    setPathValue("");
    void openRepositoryPath(next);
  };

  return (
    <header className="app-drag flex h-[var(--titlebar-h)] shrink-0 items-center gap-3 border-b border-line bg-sidebar px-3 select-none">
      <WindowControls interactive={desktop} />
      <div className="flex items-center gap-2 text-ink">
        <BrandMark size={18} />
        <span className="text-[12px] font-medium tracking-tight">GraphQL Explorer</span>
        <span className="text-faint">/</span>
        <span className="text-[12px] text-mute">{titles[view]}</span>
      </div>
      <Button
        variant="quiet"
        onClick={() => openPalette("search")}
        className="app-no-drag mx-auto h-7 w-[280px] justify-start gap-2 rounded-[7px] bg-app px-2.5 text-faint ring-1 ring-line hover:bg-elevated hover:text-mute"
      >
        <MagnifyingGlass size={13} weight="regular" />
        <span className="flex-1 text-left text-[12px]">Search operations...</span>
        <span className="flex items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>
      <div className="app-no-drag flex items-center gap-2 text-[11px] text-mute">
        <div className="relative" ref={menuRef}>
          <Button
            size="sm"
            onClick={() => setOpenMenu((value) => !value)}
            aria-expanded={openMenu}
            className="h-7 gap-1.5"
          >
            <FolderOpen size={13} />
            Open
            <CaretDown size={10} className="text-faint" />
          </Button>
          {openMenu ? (
            <div className="absolute right-0 z-50 mt-1.5 w-[300px] rounded-[10px] bg-elevated p-2 shadow-[var(--shadow-overlay)] ring-1 ring-line">
              <Button
                variant="quiet"
                className="h-8 w-full justify-start gap-2 px-2 text-[12.5px]"
                onClick={() => {
                  setOpenMenu(false);
                  void pickAndOpenRepository();
                }}
              >
                <FolderOpen size={14} />
                Open folder
              </Button>
              {hasRepository ? (
                <Button
                  variant="quiet"
                  disabled={scanActive}
                  className="h-8 w-full justify-start gap-2 px-2 text-[12.5px]"
                  onClick={() => {
                    setOpenMenu(false);
                    void resyncRepository();
                  }}
                >
                  <ArrowsClockwise size={14} className={scanActive ? "animate-spin" : ""} />
                  Resync index
                </Button>
              ) : null}
              <div className="my-1.5 flex items-center gap-2 px-1">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10px] uppercase tracking-[0.12em] text-faint">or add a path</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <form onSubmit={submitPath} className="flex gap-1.5">
                <Input
                  mono
                  value={pathValue}
                  onChange={(event) => setPathValue(event.target.value)}
                  placeholder="/Users/you/code/app"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="h-8 min-w-0 flex-1 rounded-[7px] px-2 text-[11px]"
                />
                <Button type="submit" variant="primary" size="sm" disabled={!pathValue.trim()} className="h-8 shrink-0">
                  Scan
                </Button>
              </form>
            </div>
          ) : null}
        </div>
        <span className="font-mono">{catalog.repository.branch}</span>
        <Button
          size="sm"
          onClick={toggleInspector}
          aria-pressed={inspectorOpen}
          title="Toggle inspector"
          className={`size-7 p-0 ${
            inspectorOpen ? "bg-active text-accent-text" : "bg-elevated text-mute hover:text-ink"
          }`}
        >
          <SidebarSimple size={14} />
        </Button>
      </div>
    </header>
  );
}

function WindowControls({ interactive }: { interactive: boolean }) {
  const [fullscreen, setFullscreen] = useState(false);
  const controls = window.graphscope?.window;

  useEffect(() => {
    if (!controls) return;
    void controls.getState().then((state) => setFullscreen(state.fullscreen));
    return controls.onState((state) => setFullscreen(state.fullscreen));
  }, [controls]);

  const close = () => {
    if (controls) void controls.close();
  };
  const minimize = () => {
    if (fullscreen || !controls) return;
    void controls.minimize();
  };
  const toggleFullscreen = () => {
    if (!controls) return;
    void controls.toggleFullscreen().then((state) => setFullscreen(state.fullscreen));
  };

  return (
    <div
      className={`app-no-drag group/traffic flex h-full shrink-0 items-center gap-[8px] pr-1 ${
        interactive ? "" : "pointer-events-none"
      }`}
      aria-hidden={!interactive}
    >
      <TrafficButton
        label="Close"
        className="bg-[#ff5f57] text-[#4d0000]"
        onClick={close}
        disabled={!interactive}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </TrafficButton>
      <TrafficButton
        label="Minimize"
        className={`bg-[#febc2e] text-[#5c3b00] ${fullscreen ? "opacity-40" : ""}`}
        onClick={minimize}
        disabled={!interactive || fullscreen}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1.5 4h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </TrafficButton>
      <TrafficButton
        label={fullscreen ? "Exit full screen" : "Enter full screen"}
        className="bg-[#28c840] text-[#0b3d14]"
        onClick={toggleFullscreen}
        disabled={!interactive}
      >
        {fullscreen ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 3.5V1.5H3.5M6.5 4.5v2H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 1.5h2v2M6.5 6.5h-2v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </TrafficButton>
    </div>
  );
}

function TrafficButton({
  label,
  className,
  onClick,
  disabled,
  children,
}: {
  label: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-[12px] items-center justify-center rounded-full ring-1 ring-black/20 ${className}`}
    >
      <span className="hidden group-hover/traffic:block">{children}</span>
    </button>
  );
}
