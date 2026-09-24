import { Button, Input } from "@/components/ui";
import type { HeaderPair } from "@/data/types";
import { Plus, Trash } from "@phosphor-icons/react";

let pairSeq = 0;

export function newHeaderPair(key = "", value = ""): HeaderPair {
  pairSeq += 1;
  return { id: `hdr-${pairSeq}-${Date.now()}`, key, value };
}

export function pairsFromRecord(headers?: Record<string, string> | null): HeaderPair[] {
  const entries = Object.entries(headers ?? {});
  if (!entries.length) return [newHeaderPair()];
  return entries.map(([key, value]) => newHeaderPair(key, value));
}

export function recordFromPairs(pairs: HeaderPair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of pairs) {
    const key = pair.key.trim();
    if (!key) continue;
    out[key] = pair.value;
  }
  return out;
}

export function HeaderEditor({
  pairs,
  onChange,
}: {
  pairs: HeaderPair[];
  onChange: (pairs: HeaderPair[]) => void;
}) {
  const update = (id: string, patch: Partial<HeaderPair>) => {
    onChange(pairs.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_28px] gap-1.5 text-[10px] uppercase tracking-[0.12em] text-faint">
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {pairs.map((pair) => (
        <div key={pair.id} className="grid grid-cols-[1fr_1fr_28px] items-center gap-1.5">
          <Input
            mono
            value={pair.key}
            onChange={(event) => update(pair.id, { key: event.target.value })}
            placeholder="Authorization"
          />
          <Input
            mono
            value={pair.value}
            onChange={(event) => update(pair.id, { value: event.target.value })}
            placeholder="Bearer …"
          />
          <Button
            variant="quiet"
            className="!h-8 !w-7 !px-0"
            aria-label="Remove header"
            onClick={() =>
              onChange(pairs.length === 1 ? [newHeaderPair()] : pairs.filter((item) => item.id !== pair.id))
            }
          >
            <Trash size={13} />
          </Button>
        </div>
      ))}
      <Button variant="quiet" size="sm" className="w-fit" onClick={() => onChange([...pairs, newHeaderPair()])}>
        <Plus size={12} />
        Add header
      </Button>
    </div>
  );
}
