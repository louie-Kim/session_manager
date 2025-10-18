export type SessionIntegrityStatus = 'ok' | 'corrupted' | 'missing';

export interface SessionListItem {
  id: string;
  createdAtIso: string;
  createdAt: Date;
  cwd: string;
  originator: string;
  cliVersion: string;
  instructions: unknown | null;
  status: SessionIntegrityStatus;
  sessionPath: string;
}

export interface SessionDetail extends SessionListItem {
  cliVersion: string;
  instructions: unknown | null;
  metadataPath?: string;
  cliVersionLabel?: string;
  notes?: string | null;
}

export interface GetSessionsResponse {
  sessions: RawSessionListItem[];
}

export interface RawSessionListItem {
  id: string;
  createdAtIso?: string;
  cwd?: string;
  originator?: string;
  cliVersion?: string;
  instructions?: unknown | null;
  status?: SessionIntegrityStatus;
  sessionPath: string;
}

export interface GetSessionDetailResponse {
  session: RawSessionDetail | null;
}

export interface RawSessionDetail extends RawSessionListItem {
  metadataPath?: string;
  notes?: string | null;
}

export interface ResumeSessionResponse {
  success: boolean;
  sessionId?: string;
  metaPath?: string;
  command?: string;
  cliPath?: string | null;
  simulated?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface DeleteSessionResponse {
  success: boolean;
  sessionId?: string;
  removedPath?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export type SessionConversationMessageType = 'user_message' | 'agent_message' | 'agent_reasoning';

export interface SessionConversationEntry {
  timestamp: string;
  type: SessionConversationMessageType;
  text: string;
}

export interface SessionConversationTurn {
  user?: SessionConversationEntry;
  reasonings: SessionConversationEntry[];
  agent?: SessionConversationEntry;
}
