import { CodeBlock } from "@/components/CodeBlock";
import { CodeEditor } from "@/components/CodeEditor";
import { HeaderEditor } from "@/components/HeaderEditor";
import { Button, Field, Select, StatusChip, Tabs, type StatusTone } from "@/components/ui";
import type { ExecutionResult } from "@/data/types";
import { buildGraphqlCurl, mergePreviewHeaders, parseGraphqlCurl } from "@/lib/curl";
import { useExplorer } from "@/store/explorer-store";
import { Copy, Play } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

const REQUEST_TABS = [
  { id: "query" as const, label: "Query" },
  { id: "variables" as const, label: "Variables" },
  { id: "headers" as const, label: "Headers" },
  { id: "curl" as const, label: "cURL" },
];

export function RunWorkbench() {
  const open = useExplorer((s) => s.runOpen);
  const selected = useExplorer((s) => s.selected);
  const catalog = useExplorer((s) => s.catalog);
  const closeRun = useExplorer((s) => s.closeRun);
  const executeRun = useExplorer((s) => s.executeRun);
  const runStatus = useExplorer((s) => s.runStatus);
  const runResult = useExplorer((s) => s.runResult);
  const runTab = useExplorer((s) => s.runTab);
  const setRunTab = useExplorer((s) => s.setRunTab);
  const requestTab = useExplorer((s) => s.requestTab);
  const setRequestTab = useExplorer((s) => s.setRequestTab);
  const environmentId = useExplorer((s) => s.environmentId);
  const setEnvironment = useExplorer((s) => s.setEnvironment);
  const setView = useExplorer((s) => s.setView);
  const queryDraft = useExplorer((s) => s.queryDraft);
  const setQueryDraft = useExplorer((s) => s.setQueryDraft);
  const variableJson = useExplorer((s) => s.variableJson);
  const setVariableJson = useExplorer((s) => s.setVariableJson);
  const headerDraft = useExplorer((s) => s.headerDraft);
  const setHeaderDraft = useExplorer((s) => s.setHeaderDraft);
  const showToast = useExplorer((s) => s.showToast);

  const [curlText, setCurlText] = useState("");
  const [curlDirty, setCurlDirty] = useState(false);

  const operation = selected?.kind === "operation" ? catalog.operationsById[selected.id] : null;
  const endpoint = operation ? catalog.endpointsById[environmentId] : null;

  const builtCurl = useMemo(() => {
    if (!operation) return "";
    return buildGraphqlCurl({
      url: endpoint?.url ?? "",
      query: queryDraft,
      variablesJson: variableJson,
      headers: mergePreviewHeaders(endpoint?.headers, headerDraft),
    });
  }, [operation, endpoint?.url, endpoint?.headers, queryDraft, variableJson, headerDraft]);

  useEffect(() => {
    if (!curlDirty) setCurlText(builtCurl);
  }, [builtCurl, curlDirty]);

  if (!open || !operation) return null;

  const result = runResult;
  const running = runStatus === "running";
  const status = statusFromResult(result, running);

  const resultTabs = [
    { id: "response" as const, label: "Response" },
    {
      id: "errors" as const,
      label: "Errors",
      badge:
        result && result.errors.length > 0 ? (
          <span className="text-danger">{result.errors.length}</span>
        ) : undefined,
    },
    { id: "headers" as const, label: "Headers" },
    { id: "timing" as const, label: "Timing" },
  ];

  const applyCurl = (raw: string) => {
    setCurlText(raw);
    setCurlDirty(true);
    const parsed = parseGraphqlCurl(raw);
    if (!parsed) return;
    setQueryDraft(parsed.query);
    setVariableJson(parsed.variableJson);
    setHeaderDraft(parsed.headers);
    if (parsed.url) {
      const match = catalog.endpoints.find((item) => item.url.trim() === parsed.url.trim());
      if (match && match.id !== environmentId) setEnvironment(match.id);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-tight text-ink">{operation.name}</p>
          <p className="truncate font-mono text-[11px] text-faint">
            {operation.source.path}:{operation.source.line}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {catalog.endpoints.length === 0 ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                closeRun();
                setView("endpoints");
              }}
            >
              Add environment
            </Button>
          ) : (
            <>
              <Field className="w-[180px]">
                <Select
                  value={environmentId}
                  onChange={(id) => {
                    setCurlDirty(false);
                    setEnvironment(id);
                  }}
                  options={catalog.endpoints.map((item) => ({
                    value: item.id,
                    label: item.name,
                    hint: item.environment,
                  }))}
                  placeholder="Environment"
                />
              </Field>
              <p className="hidden max-w-[280px] truncate font-mono text-[11px] text-mute xl:block">
                {endpoint?.url || "No URL set"}
              </p>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  closeRun();
                  setView("endpoints");
                }}
              >
                Edit
              </Button>
            </>
          )}
          <Button
            variant="primary"
            loading={running}
            disabled={running || catalog.endpoints.length === 0}
            onClick={() => void executeRun()}
            className="min-w-[108px]"
          >
            <Play size={12} weight="fill" />
            {running ? "Running" : "Run"}
          </Button>
          <Button variant="ghost" onClick={closeRun}>
            Close
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,42%)_1fr]">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-line">
          <Tabs
            items={REQUEST_TABS}
            value={requestTab}
            onChange={(tab) => {
              if (tab !== "curl") setCurlDirty(false);
              setRequestTab(tab);
            }}
          />
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {requestTab === "query" ? (
              <CodeEditor
                language="graphql"
                value={queryDraft}
                onChange={(next) => {
                  setCurlDirty(false);
                  setQueryDraft(next);
                }}
                aria-label="Query"
              />
            ) : null}
            {requestTab === "variables" ? (
              <CodeEditor
                language="json"
                value={variableJson}
                onChange={(next) => {
                  setCurlDirty(false);
                  setVariableJson(next);
                }}
                aria-label="Variables"
              />
            ) : null}
            {requestTab === "headers" ? (
              <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
                <p className="mb-2 text-[11px] text-mute">
                  Sent with this run. Environment headers stay unless you override a key. Use {"{{NAME}}"} for
                  secrets stored on the environment.
                </p>
                <HeaderEditor
                  pairs={headerDraft}
                  onChange={(pairs) => {
                    setCurlDirty(false);
                    setHeaderDraft(pairs);
                  }}
                />
              </div>
            ) : null}
            {requestTab === "curl" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-mute">
                    Full request as curl. Edits sync with Query / Variables / Headers (and environment URL when it
                    matches).
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(curlText || builtCurl);
                      showToast("Copied curl");
                    }}
                  >
                    <Copy size={12} />
                    Copy
                  </Button>
                </div>
                <CodeEditor
                  language="shell"
                  value={curlText || builtCurl}
                  onChange={(next) => applyCurl(next)}
                  aria-label="cURL"
                  formatOnBlur={false}
                />
              </div>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col">
          <Tabs
            items={resultTabs}
            value={runTab}
            onChange={setRunTab}
            trailing={<StatusChip tone={status.tone}>{status.label}</StatusChip>}
          />
          <div className="min-h-0 flex-1 overflow-auto p-3 scrollbar-thin">
            {running && !result ? (
              <p className="text-[12px] text-mute">
                Running {operation.name} against {endpoint?.url || "the selected environment"}…
              </p>
            ) : null}

            {!running && !result ? (
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-1 text-center">
                <p className="text-[13px] text-mute">Run to see response</p>
                <p className="max-w-sm text-[11px] text-faint">
                  Edit the query or variables on the left, pick an environment, then press Run (⌘↵).
                </p>
              </div>
            ) : null}

            {result && runTab === "response" ? (
              <CodeBlock code={JSON.stringify(result.body, null, 2)} language="json" />
            ) : null}
            {result && runTab === "errors" ? <ErrorPane result={result} /> : null}
            {result && runTab === "headers" ? (
              <div className="font-mono text-[12px]">
                {Object.keys(result.headers).length === 0 ? (
                  <p className="text-mute">No response headers</p>
                ) : (
                  Object.entries(result.headers).map(([key, value]) => (
                    <p key={key} className="flex gap-3 border-b border-line/60 py-1.5 last:border-b-0">
                      <span className="w-[160px] shrink-0 text-mute">{key}</span>
                      <span className="min-w-0 break-all text-ink">{value}</span>
                    </p>
                  ))
                )}
              </div>
            ) : null}
            {result && runTab === "timing" ? (
              <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
                <Timing label="DNS" value={`${result.timing.dns}ms`} />
                <Timing label="Connect" value={`${result.timing.connect}ms`} />
                <Timing label="TTFB" value={`${result.timing.ttfb}ms`} />
                <Timing label="Total" value={`${result.timing.total}ms`} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function statusFromResult(
  result: ExecutionResult | null,
  running: boolean,
): { tone: StatusTone; label: string } {
  if (running) return { tone: "running", label: "Executing…" };
  if (!result) return { tone: "idle", label: "Ready" };
  const failed = result.kind !== "SUCCESS" || result.errors.length > 0;
  const statusPart = result.status ? String(result.status) : "—";
  const text = result.statusText || result.kind.replace(/_/g, " ");
  return {
    tone: failed ? "error" : "success",
    label: `${statusPart} · ${text} · ${result.durationMs}ms`,
  };
}

function ErrorPane({ result }: { result: ExecutionResult }) {
  if (!result.title && result.errors.length === 0) {
    return <p className="text-[12px] text-mute">No errors</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {result.title ? (
        <div className="rounded-[8px] bg-app px-3 py-2 ring-1 ring-danger/40">
          <p className="text-[13px] font-medium text-danger">{result.title}</p>
          {result.detail ? <p className="mt-1 text-[12px] text-mute">{result.detail}</p> : null}
        </div>
      ) : null}
      {result.errors.length > 0 ? (
        <CodeBlock code={JSON.stringify(result.errors, null, 2)} language="json" />
      ) : null}
    </div>
  );
}

function Timing({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-app px-3 py-2 ring-1 ring-line">
      <p className="text-[10px] uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="font-mono text-ink">{value}</p>
    </div>
  );
}
