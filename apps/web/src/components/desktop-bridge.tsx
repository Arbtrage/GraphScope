"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAppRouter } from "@/components/navigation-provider";
import { hydrateSessionFromKeychain } from "@/lib/apollo";

/** Marks Electron renderer and syncs theme / deep links. */
export function DesktopBridge({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useAppRouter();

  useEffect(() => {
    void hydrateSessionFromKeychain();
    if (!window.graphscope) return;
    document.documentElement.dataset.desktop = "true";
    document.documentElement.dataset.platform = window.graphscope.platform ?? "desktop";
  }, []);

  useEffect(() => {
    if (!window.graphscope?.setTheme || !resolvedTheme) return;
    window.graphscope.setTheme(resolvedTheme === "light" ? "light" : "dark");
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (!window.graphscope?.onOpenRoute) return;
    return window.graphscope.onOpenRoute((path) => {
      router.push(path.startsWith("/") ? path : `/${path}`);
    });
  }, [router]);

  return children;
}
