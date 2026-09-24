import { CaretDown, Check } from "@phosphor-icons/react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-elevated px-1 font-sans text-[10px] font-medium text-mute ring-1 ring-line">
      {children}
    </kbd>
  );
}

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--bg-elevated)" />
      <path
        d="M16 6.5 25 11.7v10.6L16 27.5 7 22.3V11.7L16 6.5Z"
        stroke="var(--accent)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12.2" r="1.35" fill="var(--accent)" />
      <circle cx="11.6" cy="19.4" r="1.35" fill="var(--accent)" />
      <circle cx="20.4" cy="19.4" r="1.35" fill="var(--accent)" />
      <path
        d="M16 12.2 11.6 19.4h8.8L16 12.2Z"
        stroke="var(--accent)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ButtonVariant = "primary" | "ghost" | "quiet";
type ButtonSize = "sm" | "md";

export function Button({
  variant = "ghost",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  const sizeClass = size === "sm" ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 text-[12px]";
  const variantClass =
    variant === "primary"
      ? "bg-accent font-medium text-white hover:brightness-110 disabled:opacity-50"
      : variant === "quiet"
        ? "text-mute hover:bg-hover hover:text-ink disabled:opacity-40"
        : "bg-elevated text-ink ring-1 ring-line hover:bg-hover disabled:opacity-50";
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[7px] transition-colors active:scale-[0.98] disabled:pointer-events-none ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {loading ? "…" : null}
      {children}
    </button>
  );
}

export type SelectOption = { value: string; label: string; hint?: string };

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select…",
  className = "",
  disabled = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      options.findIndex((item) => item.value === value),
    );
    setActiveIndex(idx);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-8 w-full items-center gap-2 rounded-[7px] bg-elevated px-2.5 text-left text-[12px] text-ink ring-1 ring-line hover:bg-hover disabled:opacity-50"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-ink" : "text-faint"}`}>
          {selected?.label ?? placeholder}
        </span>
        <CaretDown size={12} className="shrink-0 text-faint" />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-[8px] bg-elevated py-1 shadow-[var(--shadow-overlay)] ring-1 ring-line scrollbar-thin"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => Math.min(options.length - 1, i + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const item = options[activeIndex];
              if (item) commit(item.value);
            }
          }}
        >
          {options.map((item, index) => {
            const active = item.value === value;
            const focused = index === activeIndex;
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] ${
                    focused ? "bg-active" : "hover:bg-hover"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(item.value)}
                >
                  <span className="min-w-0 flex-1 truncate text-ink">{item.label}</span>
                  {item.hint ? <span className="truncate font-mono text-[10px] text-faint">{item.hint}</span> : null}
                  {active ? <Check size={12} className="shrink-0 text-accent" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className = "",
  trailing,
}: {
  items: Array<{ id: T; label: string; badge?: ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={`flex items-end gap-1 border-b border-line px-3 ${className}`}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative h-9 px-2 text-[12px] capitalize transition-colors ${
              active ? "text-ink" : "text-mute hover:text-ink"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {item.label}
              {item.badge}
            </span>
            {active ? <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-accent" /> : null}
          </button>
        );
      })}
      {trailing ? <div className="ml-auto flex h-9 items-center pb-0.5">{trailing}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-faint">{label}</span> : null}
      {children}
    </label>
  );
}

export function TextArea({
  mono = false,
  fill = false,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean; fill?: boolean }) {
  return (
    <textarea
      spellCheck={false}
      className={`w-full resize-none rounded-[8px] bg-app px-3 py-2 text-[12px] leading-[20px] text-ink ring-1 ring-line outline-none focus:ring-accent/50 ${
        mono ? "font-mono" : ""
      } ${fill ? "h-full min-h-0" : "min-h-[120px]"} ${className}`}
      {...props}
    />
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }
>(function Input({ mono = false, className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-8 w-full rounded-[6px] bg-app px-2 text-[12px] text-ink ring-1 ring-line outline-none focus:ring-accent/50 ${
        mono ? "font-mono" : ""
      } ${className}`}
      {...props}
    />
  );
});

export type StatusTone = "idle" | "running" | "success" | "error" | "warning";

export function StatusChip({
  tone,
  children,
  className = "",
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/15 text-success ring-success/30"
      : tone === "error"
        ? "bg-danger/15 text-danger ring-danger/30"
        : tone === "running"
          ? "bg-info/15 text-info ring-info/30"
          : tone === "warning"
            ? "bg-warning/15 text-warning ring-warning/30"
            : "bg-elevated text-mute ring-line";
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2 font-mono text-[11px] ring-1 ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
