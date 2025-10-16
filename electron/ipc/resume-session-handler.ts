import { resolve } from 'node:path';

import { ipcMain } from 'electron';

import { resumeSession } from '../cli/resume-session';
import { DEFAULT_META_FILE, SESSION_ID_REGEX } from '../scanner/session-meta';
import {
  ResumeSessionError,
  ResumeSessionResult,
} from '../types/session';

export interface ResumeSessionRequest {
  sessionId: string;
  path: string;
  metaFileName?: string;
}

export interface ResumeSessionResponse {
  success: boolean;
  sessionId?: string;
  metaPath?: string;
  command?: string;
  cliPath?: string | null;
  simulated?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

const CHANNEL_NAME = 'resume-session';

export function registerResumeSessionHandler(): void {
  ipcMain.handle(CHANNEL_NAME, async (_event, payload: ResumeSessionRequest) => {
    try {
      const result = validateAndResume(payload);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  });
}

function validateAndResume(payload: ResumeSessionRequest): ResumeSessionResult {
  if (!payload || typeof payload !== 'object') {
    throw new ResumeSessionError({
      code: 'INVALID_ID',
      message: 'Invalid resume-session payload',
    });
  }

  const sessionId = payload.sessionId?.trim();
  const sessionPath = payload.path?.trim();

  if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
    throw new ResumeSessionError({
      code: 'INVALID_ID',
      message: `Session id "${sessionId ?? ''}" is not valid`,
    });
  }

  if (!sessionPath) {
    throw new ResumeSessionError({
      code: 'MISSING_META',
      message: 'Session path is required',
    });
  }

  const metaFile = payload.metaFileName?.trim() || DEFAULT_META_FILE;
  const absSessionPath = resolve(sessionPath);

  return resumeSession({
    sessionId,
    sessionPath: absSessionPath,
    metaFileName: metaFile,
  });
}

function createSuccessResponse(result: ResumeSessionResult): ResumeSessionResponse {
  return {
    success: true,
    sessionId: result.sessionId,
    metaPath: result.metaPath,
    command: result.command,
    cliPath: result.cliPath,
    simulated: result.simulated,
  };
}

function createErrorResponse(error: unknown): ResumeSessionResponse {
  if (error instanceof ResumeSessionError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'SPAWN_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error resuming session',
    },
  };
}
