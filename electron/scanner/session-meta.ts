import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import type {
  NormalizedSessionMeta,
  SessionMetaError,
  SessionMetaFile,
  SessionMetaPayload,
  SessionSummary,
} from '../types/session';

const REQUIRED_FIELDS: Array<keyof SessionMetaPayload> = [
  'id',
  'timestamp',
  'cwd',
  'originator',
  'cli_version',
  'source',
];

export const SESSION_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LoadSessionMetaOptions {
  sessionPath: string;
  metaFileName?: string;
}

export const DEFAULT_META_FILE = 'session_meta';

/**
 * Load and validate session metadata from either a session directory
 * (containing a `session_meta` file) or from a `.jsonl` session log.
 */
export function loadSessionMeta({
  sessionPath,
  metaFileName = DEFAULT_META_FILE,
}: LoadSessionMetaOptions): NormalizedSessionMeta {
  const resolved = resolve(sessionPath);

  let sessionStats: ReturnType<typeof statSync>;
  try {
    sessionStats = statSync(resolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        status: 'missing',
        etag: null,
        summary: null,
        raw: null,
        error: {
          code: 'MISSING_FILE',
          message: `Missing session resource at ${resolved}`,
        },
        metaPath: null,
      };
    }

    throw error;
  }

  if (sessionStats.isFile()) {
    return loadMetaFromFile(resolved, sessionStats);
  }

  if (sessionStats.isDirectory()) {
    const metaPath = resolve(resolved, metaFileName);
    if (!existsSync(metaPath)) {
      return {
        status: 'missing',
        etag: null,
        summary: null,
        raw: null,
        error: {
          code: 'MISSING_FILE',
          message: `Missing session_meta at ${metaPath}`,
        },
        metaPath,
      };
    }

    let metaStats: ReturnType<typeof statSync>;
    try {
      metaStats = statSync(metaPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          status: 'missing',
          etag: null,
          summary: null,
          raw: null,
          error: {
            code: 'MISSING_FILE',
            message: `Missing session_meta at ${metaPath}`,
          },
          metaPath,
        };
      }

      throw error;
    }

    if (!metaStats.isFile()) {
      return corruptedResult(
        'INVALID_FILE',
        'session_meta is not a file',
        undefined,
        createEtag(metaPath, metaStats),
        null,
        undefined,
        metaPath,
      );
    }

    const etag = createEtag(metaPath, metaStats);
    return loadAndNormalizeMeta(metaPath, etag);
  }

  return corruptedResult(
    'INVALID_FILE',
    `Unsupported session resource at ${resolved}`,
    undefined,
    createEtag(resolved, sessionStats),
    null,
    undefined,
    resolved,
  );
}

function loadMetaFromFile(pathname: string, stats: ReturnType<typeof statSync>): NormalizedSessionMeta {
  const etag = createEtag(pathname, stats);

  if (pathname.endsWith('.jsonl')) {
    return loadMetaFromJsonl(pathname, etag);
  }

  return loadAndNormalizeMeta(pathname, etag);
}

function loadMetaFromJsonl(pathname: string, etag: string): NormalizedSessionMeta {
  let rawFile: string;
  try {
    rawFile = readFileSync(pathname, 'utf-8');
  } catch (error) {
    return corruptedResult(
      'INVALID_FILE',
      `Unable to read session log at ${pathname}`,
      error,
      etag,
      null,
      undefined,
      pathname,
    );
  }

  const lines = rawFile.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as SessionMetaFile;
      if (parsed.type === 'session_meta') {
        return normalizeParsedMeta(pathname, parsed, etag);
      }
    } catch {
      // ignore malformed lines, continue searching for the session_meta entry
    }
  }

  return corruptedResult(
    'INVALID_FILE',
    `Unable to locate session_meta entry inside ${pathname}`,
    undefined,
    etag,
    null,
    undefined,
    pathname,
  );
}

function loadAndNormalizeMeta(pathname: string, etag: string): NormalizedSessionMeta {
  let parsed: SessionMetaFile;
  try {
    const raw = readFileSync(pathname, 'utf-8');
    parsed = JSON.parse(raw) as SessionMetaFile;
  } catch (error) {
    return corruptedResult(
      'INVALID_JSON',
      `Unable to parse session_meta JSON at ${pathname}`,
      error,
      etag,
      null,
      undefined,
      pathname,
    );
  }

  return normalizeParsedMeta(pathname, parsed, etag);
}

function normalizeParsedMeta(pathname: string, parsed: SessionMetaFile, etag: string): NormalizedSessionMeta {
  if (parsed.type !== 'session_meta') {
    return corruptedResult(
      'INVALID_FILE',
      `Unexpected meta type "${parsed.type}"`,
      undefined,
      etag,
      parsed,
      undefined,
      pathname,
    );
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => parsed.payload?.[field] === undefined || parsed.payload?.[field] === null,
  );

  if (missingFields.length > 0) {
    return corruptedResult(
      'MISSING_FIELDS',
      `session_meta is missing required fields: ${missingFields.join(', ')}`,
      undefined,
      etag,
      parsed,
      missingFields,
      pathname,
    );
  }

  const payload = parsed.payload;
  if (!SESSION_ID_REGEX.test(payload.id)) {
    return corruptedResult(
      'INVALID_ID',
      `Invalid session id "${payload.id}"`,
      undefined,
      etag,
      parsed,
      undefined,
      pathname,
    );
  }

  const createdAt = new Date(payload.timestamp);
  if (Number.isNaN(createdAt.getTime())) {
    return corruptedResult(
      'INVALID_TIMESTAMP',
      `Invalid timestamp "${payload.timestamp}"`,
      undefined,
      etag,
      parsed,
      undefined,
      pathname,
    );
  }

  const summary: SessionSummary = {
    id: payload.id,
    createdAt,
    createdAtIso: payload.timestamp,
    cwd: payload.cwd,
    originator: payload.originator,
    cliVersion: payload.cli_version,
    instructions: payload.instructions ?? null,
    source: payload.source,
  };

  return {
    status: 'ok',
    etag,
    summary,
    raw: parsed,
    metaPath: pathname,
  };
}

function createEtag(pathname: string, stats: ReturnType<typeof statSync> | null): string {
  if (!stats) {
    return `${pathname}:0:0`;
  }
  return `${pathname}:${stats.mtimeMs}:${stats.size}`;
}

function corruptedResult(
  code: SessionMetaError['code'],
  message: string,
  cause?: unknown,
  etag: string | null = null,
  raw: SessionMetaFile | null = null,
  missingFields?: string[],
  metaPath: string | null = null,
): NormalizedSessionMeta {
  return {
    status: 'corrupted',
    etag,
    summary: null,
    raw,
    error: {
      code,
      message,
      cause,
      missingFields,
    },
    metaPath,
  };
}
