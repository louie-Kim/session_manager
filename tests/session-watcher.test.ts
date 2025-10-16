import type { FSWatcher } from 'node:fs';

import { createSessionWatcher } from '../electron/watchers/session-watcher';

const mockClose = jest.fn();
const mockOn = jest.fn();
const mockWatchCallback: Array<(event: string, filename: string | Buffer | null) => void> = [];
const mockErrorHandlers: Array<(error: unknown) => void> = [];

jest.mock('node:fs', () => ({
  watch: jest.fn((path: string, options: { recursive: boolean }, handler: typeof mockWatchCallback[number]) => {
    mockWatchCallback.push(handler);
    return {
      on: jest.fn((event: string, listener: (error: unknown) => void) => {
        mockOn(event, listener);
        if (event === 'error') {
          mockErrorHandlers.push(listener);
        }
      }),
      close: mockClose,
    } as unknown as FSWatcher;
  }),
}));

describe('createSessionWatcher', () => {
  beforeEach(() => {
    mockClose.mockReset();
    mockOn.mockReset();
    mockWatchCallback.length = 0;
    mockErrorHandlers.length = 0;
  });

  it('invokes listener with updated events from fs.watch', () => {
    const listener = jest.fn();
    const watcher = createSessionWatcher('C:\\sessions', listener);

    expect(watcher).not.toBeNull();
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockWatchCallback).toHaveLength(1);

    const notify = mockWatchCallback[0];
    notify('change', 'session_meta');

    expect(listener).toHaveBeenCalledWith({
      type: 'updated',
      path: expect.stringContaining('session_meta'),
    });

    watcher?.dispose();
    expect(mockClose).toHaveBeenCalled();
  });

  it('surfaces fs.watch errors through listener', () => {
    const listener = jest.fn();
    createSessionWatcher('C:\\sessions', listener);

    expect(mockErrorHandlers).toHaveLength(1);
    const error = new Error('watch failed');
    mockErrorHandlers[0](error);

    expect(listener).toHaveBeenCalledWith({ type: 'error', error });
  });

  it('returns null and invokes listener on watcher creation failure', () => {
    const { watch } = jest.requireMock('node:fs') as { watch: jest.Mock };
    watch.mockImplementationOnce(() => {
      throw new Error('permission denied');
    });

    const listener = jest.fn();
    const watcher = createSessionWatcher('C:\\sessions', listener);

    expect(watcher).toBeNull();
    expect(listener).toHaveBeenCalledWith({
      type: 'error',
      error: expect.any(Error),
    });
  });
});
