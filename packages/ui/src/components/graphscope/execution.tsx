"use client";

import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import { Textarea } from "../ui/textarea.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.js";
import { Badge } from "../ui/badge.js";
import { StatusBadge } from "./status-badge.js";
import { EmptyState } from "./empty-state.js";
import { useState } from "react";
import type * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

export function EnvPicker({
  environments,
  activeId,
  onChange,
}: {
  environments: Array<{ id: string; name: string }>;
  activeId: string | null;
  onChange: (id: string) => void;
}) {
  if (!environments.length) {
    return <Badge variant="warning">No environment</Badge>;
  }
  return (
    <Select value={activeId ?? environments[0]?.id} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Environment" />
      </SelectTrigger>
      <SelectContent>
        {environments.map((env) => (
          <SelectItem key={env.id} value={env.id}>
            {env.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HeadersEditor({
  headers,
  onChange,
}: {
  headers: Array<{ key: string; value: string }>;
  onChange: (headers: Array<{ key: string; value: string }>) => void;
}) {
  const update = (index: number, field: "key" | "value", val: string) => {
    const next = headers.map((h, i) => (i === index ? { ...h, [field]: val } : h));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder="Header" value={h.key} onChange={(e) => update(i, "key", e.target.value)} />
          <Input placeholder="Value" value={h.value} onChange={(e) => update(i, "value", e.target.value)} />
          <Button variant="ghost" size="sm" onClick={() => onChange(headers.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...headers, { key: "", value: "" }])}>
        Add header
      </Button>
    </div>
  );
}

export function VariablesForm({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-2">
      <Textarea className="min-h-[120px] font-mono text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function SecretForm({ onSubmit }: { onSubmit: (input: { name: string; value: string }) => void }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder="Secret name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input type="password" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => { onSubmit({ name, value }); setName(""); setValue(""); }}>Save</Button>
    </div>
  );
}

export function ResponsePanel({
  result,
  status,
  durationMs,
  httpStatus,
}: {
  result?: string;
  status?: string;
  durationMs?: number;
  httpStatus?: number | null;
}) {
  let formatted = result;
  if (result) {
    try {
      formatted = JSON.stringify(JSON.parse(result), null, 2);
    } catch {
      formatted = result;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status && <StatusBadge status={status} />}
        {httpStatus != null && <Badge variant="outline">HTTP {httpStatus}</Badge>}
        {durationMs != null && <Badge variant="secondary">{durationMs}ms</Badge>}
      </div>
      <pre className="min-h-[320px] overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
        {formatted ?? "Run a query to see the response."}
      </pre>
    </div>
  );
}

export function OperationRunner({
  initialQuery = "query { __typename }",
  initialVariables = "{}",
  initialHeaders = "{}",
  environments,
  onExecute,
  result,
  loading,
  queryEditor,
  query: controlledQuery,
  onQueryChange,
  executionMeta,
  emptyEnvironmentHref,
  resizable = false,
}: {
  initialQuery?: string;
  initialVariables?: string;
  initialHeaders?: string;
  environments: Array<{ id: string; name: string }>;
  onExecute: (input: { environmentId: string; query: string; variables: string; headers: string }) => void;
  result?: string;
  loading?: boolean;
  queryEditor?: React.ReactNode;
  query?: string;
  onQueryChange?: (query: string) => void;
  executionMeta?: { status?: string; durationMs?: number; httpStatus?: number | null };
  emptyEnvironmentHref?: string;
  resizable?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const activeQuery = controlledQuery ?? query;
  const setActiveQuery = onQueryChange ?? setQuery;
  const [variables, setVariables] = useState(initialVariables);
  const [headers, setHeaders] = useState(initialHeaders);
  const [envId, setEnvId] = useState(environments[0]?.id ?? "");
  const [varError, setVarError] = useState<string | undefined>();

  if (!environments.length && emptyEnvironmentHref) {
    return (
      <EmptyState
        title="No environment configured"
        description="Create an environment with a GraphQL endpoint before running queries."
        actionLabel="Go to Environments"
        onAction={() => { window.location.href = emptyEnvironmentHref; }}
      />
    );
  }

  const handleExecute = () => {
    try {
      JSON.parse(variables || "{}");
      JSON.parse(headers || "{}");
      setVarError(undefined);
      onExecute({ environmentId: envId, query: activeQuery, variables, headers });
    } catch {
      setVarError("Invalid JSON in variables or headers");
    }
  };

  const editorPanel = (
    <div className="space-y-4">
      <EnvPicker environments={environments} activeId={envId} onChange={setEnvId} />
      <Tabs defaultValue="query">
        <TabsList>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>
        <TabsContent value="query">
          {queryEditor ?? (
            <Textarea
              className="min-h-[280px] font-mono text-sm"
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
            />
          )}
        </TabsContent>
        <TabsContent value="variables">
          <VariablesForm value={variables} onChange={setVariables} error={varError} />
        </TabsContent>
        <TabsContent value="headers">
          <VariablesForm value={headers} onChange={setHeaders} />
        </TabsContent>
      </Tabs>
      <Button variant="default" className="bg-execute text-execute-foreground hover:bg-execute/90" disabled={!envId || loading} onClick={handleExecute}>
        {loading ? "Running…" : "Execute"}
      </Button>
    </div>
  );

  if (resizable) {
    return (
      <Group orientation="horizontal" className="min-h-[520px] rounded-lg border border-border">
        <Panel defaultSize="50" minSize="30">
          <div className="h-full overflow-auto p-4">{editorPanel}</div>
        </Panel>
        <Separator className="w-1.5 bg-border transition-colors hover:bg-primary/30" />
        <Panel defaultSize="50" minSize="25">
          <div className="h-full overflow-auto p-4">
            <ResponsePanel result={result} {...executionMeta} />
          </div>
        </Panel>
      </Group>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {editorPanel}
      <ResponsePanel result={result} {...executionMeta} />
    </div>
  );
}

export function HistoryTable({
  executions,
  onRowClick,
}: {
  executions: Array<{
    id: string;
    status: string;
    durationMs: number;
    createdAt: string;
    httpStatus?: number | null;
    operationId?: string | null;
    responsePreview?: string | null;
  }>;
  onRowClick?: (execution: (typeof executions)[number]) => void;
}) {
  if (!executions.length) {
    return <EmptyState title="No executions yet" description="Run a query from Execute to see history here." />;
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>HTTP</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((e) => (
            <TableRow key={e.id} className={onRowClick ? "cursor-pointer" : undefined} onClick={() => onRowClick?.(e)}>
              <TableCell>
                <StatusBadge status={e.status} />
              </TableCell>
              <TableCell>{e.httpStatus ?? "—"}</TableCell>
              <TableCell>{e.durationMs}ms</TableCell>
              <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CollectionTree({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  collections: Array<{ id: string; name: string; items?: Array<{ id: string; name: string; operationId?: string | null }> }>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onCreate: (name: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const selected = collections.find((c) => c.id === selectedId) ?? collections[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex gap-2">
          <Input placeholder="Collection name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            size="sm"
            onClick={() => {
              onCreate(name);
              setName("");
            }}
          >
            Add
          </Button>
        </div>
        <ul className="space-y-1">
          {collections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${selected?.id === c.id ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
                onClick={() => onSelect?.(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border p-4">
        {selected ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">{selected.name}</h3>
              <div className="flex gap-2">
                {onRename && (
                  <Button size="sm" variant="outline" onClick={() => onRename(selected.id, selected.name)}>
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
              {(selected.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="flex-1">{item.name}</span>
                  {item.operationId && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/app/execute?operationId=${item.operationId}`}>Open</a>
                    </Button>
                  )}
                </li>
              ))}
              {!selected.items?.length && <p className="text-sm text-muted-foreground">No items in this collection.</p>}
            </ul>
          </>
        ) : (
          <EmptyState title="No collections" description="Create a collection to save queries." />
        )}
      </div>
    </div>
  );
}

export function EnvironmentForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; endpointUrl: string; isProduction?: boolean };
  onSubmit: (input: { name: string; endpointUrl: string; isProduction?: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [endpointUrl, setEndpointUrl] = useState(initial?.endpointUrl ?? "");
  const [isProduction, setIsProduction] = useState(initial?.isProduction ?? false);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input placeholder="Production" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Endpoint URL</Label>
        <Input placeholder="https://api.example.com/graphql" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isProduction} onChange={(e) => setIsProduction(e.target.checked)} />
        Production environment
      </label>
      <Button onClick={() => onSubmit({ name, endpointUrl, isProduction })}>Save</Button>
    </div>
  );
}
