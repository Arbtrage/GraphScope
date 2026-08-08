"use client";

import { Textarea } from "../../ui/textarea.js";

export function VariablesForm({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-2">
      <Textarea className="min-h-[120px] font-mono text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
