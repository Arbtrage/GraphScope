"use client";



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
