"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  WorkspaceSwitcherTrigger,
} from "../ui/dropdown-menu.js";
import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import { cn } from "../../lib/utils.js";
import { Check, Plus } from "lucide-react";
import * as React from "react";

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => Promise<void>;
  onCreate: (input: { name: string; slug: string }) => Promise<void>;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  onCreate,
}: WorkspaceSwitcherProps) {
  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  async function handleSelect(workspaceId: string) {
    if (workspaceId === activeWorkspaceId || switchingId) return;
    setMenuOpen(false);
    setSwitchingId(workspaceId);
    try {
      await onSwitch(workspaceId);
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await onCreate({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") });
      setName("");
      setSlug("");
      setDialogOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <WorkspaceSwitcherTrigger
            label={switchingId ? "Switching…" : (active?.name ?? "Select workspace")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length === 0 ? (
            <DropdownMenuItem disabled>No workspaces yet</DropdownMenuItem>
          ) : (
            workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                disabled={!!switchingId}
                onSelect={() => void handleSelect(w.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    w.id === activeWorkspaceId ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className={cn(w.id === activeWorkspaceId && "font-medium")}>{w.name}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create workspace…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
              <DialogDescription>A workspace groups your GraphQL projects and collections.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ws-slug">Slug</Label>
                <Input id="ws-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-team" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
