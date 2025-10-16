import { resolve } from 'node:path';
import { homedir } from 'node:os';

export function getSessionRootPath(): string {
  return process.env.CODEX_SESSION_PATH ?? resolve(homedir(), '.codex', 'sessions');
}
