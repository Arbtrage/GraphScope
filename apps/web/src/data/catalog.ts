import type { EntityKind, FileKind, Fragment, IndexedCatalog, Operation, SourceFile, UsageKind } from "@/data/types";

export function emptyCatalog(): IndexedCatalog {
  return {
    repository: { id: "", name: "No repository", branch: "—", scannedAtLabel: "Not scanned", status: "", operationCount: 0 },
    stats: {
      operations: 0,
      queries: 0,
      mutations: 0,
      subscriptions: 0,
      fragments: 0,
      types: 0,
      endpoints: 0,
      files: 0,
    },
    operations: [],
    fragments: [],
    types: [],
    fields: [],
    files: [],
    endpoints: [],
    usages: [],
    history: [],
    attention: [],
    recentOperationIds: [],
    operationsById: {},
    fragmentsById: {},
    typesById: {},
    fieldsById: {},
    filesById: {},
    endpointsById: {},
    usagesById: {},
    graphEdges: [],
    surfaceNodeIds: [],
  };
}

export function indexCatalog(partial: Omit<IndexedCatalog, "operationsById" | "fragmentsById" | "typesById" | "fieldsById" | "filesById" | "endpointsById" | "usagesById"> & Partial<IndexedCatalog>): IndexedCatalog {
  const operationsById = Object.fromEntries(partial.operations.map((item) => [item.id, item]));
  const fragmentsById = Object.fromEntries(partial.fragments.map((item) => [item.id, item]));
  const typesById = Object.fromEntries(partial.types.map((item) => [item.id, item]));
  const fieldsById = Object.fromEntries(partial.fields.map((item) => [item.id, item]));
  const filesById = Object.fromEntries(partial.files.map((item) => [item.id, item]));
  const endpointsById = Object.fromEntries(partial.endpoints.map((item) => [item.id, item]));
  const usagesById = Object.fromEntries(partial.usages.map((item) => [item.id, item]));
  return {
    ...emptyCatalog(),
    ...partial,
    operationsById,
    fragmentsById,
    typesById,
    fieldsById,
    filesById,
    endpointsById,
    usagesById,
  };
}

export function impactForFragment(catalog: IndexedCatalog, fragment: Fragment) {
  const usages = catalog.usages.filter((usage) =>
    fragment.operationIds.some((opId) => catalog.operationsById[opId]?.usageIds.includes(usage.id)),
  );
  return {
    operations: fragment.operationIds.length,
    files: fragment.fileIds.length,
    components: usages.filter((usage) => usage.kind === "component").length,
    screens: usages.filter((usage) => usage.kind === "page").length,
    tests: usages.filter((usage) => usage.kind === "test").length,
  };
}

export function neighborhood(catalog: IndexedCatalog, id: string, depth = 2): Set<string> {
  const ids = new Set<string>([id]);
  let frontier = [id];
  for (let i = 0; i < depth; i += 1) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const edge of catalog.graphEdges) {
        if (edge.source === node && !ids.has(edge.target)) {
          ids.add(edge.target);
          next.push(edge.target);
        }
        if (edge.target === node && !ids.has(edge.source)) {
          ids.add(edge.source);
          next.push(edge.source);
        }
      }
    }
    frontier = next;
  }
  return ids;
}

export function searchCatalog(catalog: IndexedCatalog, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      operations: catalog.operations.slice(0, 8),
      fragments: catalog.fragments.slice(0, 4),
      types: catalog.types.slice(0, 4),
      files: catalog.files.slice(0, 4),
    };
  }
  const match = (name: string, extra = "") => `${name} ${extra}`.toLowerCase().includes(q);
  return {
    operations: catalog.operations
      .filter((item) => match(item.name, `${item.kind} ${item.source.path} ${item.description}`))
      .slice(0, 24),
    fragments: catalog.fragments.filter((item) => match(item.name, item.source.path)).slice(0, 12),
    types: catalog.types.filter((item) => match(item.name)).slice(0, 12),
    files: catalog.files.filter((item) => match(item.path)).slice(0, 12),
  };
}

export interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  file?: SourceFile;
}

export function buildFileTree(sourceFiles: SourceFile[]): FileTreeNode[] {
  return buildPathTree(sourceFiles.map((file) => ({ path: file.path, file })));
}

export interface PathTreeNode {
  name: string;
  path: string;
  children?: PathTreeNode[];
  isFile?: boolean;
}

export function buildPathTree(
  entries: Array<{ path: string; file?: SourceFile }>,
): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", children: [] };
  for (const entry of entries) {
    const parts = entry.path.split("/").filter(Boolean);
    let node = root;
    let acc = "";
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]!;
      acc = acc ? `${acc}/${part}` : part;
      node.children ??= [];
      let child = node.children.find((item) => item.name === part);
      if (!child) {
        child = { name: part, path: acc, children: [] };
        node.children.push(child);
      }
      if (i === parts.length - 1) {
        child.file = entry.file;
        child.children = undefined;
      }
      node = child;
    }
  }
  const sortTree = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      const aDir = a.children ? 0 : 1;
      const bDir = b.children ? 0 : 1;
      if (aDir !== bDir) return aDir - bDir;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) if (node.children) sortTree(node.children);
  };
  sortTree(root.children ?? []);
  return root.children ?? [];
}

export function inferEntity(id: string): { kind: EntityKind; id: string } | null {
  const kind = id.split(":")[0] as EntityKind | "op" | "frag" | "ep";
  const map: Record<string, EntityKind> = {
    op: "operation",
    frag: "fragment",
    type: "type",
    field: "field",
    file: "file",
    ep: "endpoint",
  };
  const entityKind = map[kind];
  if (!entityKind) return null;
  return { kind: entityKind, id };
}

export function rawEntityId(id: string): string {
  const idx = id.indexOf(":");
  return idx === -1 ? id : id.slice(idx + 1);
}

export function usageKindFromPath(filePath: string): UsageKind {
  const lower = filePath.toLowerCase();
  if (/\.(test|spec)\.[jt]sx?$/.test(lower) || lower.includes("/__tests__/") || lower.includes("/tests/")) {
    return "test";
  }
  if (/(^|\/)use[a-z0-9]+\.[jt]sx?$/.test(lower) || lower.includes("/hooks/")) return "hook";
  if (lower.includes("/pages/") || lower.includes("/app/") || lower.includes("/routes/")) return "page";
  return "component";
}

export function fileKindFromPath(filePath: string): FileKind {
  if (filePath.endsWith(".graphql") || filePath.endsWith(".gql")) return "graphql";
  if (/\.(test|spec)\.[jt]sx?$/.test(filePath)) return "test";
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) return "tsx";
  return "ts";
}

export function parseVariableEntries(operation: Operation): Array<{ key: string; value: string; required: boolean }> {
  return Object.entries(operation.variables).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value ?? ""),
    required: true,
  }));
}
