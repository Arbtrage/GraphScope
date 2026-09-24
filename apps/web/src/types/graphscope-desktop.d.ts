export {};

declare global {
  interface Window {
    graphscope?: {
      platform?: string;
      getRuntime?: () => Promise<{
        apiHost: string;
        apiPort: number;
        pgPort: number;
        webPort: number;
        webUrl: string;
        apiUrl: string;
        createdAt: string;
      }>;
      keychain: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
      };
      setTheme?: (theme: "light" | "dark" | "system") => void;
      onOpenRoute?: (cb: (path: string) => void) => () => void;
      openDirectory?: () => Promise<string | null>;
      openInSource?: (input: { path: string; line?: number }) => Promise<boolean>;
      window?: {
        minimize: () => Promise<void>;
        close: () => Promise<void>;
        toggleFullscreen: () => Promise<{ fullscreen: boolean }>;
        getState: () => Promise<{ fullscreen: boolean }>;
        onState: (cb: (state: { fullscreen: boolean }) => void) => () => void;
      };
    };
  }
}
