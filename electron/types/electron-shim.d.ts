declare module 'electron' {
  export interface IpcMainInvokeEvent {
    sender: unknown;
  }

  export interface IpcMain {
    handle(
      channel: string,
      listener: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown | Promise<unknown>,
    ): void;
    removeHandler(channel: string): void;
  }

  export interface BrowserWindowConstructorOptions {
    width?: number;
    height?: number;
    webPreferences?: {
      preload?: string;
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
    };
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowConstructorOptions);
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): void;
    webContents: {
      send(channel: string, ...args: unknown[]): void;
      openDevTools(options?: unknown): void;
    };
    isDestroyed(): boolean;
    static getAllWindows(): BrowserWindow[];
  }

  export const ipcMain: IpcMain;

  export const ipcRenderer: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
    removeListener(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
  };

  export const contextBridge: {
    exposeInMainWorld(key: string, api: unknown): void;
  };

  export const app: {
    isPackaged: boolean;
    whenReady(): Promise<void>;
    quit(): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
  };
}
