import type { BrowserWindow } from 'electron';

import { registerGetSessionDetailHandler } from './get-session-detail-handler';
import { registerGetSessionsHandler } from './get-sessions-handler';
import { registerResumeSessionHandler } from './resume-session-handler';
import { registerDeleteSessionHandler } from './delete-session-handler';
import { startSessionWatcher } from './session-events';

export function registerSessionIpc(mainWindow: BrowserWindow): void {
  registerGetSessionsHandler();
  registerGetSessionDetailHandler();
  registerResumeSessionHandler();
  registerDeleteSessionHandler();
  startSessionWatcher(mainWindow);
}
