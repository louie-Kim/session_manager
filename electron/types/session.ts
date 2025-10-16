export interface SessionMetaPayload {
  id: string;
  timestamp: string;
  cwd: string;
  originator: string;
  cli_version: string;
  instructions: unknown | null;
  source: string;
}

export interface SessionMetaFile {
  timestamp: string;
  type: 'session_meta';
  payload: SessionMetaPayload;
}

export type SessionMetaStatus = 'ok' | 'missing' | 'corrupted';

export type SessionMetaErrorCode =
  | 'MISSING_FILE'
  | 'INVALID_FILE'
  | 'INVALID_JSON'
  | 'MISSING_FIELDS'
  | 'INVALID_ID'
  | 'INVALID_TIMESTAMP';

export interface SessionMetaError {
  code: SessionMetaErrorCode;
  message: string;
  cause?: unknown;
  missingFields?: string[];
}

export interface NormalizedSessionMeta {
  status: SessionMetaStatus;
  etag: string | null;
  summary: SessionSummary | null;
  raw: SessionMetaFile | null;
  error?: SessionMetaError;
  metaPath: string | null;
}

export interface SessionSummary {
  id: string;
  createdAt: Date;
  createdAtIso: string;
  cwd: string;
  originator: string;
  cliVersion: string;
  instructions: unknown | null;
  source: string;
}

export type ResumeSessionErrorCode =
  | 'INVALID_ID'
  | 'MISSING_META'
  | 'ID_MISMATCH'
  | 'CLI_NOT_FOUND'
  | 'SPAWN_FAILED';

export interface ResumeSessionErrorOptions {
  code: ResumeSessionErrorCode;
  message: string;
  cause?: unknown;
}

export class ResumeSessionError extends Error {
  readonly code: ResumeSessionErrorCode;
  readonly cause: unknown;

  constructor(options: ResumeSessionErrorOptions) {
    super(options.message);
    this.name = 'ResumeSessionError';
    this.code = options.code;
    this.cause = options.cause;
  }
}

export interface ResumeSessionResult {
  sessionId: string;
  metaPath: string;
  cliPath: string | null;
  command: string;
  simulated: boolean;
}

export type DeleteSessionErrorCode =
  | 'INVALID_ID'
  | 'MISSING_META'
  | 'ID_MISMATCH'
  | 'REMOVE_FAILED';

export interface DeleteSessionErrorOptions {
  code: DeleteSessionErrorCode;
  message: string;
  cause?: unknown;
}

export class DeleteSessionError extends Error {
  readonly code: DeleteSessionErrorCode;
  readonly cause: unknown;

  constructor(options: DeleteSessionErrorOptions) {
    super(options.message);
    this.name = 'DeleteSessionError';
    this.code = options.code;
    this.cause = options.cause;
  }
}

export interface DeleteSessionResult {
  sessionId: string;
  removedPath: string;
}
