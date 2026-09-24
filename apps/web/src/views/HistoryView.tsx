import type { HistoryEntry } from '@/data/types'
import { useExplorer } from '@/store/explorer-store'

export function HistoryView() {
  const catalog = useExplorer((s) => s.catalog)
  const history = useExplorer((s) => s.history)
  const replayOperation = useExplorer((s) => s.replayOperation)
  const today = history.filter((entry) => entry.day === 'today')
  const yesterday = history.filter((entry) => entry.day === 'yesterday')
  const older = history.filter((entry) => entry.day === 'older')

  return (
    <div className="h-full overflow-y-auto px-5 py-4 scrollbar-thin">
      <h1 className="text-[18px] font-semibold tracking-tight">History</h1>
      <p className="mb-4 text-[12px] text-mute">Recent runs in {catalog.repository.name}. Click to reopen the last draft.</p>
      <Group title="Today" entries={today} onOpen={replayOperation} />
      <Group title="Yesterday" entries={yesterday} onOpen={replayOperation} />
      {older.length > 0 ? <Group title="Older" entries={older} onOpen={replayOperation} /> : null}
    </div>
  )
}

function Group({
  title,
  entries,
  onOpen,
}: {
  title: string
  entries: HistoryEntry[]
  onOpen: (id: string) => void
}) {
  if (entries.length === 0) return null
  return (
    <section className="mb-6">
      <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onOpen(entry.operationId)}
              className="flex w-full items-baseline justify-between rounded-[6px] px-2 py-2 text-left hover:bg-hover"
            >
              <span>
                <span className="block text-[13px] text-ink">{entry.operationName}</span>
                <span className="text-[11px] capitalize text-faint">{entry.kind}</span>
              </span>
              <span className="font-mono text-[11px] text-mute">{entry.at}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
