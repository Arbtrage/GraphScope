"use client";

import { useState } from "react";
import { Button } from "../../ui/button.js";
import { Input, Label } from "../../ui/input.js";
import { Textarea } from "../../ui/textarea.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog.js";

export function PublishDialog({
  onPublish,
  loading,
}: {
  onPublish: (input: { name: string; sdl: string }) => Promise<void>;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("default");
  const [sdl, setSdl] = useState("type Query {\n  hello: String\n}\n");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Publish schema</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish schema</DialogTitle>
          <DialogDescription>Upload SDL to create a new schema version.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schema-name">Name</Label>
            <Input id="schema-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schema-sdl">SDL</Label>
            <Textarea
              id="schema-sdl"
              className="min-h-[160px] font-mono"
              value={sdl}
              onChange={(e) => setSdl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            onClick={async () => {
              await onPublish({ name, sdl });
              setOpen(false);
            }}
          >
            {loading ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
