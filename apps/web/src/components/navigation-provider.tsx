"use client";

import { cn } from "@graphscope/ui";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type TransitionStartFunction,
} from "react";
import { startTransition } from "react";

type NavigationContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
  navigate: (href: string, options?: { replace?: boolean }) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function normalizePath(href: string): string {
  try {
    const url = new URL(href, "http://local");
    return url.pathname + url.search;
  } catch {
    return href;
  }
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const pendingPath = useRef<string | null>(null);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const completeNavigation = useCallback(() => {
    pendingPath.current = null;
    setIsNavigating(false);
  }, []);

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const target = normalizePath(href);
      const current = pathname + (typeof window !== "undefined" ? window.location.search : "");
      if (target.split("?")[0] === pathname && !href.includes("?")) {
        return;
      }
      if (target === current) return;

      pendingPath.current = target;
      startNavigation();

      const go: TransitionStartFunction = (fn) => startTransition(fn);
      go(() => {
        if (options?.replace) router.replace(href);
        else router.push(href);
      });
    },
    [pathname, router, startNavigation],
  );

  useEffect(() => {
    completeNavigation();
  }, [pathname, completeNavigation]);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(completeNavigation, 8000);
    return () => window.clearTimeout(timeout);
  }, [isNavigating, completeNavigation]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalHref(href)) return;

      const next = normalizePath(href);
      if (next.split("?")[0] === pathname && !href.includes("?")) return;

      pendingPath.current = next;
      startNavigation();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startNavigation]);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation, navigate }}>
      <NavigationProgress active={isNavigating} />
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return ctx;
}

export function useAppRouter() {
  const { navigate } = useNavigation();
  const router = useRouter();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  };
}

import { HoneycombLoader } from "@/components/honeycomb-loader";

export function NavigationContent({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigation();

  return (
    <div className="relative min-h-full">
      {children}
      {isNavigating && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
          aria-busy
          aria-live="polite"
        >
          <HoneycombLoader />
        </div>
      )}
    </div>
  );
}

function NavigationProgress({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full w-2/5 bg-execute shadow-[0_0_8px_var(--execute)]",
          active ? "animate-navigation-progress" : "",
        )}
      />
    </div>
  );
}
