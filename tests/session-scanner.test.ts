import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { scanSessions } from '../electron/scanner/session-scanner';

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'codex-session-scan-'));
}

function cleanup(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

function writeSessionLog(filePath: string, overrides: Partial<SessionMetaOverrides> = {}) {
  const meta = createSessionMeta(overrides);
  const logLine = {
    timestamp: new Date(Date.parse(meta.payload.timestamp) + 1000).toISOString(),
    type: 'response_item',
    payload: { type: 'message', role: 'assistant', content: [] },
  };

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    `${JSON.stringify(meta)}\n${JSON.stringify(logLine)}\n`,
    'utf-8',
  );
}

interface SessionMetaOverrides {
  id: string;
  timestamp: string;
  cwd: string;
  cli_version: string;
}

function createSessionMeta(overrides: Partial<SessionMetaOverrides> = {}) {
  const timestamp = overrides.timestamp ?? '2025-10-13T07:25:11.086Z';
  return {
    timestamp,
    type: 'session_meta' as const,
    payload: {
      id: overrides.id ?? '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      timestamp,
      cwd: overrides.cwd ?? 'D:\\vsCodeWorkSpace\\session_manager',
      originator: 'codex_cli_rs',
      cli_version: overrides.cli_version ?? '0.46.0',
      instructions: null,
      source: 'cli',
    },
  };
}

describe('scanSessions', () => {
  it('finds jsonl sessions in nested folders and sorts by timestamp', () => {
    const root = createTempDir();
    const olderPath = join(root, '2025', '10', '13', 'rollout-old.jsonl');
    const newerPath = join(root, '2025', '10', '14', 'rollout-new.jsonl');

    writeSessionLog(olderPath, {
      id: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      timestamp: '2024-12-01T10:00:00.000Z',
    });
    writeSessionLog(newerPath, {
      id: '0199dc75-7be5-7ae2-98a3-5be0079041b6',
      timestamp: '2025-01-01T10:00:00.000Z',
    });

    const results = scanSessions({ rootPath: root });

    expect(results).toHaveLength(2);
    expect(results[0].sessionPath).toBe(newerPath);
    expect(results[0].meta.summary?.id).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b6');
    expect(results[1].sessionPath).toBe(olderPath);
    expect(results[1].meta.summary?.id).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b5');

    cleanup(root);
  });

  it('ignores directories that do not represent sessions', () => {
    const root = createTempDir();
    mkdirSync(join(root, '2025'), { recursive: true });

    const results = scanSessions({ rootPath: root });

    expect(results).toHaveLength(0);

    cleanup(root);
  });

  it('marks jsonl sessions without metadata as corrupted', () => {
    const root = createTempDir();
    const sessionPath = join(root, 'rollout-invalid.jsonl');
    mkdirSync(root, { recursive: true });
    writeFileSync(sessionPath, '{"type":"response_item"}\n', 'utf-8');

    const [result] = scanSessions({ rootPath: root });

    expect(result.sessionPath).toBe(sessionPath);
    expect(result.meta.status).toBe('corrupted');
    expect(result.meta.error?.code).toBe('INVALID_FILE');

    cleanup(root);
  });
});
