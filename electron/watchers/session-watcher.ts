import { watch } from 'node:fs';
import { join } from 'node:path';

type Listener = (event: SessionWatcherEvent) => void;

export type SessionWatcherEvent =
  | { type: 'updated'; path: string | null }
  | { type: 'error'; error: unknown };

export interface SessionWatcher {
  dispose: () => void;
}

export function createSessionWatcher(rootPath: string, listener: Listener): SessionWatcher | null {
  try {
    const watcher = watch(rootPath, { recursive: true }, (eventType, filename) => {
      const fullPath = filename ? join(rootPath, filename.toString()) : null;
      listener({ type: 'updated', path: fullPath });
    });

    watcher.on('error', (error) => listener({ type: 'error', error }));

    return {
      dispose: () => watcher.close(),
    };
  } catch (error) {
    listener({ type: 'error', error });
    return null;
  }
}
