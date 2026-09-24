import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { useExplorer } from '@/store/explorer-store'
import { ReactFlowProvider } from '@xyflow/react'

const SHOW_KEYS = ['operations', 'fragments', 'types', 'fields', 'files'] as const

export function GraphView() {
  const catalog = useExplorer((s) => s.catalog)
  const graphShow = useExplorer((s) => s.graphShow)
  const toggle = useExplorer((s) => s.toggleGraphShow)
  const layout = useExplorer((s) => s.graphLayout)
  const setLayout = useExplorer((s) => s.setGraphLayout)
  const graphFocusId = useExplorer((s) => s.graphFocusId)
  const setGraphFocus = useExplorer((s) => s.setGraphFocus)
  const selected = useExplorer((s) => s.selected)

  const focusLabel =
    (graphFocusId &&
      (catalog.operationsById[graphFocusId]?.name ||
        catalog.fragmentsById[graphFocusId]?.name ||
        catalog.typesById[graphFocusId]?.name)) ||
    (selected?.kind === 'operation' ? catalog.operationsById[selected.id]?.name : selected?.kind === 'type' ? catalog.typesById[selected.id]?.name : '')

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Graph</h1>
          <p className="text-[12px] text-mute">
            {catalog.types.some((item) => item.source === "introspected")
              ? `From ${catalog.endpoints.find((item) => item.schemaPulled)?.name ?? "the pulled schema"} and repo operations`
              : "Inferred from the repo (pull a schema on Environments)"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-[12px] text-mute">
            <span>Show:</span>
            {SHOW_KEYS.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-1 capitalize">
                <input
                  type="checkbox"
                  checked={graphShow[key]}
                  onChange={() => toggle(key)}
                  className="accent-[var(--accent)]"
                />
                {key}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[12px] text-mute">
              Focus:
              <input
                value={focusLabel ?? ''}
                readOnly
                className="h-7 w-[140px] rounded-[6px] bg-app px-2 font-mono text-[12px] text-ink ring-1 ring-line"
              />
            </label>
            {graphFocusId ? (
              <button type="button" onClick={() => setGraphFocus(null)} className="text-[12px] text-mute hover:text-ink">
                Clear
              </button>
            ) : null}
            <div className="flex rounded-[6px] bg-app p-0.5 ring-1 ring-line">
              {(['relationship', 'dependency', 'source'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLayout(item)}
                  className={`h-6 rounded-[5px] px-2 text-[11px] capitalize ${
                    layout === item ? 'bg-elevated text-ink' : 'text-mute'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 border-t border-line">
        <ReactFlowProvider>
          <GraphCanvas variant="full" />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
