"use client";

import { Badge } from "../ui/badge.js";
import { Button } from "../ui/button.js";
import { Input, Label } from "../ui/input.js";
import { ScrollArea } from "../ui/scroll-area.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.js";
import { Separator } from "../ui/separator.js";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.js";
import { Textarea } from "../ui/textarea.js";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export type AiRedactionMode = "STRICT" | "STANDARD" | "FULL";

export interface SchemaCitation {
  typeName: string;
  fieldName?: string | null;
}

export interface AiSidePanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  operationId?: string;
  operationContent?: string;
  projectId?: string;
  schemaVersionId?: string;
  settings?: {
    redactionMode: AiRedactionMode;
    enabled: boolean;
    hasOpenAiKey: boolean;
  };
  loading?: boolean;
  explanation?: { markdown: string; citations: SchemaCitation[] };
  generated?: { document: string; warnings: string[] };
  onExplain?: () => void | Promise<void>;
  onGenerate?: (prompt: string) => void | Promise<void>;
  onApplyGenerated?: (document: string) => void;
  triggerLabel?: string;
}

function CitationList({ citations }: { citations: SchemaCitation[] }) {
  if (!citations.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Citations</p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c, i) => (
          <Badge key={`${c.typeName}-${c.fieldName ?? i}`} variant="secondary" className="font-mono text-xs">
            {c.fieldName ? `${c.typeName}.${c.fieldName}` : c.typeName}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
      {markdown}
    </div>
  );
}

export function AiSidePanel({
  open,
  onOpenChange,
  operationId,
  operationContent,
  projectId: _projectId,
  schemaVersionId,
  settings,
  loading,
  explanation,
  generated,
  onExplain,
  onGenerate,
  onApplyGenerated,
  triggerLabel = "AI Copilot",
}: AiSidePanelProps) {
  const [prompt, setPrompt] = useState("");
  const disabled = settings?.enabled === false;

  const panel = (
    <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Copilot
        </SheetTitle>
        <SheetDescription>
          Schema-aware explain and generate. Redaction: {settings?.redactionMode ?? "STANDARD"}.
        </SheetDescription>
      </SheetHeader>

      {disabled && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          AI is disabled for this workspace. Enable it in Settings.
        </p>
      )}

      {!settings?.hasOpenAiKey && (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          Using mock provider until an OpenAI key is saved in Settings.
        </p>
      )}

      <Tabs defaultValue="explain" className="mt-4 flex min-h-0 flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explain">Explain</TabsTrigger>
          <TabsTrigger value="generate" disabled={!schemaVersionId}>
            Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explain" className="mt-4 flex min-h-0 flex-1 flex-col space-y-4">
          <Button disabled={disabled || loading || (!operationId && !operationContent)} onClick={() => onExplain?.()}>
            {loading ? "Explaining…" : "Explain operation"}
          </Button>
          <ScrollArea className="flex-1 rounded-md border border-border bg-muted/20 p-3">
            {explanation ? (
              <div className="space-y-4">
                <MarkdownBody markdown={explanation.markdown} />
                <CitationList citations={explanation.citations} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Run explain to see a schema-grounded summary.</p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="generate" className="mt-4 flex min-h-0 flex-1 flex-col space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Natural language request</Label>
            <Textarea
              id="ai-prompt"
              placeholder="List all users with their names"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button
            disabled={disabled || loading || !schemaVersionId || !prompt.trim()}
            onClick={() => onGenerate?.(prompt)}
          >
            {loading ? "Generating…" : "Generate operation"}
          </Button>
          <ScrollArea className="flex-1 rounded-md border border-border bg-muted/20 p-3">
            {generated ? (
              <div className="space-y-3">
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{generated.document}</pre>
                {generated.warnings.length > 0 && (
                  <div className="space-y-1">
                    {generated.warnings.map((w) => (
                      <p key={w} className="text-xs text-destructive">{w}</p>
                    ))}
                  </div>
                )}
                {onApplyGenerated && (
                  <Button size="sm" variant="secondary" onClick={() => onApplyGenerated(generated.document)}>
                    Use in editor
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Generated operations are validated against the schema.</p>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </SheetContent>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {panel}
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      {panel}
    </Sheet>
  );
}

export function AiModeSelect({
  value,
  onChange,
  disabled,
}: {
  value: AiRedactionMode;
  onChange: (mode: AiRedactionMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Redaction mode</Label>
      <Select value={value} onValueChange={(v) => onChange(v as AiRedactionMode)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="STRICT">Strict — minimal schema</SelectItem>
          <SelectItem value="STANDARD">Standard — referenced types</SelectItem>
          <SelectItem value="FULL">Full — entire schema</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AiSettingsForm({
  redactionMode,
  enabled,
  hasOpenAiKey,
  onSaveKey,
  onUpdateSettings,
  saving,
}: {
  redactionMode: AiRedactionMode;
  enabled: boolean;
  hasOpenAiKey: boolean;
  onSaveKey: (key: string) => void | Promise<void>;
  onUpdateSettings: (patch: { redactionMode?: AiRedactionMode; enabled?: boolean }) => void | Promise<void>;
  saving?: boolean;
}) {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="space-y-4">
      <Separator />
      <DropdownMenuLabelSection title="AI Copilot" />
      <AiModeSelect
        value={redactionMode}
        onChange={(mode) => onUpdateSettings({ redactionMode: mode })}
        disabled={saving}
      />
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="ai-enabled" className="text-sm">Enabled</Label>
        <Button
          id="ai-enabled"
          size="sm"
          variant={enabled ? "default" : "outline"}
          disabled={saving}
          onClick={() => onUpdateSettings({ enabled: !enabled })}
        >
          {enabled ? "On" : "Off"}
        </Button>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-normal text-muted-foreground">
          OpenAI API key {hasOpenAiKey ? "(saved)" : ""}
        </Label>
        <Input
          type="password"
          placeholder="sk-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="h-8"
        />
        <Button
          size="sm"
          className="w-full"
          variant="secondary"
          disabled={!apiKey.trim() || saving}
          onClick={async () => {
            await onSaveKey(apiKey);
            setApiKey("");
          }}
        >
          Save OpenAI key
        </Button>
      </div>
    </div>
  );
}

function DropdownMenuLabelSection({ title }: { title: string }) {
  return <p className="px-2 text-xs font-medium text-muted-foreground">{title}</p>;
}
