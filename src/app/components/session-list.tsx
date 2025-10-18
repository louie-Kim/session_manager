'use client';

import { memo } from 'react';

import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionListItem } from '@/lib/types';

interface SessionListProps {
  onRefresh: () => void;
}

export const SessionList = memo(function SessionList({ onRefresh }: SessionListProps) {
  const sessions = useSessionStore((state) => state.sessions);
  const selectedId = useSessionStore((state) => state.selectedId);
  const loading = useSessionStore((state) => state.loadingSessions);
  const error = useSessionStore((state) => state.error);
  const setSelectedId = useSessionStore((state) => state.setSelectedId);

  return (
    <aside className='flex h-full w-full max-w-full flex-col border-b border-neutral-200 bg-neutral-50 md:max-w-sm md:flex-shrink-0 md:border-b-0 md:border-r'>
      <div className='px-6 pb-4 pt-6 ring-1 rounded-t-2xl overflow-hidden'>
        <h2 className='text-base font-semibold text-neutral-900'>Sessions</h2>
        <p className='mt-1 text-sm text-neutral-500'>Browse Codex CLI sessions on this machine.</p>
        <div className='mt-4'>
          <button
            type='button'
            onClick={onRefresh}
            disabled={loading}
            className='inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className='h-px bg-neutral-200' />
      {error ? <div className='px-6 py-3 text-xs text-red-600'>{error}</div> : null}

      <div className='flex-1 overflow-y-auto px-4 py-4 pb-4'>
        {sessions.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <ul className='grid gap-3'>
            {sessions.map((session) => (
              <li key={session.id}>
                <SessionListRow
                  session={session}
                  active={session.id === selectedId}
                  onSelect={setSelectedId}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
});

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className='rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center text-sm text-neutral-500'>
      {loading ? 'Loading sessions...' : 'No sessions found. Run Codex CLI to create sessions.'}
    </div>
  );
}

interface SessionListRowProps {
  session: SessionListItem;
  active: boolean;
  onSelect: (id: string) => void;
}

const SessionListRow = memo(function SessionListRow({
  session,
  active,
  onSelect,
}: SessionListRowProps) {
  const badge = getStatusBadge(session.status);
  const displayId = session.id;
  const timestampLabel = formatKstDateTime(session.createdAt);
  return (
    <button
      type='button'
      onClick={() => onSelect(session.id)}
      className={[
        'h-auto w-full items-start rounded-xl border px-4 py-4 text-left transition-all',
        active
          ? 'border-neutral-900 bg-neutral-200/60 shadow-sm'
          : 'border-transparent bg-white hover:border-neutral-300 hover:bg-neutral-100',
      ].join(' ')}
    >
      <div className='w-full space-y-3 text-left'>
        <div className='flex flex-col gap-1 text-xs text-neutral-500'>
          <span className='font-medium text-neutral-600 md:text-sm'>{timestampLabel}</span>
          <span className='break-all font-mono text-sm font-semibold text-neutral-900'>{displayId}</span>
          <span className='truncate text-xs md:text-[13px]'>{session.cwd}</span>
        </div>
        <div className='flex w-full flex-wrap items-center justify-between gap-2 text-xs text-neutral-500'>
          <span className='font-medium'>{session.cliVersion}</span>
          <span
            className={[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              badge.className,
            ].join(' ')}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </button>
  );
});

function getStatusBadge(status: SessionListItem['status']) {
  switch (status) {
    case 'corrupted':
      return { label: 'Corrupted', className: 'bg-red-100 text-red-700' };
    case 'missing':
      return { label: 'Missing', className: 'bg-amber-100 text-amber-700' };
    default:
      return { label: 'Ready', className: 'bg-emerald-100 text-emerald-700' };
  }
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
