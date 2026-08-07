"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "./empty-state.js";

export type SchemaVoyagerProps = {
  /** GraphQL SDL string from a published schema version */
  sdl: string;
  className?: string;
};

type VoyagerModule = typeof import("graphql-voyager");

export function SchemaVoyager({ sdl, className }: SchemaVoyagerProps) {
  const [voyager, setVoyager] = useState<VoyagerModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("graphql-voyager")
      .then((mod) => {
        if (!cancelled) setVoyager(mod);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load Voyager");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sdl.trim()) {
    return <EmptyState title="No schema SDL" description="Publish a schema version to explore it here." />;
  }

  if (loadError) {
    return <EmptyState title="Could not load schema graph" description={loadError} />;
  }

  if (!voyager) {
    return (
      <div className={`flex min-h-[480px] items-center justify-center rounded-lg border border-border bg-muted/20 ${className ?? ""}`}>
        <p className="text-sm text-muted-foreground">Loading schema graph…</p>
      </div>
    );
  }

  try {
    const schema = voyager.sdlToSchema(sdl);
    const Voyager = voyager.Voyager;
    return (
      <div className={`min-h-[480px] overflow-hidden rounded-lg border border-border ${className ?? ""}`}>
        <Voyager introspection={schema} hideVoyagerLogo />
      </div>
    );
  } catch (e) {
    return (
      <EmptyState
        title="Invalid schema SDL"
        description={e instanceof Error ? e.message : "Could not parse schema."}
      />
    );
  }
}
