"use client";

import { useState } from "react";
import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import { Textarea } from "../ui/textarea.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.js";
import { StatusBadge } from "./status-badge.js";
import { EmptyState } from "./empty-state.js";
import { FolderKanban } from "lucide-react";

export function PublishDialog({
  onPublish,
  loading,
}: {
  onPublish: (input: { name: string; sdl: string }) => Promise<void>;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("default");
  const [sdl, setSdl] = useState("type Query {\n  hello: String\n}\n");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Publish schema</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish schema</DialogTitle>
          <DialogDescription>Upload SDL to create a new schema version.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schema-name">Name</Label>
            <Input id="schema-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schema-sdl">SDL</Label>
            <Textarea
              id="schema-sdl"
              className="min-h-[160px] font-mono"
              value={sdl}
              onChange={(e) => setSdl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            onClick={async () => {
              await onPublish({ name, sdl });
              setOpen(false);
            }}
          >
            {loading ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CheckBadge({ status, result }: { status: string; result?: string | null }) {
  return <StatusBadge status={status} label={result ?? status} />;
}

export function SchemaVersionTable({
  versions,
}: {
  versions: Array<{ id: string; contentHash: string; createdAt: string; checks?: Array<{ status: string; result?: string | null }> }>;
}) {
  if (!versions.length) {
    return <EmptyState title="No versions yet" description="Publish a schema to create the first version." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hash</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Check</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-mono text-xs">{v.contentHash.slice(0, 12)}…</TableCell>
              <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <CheckBadge status={v.checks?.[0]?.status ?? "PENDING"} result={v.checks?.[0]?.result} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SchemaDiffViewer({ oldSdl, newSdl }: { oldSdl: string; newSdl: string }) {
  const oldLines = new Set(oldSdl.split("\n"));
  const newLines = newSdl.split("\n");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Previous</p>
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">{oldSdl || "—"}</pre>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Current</p>
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          {newLines.map((line, i) => {
            const added = !oldLines.has(line);
            return (
              <span key={i} className={added ? "text-success" : undefined}>
                {line}
                {"\n"}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export function ProjectList({
  projects,
  onCreate,
  onRowClick,
}: {
  projects: Array<{ id: string; name: string; slug: string; createdAt?: string }>;
  onCreate: (input: { name: string; slug: string }) => void;
  onRowClick?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  if (!projects.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Create your first project"
        description="Projects organize schemas, repositories, and discovered operations."
        actionLabel="New project"
        onAction={() => setOpen(true)}
      />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onCreate({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") });
                setName("");
                setSlug("");
                setOpen(false);
              }}
            >
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
