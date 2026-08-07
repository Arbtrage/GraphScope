"use client";

import { gql, useQuery } from "@apollo/client";
import {
  Badge,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  PageSkeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@graphscope/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const SEARCH = gql`
  query SearchPage($q: String!, $limit: Int) {
    search(q: $q, limit: $limit) {
      kind
      id
      title
      subtitle
      href
      score
    }
  }
`;

const KIND_OPTIONS = [
  { value: "ALL", label: "All kinds" },
  { value: "OPERATION", label: "Operations" },
  { value: "TYPE", label: "Types" },
  { value: "FIELD", label: "Fields" },
  { value: "PROJECT", label: "Projects" },
  { value: "COLLECTION", label: "Collections" },
  { value: "REPOSITORY", label: "Repositories" },
] as const;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [kindFilter, setKindFilter] = useState<string>("ALL");

  const trimmed = query.trim();
  const { data, loading, error, refetch } = useQuery(SEARCH, {
    variables: { q: trimmed, limit: 50 },
    skip: trimmed.length < 2,
  });

  const results = useMemo(() => {
    const hits = data?.search ?? [];
    if (kindFilter === "ALL") return hits;
    return hits.filter((h: { kind: string }) => h.kind === kindFilter);
  }, [data?.search, kindFilter]);

  return (
    <div>
      <PageHeader
        title="Search"
        description="Full-text search across operations, schema types, and workspace entities."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-md"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {trimmed.length < 2 ? (
        <EmptyState
          title="Enter a search query"
          description="Type at least 2 characters to search your workspace."
        />
      ) : loading ? (
        <PageSkeleton />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState title="No results" description={`Nothing matched "${trimmed}".`} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {results.map((hit: { kind: string; id: string; title: string; subtitle?: string | null; href: string; score: number }) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <Link
                href={hit.href}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                  {hit.kind}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{hit.title}</p>
                  {hit.subtitle && (
                    <p className="truncate text-sm text-muted-foreground">{hit.subtitle}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {hit.score.toFixed(2)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
