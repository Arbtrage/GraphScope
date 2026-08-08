"use client";

import { gql, useLazyQuery } from "@apollo/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@graphscope/ui";
import {
  BookMarked,
  Code2,
  FolderKanban,
  GitBranch,
  History,
  Home,
  Layers,
  Play,
  Search,
  Type,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppRouter } from "@/components/navigation-provider";

const SEARCH = gql`
  query GlobalSearch($q: String!, $limit: Int) {
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

type SearchHit = {
  kind: string;
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  score: number;
};

const KIND_LABELS: Record<string, string> = {
  OPERATION: "Operations",
  TYPE: "Types",
  FIELD: "Fields",
  REPOSITORY: "Repositories",
  COLLECTION: "Collections",
  PROJECT: "Projects",
};

const KIND_ICONS: Record<string, ReactNode> = {
  OPERATION: <Play className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
  TYPE: <Layers className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
  FIELD: <Type className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
  REPOSITORY: <GitBranch className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
  COLLECTION: <BookMarked className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
  PROJECT: <FolderKanban className="mr-2 h-4 w-4 shrink-0 opacity-60" />,
};

const QUICK_NAV = [
  { label: "Home", href: "/app", icon: <Home className="mr-2 h-4 w-4" /> },
  { label: "Projects", href: "/app/projects", icon: <FolderKanban className="mr-2 h-4 w-4" /> },
  { label: "Execute", href: "/app/execute", icon: <Play className="mr-2 h-4 w-4" /> },
  { label: "Environments", href: "/app/environments", icon: <Zap className="mr-2 h-4 w-4" /> },
  { label: "Search", href: "/app/search", icon: <Search className="mr-2 h-4 w-4" /> },
  { label: "Schema Explorer", href: "/app/schema/explore", icon: <Layers className="mr-2 h-4 w-4" /> },
  { label: "Operations", href: "/app/operations", icon: <Code2 className="mr-2 h-4 w-4" /> },
  { label: "History", href: "/app/history", icon: <History className="mr-2 h-4 w-4" /> },
];

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const appRouter = useAppRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [runSearch, { data, loading }] = useLazyQuery<{ search: SearchHit[] }>(SEARCH, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      void runSearch({ variables: { q: debouncedQuery.trim(), limit: 20 } });
    }
  }, [debouncedQuery, runSearch]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      appRouter.push(href);
    },
    [appRouter, onOpenChange],
  );

  const grouped = useMemo(() => {
    const hits = data?.search ?? [];
    const map = new Map<string, SearchHit[]>();
    for (const hit of hits) {
      const list = map.get(hit.kind) ?? [];
      list.push(hit);
      map.set(hit.kind, list);
    }
    return map;
  }, [data?.search]);

  const showResults = debouncedQuery.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search operations, types, projects…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {showResults ? (
          loading ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : grouped.size === 0 ? (
            <CommandEmpty>No results for &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
          ) : (
            Array.from(grouped.entries()).map(([kind, hits]) => (
              <CommandGroup key={kind} heading={KIND_LABELS[kind] ?? kind}>
                {hits.map((hit) => (
                  <CommandItem key={`${hit.kind}-${hit.id}`} onSelect={() => navigate(hit.href)}>
                    {KIND_ICONS[hit.kind]}
                    <span className="flex-1 truncate">{hit.title}</span>
                    {hit.subtitle && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )
        ) : (
          <>
            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            <CommandGroup heading="Quick navigation">
              {QUICK_NAV.map((item) => (
                <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
                  {item.icon}
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {query.trim().length > 0 && query.trim().length < 2 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Search">
                  <CommandItem onSelect={() => navigate(`/app/search?q=${encodeURIComponent(query.trim())}`)}>
                    <Search className="mr-2 h-4 w-4" />
                    Search for &ldquo;{query.trim()}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
