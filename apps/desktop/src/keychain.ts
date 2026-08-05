import { ipcMain } from "electron";
import keytar from "keytar";

const SERVICE = "GraphScope";

export function registerKeychainHandlers(): void {
  ipcMain.handle("keychain:get", async (_event, key: string) => {
    return keytar.getPassword(SERVICE, key);
  });

  ipcMain.handle("keychain:set", async (_event, key: string, value: string) => {
    await keytar.setPassword(SERVICE, key, value);
    return true;
  });

  ipcMain.handle("keychain:delete", async (_event, key: string) => {
    await keytar.deletePassword(SERVICE, key);
    return true;
  });
}
