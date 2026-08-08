import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("graphscope", {
  platform: process.platform,
  keychain: {
    get: (key: string) => ipcRenderer.invoke("keychain:get", key) as Promise<string | null>,
    set: (key: string, value: string) => ipcRenderer.invoke("keychain:set", key, value) as Promise<boolean>,
    delete: (key: string) => ipcRenderer.invoke("keychain:delete", key) as Promise<boolean>,
  },
  setTheme: (theme: "light" | "dark" | "system") => {
    ipcRenderer.send("graphscope:set-theme", theme);
  },
  onOpenRoute: (cb: (path: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, path: string) => cb(path);
    ipcRenderer.on("graphscope:open-route", listener);
    return () => ipcRenderer.removeListener("graphscope:open-route", listener);
  },
});

export type GraphscopeBridge = {
  platform?: string;
  keychain: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
  setTheme?: (theme: "light" | "dark" | "system") => void;
  onOpenRoute?: (cb: (path: string) => void) => () => void;
};

declare global {
  interface Window {
    graphscope?: GraphscopeBridge;
  }
}
