import { Button } from "@graphscope/ui";
import { Download, Github } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">GraphScope</span>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="https://github.com/Arbtrage/GraphScope" className="hover:text-foreground">
              GitHub
            </Link>
            <Link href="/app" className="hover:text-foreground">
              Open app
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Open source</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Postman for GraphQL — local-first, schema-aware
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Discover operations from your repos, publish schemas, run queries against environments, and keep history —
          all on your machine.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <a href="https://github.com/Arbtrage/GraphScope/releases/latest">
              <Download className="mr-2 h-4 w-4" />
              Download for macOS
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/Arbtrage/GraphScope">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Apache 2.0 · Built for macOS desktop and local API development
      </footer>
    </main>
  );
}
