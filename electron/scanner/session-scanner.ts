import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { NormalizedSessionMeta } from '../types/session';
import { DEFAULT_META_FILE, loadSessionMeta } from './session-meta';

export interface ScanSessionsOptions {
  rootPath: string;
}

export interface ScannedSession {
  sessionPath: string;
  meta: NormalizedSessionMeta;
  stats: {
    mtimeMs: number;
    ctimeMs: number;
  };
}

export function scanSessions({ rootPath }: ScanSessionsOptions): ScannedSession[] {
  const sessions: Array<ScannedSession & { sortKey: number }> = [];
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.pop();
    if (!currentPath) {
      continue;
    }

    let stats: ReturnType<typeof statSync>;
    try {
      stats = statSync(currentPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      const metaCandidate = join(currentPath, DEFAULT_META_FILE);
      if (existsSync(metaCandidate)) {
        const meta = loadSessionMeta({ sessionPath: currentPath });
        sessions.push({
          sessionPath: currentPath,
          meta,
          stats: {
            mtimeMs: stats.mtimeMs,
            ctimeMs: stats.ctimeMs,
          },
          sortKey: computeSortKey(meta, stats),
        });
      }

      let entries: string[];
      try {
        entries = readdirSync(currentPath);
      } catch {
        continue;
      }

      for (const entry of entries) {
        queue.push(join(currentPath, entry));
      }

      continue;
    }

    if (stats.isFile() && currentPath.endsWith('.jsonl')) {
      const meta = loadSessionMeta({ sessionPath: currentPath });
      sessions.push({
        sessionPath: currentPath,
        meta,
        stats: {
          mtimeMs: stats.mtimeMs,
          ctimeMs: stats.ctimeMs,
        },
        sortKey: computeSortKey(meta, stats),
      });
    }
  }

  return sessions
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((session) => {
      const { sortKey, ...rest } = session;
      void sortKey;
      return rest;
    });
}

function computeSortKey(
  meta: NormalizedSessionMeta,
  stats: { mtimeMs: number; ctimeMs: number },
): number {
  const createdAt = meta.summary?.createdAt.getTime();
  if (typeof createdAt === 'number') {
    return createdAt;
  }

  if (typeof stats.mtimeMs === 'number') {
    return stats.mtimeMs;
  }

  if (typeof stats.ctimeMs === 'number') {
    return stats.ctimeMs;
  }

  return 0;
}
