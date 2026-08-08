"use client";

import { Input, Label } from "../../ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.js";
import { useState } from "react";
import { Search } from "lucide-react";

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
