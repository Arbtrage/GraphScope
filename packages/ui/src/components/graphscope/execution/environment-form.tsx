"use client";

import { Button } from "../../ui/button.js";
import { Input, Label } from "../../ui/input.js";
import { useState } from "react";

export function EnvironmentForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; endpointUrl: string; isProduction?: boolean };
  onSubmit: (input: { name: string; endpointUrl: string; isProduction?: boolean }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [endpointUrl, setEndpointUrl] = useState(initial?.endpointUrl ?? "");
  const [isProduction, setIsProduction] = useState(initial?.isProduction ?? false);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input placeholder="Production" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Endpoint URL</Label>
        <Input
          placeholder="https://api.example.com/graphql"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isProduction} onChange={(e) => setIsProduction(e.target.checked)} />
        Production environment
      </label>
      <Button onClick={() => onSubmit({ name, endpointUrl, isProduction })}>Save</Button>
    </div>
  );
}
