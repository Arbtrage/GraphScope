import { Button } from "@/components/ui";
import { formatCode, type CodeLanguage } from "@/lib/format-code";
import { TOKEN_CLASS, highlightCode, type Token } from "@/lib/highlight";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: CodeLanguage;
  "aria-label"?: string;
  className?: string;
  /** Format on blur (default true). */
  formatOnBlur?: boolean;
  showToolbar?: boolean;
}

/**
 * Editable code surface: colored highlight layer under a transparent textarea.
 * Formats GraphQL/JSON (and light JS) on blur / Format action.
 */
export function CodeEditor({
  value,
  onChange,
  language = "text",
  "aria-label": ariaLabel,
  className = "",
  formatOnBlur = true,
  showToolbar = true,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [focused, setFocused] = useState(false);

  const lines = useMemo(() => highlightCode(value || " ", language), [value, language]);

  const syncScroll = () => {
    const textarea = textareaRef.current;
    const pre = preRef.current;
    if (!textarea || !pre) return;
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  };

  useEffect(() => {
    syncScroll();
  }, [value, lines]);

  const applyFormat = () => {
    const next = formatCode(value, language);
    if (next !== value) onChange(next);
  };

  const shared: CSSProperties = {
    fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
    fontSize: 12,
    lineHeight: "22px",
    tabSize: 2,
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-1.5 ${className}`}>
      {showToolbar ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-faint">{languageLabel(language)}</span>
          <Button
            variant="quiet"
            size="sm"
            onClick={applyFormat}
            title="Format with Prettier-style rules"
            className="h-6 px-2 text-[11px]"
          >
            Format
          </Button>
        </div>
      ) : null}
      <div
        className={`relative min-h-0 flex-1 overflow-hidden rounded-[8px] bg-app ring-1 transition-shadow ${
          focused ? "ring-accent/50" : "ring-line"
        }`}
      >
        <pre
          ref={preRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-auto p-3 font-mono text-[12px] leading-[22px] scrollbar-thin"
          style={{ ...shared, whiteSpace: "pre", wordBreak: "normal", overflowWrap: "normal" }}
        >
          {lines.map((tokens, index) => (
            <div key={index} className="min-h-[22px]">
              <HighlightedLine tokens={tokens} />
            </div>
          ))}
        </pre>
        <textarea
          ref={textareaRef}
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={ariaLabel}
          onScroll={syncScroll}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (formatOnBlur) applyFormat();
          }}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              const el = event.currentTarget;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              const next = `${value.slice(0, start)}  ${value.slice(end)}`;
              onChange(next);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 2;
              });
            }
            if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
              event.preventDefault();
              applyFormat();
            }
          }}
          className="absolute inset-0 z-[1] h-full w-full resize-none overflow-auto bg-transparent p-3 font-mono text-[12px] leading-[22px] text-transparent outline-none selection:bg-accent/30 scrollbar-thin"
          style={{ ...shared, caretColor: "var(--text-primary)", whiteSpace: "pre", wordBreak: "normal", overflowWrap: "normal" }}
        />
      </div>
    </div>
  );
}

function HighlightedLine({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${token.kind}-${index}`} className={TOKEN_CLASS[token.kind]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

function languageLabel(language: CodeLanguage): string {
  switch (language) {
    case "graphql":
      return "GraphQL";
    case "json":
      return "JSON";
    case "javascript":
      return "JavaScript";
    case "typescript":
      return "TypeScript";
    case "shell":
      return "Shell";
    default:
      return "Plain text";
  }
}
