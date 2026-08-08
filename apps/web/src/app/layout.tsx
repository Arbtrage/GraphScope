import { JetBrains_Mono, Outfit } from "next/font/google";
import "@graphscope/ui/styles/globals.css";
import "../styles/honeycomb.css";
import { AppToaster } from "@/components/app-toaster";
import { DesktopBridge } from "@/components/desktop-bridge";
import { NavigationProvider } from "@/components/navigation-provider";
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

export const metadata = {
  title: "GraphScope",
  description: "Local-first GraphQL workspace — discover, schema, execute.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <NavigationProvider>
            <DesktopBridge>{children}</DesktopBridge>
          </NavigationProvider>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
