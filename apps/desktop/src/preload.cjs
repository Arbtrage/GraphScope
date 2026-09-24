const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("graphscope", {
  platform: process.platform,
  getRuntime: () => ipcRenderer.invoke("graphscope:get-runtime"),
  keychain: {
    get: (key) => ipcRenderer.invoke("keychain:get", key),
    set: (key, value) => ipcRenderer.invoke("keychain:set", key, value),
    delete: (key) => ipcRenderer.invoke("keychain:delete", key),
  },
  setTheme: (theme) => {
    ipcRenderer.send("graphscope:set-theme", theme);
  },
  onOpenRoute: (cb) => {
    const listener = (_event, path) => cb(path);
    ipcRenderer.on("graphscope:open-route", listener);
    return () => ipcRenderer.removeListener("graphscope:open-route", listener);
  },
  openDirectory: () => ipcRenderer.invoke("graphscope:open-directory"),
  openInSource: (input) => ipcRenderer.invoke("graphscope:open-in-source", input),
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    close: () => ipcRenderer.invoke("window:close"),
    toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
    getState: () => ipcRenderer.invoke("window:state"),
    onState: (cb) => {
      const listener = (_event, state) => cb(state);
      ipcRenderer.on("window:state", listener);
      return () => ipcRenderer.removeListener("window:state", listener);
    },
  },
});
