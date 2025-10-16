/**
 * @jest-environment node
 */

import type { ResumeSessionResult } from '../electron/types/session';

const mockHandle = jest.fn();
const mockResumeSession = jest.fn();

jest.mock('electron', () => ({
  ipcMain: {
    handle: (...args: unknown[]) => mockHandle(...args),
  },
}));

jest.mock('../electron/cli/resume-session', () => ({
  resumeSession: (...args: unknown[]) => mockResumeSession(...args),
}));

describe('registerResumeSessionHandler', () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockResumeSession.mockReset();
  });

  it('registers IPC handler and returns success payload', async () => {
    const { registerResumeSessionHandler } = await import('../electron/ipc/resume-session-handler');
    registerResumeSessionHandler();

    expect(mockHandle).toHaveBeenCalledTimes(1);
    const [channel, handler] = mockHandle.mock.calls[0];

    expect(channel).toBe('resume-session');
    const fakeResult: ResumeSessionResult = {
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      metaPath: 'mock/meta/path',
      cliPath: 'mock/cli/path',
      command: 'start cmd /k codex resume 0199dc75-7be5-7ae2-98a3-5be0079041b5',
      simulated: false,
    };
    mockResumeSession.mockReturnValue(fakeResult);

    const handlerFn = handler as (
      event: unknown,
      payload: import('../electron/ipc/resume-session-handler').ResumeSessionRequest,
    ) => Promise<unknown>;
    const response = await handlerFn({}, { sessionId: fakeResult.sessionId, path: 'C:\\sessions\\foo' });
    expect(response).toEqual({
      success: true,
      sessionId: fakeResult.sessionId,
      metaPath: fakeResult.metaPath,
      command: fakeResult.command,
      cliPath: fakeResult.cliPath,
      simulated: false,
    });
  });

  it('maps resume errors into structured IPC response', async () => {
    const { registerResumeSessionHandler } = await import('../electron/ipc/resume-session-handler');
    registerResumeSessionHandler();

    const [, handler] = mockHandle.mock.calls[0];
    const validId = '0199dc75-7be5-7ae2-98a3-5be0079041b5';
    const error = new (await import('../electron/types/session')).ResumeSessionError({
      code: 'ID_MISMATCH',
      message: 'Mismatch',
    });
    mockResumeSession.mockImplementation(() => {
      throw error;
    });

    const handlerFn = handler as (
      event: unknown,
      payload: import('../electron/ipc/resume-session-handler').ResumeSessionRequest,
    ) => Promise<unknown>;
    const response = await handlerFn({}, { sessionId: validId, path: 'path' });

    expect(response).toEqual({
      success: false,
      error: {
        code: 'ID_MISMATCH',
        message: 'Mismatch',
      },
    });
  });
});
