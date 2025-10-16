import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { format } from 'node:url';

import { registerSessionIpc } from './ipc';
import { stopSessionWatcher } from './ipc/session-events';

let mainWindow: BrowserWindow | null = null;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  registerSessionIpc(mainWindow);

  const startUrl =
    process.env.ELECTRON_START_URL ??
    (app.isPackaged
      ? format({
          pathname: join(__dirname, '..', 'out', 'index.html'),
          protocol: 'file',
          slashes: true,
        })
      : 'http://localhost:3000');

  await mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createMainWindow();
  }
});

app.on('before-quit', () => {
  stopSessionWatcher();
});
