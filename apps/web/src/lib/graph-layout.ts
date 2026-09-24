import type { EntityKind, IndexedCatalog } from "@/data/types";
import type { GraphLayout } from "@/store/explorer-store";
import type { Node } from "@xyflow/react";

export interface GraphNodeData {
  label: string;
  kind: EntityKind;
  subtitle?: string;
  selected: boolean;
  dimmed: boolean;
  [key: string]: unknown;
}

export function entityKindFromId(id: string): EntityKind | null {
  const prefix = id.split(":")[0];
  const map: Record<string, EntityKind> = {
    op: "operation",
    frag: "fragment",
    type: "type",
    field: "field",
    file: "file",
    ep: "endpoint",
  };
  return map[prefix] ?? null;
}

export function labelFor(catalog: IndexedCatalog, id: string): string {
  const op = catalog.operationsById[id];
  if (op) return op.name;
  const fragment = catalog.fragmentsById[id];
  if (fragment) return fragment.name;
  const type = catalog.typesById[id];
  if (type) return type.name;
  const field = catalog.fieldsById[id];
  if (field) return field.name;
  const file = catalog.filesById[id];
  if (file) return file.path.split("/").pop() ?? file.path;
  const endpoint = catalog.endpointsById[id];
  if (endpoint) return endpoint.name;
  return id;
}

function layerFor(kind: EntityKind, layout: GraphLayout): number {
  const relationship: Record<EntityKind, number> = {
    operation: 0,
    fragment: 1,
    type: 2,
    field: 3,
    file: 4,
    endpoint: 5,
  };
  const dependency: Record<EntityKind, number> = {
    file: 0,
    operation: 1,
    fragment: 2,
    type: 3,
    field: 4,
    endpoint: 5,
  };
  if (layout === "dependency") return dependency[kind];
  if (layout === "source") return kind === "file" ? 0 : relationship[kind] + 1;
  return relationship[kind];
}

export function layoutGraph(catalog: IndexedCatalog, ids: string[], layout: GraphLayout): Node<GraphNodeData>[] {
  const buckets = new Map<number, string[]>();
  for (const id of ids) {
    const kind = entityKindFromId(id);
    if (!kind || kind === "endpoint") continue;
    const layer = layerFor(kind, layout);
    const list = buckets.get(layer) ?? [];
    list.push(id);
    buckets.set(layer, list);
  }

  const nodes: Node<GraphNodeData>[] = [];
  const layers = [...buckets.keys()].sort((a, b) => a - b);
  for (const layer of layers) {
    const list = buckets.get(layer) ?? [];
    const cols = Math.min(list.length, layout === "relationship" && layer === 0 ? 10 : 12);
    list.forEach((id, index) => {
      const kind = entityKindFromId(id)!;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = layout === "dependency" ? layer * 220 : col * 168 - ((Math.min(list.length, cols) - 1) * 168) / 2;
      const y = layout === "dependency" ? row * 72 : layer * 130 + row * 72;
      nodes.push({
        id,
        type: "explorer",
        position: { x, y },
        data: {
          label: labelFor(catalog, id),
          kind,
          subtitle: kind,
          selected: false,
          dimmed: false,
        },
      });
    });
  }
  return nodes;
}
