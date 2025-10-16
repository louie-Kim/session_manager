/**
 * @jest-environment node
 */

import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { deleteSession } from '../electron/cli/delete-session';
import { DEFAULT_META_FILE } from '../electron/scanner/session-meta';

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'codex-delete-'));
}

function cleanup(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

function createMeta(dir: string, overrides: Partial<Record<string, unknown>> = {}) {
  const payload = {
    timestamp: '2025-10-13T07:25:11.086Z',
    type: 'session_meta',
    payload: {
      id: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      timestamp: '2025-10-13T07:25:11.013Z',
      cwd: 'D:\\vsCodeWorkSpace\\session_manager',
      originator: 'codex_cli_rs',
      cli_version: '0.46.0',
      instructions: null,
      source: 'cli',
      ...overrides,
    },
  };

  writeFileSync(join(dir, DEFAULT_META_FILE), JSON.stringify(payload), 'utf-8');
}

function createSessionLog(filePath: string, overrides: Partial<Record<string, unknown>> = {}) {
  const meta = {
    timestamp: overrides.timestamp ?? '2025-10-13T07:25:11.086Z',
    type: 'session_meta',
    payload: {
      id: overrides.id ?? '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      timestamp: overrides.timestamp ?? '2025-10-13T07:25:11.086Z',
      cwd: overrides.cwd ?? 'D:\\vsCodeWorkSpace\\session_manager',
      originator: 'codex_cli_rs',
      cli_version: overrides.cli_version ?? '0.46.0',
      instructions: null,
      source: 'cli',
    },
  };
  const extra = {
    timestamp: '2025-10-13T07:25:12.000Z',
    type: 'response_item',
    payload: { type: 'message', role: 'assistant', content: [] },
  };
  writeFileSync(filePath, `${JSON.stringify(meta)}\n${JSON.stringify(extra)}\n`, 'utf-8');
}

describe('deleteSession', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('removes session directory when metadata matches', () => {
    const dir = createTempDir();
    createMeta(dir);

    const result = deleteSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: dir,
    });

    expect(result.sessionId).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b5');
    expect(result.removedPath).toBe(dir);
    expect(existsSync(dir)).toBe(false);

    cleanup(dir);
  });

  it('throws when session id differs from metadata', () => {
    const dir = createTempDir();
    createMeta(dir);

    expect(() =>
      deleteSession({
        sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b6',
        sessionPath: dir,
      }),
    ).toThrow(/Session id mismatch/);

    cleanup(dir);
  });

  it('handles deletion of jsonl session logs', () => {
    const dir = createTempDir();
    const logPath = join(dir, 'session.jsonl');
    createSessionLog(logPath);

    const result = deleteSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: logPath,
    });

    expect(result.removedPath).toBe(logPath);
    expect(existsSync(logPath)).toBe(false);

    cleanup(dir);
  });

  it('deletes session when metadata is missing but path contains id', () => {
    const dir = createTempDir();
    const sessionDir = join(dir, '0199dc75-7be5-7ae2-98a3-5be0079041b5');
    mkdirSync(sessionDir);

    const result = deleteSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: sessionDir,
    });

    expect(result.sessionId).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b5');
    expect(existsSync(sessionDir)).toBe(false);

    cleanup(dir);
  });
});
