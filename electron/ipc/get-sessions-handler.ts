import { ipcMain } from 'electron';

import { scanSessions } from '../scanner/session-scanner';
import type { NormalizedSessionMeta, SessionSummary } from '../types/session';
import { getSessionRootPath } from '../paths/session-root';

export interface GetSessionsRequest {
  forceRefresh?: boolean;
}

export interface GetSessionsResponse {
  sessions: SessionSummaryForRenderer[];
}

export interface SessionSummaryForRenderer {
  id: string;
  createdAtIso: string;
  cwd: string;
  originator: string;
  cliVersion: string;
  instructions: unknown | null;
  status: NormalizedSessionMeta['status'];
  sessionPath: string;
  metadataPath?: string;
}

const CHANNEL_NAME = 'get-sessions';

export function registerGetSessionsHandler(): void {
  ipcMain.handle(CHANNEL_NAME, () => {
    const rootPath = getSessionRootPath();
    const sessions = scanSessions({ rootPath });

    return {
      sessions: sessions.map((session) =>
        mapSessionForRenderer(session.meta, session.sessionPath, rootPath, session.stats),
      ),
    } as GetSessionsResponse;
  });
}

function mapSessionForRenderer(
  meta: NormalizedSessionMeta,
  sessionPath: string,
  rootPath: string,
  stats: { mtimeMs: number; ctimeMs: number },
): SessionSummaryForRenderer {
  const summary: SessionSummary | null = meta.summary;
  const relativePath = sessionPath.startsWith(rootPath)
    ? sessionPath.slice(rootPath.length).replace(/^[\\/]/, '')
    : sessionPath;
  const createdAtIso =
    summary?.createdAtIso ?? new Date(stats.mtimeMs || stats.ctimeMs || Date.now()).toISOString();
  const rawPayload = meta.raw?.payload ?? null;
  const fallbackId = summary?.id ?? meta.raw?.payload?.id ?? relativePath;

  return {
    id: fallbackId,
    createdAtIso,
    cwd: summary?.cwd ?? rawPayload?.cwd ?? sessionPath,
    originator: summary?.originator ?? rawPayload?.originator ?? 'unknown',
    cliVersion: summary?.cliVersion ?? rawPayload?.cli_version ?? 'unknown',
    instructions: summary?.instructions ?? rawPayload?.instructions ?? null,
    status: meta.status,
    sessionPath,
    metadataPath: meta.metaPath ?? undefined,
  };
}
