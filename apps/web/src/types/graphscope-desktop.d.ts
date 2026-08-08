export {};

declare global {
  interface Window {
    graphscope?: {
      keychain: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
      };
      setTheme?: (theme: "light" | "dark" | "system") => void;
      onOpenRoute?: (cb: (path: string) => void) => () => void;
      platform?: string;
    };
  }
}
