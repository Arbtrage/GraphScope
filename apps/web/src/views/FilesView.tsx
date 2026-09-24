import { CodeBlock } from '@/components/CodeBlock'
import { buildPathTree, type FileTreeNode } from '@/data/catalog'
import { fetchRepositoryFile, fetchRepositoryTree } from '@/lib/explorer-api'
import { languageForPath } from '@/lib/format-code'
import { useExplorer } from '@/store/explorer-store'
import { CaretDown, CaretRight, FileCode, FolderSimple } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'

export function FilesView() {
  const catalog = useExplorer((s) => s.catalog)
  const activeRepositoryId = useExplorer((s) => s.activeRepositoryId)
  const openOperation = useExplorer((s) => s.openOperation)

  const [paths, setPaths] = useState<string[]>([])
  const [treeError, setTreeError] = useState<string | null>(null)
  const [treeLoading, setTreeLoading] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState<{
    path: string
    content: string
    truncated: boolean
    binary: boolean
    byteSize: number
  } | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  const catalogByPath = useMemo(() => {
    return Object.fromEntries(catalog.files.map((file) => [file.path, file]))
  }, [catalog.files])

  const tree = useMemo(() => {
    const entries = paths.map((path) => ({
      path,
      file: catalogByPath[path],
    }))
    return buildPathTree(entries)
  }, [paths, catalogByPath])

  const indexedFile = selectedPath ? catalogByPath[selectedPath] : undefined

  useEffect(() => {
    if (!activeRepositoryId) {
      setPaths([])
      return
    }
    let cancelled = false
    setTreeLoading(true)
    setTreeError(null)
    void fetchRepositoryTree(activeRepositoryId)
      .then((next) => {
        if (!cancelled) setPaths(next)
      })
      .catch((err) => {
        if (!cancelled) setTreeError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setTreeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeRepositoryId])

  useEffect(() => {
    if (!activeRepositoryId || !selectedPath) {
      setContent(null)
      return
    }
    let cancelled = false
    setContentLoading(true)
    void fetchRepositoryFile(activeRepositoryId, selectedPath)
      .then((file) => {
        if (!cancelled) setContent(file)
      })
      .catch(() => {
        if (!cancelled) setContent(null)
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeRepositoryId, selectedPath])

  return (
    <div className="flex h-full min-w-0">
      <div className="w-[300px] shrink-0 overflow-y-auto border-r border-line py-3 scrollbar-thin">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
          Repository
        </p>
        {treeLoading ? (
          <p className="px-3 text-[12px] text-mute">Loading tree…</p>
        ) : treeError ? (
          <p className="px-3 text-[12px] text-warning">{treeError}</p>
        ) : tree.length === 0 ? (
          <p className="px-3 text-[12px] text-mute">Open a repository to browse files.</p>
        ) : (
          <Tree nodes={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        {selectedPath ? (
          <>
            <h1 className="font-mono text-[16px] font-semibold tracking-tight">
              {selectedPath.split('/').pop()}
            </h1>
            <p className="mt-1 font-mono text-[11px] text-faint">{selectedPath}</p>
            {indexedFile ? (
              <dl className="mt-3 flex gap-5 text-[12px] text-mute">
                <div>
                  <dt className="font-mono text-ink">{indexedFile.operationIds.length}</dt>
                  <dd>operations</dd>
                </div>
                <div>
                  <dt className="font-mono text-ink">{indexedFile.fragmentIds.length}</dt>
                  <dd>fragments</dd>
                </div>
                <div>
                  <dt className="font-mono text-ink">{indexedFile.referenceCount}</dt>
                  <dd>references</dd>
                </div>
              </dl>
            ) : null}
            <div className="mt-4">
              {contentLoading ? (
                <p className="text-[12px] text-mute">Loading file…</p>
              ) : content?.binary ? (
                <p className="text-[12px] text-mute">
                  Binary file ({content.byteSize.toLocaleString()} bytes)
                </p>
              ) : content ? (
                <>
                  {content.truncated ? (
                    <p className="mb-2 text-[11px] text-warning">
                      Showing first {content.content.length.toLocaleString()} characters
                    </p>
                  ) : null}
                  <CodeBlock code={content.content} language={languageForPath(selectedPath)} />
                </>
              ) : (
                <p className="text-[12px] text-mute">Unable to read this file.</p>
              )}
            </div>
            {indexedFile && indexedFile.operationIds.length > 0 ? (
              <>
                <h2 className="mt-5 mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                  Operations in this file
                </h2>
                <ul>
                  {indexedFile.operationIds.map((id) => {
                    const op = catalog.operationsById[id]
                    if (!op) return null
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => openOperation(id)}
                          className="flex w-full items-baseline justify-between rounded-[6px] px-2 py-1.5 text-left hover:bg-hover"
                        >
                          <span className="text-[13px] text-ink">{op.name}</span>
                          <span className="text-[11px] capitalize text-mute">{op.kind}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] text-mute">Select a file to open it.</p>
        )}
      </div>
    </div>
  )
}

function Tree({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: FileTreeNode[]
  selectedPath: string | null
  onSelect: (path: string) => void
  depth?: number
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={depth}
        />
      ))}
    </ul>
  )
}

function TreeItem({
  node,
  selectedPath,
  onSelect,
  depth,
}: {
  node: FileTreeNode
  selectedPath: string | null
  onSelect: (path: string) => void
  depth: number
}) {
  const isDirectory = Boolean(node.children)
  const [open, setOpen] = useState(depth < 1)
  const active = !isDirectory && selectedPath === node.path
  const hasGraphql = Boolean(node.file && (node.file.operationIds.length || node.file.fragmentIds.length))

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (isDirectory) setOpen((value) => !value)
          else onSelect(node.path)
        }}
        style={{ paddingLeft: 8 + depth * 12 }}
        className={`flex h-7 w-full items-center gap-1.5 text-left font-mono text-[12px] ${
          active ? 'bg-active text-ink' : 'text-mute hover:bg-hover hover:text-ink'
        }`}
      >
        {isDirectory ? (
          open ? (
            <CaretDown size={10} />
          ) : (
            <CaretRight size={10} />
          )
        ) : (
          <FileCode size={12} className={hasGraphql ? 'text-accent' : undefined} />
        )}
        {isDirectory ? <FolderSimple size={12} /> : null}
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && open && node.children ? (
        <Tree nodes={node.children} selectedPath={selectedPath} onSelect={onSelect} depth={depth + 1} />
      ) : null}
    </li>
  )
}
