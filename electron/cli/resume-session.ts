import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import {
  DEFAULT_META_FILE,
  SESSION_ID_REGEX,
  loadSessionMeta,
} from '../scanner/session-meta';
import {
  ResumeSessionError,
  ResumeSessionResult,
} from '../types/session';
import { resolveCodexExecutable } from './paths';

export interface ResumeSessionOptions {
  sessionId: string;
  sessionPath: string;
  metaFileName?: string;
  cliPathOverride?: string;
}

/**
 * Resume a Codex session by spawning a new Command Prompt window
 * that executes `codex resume <sessionId>`. The function validates
 * the supplied session metadata before launching the CLI.
 */
export function resumeSession(
  options: ResumeSessionOptions,
): ResumeSessionResult {
  const { sessionId, sessionPath, metaFileName = DEFAULT_META_FILE, cliPathOverride } = options;

  if (!SESSION_ID_REGEX.test(sessionId)) {
    throw new ResumeSessionError({
      code: 'INVALID_ID',
      message: `Session id "${sessionId}" is not a valid UUIDv7`,
    });
  }

  const resolvedSessionPath = resolve(sessionPath);
  const meta = loadSessionMeta({ sessionPath: resolvedSessionPath, metaFileName });
  const metaPath = meta.metaPath ?? resolve(resolvedSessionPath, metaFileName);

  if (meta.status === 'missing') {
    throw new ResumeSessionError({
      code: 'MISSING_META',
      message: meta.error?.message ?? `Missing session metadata at "${metaPath}"`,
    });
  }

  if (meta.status === 'corrupted') {
    throw new ResumeSessionError({
      code: 'MISSING_META',
      message: meta.error?.message ?? `Corrupted session metadata at "${metaPath}"`,
      cause: meta.error,
    });
  }

  const metaSummary = meta.summary;
  if (!metaSummary) {
    throw new ResumeSessionError({
      code: 'MISSING_META',
      message: `Unable to read session metadata at "${metaPath}"`,
    });
  }

  if (metaSummary.id !== sessionId) {
    throw new ResumeSessionError({
      code: 'ID_MISMATCH',
      message: `Session id mismatch: UI(${sessionId}) vs meta(${metaSummary.id})`,
    });
  }

  const cliPath = resolveCodexExecutable({ explicitPath: cliPathOverride });
  const simulated = !cliPath;
  const command = simulated
    ? buildSimulatedCommand(sessionId)
    : buildResumeCommand(cliPath!, sessionId);

  try {
    const child = spawn('cmd.exe', ['/c', command], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } catch (error) {
    throw new ResumeSessionError({
      code: 'SPAWN_FAILED',
      message: 'Failed to launch Codex CLI session command',
      cause: error,
    });
  }

  return {
    sessionId,
    metaPath,
    cliPath: cliPath ?? null,
    command,
    simulated,
  };
}

function buildResumeCommand(cliPath: string, sessionId: string): string {
  const escapedCliPath = cliPath.includes(' ') ? `"${cliPath}"` : cliPath;
  const escapedSessionId = sessionId;
  return `start cmd /k ${escapedCliPath} resume ${escapedSessionId}`;
}

function buildSimulatedCommand(sessionId: string): string {
  const escapedSessionId = sessionId;
  const message = `[Simulated] Codex resume ${escapedSessionId}`;
  return `start cmd /k echo ${message}`;
}
