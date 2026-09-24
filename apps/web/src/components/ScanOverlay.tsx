import { Button, Input } from "@/components/ui";
import { useExplorer } from "@/store/explorer-store";
import { Check, FolderOpen } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";

const STEPS = [
  "Detecting GraphQL clients",
  "Indexing .graphql files",
  "Finding embedded operations",
  "Resolving fragments",
  "Building schema relationships",
  "Mapping source references",
];

export function ScanOverlay() {
  const ready = useExplorer((s) => s.ready);
  const hasRepository = useExplorer((s) => s.hasRepository);
  const scan = useExplorer((s) => s.scan);
  const catalog = useExplorer((s) => s.catalog);
  const pickAndOpenRepository = useExplorer((s) => s.pickAndOpenRepository);
  const openRepositoryPath = useExplorer((s) => s.openRepositoryPath);
  const dismissScanError = useExplorer((s) => s.dismissScanError);
  const completeScan = useExplorer((s) => s.completeScan);
  const [pathValue, setPathValue] = useState("");

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app">
        <p className="text-[13px] text-mute">Starting GraphQL Explorer…</p>
      </div>
    );
  }

  if (scan.active) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app">
        <div className="w-[360px]">
          <p className="mb-5 text-[13px] text-mute">Scanning repository...</p>
          <ul className="flex flex-col gap-2">
            {STEPS.map((step, index) => {
              const readyStep = index < scan.doneCount;
              return (
                <li key={step} className="flex items-center gap-2 text-[13px]">
                  <span
                    className={`flex size-4 items-center justify-center rounded-full ${
                      readyStep ? "bg-success/20 text-success" : "bg-elevated text-faint"
                    }`}
                  >
                    {readyStep ? <Check size={10} weight="bold" /> : null}
                  </span>
                  <span className={readyStep ? "text-ink" : "text-faint"}>{step}</span>
                </li>
              );
            })}
          </ul>
          {scan.statsLabel ? <p className="mt-6 text-[13px] text-ink">{scan.statsLabel}</p> : null}
        </div>
      </div>
    );
  }

  if (scan.awaitingContinue) {
    const report = scan.report;
    const errors = report?.parseErrors ?? [];
    const skipped = report?.skippedFiles ?? [];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app">
        <div className="w-[420px]">
          <p className="text-center text-[15px] font-semibold text-ink">Scan complete</p>
          <p className="mt-2 text-center text-[13px] text-mute">
            {scan.statsLabel ?? `${catalog.stats.operations} operations discovered`}
            {report ? ` · ${report.ignoredCount} ignored` : null}
            {errors.length ? ` · ${errors.length} parse errors` : null}
          </p>
          {skipped.length > 0 ? (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-faint">Skipped</p>
              <ul className="mt-1 font-mono text-[11px] text-mute">
                {skipped.slice(0, 8).map((path) => (
                  <li key={path} className="truncate">
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {errors.length > 0 ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-faint">Parse errors</p>
              <ul className="mt-1 text-[12px] text-mute">
                {errors.slice(0, 6).map((item) => (
                  <li key={`${item.path}:${item.message}`} className="truncate">
                    <span className="font-mono text-[11px]">{item.path}</span>
                    <span className="text-faint"> — {item.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button variant="primary" className="mt-5 h-9 w-full rounded-[8px] text-[13px]" onClick={completeScan}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (scan.error) {
    const apiDown = scan.kind === "api";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app">
        <div className="w-[420px]">
          <p className="text-center text-[15px] font-semibold text-ink">
            {apiDown ? "GraphScope API not reachable" : "Scan failed"}
          </p>
          <p className="mt-2 text-center text-[13px] text-danger">{scan.error}</p>
          {scan.path ? (
            <p className="mt-2 truncate text-center font-mono text-[11px] text-faint">{scan.path}</p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            {scan.path && !apiDown ? (
              <Button
                variant="primary"
                className="h-9 w-full rounded-[8px] text-[13px]"
                onClick={() => void openRepositoryPath(scan.path!)}
              >
                Retry scan
              </Button>
            ) : null}
            {apiDown ? (
              <Button
                variant="primary"
                className="h-9 w-full rounded-[8px] text-[13px]"
                onClick={() => window.location.reload()}
              >
                Retry connection
              </Button>
            ) : null}
            <Button
              className="h-9 w-full rounded-[8px] text-[13px]"
              onClick={() => void pickAndOpenRepository()}
            >
              <FolderOpen size={16} />
              Open a different folder
            </Button>
            {hasRepository ? (
              <Button variant="quiet" className="h-9 w-full text-[13px]" onClick={dismissScanError}>
                Back to {catalog.repository.name}
              </Button>
            ) : (
              <Button variant="quiet" className="h-9 w-full text-[13px]" onClick={dismissScanError}>
                Choose another path
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hasRepository) return null;

  const submitPath = (event: FormEvent) => {
    event.preventDefault();
    void openRepositoryPath(pathValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app">
      <div className="w-[420px]">
        <p className="text-center text-[15px] font-semibold text-ink">Open a repository</p>
        <p className="mt-2 text-center text-[13px] text-mute">
          Scan an existing codebase to discover, understand, and run the GraphQL already in it.
        </p>
        <Button
          variant="primary"
          className="mt-5 h-9 w-full rounded-[8px] text-[13px]"
          onClick={() => void pickAndOpenRepository()}
        >
          <FolderOpen size={16} />
          Open folder
        </Button>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-[0.12em] text-faint">or paste a path</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={submitPath} className="mt-4 flex gap-2">
          <Input
            mono
            value={pathValue}
            onChange={(event) => setPathValue(event.target.value)}
            placeholder="/Users/you/code/app"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="h-9 min-w-0 flex-1 rounded-[8px] bg-elevated px-3"
          />
          <Button type="submit" disabled={!pathValue.trim()} className="h-9 shrink-0 rounded-[8px] text-[13px]">
            Scan path
          </Button>
        </form>
      </div>
    </div>
  );
}
