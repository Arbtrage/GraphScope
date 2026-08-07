"use client";

import { useState } from "react";
import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.js";
import { Badge } from "../ui/badge.js";
import { StatusBadge } from "./status-badge.js";
import { EmptyState } from "./empty-state.js";
import { Search } from "lucide-react";

export function SyncStatusChip({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function FilterBar({
  projects,
  projectId,
  operationType,
  search,
  onProjectChange,
  onTypeChange,
  onSearchChange,
}: {
  projects: Array<{ id: string; name: string }>;
  projectId?: string;
  operationType?: string;
  search?: string;
  onProjectChange: (id: string | undefined) => void;
  onTypeChange: (type: string | undefined) => void;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Project</Label>
        <Select value={projectId ?? "all"} onValueChange={(v) => onProjectChange(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <Select value={operationType ?? "all"} onValueChange={(v) => onTypeChange(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="QUERY">Query</SelectItem>
            <SelectItem value="MUTATION">Mutation</SelectItem>
            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[200px] flex-1 space-y-1">
        <Label className="text-xs">Search</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name…"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export function OperationTable({
  operations,
  onRun,
  onView,
  showProject = false,
}: {
  operations: Array<{
    id: string;
    name: string | null;
    operationType: string;
    confidence: number;
    projectName?: string | null;
  }>;
  onRun?: (id: string) => void;
  onView?: (id: string) => void;
  showProject?: boolean;
}) {
  if (!operations.length) {
    return <EmptyState title="No operations discovered yet" description="Connect a repository and run indexing to discover GraphQL operations." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations.map((op) => (
            <TableRow key={op.id}>
              <TableCell className="font-medium">{op.name ?? "Anonymous"}</TableCell>
              {showProject && <TableCell className="text-muted-foreground">{op.projectName ?? "—"}</TableCell>}
              <TableCell>
                <Badge variant="secondary">{op.operationType}</Badge>
              </TableCell>
              <TableCell>{Math.round(op.confidence * 100)}%</TableCell>
              <TableCell className="space-x-2 text-right">
                {onView && (
                  <Button size="sm" variant="ghost" onClick={() => onView(op.id)}>
                    View
                  </Button>
                )}
                {onRun && (
                  <Button size="sm" variant="outline" onClick={() => onRun(op.id)}>
                    Run
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SourceMapPanel({
  locations,
}: {
  locations: Array<{ path: string; startLine: number; endLine: number; githubUrl?: string | null }>;
}) {
  if (!locations.length) return <p className="text-sm text-muted-foreground">No source locations mapped.</p>;
  return (
    <ul className="space-y-2">
      {locations.map((loc, i) => (
        <li key={i} className="rounded-md border border-border px-3 py-2 font-mono text-xs">
          {loc.githubUrl ? (
            <a href={loc.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {loc.path}:{loc.startLine}-{loc.endLine}
            </a>
          ) : (
            <span>
              {loc.path}:{loc.startLine}-{loc.endLine}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RepoList({
  repos,
  onReindex,
}: {
  repos: Array<{ id: string; sourceType: string; localPath?: string | null; githubRepo?: string | null; status: string }>;
  onReindex?: (id: string) => void;
}) {
  if (!repos.length) return <EmptyState title="No repositories connected" description="Connect a local folder or GitHub repo to discover operations." />;
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repos.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{r.githubRepo ?? r.localPath ?? r.sourceType}</p>
              </TableCell>
              <TableCell>
                <SyncStatusChip status={r.status} />
              </TableCell>
              <TableCell className="text-right">
                {onReindex && (
                  <Button size="sm" variant="outline" onClick={() => onReindex(r.id)}>
                    Reindex
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EnableRepoForm({
  onEnable,
}: {
  onEnable: (input: { sourceType: "LOCAL" | "GITHUB"; localPath?: string; githubRepo?: string }) => void;
}) {
  const [sourceType, setSourceType] = useState<"LOCAL" | "GITHUB">("LOCAL");
  const [localPath, setLocalPath] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant={sourceType === "LOCAL" ? "default" : "outline"} size="sm" onClick={() => setSourceType("LOCAL")}>
          Local folder
        </Button>
        <Button variant={sourceType === "GITHUB" ? "default" : "outline"} size="sm" onClick={() => setSourceType("GITHUB")}>
          GitHub
        </Button>
      </div>
      {sourceType === "LOCAL" ? (
        <Input placeholder="/path/to/repo" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
      ) : (
        <Input placeholder="owner/repo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
      )}
      <Button
        onClick={() =>
          onEnable({
            sourceType,
            localPath: sourceType === "LOCAL" ? localPath : undefined,
            githubRepo: sourceType === "GITHUB" ? githubRepo : undefined,
          })
        }
      >
        Enable & index
      </Button>
    </div>
  );
}
