import { ExplorerNode } from "@/components/graph/ExplorerNode";
import { neighborhood } from "@/data/catalog";
import { entityKindFromId, layoutGraph, type GraphNodeData } from "@/lib/graph-layout";
import { useExplorer } from "@/store/explorer-store";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useMemo } from "react";

const nodeTypes = { explorer: ExplorerNode } satisfies NodeTypes;

interface GraphCanvasProps {
  variant: "surface" | "full";
}

export function GraphCanvas({ variant }: GraphCanvasProps) {
  const catalog = useExplorer((s) => s.catalog);
  const selected = useExplorer((s) => s.selected);
  const select = useExplorer((s) => s.select);
  const openOperation = useExplorer((s) => s.openOperation);
  const focusNeighborhood = useExplorer((s) => s.focusNeighborhood);
  const graphShow = useExplorer((s) => s.graphShow);
  const graphLayout = useExplorer((s) => s.graphLayout);
  const graphFocusId = useExplorer((s) => s.graphFocusId);
  const graphDimUnrelated = useExplorer((s) => s.graphDimUnrelated);

  const related = useMemo(() => {
    const focus = graphFocusId ?? selected?.id;
    return focus ? neighborhood(catalog, focus, 2) : null;
  }, [catalog, graphFocusId, selected?.id]);

  const { nodes, edges } = useMemo(() => {
    if (variant === "surface") {
      const ids = catalog.surfaceNodeIds.length
        ? catalog.surfaceNodeIds
        : [
            ...catalog.operations.slice(0, 2).map((item) => item.id),
            ...catalog.fragments.slice(0, 1).map((item) => item.id),
            ...catalog.types.slice(0, 1).map((item) => item.id),
          ];
      const laid = layoutGraph(catalog, ids, "relationship").map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: selected?.id === node.id,
          dimmed: Boolean(graphDimUnrelated && related && !related.has(node.id)),
        },
      }));
      const visible = new Set(laid.map((node) => node.id));
      const mapped = catalog.graphEdges
        .filter((edge) => visible.has(edge.source) && visible.has(edge.target))
        .map((edge) => styleEdge({ id: edge.id, source: edge.source, target: edge.target }, selected?.id, related, graphDimUnrelated));
      return { nodes: laid, edges: mapped };
    }

    const allowed = new Set<string>();
    const take = (ids: string[], limit: number) => {
      for (const id of ids.slice(0, limit)) allowed.add(id);
    };
    if (graphShow.operations) take(catalog.operations.map((op) => op.id), 48);
    if (graphShow.fragments) take(catalog.fragments.map((item) => item.id), 36);
    if (graphShow.types) take(catalog.types.map((item) => item.id), 41);
    if (graphShow.fields) {
      const focusType = selected?.kind === "type" ? selected.id : catalog.types[0]?.id;
      const fieldIds = catalog.typesById[focusType ?? ""]?.fieldIds ?? catalog.fields.slice(0, 18).map((item) => item.id);
      take(fieldIds, 24);
    }
    if (graphShow.files && selected) {
      const files = catalog.graphEdges
        .filter(
          (edge) =>
            (edge.source === selected.id || edge.target === selected.id) &&
            (edge.source.startsWith("file:") || edge.target.startsWith("file:")),
        )
        .map((edge) => (edge.source.startsWith("file:") ? edge.source : edge.target));
      take(files, 16);
    }
    if (graphFocusId) {
      for (const id of neighborhood(catalog, graphFocusId, 1)) {
        const kind = entityKindFromId(id);
        if (!kind || kind === "endpoint") continue;
        if (kind === "field" && !graphShow.fields) continue;
        if (kind === "file" && !graphShow.files) continue;
        allowed.add(id);
      }
    }

    const laidOut = layoutGraph(catalog, [...allowed], graphLayout).map((node) => ({
      ...node,
      data: {
        ...node.data,
        selected: selected?.id === node.id,
        dimmed: Boolean(graphDimUnrelated && related && !related.has(node.id)),
      },
    }));

    const visible = new Set(laidOut.map((node) => node.id));
    const selectedId = selected?.id;
    const rawEdges = catalog.graphEdges.filter(
      (edge) =>
        visible.has(edge.source) &&
        visible.has(edge.target) &&
        (edge.relation === "uses" || edge.relation === "spreads" || edge.relation === "has"),
    );
    const focusedEdges = selectedId
      ? rawEdges.filter((edge) => edge.source === selectedId || edge.target === selectedId)
      : rawEdges.slice(0, 80);
    const edgeSet = focusedEdges.length > 0 ? focusedEdges : rawEdges.slice(0, 80);
    const mapped: Edge[] = edgeSet.map((edge) =>
      styleEdge({ id: edge.id, source: edge.source, target: edge.target }, selectedId, related, graphDimUnrelated),
    );
    return { nodes: laidOut, edges: mapped };
  }, [variant, catalog, selected, graphShow, graphLayout, graphFocusId, graphDimUnrelated, related]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const kind = entityKindFromId(node.id);
      if (!kind) return;
      select({ kind, id: node.id });
    },
    [select],
  );

  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      const kind = entityKindFromId(node.id);
      if (kind === "operation") openOperation(node.id);
      else if (kind) focusNeighborhood(node.id);
    },
    [openOperation, focusNeighborhood],
  );

  if (!nodes.length) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-mute">
        Scan a repository to see how operations connect.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      fitView
      minZoom={0.35}
      maxZoom={1.6}
      defaultEdgeOptions={{ type: "smoothstep" }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={!graphDimUnrelated}
      panOnScroll
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
      {variant === "full" ? (
        <>
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(17,18,20,0.7)"
            nodeColor={(node) => (node.data && (node.data as GraphNodeData).selected ? "var(--accent)" : "var(--border-strong)")}
          />
        </>
      ) : null}
    </ReactFlow>
  );
}

function styleEdge(
  edge: { id: string; source: string; target: string },
  selectedId: string | undefined,
  related: Set<string> | null,
  dim: boolean,
): Edge {
  const hot = selectedId === edge.source || selectedId === edge.target;
  const hidden = Boolean(dim && related && !related.has(edge.source) && !related.has(edge.target));
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: hot,
    style: {
      stroke: hot ? "var(--accent)" : "var(--border-strong)",
      strokeWidth: hot ? 1.6 : 1,
      opacity: hidden ? 0.12 : hot ? 1 : 0.55,
    },
  };
}
