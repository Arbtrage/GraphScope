"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, WorkspaceSwitcherTrigger } from "../ui/dropdown-menu.js";
import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import * as React from "react";

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

export interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => void;
  onCreate: (input: { name: string; slug: string }) => Promise<void>;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  onCreate,
}: WorkspaceSwitcherProps) {
  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await onCreate({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") });
      setName("");
      setSlug("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <WorkspaceSwitcherTrigger label={active?.name ?? "Select workspace"} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => onSwitch(w.id)}>
              {w.name}
              {w.id === activeWorkspaceId ? " ✓" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            New workspace
          </Button>
        </DialogTrigger>
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
    </div>
  );
}
