"use client";

import { Button } from "../../ui/button.js";
import { Input } from "../../ui/input.js";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog.js";
import { EmptyState } from "../empty-state.js";
import { useState } from "react";
import { cn } from "../../../lib/utils.js";

export type CollectionTreeItem = {
  id: string;
  name: string;
  operationId?: string | null;
  queryContent?: string | null;
};

export function CollectionTree({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDeleteItem,
  onOpenItem,
  emptyExecuteHref = "/app/execute",
}: {
  collections: Array<{ id: string; name: string; items?: CollectionTreeItem[] }>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onCreate: (name: string) => void | Promise<void>;
  onRename?: (id: string, name: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onDeleteItem?: (id: string) => void | Promise<void>;
  onOpenItem?: (item: CollectionTreeItem) => void;
  emptyExecuteHref?: string;
}) {
  const [name, setName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const selected = collections.find((c) => c.id === selectedId) ?? collections[0];

  if (!collections.length) {
    return (
      <EmptyState
        title="No collections yet"
        description="Collections are folders of saved GraphQL requests (query + variables) you can reopen in Execute — not your Operations catalog or run History."
        actionLabel="Create collection"
        onAction={() => onCreate("Saved requests")}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="bezel-outer">
        <div className="bezel-inner space-y-3 p-3">
          <div className="flex gap-2">
            <Input
              placeholder="New collection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Collection name"
            />
            <Button
              size="sm"
              disabled={!name.trim()}
              onClick={async () => {
                await onCreate(name.trim());
                setName("");
              }}
            >
              Add
            </Button>
          </div>
          <ul className="space-y-1">
            {collections.map((c) => {
              const count = c.items?.length ?? 0;
              const active = selected?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      active ? "bg-primary/15 font-medium text-foreground" : "hover:bg-muted/60",
                    )}
                    onClick={() => onSelect?.(c.id)}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="font-tabular text-xs text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="bezel-outer">
        <div className="bezel-inner p-4">
          {selected ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Saved requests
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight">{selected.name}</h3>
                </div>
                <div className="flex gap-2">
                  {onRename && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRenameValue(selected.name);
                        setRenameOpen(true);
                      }}
                    >
                      Rename
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="sm" variant="destructive" onClick={() => onDelete(selected.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <ul className="space-y-2">
                {(selected.items ?? []).map((item) => {
                  const preview = (item.queryContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        {preview ? (
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{preview}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            if (onOpenItem) onOpenItem(item);
                            else window.location.href = `/app/execute?itemId=${item.id}`;
                          }}
                        >
                          Open in Execute
                        </Button>
                        {onDeleteItem && (
                          <Button size="sm" variant="ghost" onClick={() => onDeleteItem(item.id)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {!selected.items?.length && (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No saved requests in this collection yet.</p>
                    <Button size="sm" variant="outline" className="mt-3" asChild>
                      <a href={emptyExecuteHref}>Save from Execute</a>
                    </Button>
                  </div>
                )}
              </ul>
            </>
          ) : (
            <EmptyState title="Select a collection" description="Pick a collection on the left to browse saved requests." />
          )}
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename collection</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="New collection name"
            autoFocus
          />
          <DialogFooter>
            <Button
              disabled={!renameValue.trim() || !selected}
              onClick={async () => {
                if (!selected || !onRename) return;
                await onRename(selected.id, renameValue.trim());
                setRenameOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
