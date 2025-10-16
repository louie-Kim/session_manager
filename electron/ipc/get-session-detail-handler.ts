import { resolve } from 'node:path';

import { ipcMain } from 'electron';

import { DEFAULT_META_FILE, loadSessionMeta } from '../scanner/session-meta';
import type { NormalizedSessionMeta, SessionSummary } from '../types/session';

export interface GetSessionDetailRequest {
  id: string;
  path: string;
  metaFileName?: string;
}

export interface GetSessionDetailResponse {
  session: {
    id: string;
    createdAtIso: string;
    cwd: string;
    originator: string;
    cliVersion: string;
    instructions: unknown | null;
    status: NormalizedSessionMeta['status'];
    sessionPath: string;
    metadataPath?: string;
    notes?: string | null;
  } | null;
}

const CHANNEL_NAME = 'get-session-detail';

export function registerGetSessionDetailHandler(): void {
  ipcMain.handle(CHANNEL_NAME, async (_event, payload: GetSessionDetailRequest) => {
    const sessionPath = resolve(payload.path);
    const metaFileName = payload.metaFileName ?? DEFAULT_META_FILE;
    const meta = loadSessionMeta({ sessionPath, metaFileName });

    if (meta.status !== 'ok' || !meta.summary) {
      return {
        session: meta.summary
          ? mapSummary(meta.summary, sessionPath, meta)
          : null,
      } satisfies GetSessionDetailResponse;
    }

    return {
      session: mapSummary(meta.summary, sessionPath, meta),
    } satisfies GetSessionDetailResponse;
  });
}

function mapSummary(
  summary: SessionSummary,
  sessionPath: string,
  meta: NormalizedSessionMeta,
) {
  return {
    id: summary.id,
    createdAtIso: summary.createdAtIso,
    cwd: summary.cwd,
    originator: summary.originator,
    cliVersion: summary.cliVersion,
    instructions: summary.instructions ?? null,
    status: meta.status,
    sessionPath,
    metadataPath: meta.metaPath ?? undefined,
    notes: null,
  };
}
