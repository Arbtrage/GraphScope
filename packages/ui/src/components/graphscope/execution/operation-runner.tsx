"use client";

import { Button } from "../../ui/button.js";
import { Label } from "../../ui/input.js";
import { Textarea } from "../../ui/textarea.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs.js";
import { Badge } from "../../ui/badge.js";
import { EmptyState } from "../empty-state.js";
import { useEffect, useState } from "react";
import type * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { EnvPicker } from "./env-picker.js";
import { HeadersEditor } from "./headers-editor.js";
import { VariablesForm } from "./variables-form.js";
import { ResponsePanel } from "./response-panel.js";

function headersToRecord(rows: Array<{ key: string; value: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    out[key] = row.value;
  }
  return out;
}

function BezelPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bezel-outer h-full", className)}>
      <div className="bezel-inner flex h-full min-h-0 flex-col p-4">{children}</div>
    </div>
  );
}

export function OperationRunner({
  initialQuery = "query { __typename }",
  initialVariables = "{}",
  environments,
  environmentId,
  onEnvironmentChange,
  onExecute,
  result,
  loading,
  queryEditor,
  query: controlledQuery,
  onQueryChange,
  variables: controlledVariables,
  onVariablesChange,
  executionMeta,
  emptyEnvironmentHref,
  environmentsHref = "/app/environments",
  resizable = false,
  toolbarExtra,
  showAuthHint = true,
}: {
  initialQuery?: string;
  initialVariables?: string;
  environments: Array<{ id: string; name: string; headers?: Record<string, string> | null }>;
  environmentId?: string | null;
  onEnvironmentChange?: (id: string) => void;
  onExecute: (input: {
    environmentId: string;
    query: string;
    variables: string;
    headers: Record<string, string>;
  }) => void;
  result?: string;
  loading?: boolean;
  queryEditor?: React.ReactNode;
  query?: string;
  onQueryChange?: (query: string) => void;
  variables?: string;
  onVariablesChange?: (variables: string) => void;
  executionMeta?: { status?: string; durationMs?: number; httpStatus?: number | null };
  emptyEnvironmentHref?: string;
  environmentsHref?: string;
  resizable?: boolean;
  toolbarExtra?: React.ReactNode;
  showAuthHint?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const activeQuery = controlledQuery ?? query;
  const setActiveQuery = onQueryChange ?? setQuery;
  const [variables, setVariables] = useState(initialVariables);
  const activeVariables = controlledVariables ?? variables;
  const setActiveVariables = onVariablesChange ?? setVariables;
  const [headerRows, setHeaderRows] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const [localEnvId, setLocalEnvId] = useState(environmentId ?? environments[0]?.id ?? "");
  const [varError, setVarError] = useState<string | undefined>();

  const envId = environmentId ?? localEnvId;
  const setEnvId = (id: string) => {
    setLocalEnvId(id);
    onEnvironmentChange?.(id);
  };

  useEffect(() => {
    if (environmentId) setLocalEnvId(environmentId);
  }, [environmentId]);

  useEffect(() => {
    if (!envId && environments[0]?.id) setEnvId(environments[0].id);
  }, [environments, envId]);

  const activeEnv = environments.find((e) => e.id === envId);
  const envHasAuth =
    !!activeEnv?.headers &&
    Object.keys(activeEnv.headers).some((k) => /authorization|api[-_]?key|x-api/i.test(k));

  if (!environments.length && emptyEnvironmentHref) {
    return (
      <EmptyState
        title="No environment configured"
        description="Create an environment with a GraphQL endpoint and auth headers before running queries."
        actionLabel="Go to Environments"
        onAction={() => {
          window.location.href = emptyEnvironmentHref;
        }}
      />
    );
  }

  const handleExecute = () => {
    try {
      JSON.parse(activeVariables || "{}");
      setVarError(undefined);
      if (!envId) return;
      onExecute({
        environmentId: envId,
        query: activeQuery,
        variables: activeVariables,
        headers: headersToRecord(headerRows),
      });
    } catch {
      setVarError("Invalid JSON in variables");
    }
  };

  const stickyChrome = (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-background/80 px-4 py-2.5 shadow-tinted-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Env</span>
        <EnvPicker environments={environments} activeId={envId || null} onChange={setEnvId} />
        {toolbarExtra}
      </div>
      <Button
        variant="island"
        size="island"
        className="group bg-execute text-execute-foreground hover:bg-execute/90"
        disabled={!envId || loading}
        onClick={handleExecute}
      >
        <span>{loading ? "Running…" : "Run"}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105 dark:bg-white/15">
          <Play className="h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" />
        </span>
      </Button>
    </div>
  );

  const editorPanel = (
    <div className="flex h-full min-h-0 flex-col space-y-3">
      <Tabs defaultValue="query" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>
        <TabsContent value="query" className="mt-3 min-h-0 flex-1">
          {queryEditor ?? (
            <Textarea
              className="min-h-[280px] font-mono text-sm"
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
            />
          )}
        </TabsContent>
        <TabsContent value="variables" className="mt-3">
          <VariablesForm value={activeVariables} onChange={setActiveVariables} error={varError} />
        </TabsContent>
        <TabsContent value="headers" className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Temporary overrides merge on top of environment headers (request wins). Use secrets as{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{{NAME}}"}</code>. Durable auth
            belongs in{" "}
            <a href={environmentsHref} className="text-primary underline-offset-2 hover:underline">
              Environments
            </a>
            .
          </p>
          <HeadersEditor headers={headerRows} onChange={setHeaderRows} />
        </TabsContent>
      </Tabs>
      {showAuthHint && activeEnv && !envHasAuth && (
        <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This environment has no Authorization-style header. For JWT APIs, add{" "}
          <code className="font-mono text-[11px]">Authorization: Bearer {"{{TOKEN}}"}</code> under Environments, or a
          temporary override in Headers.
        </p>
      )}
    </div>
  );

  if (resizable) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {stickyChrome}
        <Group orientation="horizontal" className="min-h-[520px] flex-1 gap-3">
          <Panel defaultSize="50" minSize="30">
            <BezelPanel>{editorPanel}</BezelPanel>
          </Panel>
          <Separator className="w-1.5 rounded-full bg-border transition-colors hover:bg-primary/30" />
          <Panel defaultSize="50" minSize="25">
            <BezelPanel>
              <ResponsePanel result={result} {...executionMeta} />
            </BezelPanel>
          </Panel>
        </Group>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stickyChrome}
      <div className="grid gap-4 lg:grid-cols-2">
        <BezelPanel>{editorPanel}</BezelPanel>
        <BezelPanel>
          <ResponsePanel result={result} {...executionMeta} />
        </BezelPanel>
      </div>
    </div>
  );
}
