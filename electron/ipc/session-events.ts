import type { BrowserWindow } from 'electron';

import { createSessionWatcher, SessionWatcher } from '../watchers/session-watcher';
import { getSessionRootPath } from '../paths/session-root';

let watcher: SessionWatcher | null = null;

export function startSessionWatcher(window: BrowserWindow): void {
  if (watcher) {
    return;
  }

  const rootPath = getSessionRootPath();

  watcher = createSessionWatcher(rootPath, (event) => {
    if (!window || window.isDestroyed()) {
      return;
    }

    switch (event.type) {
      case 'updated':
        window.webContents.send('session-events', { type: 'updated' });
        break;
      case 'error':
        window.webContents.send('session-events', {
          type: 'error',
          message:
            event.error instanceof Error ? event.error.message : 'Unknown session watcher error.',
        });
        break;
    }
  });
}

export function stopSessionWatcher(): void {
  watcher?.dispose();
  watcher = null;
}
