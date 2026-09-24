import { CommandPalette } from "@/components/CommandPalette";
import { Inspector } from "@/components/Inspector";
import { RunWorkbench } from "@/components/RunWorkbench";
import { ScanOverlay } from "@/components/ScanOverlay";
import { Sidebar } from "@/components/Sidebar";
import { Titlebar } from "@/components/Titlebar";
import { EndpointsView } from "@/views/EndpointsView";
import { FilesView } from "@/views/FilesView";
import { GraphView } from "@/views/GraphView";
import { HistoryView } from "@/views/HistoryView";
import { OperationsView } from "@/views/OperationsView";
import { SchemaView } from "@/views/SchemaView";
import { SearchView } from "@/views/SearchView";
import type { ViewId } from "@/data/types";
import { useExplorer } from "@/store/explorer-store";
import { useEffect } from "react";

const VIEW: Record<string, ViewId> = {
  "1": "operations",
  "2": "graph",
  "3": "schema",
  "4": "files",
};

export default function App() {
  const view = useExplorer((s) => s.view);
  const runOpen = useExplorer((s) => s.runOpen);
  const selected = useExplorer((s) => s.selected);
  const catalog = useExplorer((s) => s.catalog);
  const inspectorOpen = useExplorer((s) => s.inspectorOpen);
  const toast = useExplorer((s) => s.toast);
  const boot = useExplorer((s) => s.boot);

  const runOperation =
    runOpen && selected?.kind === "operation" ? catalog.operationsById[selected.id] : null;

  useEffect(() => {
    void boot();
    const off = window.graphscope?.onOpenRoute?.((path) => {
      if (path === "open-repository") void useExplorer.getState().pickAndOpenRepository();
    });
    return () => off?.();
  }, [boot]);

  useHotkeys();
  useNarrowInspector();

  return (
    <div className="flex h-full min-w-[1120px] flex-col bg-app text-ink">
      <Titlebar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-panel">
          <div className="min-h-0 flex-1 overflow-hidden">
            {runOperation ? <RunWorkbench /> : null}
            {!runOperation && view === "operations" ? <OperationsView /> : null}
            {!runOperation && view === "graph" ? <GraphView /> : null}
            {!runOperation && view === "schema" ? <SchemaView /> : null}
            {!runOperation && view === "files" ? <FilesView /> : null}
            {!runOperation && view === "endpoints" ? <EndpointsView /> : null}
            {!runOperation && view === "search" ? <SearchView /> : null}
            {!runOperation && view === "history" ? <HistoryView /> : null}
          </div>
        </main>
        {inspectorOpen ? <Inspector /> : null}
      </div>
      <CommandPalette />
      <ScanOverlay />
      {toast ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-[8px] bg-elevated px-3 py-1.5 text-[12px] text-ink shadow-[var(--shadow-overlay)] ring-1 ring-line">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

function useNarrowInspector() {
  const setInspectorOpen = useExplorer((s) => s.setInspectorOpen);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const apply = () => {
      if (media.matches) setInspectorOpen(false);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [setInspectorOpen]);
}

function useHotkeys() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const state = useExplorer.getState();

      if (event.key === "Escape") {
        if (state.escape()) event.preventDefault();
        return;
      }

      if (meta && key === "k") {
        event.preventDefault();
        if (state.paletteOpen) state.closePalette();
        else state.openPalette("search");
        return;
      }
      if (meta && key === "p") {
        event.preventDefault();
        state.openPalette("operations");
        return;
      }
      if (meta && event.key === "Enter") {
        event.preventDefault();
        const selected = state.selected;
        if (selected?.kind === "operation" && state.catalog.operationsById[selected.id]) {
          state.openRun();
          state.executeRun();
        }
        return;
      }
      if (meta && VIEW[event.key]) {
        event.preventDefault();
        state.setView(VIEW[event.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
