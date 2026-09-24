import { CodeBlock } from '@/components/CodeBlock'
import { Button, Kbd } from '@/components/ui'
import type { IndexedCatalog, Operation } from '@/data/types'
import { useExplorer } from '@/store/explorer-store'
import { ArrowLeft, ArrowSquareOut, Copy, Play } from '@phosphor-icons/react'
import { useMemo } from 'react'

export function OperationsView() {
  const catalog = useExplorer((s) => s.catalog)
  const showDetail = useExplorer((s) => s.showOperationDetail)
  const selected = useExplorer((s) => s.selected)
  const operation = selected?.kind === 'operation' ? catalog.operationsById[selected.id] : null
  if (showDetail && operation) return <OperationDetail catalog={catalog} operation={operation} />
  return <OperationList catalog={catalog} />
}

function OperationList({ catalog }: { catalog: IndexedCatalog }) {
  const filter = useExplorer((s) => s.operationFilter)
  const sort = useExplorer((s) => s.operationSort)
  const setFilter = useExplorer((s) => s.setOperationFilter)
  const setSort = useExplorer((s) => s.setOperationSort)
  const selected = useExplorer((s) => s.selected)
  const openOperation = useExplorer((s) => s.openOperation)
  const openPalette = useExplorer((s) => s.openPalette)

  const items = useMemo(() => {
    let list = catalog.operations
    if (filter !== 'all') list = list.filter((op) => op.kind === filter)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [catalog, filter, sort])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="shrink-0 px-5 pt-4 pb-3">
        <h1 className="text-[18px] font-semibold tracking-tight">Operations</h1>
        <p className="text-[12px] text-mute">{catalog.stats.operations} operations discovered across your codebase</p>
        <Button
          variant="quiet"
          onClick={() => openPalette('operations')}
          className="mt-3 h-8 w-full max-w-[420px] justify-start gap-2 rounded-[7px] bg-app px-3 text-[12px] text-faint ring-1 ring-line hover:bg-elevated"
        >
          Search operations...
          <span className="ml-auto flex gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Button>
        <div className="mt-3 flex items-center gap-1">
          {(['all', 'query', 'mutation', 'subscription'] as const).map((item) => (
            <Button
              key={item}
              variant="quiet"
              size="sm"
              onClick={() => setFilter(item)}
              className={`capitalize ${
                filter === item ? 'bg-active text-ink' : 'text-mute hover:bg-hover hover:text-ink'
              }`}
            >
              {item === 'all' ? 'All' : item === 'query' ? 'Queries' : item === 'mutation' ? 'Mutations' : 'Subscriptions'}
            </Button>
          ))}
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setSort(sort === 'recent' ? 'name' : 'recent')}
            className="ml-auto text-mute hover:bg-hover"
          >
            Sort: {sort === 'recent' ? 'Recently changed' : 'Name'}
          </Button>
        </div>
      </header>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {items.map((op) => {
          const active = selected?.id === op.id
          const fragments = op.fragmentIds
            .map((id) => catalog.fragmentsById[id]?.name)
            .filter(Boolean)
            .slice(0, 2)
          const types = op.typeIds
            .map((id) => catalog.typesById[id]?.name)
            .filter(Boolean)
            .slice(0, 1)
          return (
            <li key={op.id} className="content-visibility-auto">
              <button
                type="button"
                onClick={() => openOperation(op.id)}
                className={`flex w-full flex-col gap-0.5 rounded-[8px] border-b border-line px-3 py-2.5 text-left last:border-b-0 ${
                  active ? 'bg-active' : 'hover:bg-hover'
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">{op.name}</span>
                  <span className="text-[11px] capitalize text-mute">{op.kind}</span>
                </span>
                {op.description ? <span className="text-[12px] text-mute">{op.description}</span> : null}
                <span className="font-mono text-[11px] text-faint">
                  {op.source.path}:{op.source.line}
                </span>
                <span className="text-[11px] text-faint">
                  {[...fragments, ...types, `${op.usageIds.length} usages`].filter(Boolean).join(' · ')}
                  {op.unused ? ' · unused' : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function OperationDetail({ operation }: { catalog: IndexedCatalog; operation: Operation }) {
  const executeRun = useExplorer((s) => s.executeRun)
  const openRun = useExplorer((s) => s.openRun)
  const showToast = useExplorer((s) => s.showToast)
  const openInSource = useExplorer((s) => s.openInSource)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <Button
            variant="quiet"
            size="sm"
            className="mb-2 !px-0"
            onClick={() => useExplorer.setState({ showOperationDetail: false, view: 'operations' })}
          >
            <ArrowLeft size={12} />
            Operations
          </Button>
          <h1 className="text-[18px] font-semibold tracking-tight">{operation.name}</h1>
          <p className="text-[12px] capitalize text-mute">{operation.kind}</p>
          <p className="mt-1 font-mono text-[11px] text-faint">{operation.source.path}</p>
          <p className="font-mono text-[11px] text-faint">Line {operation.source.line}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            onClick={() => {
              openRun()
              void executeRun()
            }}
          >
            <Play size={13} weight="fill" />
            Run
            <span className="ml-0.5 text-[10px] text-white/70">⌘↵</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void navigator.clipboard.writeText(operation.document)
              showToast('Copied query')
            }}
          >
            <Copy size={13} />
            Copy
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              openInSource(operation.source.path, operation.source.line)
            }}
          >
            <ArrowSquareOut size={13} />
            Open in source
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-5 pb-4 scrollbar-thin">
        <CodeBlock code={operation.document} language="graphql" startLine={operation.source.line} />
      </div>
    </div>
  )
}
