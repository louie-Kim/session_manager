'use client';

import { useMemo, useState } from 'react';

import { fetchSessions, requestDeleteSession } from '@/lib/session-client';
import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionDetail as SessionDetailType } from '@/lib/types';
import { pushToast } from '@/lib/toast';

import { ResumeButton } from '../resume-button';
import { ConfirmDialog } from './ConfirmDialog';
import { SessionConversation } from './SessionConversation';
import { SessionHeader } from './SessionHeader';
import { SessionInstructions } from './SessionInstructions';
import { SessionNotes } from './SessionNotes';
import { SessionOverview } from './SessionOverview';
import { badgeStyles } from './utils';

const deleteButtonClass =
  'inline-flex min-w-[160px] items-center justify-center rounded-lg border border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-70';

export function SessionDetailPanel() {
  const sessions = useSessionStore((state) => state.sessions);
  const selectedId = useSessionStore((state) => state.selectedId);
  const detail = useSessionStore((state) => state.detail);
  const loadingDetail = useSessionStore((state) => state.loadingDetail);
  const detailError = useSessionStore((state) => state.detailError);
  const setSessions = useSessionStore((state) => state.setSessions);
  const removeSession = useSessionStore((state) => state.removeSession);
  const setDetail = useSessionStore((state) => state.setDetail);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? null,
    [sessions, selectedId],
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!selectedSession) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-10">
        <div className="max-w-md rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-8 py-12 text-center">
          <h3 className="text-base font-semibold text-neutral-900">No session selected</h3>
          <p className="mt-2 text-sm text-neutral-500">Select a session from the list to view its details.</p>
        </div>
      </section>
    );
  }

  if (detailError) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-10">
        <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <SessionHeader session={selectedSession} showMeta={false} />
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeStyles.error}`}>
              Error
            </span>
          </div>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailError}
          </div>
        </div>
      </section>
    );
  }

  const resolvedDetail = (detail ?? selectedSession) as SessionDetailType;

  const handleDeleteSession = async () => {
    setDeleteLoading(true);
    try {
      const response = await requestDeleteSession({
        id: selectedSession.id,
        path: selectedSession.sessionPath,
      });
      if (!response.success) {
        const description = response.error?.message ?? 'Unable to delete session.';
        pushToast({
          title: 'Failed to delete session',
          description,
          variant: 'error',
        });
        return;
      }

      removeSession(selectedSession.id);
      setDetail(null);

      pushToast({
        title: 'Session deleted successfully',
        description: `Removed ${selectedSession.id.slice(0, 8)} from the session list.`,
        variant: 'success',
      });

      try {
        const refreshed = await fetchSessions({ forceRefresh: true });
        setSessions(refreshed);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Session list may be out of sync. Try refreshing.';
        pushToast({
          title: 'Refresh sessions manually',
          description: message,
          variant: 'warning',
        });
      }
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-full flex-1 flex-col rounded-3xl border border-neutral-200 bg-white shadow-lg">
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <SessionHeader session={resolvedDetail} />
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteLoading}
              className={deleteButtonClass}
            >
              Delete Session
            </button>
            <ResumeButton
              sessionId={selectedSession.id}
              sessionPath={selectedSession.sessionPath}
              disabled={selectedSession.status !== 'ok' || loadingDetail}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 py-5">
          {loadingDetail ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-500">
              Loading session detail...
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-4">
              <div className="space-y-6 pb-6">
                {resolvedDetail.status !== 'ok' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Session metadata is unavailable or corrupted. Resume is disabled until the meta file is restored.
                  </div>
                ) : null}
                <SessionOverview session={resolvedDetail} />
                <SessionConversation sessionPath={resolvedDetail.sessionPath} />
                <SessionInstructions instructions={resolvedDetail.instructions} />
                <SessionNotes notes={resolvedDetail.notes} metadataPath={resolvedDetail.metadataPath} />
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this session?"
        description="This will permanently remove the session files from disk. This action cannot be undone."
        confirmLabel="Delete session"
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={handleDeleteSession}
      />
    </section>
  );
}
