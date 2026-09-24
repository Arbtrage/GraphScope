import { impactForFragment } from '@/data/catalog'
import type { IndexedCatalog, SelectedEntity } from '@/data/types'
import { useExplorer } from '@/store/explorer-store'
import type { ReactNode } from 'react'

export function Inspector() {
  const selected = useExplorer((s) => s.selected)
  const catalog = useExplorer((s) => s.catalog)
  const openOperation = useExplorer((s) => s.openOperation)
  const select = useExplorer((s) => s.select)
  const setView = useExplorer((s) => s.setView)
  const openInSource = useExplorer((s) => s.openInSource)

  return (
    <aside className="flex h-full w-[var(--inspector-w)] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex h-9 items-center border-b border-line px-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Inspector</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {selected ? (
          <InspectorBody
            catalog={catalog}
            selected={selected}
            onOpenOperation={openOperation}
            onSelect={select}
            onOpenView={setView}
            onOpenSource={openInSource}
          />
        ) : (
          <p className="text-[12px] text-mute">Select an operation, fragment, or type to see where it lives and what it touches.</p>
        )}
      </div>
    </aside>
  )
}

function InspectorBody({
  catalog,
  selected,
  onOpenOperation,
  onSelect,
  onOpenView,
  onOpenSource,
}: {
  catalog: IndexedCatalog
  selected: SelectedEntity
  onOpenOperation: (id: string) => void
  onSelect: (entity: SelectedEntity) => void
  onOpenView: (view: 'graph' | 'files' | 'schema' | 'endpoints') => void
  onOpenSource: (path: string, line?: number) => void
}) {
  if (selected.kind === 'operation') {
    const op = catalog.operationsById[selected.id]
    if (!op) return null
    const usages = op.usageIds.map((id) => catalog.usagesById[id]).filter(Boolean)
    const fragments = op.fragmentIds.map((id) => catalog.fragmentsById[id]).filter(Boolean)
    const types = op.typeIds.map((id) => catalog.typesById[id]).filter(Boolean)
    const endpoint = catalog.endpointsById[op.endpointId]
    return (
      <div className="flex flex-col gap-5">
        <Header title={op.name} meta={op.kind} />
        <Section title="Source">
          <button type="button" onClick={() => onOpenSource(op.source.path, op.source.line)} className="text-left">
            <p className="font-mono text-[12px] text-ink">{op.source.path.split('/').pop()}</p>
            <p className="text-[12px] text-mute">Line {op.source.line}</p>
            <p className="mt-1 font-mono text-[11px] text-faint">{op.source.path}</p>
          </button>
        </Section>
        <Section title="Used by">
          <p className="mb-2 text-[12px] text-mute">{usages.length} files</p>
          <ul className="flex flex-col gap-1">
            {usages.map((usage) => (
              <li key={usage.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ kind: 'file', id: usage.fileId })
                    onOpenView('files')
                  }}
                  className="block w-full truncate rounded-[5px] px-1.5 py-0.5 text-left font-mono text-[12px] text-ink hover:bg-hover"
                >
                  {usage.path.split('/').pop()}
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Fragments">
          {fragments.length === 0 ? <p className="text-[12px] text-mute">None</p> : null}
          {fragments.map((fragment) => (
            <button
              key={fragment.id}
              type="button"
              onClick={() => onSelect({ kind: 'fragment', id: fragment.id })}
              className="block rounded-[5px] px-1.5 py-0.5 text-left text-[12px] text-ink hover:bg-hover"
            >
              {fragment.name}
            </button>
          ))}
        </Section>
        <Section title="Types">
          {types.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                onSelect({ kind: 'type', id: type.id })
                onOpenView('schema')
              }}
              className="block rounded-[5px] px-1.5 py-0.5 text-left font-mono text-[12px] text-ink hover:bg-hover"
            >
              {type.name}
            </button>
          ))}
        </Section>
        <Section title="Environment">
          <p className="font-mono text-[12px] text-ink">{endpoint?.url || "No URL"}</p>
          <p className="text-[11px] text-mute">{endpoint?.name ?? "None"}</p>
          {endpoint ? (
            <button
              type="button"
              onClick={() => {
                onSelect({ kind: "endpoint", id: endpoint.id })
                onOpenView("endpoints")
              }}
              className="mt-1 text-left text-[12px] text-accent-text hover:underline"
            >
              Edit environment
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenView("endpoints")}
              className="mt-1 text-left text-[12px] text-accent-text hover:underline"
            >
              Add environment
            </button>
          )}
        </Section>
      </div>
    )
  }

  if (selected.kind === 'fragment') {
    const fragment = catalog.fragmentsById[selected.id]
    if (!fragment) return null
    const impact = impactForFragment(catalog, fragment)
    return (
      <div className="flex flex-col gap-5">
        <Header title={fragment.name} meta="Fragment" />
        <Section title="Source">
          <p className="font-mono text-[12px] text-ink">{fragment.source.path}</p>
          <p className="text-[12px] text-mute">Line {fragment.source.line}</p>
        </Section>
        <Section title="Used by">
          <p className="text-[12px] text-ink">{impact.operations} operations</p>
          <p className="text-[12px] text-mute">Referenced by {impact.files} files</p>
        </Section>
        <Section title="Potential impact">
          <ImpactRow label="operations" value={impact.operations} />
          <ImpactRow label="components" value={impact.components} />
          <ImpactRow label="screens" value={impact.screens} />
          <ImpactRow label="tests" value={impact.tests} />
        </Section>
        <Section title="Operations">
          {fragment.operationIds.slice(0, 12).map((id) => {
            const op = catalog.operationsById[id]
            if (!op) return null
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenOperation(id)}
                className="block w-full truncate rounded-[5px] px-1.5 py-0.5 text-left text-[12px] text-ink hover:bg-hover"
              >
                {op.name}
              </button>
            )
          })}
        </Section>
      </div>
    )
  }

  if (selected.kind === 'type') {
    const type = catalog.typesById[selected.id]
    if (!type) return null
    const typeFields = type.fieldIds.map((id) => catalog.fieldsById[id]).filter(Boolean)
    return (
      <div className="flex flex-col gap-5">
        <Header title={type.name} meta={type.kind} />
        <Section title="Used by">
          <p className="text-[12px] text-ink">{type.operationIds.length} operations</p>
          <p className="text-[12px] text-mute">{type.fragmentIds.length} fragments</p>
          <p className="text-[12px] text-mute">{type.fileIds.length} source files</p>
        </Section>
        <Section title="Fields">
          {typeFields.map((field) => (
            <p key={field.id} className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
              <span className="text-ink">{field.name}</span>
              <span className="text-faint">{field.returnType}</span>
            </p>
          ))}
        </Section>
      </div>
    )
  }

  if (selected.kind === 'field') {
    const field = catalog.fieldsById[selected.id]
    if (!field) return null
    return (
      <div className="flex flex-col gap-5">
        <Header title={field.name} meta={`on ${field.typeName}`} />
        <Section title="Type">
          <p className="font-mono text-[12px] text-ink">{field.returnType}</p>
        </Section>
        {field.deprecated ? (
          <Section title="Deprecated">
            <p className="text-[12px] text-warning">{field.deprecationReason}</p>
          </Section>
        ) : null}
      </div>
    )
  }

  if (selected.kind === 'file') {
    const file = catalog.filesById[selected.id]
    if (!file) return null
    return (
      <div className="flex flex-col gap-5">
        <Header title={file.path.split('/').pop() ?? file.path} meta={file.kind} />
        <Section title="Contains">
          <p className="text-[12px] text-ink">{file.operationIds.length} operations</p>
          <p className="text-[12px] text-mute">{file.fragmentIds.length} fragments</p>
          <p className="text-[12px] text-mute">{file.referenceCount} references</p>
        </Section>
        <Section title="Operations">
          {file.operationIds.slice(0, 16).map((id) => {
            const op = catalog.operationsById[id]
            if (!op) return null
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenOperation(id)}
                className="block w-full truncate rounded-[5px] px-1.5 py-0.5 text-left text-[12px] text-ink hover:bg-hover"
              >
                {op.name}
              </button>
            )
          })}
        </Section>
      </div>
    )
  }

  if (selected.kind === 'endpoint') {
    const endpoint = catalog.endpointsById[selected.id]
    if (!endpoint) return null
    return (
      <div className="flex flex-col gap-5">
        <Header title={endpoint.name} meta={endpoint.environment} />
        <Section title="URL">
          <p className="font-mono text-[12px] text-ink">{endpoint.url || "No URL"}</p>
        </Section>
        <Section title="Default headers">
          {Object.keys(endpoint.headers ?? {}).length === 0 ? (
            <p className="text-[12px] text-mute">None</p>
          ) : (
            Object.entries(endpoint.headers).map(([key, value]) => (
              <p key={key} className="flex gap-2 font-mono text-[12px]">
                <span className="text-mute">{key}</span>
                <span className="truncate text-ink">{value}</span>
              </p>
            ))
          )}
        </Section>
        <Section title="Can execute">
          <p className="text-[12px] text-ink">{endpoint.operationCount} operations</p>
        </Section>
        <button
          type="button"
          onClick={() => onOpenView("endpoints")}
          className="text-left text-[12px] text-accent-text hover:underline"
        >
          Edit environment
        </button>
      </div>
    )
  }

  return null
}

function Header({ title, meta }: { title: string; meta: string }) {
  return (
    <div>
      <p className="text-[15px] font-semibold tracking-tight text-ink">{title}</p>
      <p className="text-[11px] capitalize text-mute">{meta}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  )
}

function ImpactRow({ label, value }: { label: string; value: number }) {
  return (
    <p className="flex items-baseline justify-between text-[12px]">
      <span className="text-ink">{value}</span>
      <span className="text-mute">{label}</span>
    </p>
  )
}
