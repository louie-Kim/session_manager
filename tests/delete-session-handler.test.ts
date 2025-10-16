/**
 * @jest-environment node
 */

import type { DeleteSessionResult } from '../electron/types/session';

const mockHandle = jest.fn();
const mockDeleteSession = jest.fn();

jest.mock('electron', () => ({
  ipcMain: {
    handle: (...args: unknown[]) => mockHandle(...args),
  },
}));

jest.mock('../electron/cli/delete-session', () => ({
  deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
}));

describe('registerDeleteSessionHandler', () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockDeleteSession.mockReset();
  });

  it('registers IPC handler and returns success payload', async () => {
    const { registerDeleteSessionHandler } = await import('../electron/ipc/delete-session-handler');
    registerDeleteSessionHandler();

    expect(mockHandle).toHaveBeenCalledTimes(1);
    const [channel, handler] = mockHandle.mock.calls[0];

    expect(channel).toBe('delete-session');
    const fakeResult: DeleteSessionResult = {
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      removedPath: 'mock/session/path',
    };
    mockDeleteSession.mockReturnValue(fakeResult);

    const handlerFn = handler as (
      event: unknown,
      payload: import('../electron/ipc/delete-session-handler').DeleteSessionRequest,
    ) => Promise<unknown>;

    const response = await handlerFn({}, { sessionId: fakeResult.sessionId, path: 'C:\\sessions\\foo' });
    expect(response).toEqual({
      success: true,
      sessionId: fakeResult.sessionId,
      removedPath: fakeResult.removedPath,
    });
  });

  it('maps delete errors into structured IPC response', async () => {
    const { registerDeleteSessionHandler } = await import('../electron/ipc/delete-session-handler');
    registerDeleteSessionHandler();

    const [, handler] = mockHandle.mock.calls[0];
    const validId = '0199dc75-7be5-7ae2-98a3-5be0079041b5';
    const error = new (await import('../electron/types/session')).DeleteSessionError({
      code: 'ID_MISMATCH',
      message: 'Mismatch',
    });
    mockDeleteSession.mockImplementation(() => {
      throw error;
    });

    const handlerFn = handler as (
      event: unknown,
      payload: import('../electron/ipc/delete-session-handler').DeleteSessionRequest,
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

