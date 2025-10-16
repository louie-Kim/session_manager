import { rmSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import { DEFAULT_META_FILE, SESSION_ID_REGEX, loadSessionMeta } from '../scanner/session-meta';
import {
  DeleteSessionError,
  DeleteSessionResult,
} from '../types/session';

export interface DeleteSessionOptions {
  sessionId: string;
  sessionPath: string;
  metaFileName?: string;
}

export function deleteSession({
  sessionId,
  sessionPath,
  metaFileName = DEFAULT_META_FILE,
}: DeleteSessionOptions): DeleteSessionResult {
  const normalizedId = sessionId.trim();
  if (!SESSION_ID_REGEX.test(normalizedId)) {
    throw new DeleteSessionError({
      code: 'INVALID_ID',
      message: `Session id "${sessionId}" is not a valid UUIDv7`,
    });
  }

  const resolvedPath = resolve(sessionPath);
  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(resolvedPath);
  } catch (error) {
    throw new DeleteSessionError({
      code: 'MISSING_META',
      message: `Session path "${resolvedPath}" does not exist`,
      cause: error,
    });
  }

  const meta = loadSessionMeta({ sessionPath: resolvedPath, metaFileName });
  const metaId = meta.summary?.id;
  const candidateMatchesPath = pathLikelyMatchesSession(resolvedPath, normalizedId);

  if (meta.status !== 'ok' || !meta.summary) {
    if (!candidateMatchesPath) {
      throw new DeleteSessionError({
        code: 'MISSING_META',
        message:
          meta.error?.message ??
          `Unable to read session metadata for "${resolvedPath}"`,
      });
    }
  } else if (metaId !== normalizedId) {
    if (!candidateMatchesPath) {
      throw new DeleteSessionError({
        code: 'ID_MISMATCH',
        message: `Session id mismatch: UI(${normalizedId}) vs meta(${metaId})`,
      });
    }
  }

  const deletionTarget = stats.isDirectory() ? resolvedPath : resolvedPath;

  try {
    rmSync(deletionTarget, { recursive: true, force: true, maxRetries: 2 });
  } catch (error) {
    throw new DeleteSessionError({
      code: 'REMOVE_FAILED',
      message: `Failed to delete session at "${deletionTarget}"`,
      cause: error,
    });
  }

  return {
    sessionId: normalizedId,
    removedPath: deletionTarget,
  };
}

function pathLikelyMatchesSession(pathname: string, sessionId: string): boolean {
  const lowerId = sessionId.toLowerCase();
  const lowerPath = pathname.toLowerCase();
  if (lowerPath.includes(lowerId)) {
    return true;
  }

  const filename = basename(lowerPath);
  return filename.includes(lowerId);
}

