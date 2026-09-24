import { formatCode, type CodeLanguage } from "@/lib/format-code";
import { TOKEN_CLASS, highlightCode, type Token } from "@/lib/highlight";
import { useMemo } from "react";

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  startLine?: number;
  /** Format with Prettier-like rules before highlight (default true). */
  format?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "text",
  startLine = 1,
  format = true,
  className = "",
}: CodeBlockProps) {
  const display = useMemo(
    () => (format ? formatCode(code, language) : code.replace(/\r\n/g, "\n")),
    [code, language, format],
  );

  const lines = useMemo(() => highlightCode(display, language), [display, language]);

  return (
    <div className={`overflow-auto rounded-[8px] bg-app ring-1 ring-line scrollbar-thin ${className}`}>
      <table className="w-full border-collapse font-mono text-[12px] leading-[22px]">
        <tbody>
          {lines.map((tokens, index) => (
            <tr key={`${startLine + index}`} className="hover:bg-elevated/40">
              <td className="w-12 select-none border-r border-line pr-3 text-right align-top text-faint">
                {startLine + index}
              </td>
              <td className="whitespace-pre px-3 align-top">
                <Line tokens={tokens} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Line({ tokens }: { tokens: Token[] }) {
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
