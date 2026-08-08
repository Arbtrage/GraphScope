"use client";

import { Button } from "../../ui/button.js";
import { Input } from "../../ui/input.js";
import { useState } from "react";

export function SecretForm({ onSubmit }: { onSubmit: (input: { name: string; value: string }) => void }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder="Secret name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input type="password" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        onClick={() => {
          onSubmit({ name, value });
          setName("");
          setValue("");
        }}
      >
        Save
      </Button>
    </div>
  );
}
