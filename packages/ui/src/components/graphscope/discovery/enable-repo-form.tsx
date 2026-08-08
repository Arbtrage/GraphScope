"use client";

import { Button } from "../../ui/button.js";
import { Input, Label } from "../../ui/input.js";
import { useState } from "react";

export function EnableRepoForm({
  onEnable,
}: {
  onEnable: (input: { sourceType: "LOCAL" | "GITHUB"; localPath?: string; githubRepo?: string }) => void;
}) {
  const [sourceType, setSourceType] = useState<"LOCAL" | "GITHUB">("LOCAL");
  const [localPath, setLocalPath] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant={sourceType === "LOCAL" ? "default" : "outline"} size="sm" onClick={() => setSourceType("LOCAL")}>
          Local folder
        </Button>
        <Button variant={sourceType === "GITHUB" ? "default" : "outline"} size="sm" onClick={() => setSourceType("GITHUB")}>
          GitHub
        </Button>
      </div>
      {sourceType === "LOCAL" ? (
        <Input placeholder="/path/to/repo" value={localPath} onChange={(e) => setLocalPath(e.target.value)} />
      ) : (
        <Input placeholder="owner/repo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
      )}
      <Button
        onClick={() =>
          onEnable({
            sourceType,
            localPath: sourceType === "LOCAL" ? localPath : undefined,
            githubRepo: sourceType === "GITHUB" ? githubRepo : undefined,
          })
        }
      >
        Enable & index
      </Button>
    </div>
  );
}
