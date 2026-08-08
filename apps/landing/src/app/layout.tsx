import { Outfit, JetBrains_Mono } from "next/font/google";
import "@graphscope/ui/styles/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GraphScope — Postman for GraphQL",
  description:
    "Discover operations from your repos, publish schemas, run queries against environments, and keep history — all on your machine.",
  openGraph: {
    title: "GraphScope — Postman for GraphQL",
    description:
      "Local-first, schema-aware GraphQL workspace for macOS desktop and local API development.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
