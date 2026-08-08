"use client";

import { Button } from "@graphscope/ui";
import { ArrowUpRight, Download, Github, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { label: "Product", href: "#product" },
  { label: "GitHub", href: "https://github.com/Arbtrage/GraphScope" },
  { label: "Open app", href: "http://localhost:3000/login" },
];

function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0", "blur-0");
            entry.target.classList.remove("opacity-0", "translate-y-16", "blur-md");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:inline-flex focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div aria-hidden className="pointer-events-none absolute inset-0 mesh-ethereal" />
      <div className="noise-overlay" aria-hidden />

      <div className="relative z-20 mx-auto mt-6 flex w-max max-w-[calc(100%-2rem)] justify-center px-4">
        <header className="flex items-center gap-3 rounded-full border border-white/10 bg-background/70 px-3 py-2 shadow-tinted-md backdrop-blur-xl dark:bg-black/50">
          <span className="flex items-center gap-2 pl-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7L12 2.5Zm0 2.3L6.5 8.1v7.8L12 19.2l5.5-3.3V8.1L12 4.8Z" />
              </svg>
            </span>
            <span className="pr-1 text-sm font-semibold tracking-tight">GraphScope</span>
          </span>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="relative h-4 w-4">
              <span
                className={`absolute left-0 top-1 block h-0.5 w-4 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-[0.4375rem] block h-0.5 w-4 bg-foreground transition-opacity duration-300 ${menuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 top-3 block h-0.5 w-4 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </span>
          </Button>
        </header>
      </div>

      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-50 flex flex-col bg-background/85 px-6 pt-24 backdrop-blur-3xl md:hidden"
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full p-2"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <ul className="space-y-2">
            {NAV.map((item, i) => (
              <li
                key={item.href}
                className="translate-y-0 opacity-100 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ transitionDelay: `${100 + i * 50}ms` }}
              >
                <Link
                  href={item.href}
                  className="block rounded-2xl px-4 py-4 text-2xl font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div id="main" className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-4 pb-24 pt-16 md:grid-cols-2 md:items-center md:gap-16 md:px-6 md:pt-24">
        <section
          data-reveal
          className="translate-y-16 opacity-0 blur-md transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0"
        >
          <span className="mb-6 inline-flex rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Local-first GraphQL
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            GraphScope
          </h1>
          <p className="mt-3 text-xl font-medium tracking-tight text-foreground/90 sm:text-2xl">
            Postman for GraphQL — schema-aware on your machine
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            Discover operations, publish schemas, run against environments, and keep history — without shipping your graph to the cloud.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="island" size="island" className="group">
              <a href="https://github.com/Arbtrage/GraphScope/releases/latest">
                Download for macOS
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 dark:bg-white/15">
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <a href="https://github.com/Arbtrage/GraphScope">
                <Github className="h-4 w-4" strokeWidth={1.5} />
                View on GitHub
              </a>
            </Button>
          </div>
        </section>

        <section
          id="product"
          data-reveal
          className="translate-y-16 opacity-0 blur-md transition-all delay-100 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0"
        >
          <div className="bezel-outer">
            <div className="bezel-inner overflow-hidden p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Workflow</p>
              <ul className="mt-4 space-y-3">
                {[
                  { step: "01", title: "Project", copy: "Connect repos and publish schema versions" },
                  { step: "02", title: "Environment", copy: "Point at local or remote GraphQL endpoints" },
                  { step: "03", title: "Execute", copy: "Run with history, collections, and AI assist" },
                ].map((item) => (
                  <li
                    key={item.step}
                    className="flex gap-4 rounded-2xl border border-border/40 bg-background/40 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="font-mono text-sm text-primary font-tabular">{item.step}</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="http://localhost:3000/login"
                className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                Open the app
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-border/40 px-6 py-10 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Apache 2.0 · macOS desktop and local API development</p>
          <div className="flex gap-4">
            <a href="https://github.com/Arbtrage/GraphScope" className="hover:text-foreground">
              GitHub
            </a>
            <a href="https://github.com/Arbtrage/GraphScope/blob/main/LICENSE" className="hover:text-foreground">
              License
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
