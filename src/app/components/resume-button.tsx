'use client';

import { useState } from 'react';

import { requestResumeSession } from '@/lib/session-client';
import { pushToast } from '@/lib/toast';

interface ResumeButtonProps {
  sessionId: string;
  sessionPath: string;
  disabled?: boolean;
}

export function ResumeButton({ sessionId, sessionPath, disabled }: ResumeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleResume = async () => {
    if (disabled || loading) {
      return;
    }

    const normalizedId = sessionId.trim();
    const normalizedPath = sessionPath.trim();

    if (!normalizedId) {
      pushToast({
        title: 'Resume session failed',
        description: 'Session id is missing or empty. Select a valid session and try again.',
        variant: 'error',
      });
      return;
    }

    if (!normalizedPath) {
      pushToast({
        title: 'Resume session failed',
        description: 'Session path is missing. Refresh sessions and try again.',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await requestResumeSession({ id: normalizedId, path: normalizedPath });
      if (!response.success) {
        const code = response.error?.code ?? 'unknown_error';
        const description =
          code === 'CLI_NOT_FOUND'
            ? 'Codex CLI executable not found. Restore codex.exe or update CODEX_CLI_PATH.'
            : response.error?.message ?? 'Unable to resume session.';
        const warningCodes = new Set(['CLI_NOT_FOUND', 'INVALID_ID', 'MISSING_META', 'ID_MISMATCH']);

        pushToast({
          title: 'Resume session failed',
          description,
          variant: warningCodes.has(code) ? 'warning' : 'error',
        });
        return;
      }

      const isSimulated = Boolean(response.simulated);
      pushToast({
        title: isSimulated ? 'Session resume simulated' : 'Session resumed',
        description: isSimulated
          ? `Simulated command prompt opened for ${normalizedId.slice(0, 8)}. Install Codex CLI to run actual resumes.`
          : `Command prompt opened for ${normalizedId.slice(0, 8)}.`,
        variant: isSimulated ? 'warning' : 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Failed to resume session',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred while resuming the session.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleResume}
      title="Launch a CMD window and run codex resume <session_id>. Always verify /status output."
      disabled={disabled || loading}
      className="inline-flex min-w-[160px] items-center justify-center rounded-lg border border-neutral-300 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? 'Launching...' : 'Resume Session'}
    </button>
  );
}
