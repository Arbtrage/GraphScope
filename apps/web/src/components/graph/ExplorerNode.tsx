import type { GraphNodeData } from '@/lib/graph-layout'
import { Handle, Position, type NodeProps } from '@xyflow/react'

const KIND_BAR: Record<string, string> = {
  operation: 'bg-accent',
  fragment: 'bg-success',
  type: 'bg-warning',
  field: 'bg-mute',
  file: 'bg-info',
  endpoint: 'bg-accent',
}

export function ExplorerNode({ data }: NodeProps) {
  const node = data as GraphNodeData
  return (
    <div
      className={`relative min-w-[132px] rounded-[8px] bg-elevated px-2.5 py-1.5 ring-1 transition-opacity ${
        node.selected ? 'ring-accent' : 'ring-line'
      } ${node.dimmed ? 'opacity-20' : 'opacity-100'}`}
    >
      <span className={`absolute inset-y-1 left-1 w-0.5 rounded-full ${KIND_BAR[node.kind] ?? 'bg-mute'}`} />
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-mute" />
      <p className="pl-1.5 text-[10px] capitalize text-faint">{node.kind}</p>
      <p className="pl-1.5 font-mono text-[12px] text-ink">{node.label}</p>
      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-mute" />
    </div>
  )
}
