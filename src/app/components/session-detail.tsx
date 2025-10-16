'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { fetchSessions, requestDeleteSession } from '@/lib/session-client';
import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionDetail as SessionDetailType } from '@/lib/types';
import { pushToast } from '@/lib/toast';
import { ResumeButton } from './resume-button';

const badgeStyles = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  destructive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
};

const destructiveButtonClass =
  'inline-flex min-w-[160px] items-center justify-center rounded-lg border border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-400';

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
        <div className="max-w-md rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 px-8 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">No session selected</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Select a session from the list to view its details.
          </p>
        </div>
      </section>
    );
  }

  if (detailError) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-10">
        <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <Header session={selectedSession} />
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeStyles.destructive}`}>
              Error
            </span>
          </div>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
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
          error instanceof Error
            ? error.message
            : 'Session list may be out of sync. Try refreshing.';
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
      <div className="flex h-full flex-1 flex-col rounded-3xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Header session={resolvedDetail} />
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  badgeStyles[resolvedDetail.status === 'ok' ? 'success' : 'warning']
                }`}
              >
                {resolvedDetail.status}
              </span>
              <span className="inline-block h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
              <span>CLI {resolvedDetail.cliVersion}</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteLoading}
              className={destructiveButtonClass}
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
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
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
      <h2 className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {session.id}
      </h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        생성 시각: {formatKstDateTime(new Date(session.createdAtIso))} · CLI {session.cliVersion}
      </p>
    </div>
  );
}

interface DetailBodyProps {
  session: SessionDetailType;
}

function DetailBody({ session }: DetailBodyProps) {
  const instructionText =
    session.instructions && typeof session.instructions === 'string'
      ? session.instructions
      : session.instructions
        ? JSON.stringify(session.instructions, null, 2)
        : null;

  return (
    <div className="space-y-6 pb-6">
      {session.status !== 'ok' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-200">
          Session metadata is unavailable or corrupted. Resume is disabled until the meta file is restored.
        </div>
      ) : null}

      <section>
        <SectionTitle>Overview</SectionTitle>
        <dl className="mt-3 grid grid-cols-1 gap-4 text-sm text-neutral-600 dark:text-neutral-300 md:grid-cols-2">
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
        <SectionTitle>Instructions</SectionTitle>
        {instructionText ? (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap px-4 py-3 text-xs text-neutral-700 dark:text-neutral-200">
                {instructionText}
              </pre>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No instructions captured.</p>
        )}
      </section>

      {session.notes ? (
        <section>
          <SectionTitle>Notes</SectionTitle>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{session.notes}</p>
        </section>
      ) : null}

      {session.metadataPath ? (
        <section>
          <SectionTitle>Metadata Path</SectionTitle>
          <p className="mt-2 break-all text-xs text-neutral-500 dark:text-neutral-400">{session.metadataPath}</p>
        </section>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{children}</h3>;
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
      <dt className="text-xs uppercase text-neutral-400 dark:text-neutral-500">{label}</dt>
      <dd className={['mt-1 text-neutral-700 dark:text-neutral-200', valueClassName ?? ''].join(' ')}>
        {children}
      </dd>
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

  return (
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
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-900">
        <h2 id="confirm-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        {description ? (
          <p id="confirm-description" className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:focus-visible:outline-neutral-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-400"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
