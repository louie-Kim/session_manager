import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_BIN_PATH = ['.codex', 'bin', 'codex.exe'];

export interface ResolveCodexPathOptions {
  explicitPath?: string;
}

export function resolveCodexExecutable({
  explicitPath,
}: ResolveCodexPathOptions = {}): string | null {
  const envPath = process.env.CODEX_CLI_PATH;
  const candidates = [
    normalizePath(explicitPath),
    normalizePath(envPath),
    defaultCodexPath(),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const discovered = discoverFromPath();
  if (discovered) {
    return discovered;
  }

  return null;
}

function defaultCodexPath(): string {
  return resolve(homedir(), ...DEFAULT_BIN_PATH);
}

function normalizePath(pathname?: string | null): string | null {
  if (!pathname || pathname.trim().length === 0) {
    return null;
  }

  return resolve(pathname);
}

function discoverFromPath(): string | null {
  if (process.platform === 'win32') {
    const viaWhereExe = tryWhere('codex.exe');
    if (viaWhereExe) {
      return viaWhereExe;
    }
    return tryWhere('codex');
  }

  const whichResult = spawnSync('which', ['codex'], { encoding: 'utf-8' });
  if (whichResult.status === 0) {
    const found = whichResult.stdout?.split(/\r?\n/).find(Boolean);
    return found ? found.trim() : null;
  }

  return null;
}

function tryWhere(target: string): string | null {
  const result = spawnSync('where', [target], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return null;
  }

  const match = result.stdout?.split(/\r?\n/).find(Boolean);
  return match ? match.trim() : null;
}
