'use client';

import type {
  GetSessionDetailResponse,
  GetSessionsResponse,
  RawSessionDetail,
  RawSessionListItem,
  ResumeSessionResponse,
  DeleteSessionResponse,
  SessionDetail,
  SessionListItem,
  SessionIntegrityStatus,
} from './types';

type CodexSessionsBridge = {
  getSessions?: (payload?: { forceRefresh?: boolean }) => Promise<GetSessionsResponse>;
  getSessionDetail?: (payload: { id: string; path: string }) => Promise<GetSessionDetailResponse>;
  resumeSession?: (payload: { sessionId: string; path: string }) => Promise<ResumeSessionResponse>;
  deleteSession?: (payload: { sessionId: string; path: string }) => Promise<DeleteSessionResponse>;
  onSessionEvent?: (
    callback: (event: { type: 'updated' } | { type: 'error'; message: string }) => void,
  ) => () => void;
};

declare global {
  interface Window {
    codexSessions?: CodexSessionsBridge;
  }
}

const DEFAULT_STATUS: SessionIntegrityStatus = 'ok';

export async function fetchSessions(options?: {
  forceRefresh?: boolean;
}): Promise<SessionListItem[]> {
  const bridge = getBridge();
  if (!bridge?.getSessions) {
    return [];
  }

  const response = await bridge.getSessions(options);
  return (response.sessions ?? []).map(normalizeSessionListItem);
}

export async function fetchSessionDetail(
  id: string,
  sessionPath: string,
): Promise<SessionDetail | null> {
  const bridge = getBridge();
  if (!bridge?.getSessionDetail) {
    return null;
  }

  const response = await bridge.getSessionDetail({ id, path: sessionPath });
  if (!response.session) {
    return null;
  }

  return normalizeSessionDetail(response.session);
}

export async function requestResumeSession(payload: {
  id: string;
  path: string;
}): Promise<ResumeSessionResponse> {
  const sessionId = payload.id?.trim();
  const sessionPath = payload.path?.trim();

  if (!sessionId) {
    return {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'A session id is required to resume.',
      },
    };
  }

  if (!sessionPath) {
    return {
      success: false,
      error: {
        code: 'INVALID_PATH',
        message: 'Session path is required to resume.',
      },
    };
  }

  const bridge = getBridge();
  if (!bridge?.resumeSession) {
    return {
      success: false,
      error: {
        code: 'bridge_unavailable',
        message: 'Codex session bridge is not available in this environment.',
      },
    };
  }

  return bridge.resumeSession({ sessionId, path: sessionPath });
}

export async function requestDeleteSession(payload: {
  id: string;
  path: string;
}): Promise<DeleteSessionResponse> {
  const sessionId = payload.id?.trim();
  const sessionPath = payload.path?.trim();

  if (!sessionId) {
    return {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'A session id is required to delete.',
      },
    };
  }

  if (!sessionPath) {
    return {
      success: false,
      error: {
        code: 'INVALID_PATH',
        message: 'Session path is required to delete.',
      },
    };
  }

  const bridge = getBridge();
  if (!bridge?.deleteSession) {
    return {
      success: false,
      error: {
        code: 'bridge_unavailable',
        message: 'Codex session bridge is not available in this environment.',
      },
    };
  }

  return bridge.deleteSession({ sessionId, path: sessionPath });
}

function normalizeSessionListItem(raw: RawSessionListItem): SessionListItem {
  const createdAtIso = raw.createdAtIso ?? new Date().toISOString();
  const createdAt = safeDate(createdAtIso);

  return {
    id: raw.id,
    createdAtIso,
    createdAt,
    cwd: raw.cwd ?? raw.sessionPath,
    originator: raw.originator ?? 'unknown',
    cliVersion: raw.cliVersion ?? 'unknown',
    instructions: raw.instructions ?? null,
    status: raw.status ?? DEFAULT_STATUS,
    sessionPath: raw.sessionPath,
  };
}

function normalizeSessionDetail(raw: RawSessionDetail): SessionDetail {
  const base = normalizeSessionListItem(raw);
  return {
    ...base,
    metadataPath: raw.metadataPath,
    notes: raw.notes ?? null,
  };
}

function safeDate(iso: string): Date {
  const asDate = new Date(iso);
  if (Number.isNaN(asDate.getTime())) {
    return new Date();
  }
  return asDate;
}

function getBridge(): CodexSessionsBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.codexSessions ?? null;
}
