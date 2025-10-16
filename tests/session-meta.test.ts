import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  DEFAULT_META_FILE,
  loadSessionMeta,
} from '../electron/scanner/session-meta';

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'codex-session-meta-'));
}

function cleanup(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

describe('loadSessionMeta', () => {
  it('returns ok status for valid metadata', () => {
    const dir = createTempDir();
    const metaPath = join(dir, DEFAULT_META_FILE);
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
      },
    };

    writeFileSync(metaPath, JSON.stringify(payload), 'utf-8');

    const result = loadSessionMeta({ sessionPath: dir });

    expect(result.status).toBe('ok');
    expect(result.summary).not.toBeNull();
    expect(result.summary?.id).toBe(payload.payload.id);
    expect(result.summary?.cwd).toBe(payload.payload.cwd);
    expect(result.summary?.cliVersion).toBe(payload.payload.cli_version);
    expect(result.metaPath).toBe(metaPath);

    cleanup(dir);
  });

  it('returns missing status when file is absent', () => {
    const dir = createTempDir();

    const result = loadSessionMeta({ sessionPath: dir });

    expect(result.status).toBe('missing');
    expect(result.error?.code).toBe('MISSING_FILE');
    expect(result.metaPath).toBe(join(dir, DEFAULT_META_FILE));

    cleanup(dir);
  });

  it('returns corrupted status when JSON is invalid', () => {
    const dir = createTempDir();
    const metaPath = join(dir, DEFAULT_META_FILE);

    writeFileSync(metaPath, '{invalid}', 'utf-8');

    const result = loadSessionMeta({ sessionPath: dir });

    expect(result.status).toBe('corrupted');
    expect(result.error?.code).toBe('INVALID_JSON');
    expect(result.metaPath).toBe(metaPath);

    cleanup(dir);
  });

  it('extracts session meta from jsonl session logs', () => {
    const dir = createTempDir();
    const jsonlPath = join(dir, 'session.jsonl');
    const metaLine = {
      timestamp: '2025-10-14T07:00:00.000Z',
      type: 'session_meta',
      payload: {
        id: '0199e18a-70b1-72e0-a75d-94fa9223ca99',
        timestamp: '2025-10-14T07:00:00.000Z',
        cwd: 'D:\\workspaces\\example',
        originator: 'codex_cli_rs',
        cli_version: '0.47.1',
        instructions: null,
        source: 'cli',
      },
    };
    const logLine = {
      timestamp: '2025-10-14T07:01:00.000Z',
      type: 'response_item',
      payload: { type: 'message', role: 'assistant', content: [] },
    };

    writeFileSync(
      jsonlPath,
      `${JSON.stringify(metaLine)}\n${JSON.stringify(logLine)}\n`,
      'utf-8',
    );

    const result = loadSessionMeta({ sessionPath: jsonlPath });

    expect(result.status).toBe('ok');
    expect(result.summary?.id).toBe(metaLine.payload.id);
    expect(result.summary?.cwd).toBe(metaLine.payload.cwd);
    expect(result.summary?.cliVersion).toBe(metaLine.payload.cli_version);
    expect(result.metaPath).toBe(jsonlPath);

    cleanup(dir);
  });
});
