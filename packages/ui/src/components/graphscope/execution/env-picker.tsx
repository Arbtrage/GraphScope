"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.js";
import { Badge } from "../../ui/badge.js";
import { cn } from "../../../lib/utils.js";

export function EnvPicker({
  environments,
  activeId,
  onChange,
  className,
}: {
  environments: Array<{ id: string; name: string }>;
  activeId: string | null;
  onChange: (id: string) => void;
  className?: string;
}) {
  if (!environments.length) {
    return <Badge variant="warning">No environment</Badge>;
  }
  return (
    <Select value={activeId ?? environments[0]?.id} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        <SelectValue placeholder="Environment" />
      </SelectTrigger>
      <SelectContent>
        {environments.map((env) => (
          <SelectItem key={env.id} value={env.id}>
            {env.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
