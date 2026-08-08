"use client";

import { useState } from "react";
import { Button } from "../../ui/button.js";
import { Input } from "../../ui/input.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table.js";
import { EmptyState } from "../empty-state.js";
import { FolderKanban } from "lucide-react";

export function ProjectList({
  projects,
  onCreate,
  onRowClick,
}: {
  projects: Array<{ id: string; name: string; slug: string; createdAt?: string }>;
  onCreate: (input: { name: string; slug: string }) => void | Promise<void>;
  onRowClick?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const createDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="slug (optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={name.trim().length < 1 || creating}
            onClick={async () => {
              setCreating(true);
              try {
                await onCreate({ name: name.trim(), slug: slug || name.trim().toLowerCase().replace(/\s+/g, "-") });
                setName("");
                setSlug("");
                setOpen(false);
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!projects.length) {
    return (
      <>
        <EmptyState
          icon={FolderKanban}
          title="Create your first project"
          description="Projects organize schemas, repositories, and discovered operations."
          actionLabel="New project"
          onAction={() => setOpen(true)}
        />
        {createDialog}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>New project</Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow
                key={p.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(p.id)}
              >
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.slug}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {createDialog}
    </>
  );
}
