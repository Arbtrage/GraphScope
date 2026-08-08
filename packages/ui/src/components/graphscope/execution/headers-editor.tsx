"use client";

import { Button } from "../../ui/button.js";
import { Input } from "../../ui/input.js";

export function HeadersEditor({
  headers,
  onChange,
}: {
  headers: Array<{ key: string; value: string }>;
  onChange: (headers: Array<{ key: string; value: string }>) => void;
}) {
  const update = (index: number, field: "key" | "value", val: string) => {
    const next = headers.map((h, i) => (i === index ? { ...h, [field]: val } : h));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder="Header" value={h.key} onChange={(e) => update(i, "key", e.target.value)} />
          <Input placeholder="Value" value={h.value} onChange={(e) => update(i, "value", e.target.value)} />
          <Button variant="ghost" size="sm" onClick={() => onChange(headers.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...headers, { key: "", value: "" }])}>
        Add header
      </Button>
    </div>
  );
}
