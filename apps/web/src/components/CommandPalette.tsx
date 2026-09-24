import { Input, Kbd } from "@/components/ui";
import { searchCatalog } from "@/data/catalog";
import type { EntityKind } from "@/data/types";
import { useExplorer } from "@/store/explorer-store";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface PaletteItem {
  id: string;
  kind: EntityKind;
  title: string;
  subtitle: string;
}

export function CommandPalette() {
  const open = useExplorer((s) => s.paletteOpen);
  const mode = useExplorer((s) => s.paletteMode);
  const catalog = useExplorer((s) => s.catalog);
  const closePalette = useExplorer((s) => s.closePalette);
  const select = useExplorer((s) => s.select);
  const openOperation = useExplorer((s) => s.openOperation);
  const setView = useExplorer((s) => s.setView);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  const items = useMemo(() => {
    const found = searchCatalog(catalog, query);
    const ops: PaletteItem[] = found.operations.map((item) => ({
      id: item.id,
      kind: "operation",
      title: item.name,
      subtitle: `${capitalize(item.kind)}  ${item.source.path}`,
    }));
    if (mode === "operations") return ops;
    const fragments: PaletteItem[] = found.fragments.map((item) => ({
      id: item.id,
      kind: "fragment",
      title: item.name,
      subtitle: `Fragment  ${item.source.path}`,
    }));
    const types: PaletteItem[] = found.types.map((item) => ({
      id: item.id,
      kind: "type",
      title: item.name,
      subtitle: "Type  Schema",
    }));
    const files: PaletteItem[] = found.files.map((item) => ({
      id: item.id,
      kind: "file",
      title: item.path.split("/").pop() ?? item.path,
      subtitle: item.path,
    }));
    return [...ops, ...fragments, ...types, ...files].slice(0, 16);
  }, [query, mode, catalog]);

  useEffect(() => {
    setActive(0);
  }, [query, mode]);

  if (!open) return null;

  function activate(item: PaletteItem) {
    if (item.kind === "operation") openOperation(item.id);
    else if (item.kind === "type") {
      select({ kind: "type", id: item.id });
      setView("schema");
    } else if (item.kind === "file") {
      select({ kind: "file", id: item.id });
      setView("files");
    } else {
      select({ kind: item.kind, id: item.id });
      setView("graph");
    }
    closePalette();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-[18vh]" onMouseDown={closePalette}>
      <div
        role="dialog"
        aria-label="Search GraphQL Explorer"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-[12px] bg-elevated shadow-[var(--shadow-overlay)] ring-1 ring-line-strong"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <MagnifyingGlass size={15} className="text-faint" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(items.length - 1, value + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(0, value - 1));
              } else if (event.key === "Enter" && items[active]) {
                event.preventDefault();
                activate(items[active]);
              } else if (event.key === "Escape") {
                event.preventDefault();
                closePalette();
              }
            }}
            placeholder={mode === "operations" ? "Quick open operation..." : "Search operations..."}
            className="h-11 flex-1 border-0 bg-transparent px-0 text-[14px] ring-0 focus:ring-0"
          />
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
        <ul className="max-h-[360px] overflow-y-auto p-1.5 scrollbar-thin">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12px] text-mute">No matches in {catalog.repository.name}</li>
          ) : (
            items.map((item, index) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => activate(item)}
                  className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left ${
                    index === active ? "bg-active" : ""
                  }`}
                >
                  <span>
                    <span className="block text-[13px] text-ink">{item.title}</span>
                    <span className="block font-mono text-[11px] text-faint">{item.subtitle}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-mute">{item.kind}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
