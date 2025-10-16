import { resolve } from 'node:path';

import { ipcMain } from 'electron';

import { deleteSession } from '../cli/delete-session';
import { DEFAULT_META_FILE, SESSION_ID_REGEX } from '../scanner/session-meta';
import {
  DeleteSessionError,
  DeleteSessionResult,
} from '../types/session';

export interface DeleteSessionRequest {
  sessionId: string;
  path: string;
  metaFileName?: string;
}

export interface DeleteSessionResponse {
  success: boolean;
  sessionId?: string;
  removedPath?: string;
  error?: {
    code: string;
    message: string;
  };
}

const CHANNEL_NAME = 'delete-session';

export function registerDeleteSessionHandler(): void {
  ipcMain.handle(CHANNEL_NAME, async (_event, payload: DeleteSessionRequest) => {
    try {
      const result = validateAndDelete(payload);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  });
}

function validateAndDelete(payload: DeleteSessionRequest): DeleteSessionResult {
  if (!payload || typeof payload !== 'object') {
    throw new DeleteSessionError({
      code: 'INVALID_ID',
      message: 'Invalid delete-session payload',
    });
  }

  const sessionId = payload.sessionId?.trim();
  const sessionPath = payload.path?.trim();

  if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
    throw new DeleteSessionError({
      code: 'INVALID_ID',
      message: `Session id "${sessionId ?? ''}" is not valid`,
    });
  }

  if (!sessionPath) {
    throw new DeleteSessionError({
      code: 'MISSING_META',
      message: 'Session path is required',
    });
  }

  const metaFile = payload.metaFileName?.trim() || DEFAULT_META_FILE;
  const absSessionPath = resolve(sessionPath);

  return deleteSession({
    sessionId,
    sessionPath: absSessionPath,
    metaFileName: metaFile,
  });
}

function createSuccessResponse(result: DeleteSessionResult): DeleteSessionResponse {
  return {
    success: true,
    sessionId: result.sessionId,
    removedPath: result.removedPath,
  };
}

function createErrorResponse(error: unknown): DeleteSessionResponse {
  if (error instanceof DeleteSessionError) {
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
      code: 'REMOVE_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error deleting session',
    },
  };
}

