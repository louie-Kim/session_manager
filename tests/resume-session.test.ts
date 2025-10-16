/**
 * @jest-environment node
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { resumeSession } from '../electron/cli/resume-session';
import { DEFAULT_META_FILE } from '../electron/scanner/session-meta';

const mockSpawn = jest.fn(() => ({ unref: jest.fn() }));
const mockSpawnSync = jest.fn(() => ({ status: 1, stdout: '', stderr: '' }));

jest.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
  spawnSync: (...args: unknown[]) => mockSpawnSync(...args),
}));

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'codex-resume-'));
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

function createCliExecutable(dir: string): string {
  const cliPath = join(dir, 'codex.exe');
  writeFileSync(cliPath, '');
  return cliPath;
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

describe('resumeSession', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CODEX_CLI_PATH;
    mockSpawnSync.mockReturnValue({ status: 1, stdout: '', stderr: '' });
  });

  it('spawns codex resume command when metadata matches', () => {
    const dir = createTempDir();
    const cliDir = createTempDir();
    createMeta(dir);
    const cliPath = createCliExecutable(cliDir);
    process.env.CODEX_CLI_PATH = cliPath;

    const result = resumeSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: dir,
    });

    expect(result.sessionId).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b5');
    expect(result.metaPath).toBe(join(dir, DEFAULT_META_FILE));
    expect(result.cliPath).toBe(cliPath);
    expect(result.simulated).toBe(false);
    expect(mockSpawn).toHaveBeenCalledWith('cmd.exe', ['/c', expect.stringContaining('codex.exe')], {
      detached: true,
      stdio: 'ignore',
    });
    const spawnArgs = mockSpawn.mock.calls[0]?.[1];
    const spawnCommand = Array.isArray(spawnArgs) ? (spawnArgs[1] as string) : '';
    expect(spawnCommand).toContain(' resume ');
    expect(spawnCommand).toContain(result.sessionId);
    expect(spawnCommand).toBe(result.command);

    cleanup(dir);
    cleanup(cliDir);
  });

  it('throws when session id differs from metadata', () => {
    const dir = createTempDir();
    const cliDir = createTempDir();
    createMeta(dir);
    const cliPath = createCliExecutable(cliDir);
    process.env.CODEX_CLI_PATH = cliPath;

    expect(() =>
      resumeSession({
        sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b6',
        sessionPath: dir,
      }),
    ).toThrow(/Session id mismatch/);

    cleanup(dir);
    cleanup(cliDir);
  });

  it('simulates resume when CLI binary is missing', () => {
    const dir = createTempDir();
    createMeta(dir);
    process.env.CODEX_CLI_PATH = join(dir, 'missing-codex.exe');

    const result = resumeSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: dir,
    });

    expect(result.simulated).toBe(true);
    expect(result.cliPath).toBeNull();
    expect(result.command).toContain('[Simulated]');
    expect(result.command).toContain(result.sessionId);
    expect(mockSpawn).toHaveBeenCalledWith('cmd.exe', ['/c', result.command], {
      detached: true,
      stdio: 'ignore',
    });
    cleanup(dir);
  });

  it('supports session metadata loaded from jsonl logs', () => {
    const dir = createTempDir();
    const cliDir = createTempDir();
    const logPath = join(dir, 'rollout.jsonl');
    createSessionLog(logPath, { id: '0199dc75-7be5-7ae2-98a3-5be0079041b5' });
    const cliPath = createCliExecutable(cliDir);
    process.env.CODEX_CLI_PATH = cliPath;

    const result = resumeSession({
      sessionId: '0199dc75-7be5-7ae2-98a3-5be0079041b5',
      sessionPath: logPath,
    });

    expect(result.sessionId).toBe('0199dc75-7be5-7ae2-98a3-5be0079041b5');
    expect(result.metaPath).toBe(logPath);
    expect(result.simulated).toBe(false);
    expect(mockSpawn).toHaveBeenCalled();

    cleanup(dir);
    cleanup(cliDir);
  });
});
