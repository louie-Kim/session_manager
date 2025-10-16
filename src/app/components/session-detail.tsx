'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { fetchSessions, requestDeleteSession } from '@/lib/session-client';
import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionDetail as SessionDetailType } from '@/lib/types';
import { pushToast } from '@/lib/toast';
import { ResumeButton } from './resume-button';

const badgeStyles = {
  ok: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
};

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
            <Header session={selectedSession} />
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
        const message =
          error instanceof Error ? error.message : 'Session list may be out of sync. Try refreshing.';
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
          <div className="space-y-2">
            <Header session={resolvedDetail} />
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  badgeStyles[resolvedDetail.status === 'ok' ? 'ok' : 'warning']
                }`}
              >
                {resolvedDetail.status}
              </span>
              <span className="inline-block h-4 w-px bg-neutral-200" />
              <span>CLI {resolvedDetail.cliVersion}</span>
            </div>
          </div>
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
              <DetailBody session={resolvedDetail} />
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

function Header({ session }: { session: SessionDetailType }) {
  return (
    <div className="min-w-0 space-y-1">
      <h2 className="font-mono text-sm font-semibold text-neutral-900">{session.id}</h2>
      <p className="text-xs text-neutral-500">
        생성 시각: {formatKstDateTime(new Date(session.createdAtIso))} · CLI {session.cliVersion}
      </p>
    </div>
  );
}

function DetailBody({ session }: { session: SessionDetailType }) {
  const instructionText =
    session.instructions && typeof session.instructions === 'string'
      ? session.instructions
      : session.instructions
        ? JSON.stringify(session.instructions, null, 2)
        : null;

  const [instructionsOpen, setInstructionsOpen] = useState(false);

  return (
    <div className="space-y-6 pb-6">
      {session.status !== 'ok' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Session metadata is unavailable or corrupted. Resume is disabled until the meta file is restored.
        </div>
      ) : null}

      <section>
        <SectionTitle>Overview</SectionTitle>
        <dl className="mt-3 grid grid-cols-1 gap-4 text-sm text-neutral-600 md:grid-cols-2">
          <DetailItem label="Session ID">
            <code className="break-all text-xs">{session.id}</code>
          </DetailItem>
          <DetailItem label="Working Dir">
            <code className="break-all text-xs">{session.cwd}</code>
          </DetailItem>
          <DetailItem label="Originator">{session.originator}</DetailItem>
          <DetailItem label="CLI Version">{session.cliVersion}</DetailItem>
          <DetailItem label="Status" valueClassName="capitalize">
            {session.status}
          </DetailItem>
          <DetailItem label="Created (KST)">{formatKstDateTime(new Date(session.createdAtIso))}</DetailItem>
        </dl>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <SectionTitle>Instructions</SectionTitle>
          {instructionText ? (
            <button
              type="button"
              onClick={() => setInstructionsOpen((prev) => !prev)}
              className="text-sm font-medium text-neutral-600 underline transition hover:text-neutral-900"
            >
              {instructionsOpen ? 'Hide' : 'Show'}
            </button>
          ) : null}
        </div>
        {instructionText ? (
          instructionsOpen ? (
            <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50">
              <pre className="whitespace-pre-wrap px-4 py-3 text-xs text-neutral-700">
                {instructionText}
              </pre>
            </div>
          ) : null
        ) : (
          <p className="mt-3 text-sm text-neutral-500">No instructions captured.</p>
        )}
      </section>

      {session.notes ? (
        <section>
          <SectionTitle>Notes</SectionTitle>
          <p className="mt-2 text-sm text-neutral-600">{session.notes}</p>
        </section>
      ) : null}

      {session.metadataPath ? (
        <section>
          <SectionTitle>Metadata Path</SectionTitle>
          <p className="mt-2 break-all text-xs text-neutral-500">{session.metadataPath}</p>
        </section>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-neutral-800">{children}</h3>;
}

function DetailItem({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase text-neutral-400">{label}</dt>
      <dd className={`mt-1 text-neutral-700 ${valueClassName ?? ''}`}>{children}</dd>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? 'confirm-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4 backdrop-blur-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl outline-none">
        <h2 id="confirm-title" className="text-base font-semibold text-neutral-900">
          {title}
        </h2>
        {description ? (
          <p id="confirm-description" className="mt-2 text-sm text-neutral-600">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function formatKstDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');

  if (!year || !month || !day || !hour || !minute) {
    return formatter.format(date);
  }

  return `${year}-${month}-${day} ${hour}:${minute} KST`;
}
