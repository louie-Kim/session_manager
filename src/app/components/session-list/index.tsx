'use client';

import { memo } from 'react';

import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionListItem } from '@/lib/types';

import { EmptyState } from './EmptyState';
import { SessionListRow } from './SessionListRow';

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
    <aside className="flex h-full w-full max-w-full flex-col border-b border-neutral-200 bg-neutral-50 md:max-w-sm md:flex-shrink-0 md:border-b-0 md:border-r">
      <div className="px-6 pb-4 pt-6">
        <h2 className="text-base font-semibold text-neutral-900">Sessions</h2>
        <p className="mt-1 text-sm text-neutral-500">Browse Codex CLI sessions on this machine.</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className="h-px bg-neutral-200" />
      {error ? <div className="px-6 py-3 text-xs text-red-600">{error}</div> : null}

      <div className="flex-1 overflow-y-auto ring-1 rounded-2xl px-4 py-4 pb-4">
        {sessions.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <ul className="grid gap-3">
            {sessions.map((session: SessionListItem) => (
              <li key={session.id}>
                <SessionListRow session={session} active={session.id === selectedId} onSelect={setSelectedId} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
});
