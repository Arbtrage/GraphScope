"use client";



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
