import { Input } from '@/components/ui'
import { searchCatalog } from '@/data/catalog'
import { useExplorer } from '@/store/explorer-store'
import { useMemo, type ReactNode } from 'react'

export function SearchView() {
  const catalog = useExplorer((s) => s.catalog)
  const query = useExplorer((s) => s.searchQuery)
  const openOperation = useExplorer((s) => s.openOperation)
  const select = useExplorer((s) => s.select)
  const setView = useExplorer((s) => s.setView)
  const results = useMemo(() => searchCatalog(catalog, query || ''), [catalog, query])

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="px-5 pt-4 pb-3">
        <h1 className="text-[18px] font-semibold tracking-tight">Search</h1>
        <Input
          value={query}
          onChange={(event) => useExplorer.setState({ searchQuery: event.target.value })}
          placeholder="Search operations, fragments, types, files"
          className="mt-3 max-w-[480px] rounded-[7px] px-3 text-[13px]"
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 scrollbar-thin">
        <Group title="Operations">
          {results.operations.map((item) => (
            <Row
              key={item.id}
              title={item.name}
              meta={`${capitalize(item.kind)}  ${item.source.path}`}
              onClick={() => openOperation(item.id)}
            />
          ))}
        </Group>
        <Group title="Fragments">
          {results.fragments.map((item) => (
            <Row
              key={item.id}
              title={item.name}
              meta={item.source.path}
              onClick={() => {
                select({ kind: 'fragment', id: item.id })
                setView('graph')
              }}
            />
          ))}
        </Group>
        <Group title="Types">
          {results.types.map((item) => (
            <Row
              key={item.id}
              title={item.name}
              meta="Schema"
              onClick={() => {
                select({ kind: 'type', id: item.id })
                setView('schema')
              }}
            />
          ))}
        </Group>
        <Group title="Files">
          {results.files.map((item) => (
            <Row
              key={item.id}
              title={item.path.split('/').pop() ?? item.path}
              meta={item.path}
              onClick={() => {
                select({ kind: 'file', id: item.id })
                setView('files')
              }}
            />
          ))}
        </Group>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{title}</h2>
      <ul>{children}</ul>
    </section>
  )
}

function Row({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full flex-col rounded-[6px] px-2 py-1.5 text-left hover:bg-hover">
        <span className="text-[13px] text-ink">{title}</span>
        <span className="font-mono text-[11px] text-faint">{meta}</span>
      </button>
    </li>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

