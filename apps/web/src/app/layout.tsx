import { JetBrains_Mono } from "next/font/google";
import "@graphscope/ui/styles/globals.css";
import "../styles/honeycomb.css";
import { AppToaster } from "@/components/app-toaster";
import { NavigationProvider } from "@/components/navigation-provider";
import { ThemeProvider } from "@/components/theme-provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
