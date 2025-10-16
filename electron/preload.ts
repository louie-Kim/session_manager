import { contextBridge, ipcRenderer } from 'electron';

import type {
  ResumeSessionRequest as ResumeRequest,
  ResumeSessionResponse as ResumeResponse,
} from './ipc/resume-session-handler';
import type {
  GetSessionsResponse,
} from './ipc/get-sessions-handler';
import type {
  GetSessionDetailResponse,
  GetSessionDetailRequest,
} from './ipc/get-session-detail-handler';
import type {
  DeleteSessionRequest as DeleteRequest,
  DeleteSessionResponse as DeleteResponse,
} from './ipc/delete-session-handler';

type SessionEvent =
  | { type: 'updated' }
  | { type: 'error'; message: string };

contextBridge.exposeInMainWorld('codexSessions', {
  getSessions: (payload?: { forceRefresh?: boolean }): Promise<GetSessionsResponse> =>
    ipcRenderer.invoke('get-sessions', payload),
  getSessionDetail: (payload: GetSessionDetailRequest): Promise<GetSessionDetailResponse> =>
    ipcRenderer.invoke('get-session-detail', payload),
  resumeSession: (payload: ResumeRequest): Promise<ResumeResponse> =>
    ipcRenderer.invoke('resume-session', payload),
  deleteSession: (payload: DeleteRequest): Promise<DeleteResponse> =>
    ipcRenderer.invoke('delete-session', payload),
  onSessionEvent: (callback: (event: SessionEvent) => void) => {
    const listener = (_event: unknown, data: SessionEvent) => callback(data);
    ipcRenderer.on('session-events', listener);
    return () => ipcRenderer.removeListener('session-events', listener);
  },
});
