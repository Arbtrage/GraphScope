import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("graphscope", {
  keychain: {
    get: (key: string) => ipcRenderer.invoke("keychain:get", key) as Promise<string | null>,
    set: (key: string, value: string) => ipcRenderer.invoke("keychain:set", key, value) as Promise<boolean>,
    delete: (key: string) => ipcRenderer.invoke("keychain:delete", key) as Promise<boolean>,
  },
});

export type GraphscopeBridge = {
  keychain: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
};

declare global {
  interface Window {
    graphscope?: GraphscopeBridge;
  }
}
