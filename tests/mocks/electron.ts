export const ipcMain = {
  handle: () => {},
  removeHandler: () => {},
};

export const ipcRenderer = {
  invoke: async () => ({}),
  on: () => {},
  removeListener: () => {},
};

export const contextBridge = {
  exposeInMainWorld: () => {},
};

export class BrowserWindow {
  webContents = {
    send: () => {},
    openDevTools: () => {},
  };

  loadURL = async () => {};
  on = () => {};
  isDestroyed = () => false;

  static getAllWindows(): BrowserWindow[] {
    return [];
  }
}

export const app = {
  isPackaged: false,
  whenReady: async () => undefined,
  quit: () => {},
  on: () => {},
};
