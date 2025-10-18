import { memo } from 'react';

import type { SessionListItem } from '@/lib/types';

import { formatKstDateTime, getStatusBadge } from './utils';

interface SessionListRowProps {
  session: SessionListItem;
  active: boolean;
  onSelect: (id: string) => void;
}

export const SessionListRow = memo(function SessionListRow({ session, active, onSelect }: SessionListRowProps) {
  const badge = getStatusBadge(session.status);
  const displayId = session.id;
  const timestampLabel = formatKstDateTime(session.createdAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={[
        'h-auto w-full items-start rounded-xl border px-4 py-4 text-left transition-all',
        active ? 'border-neutral-900 bg-neutral-200/60 shadow-sm' : 'border-transparent bg-white hover:border-neutral-300 hover:bg-neutral-100',
      ].join(' ')}
    >
      <div className="w-full space-y-3 text-left">
        <div className="flex flex-col gap-1 text-xs text-neutral-500">
          <span className="font-medium text-neutral-600 md:text-sm">{timestampLabel}</span>
          <span className="break-all font-mono text-sm font-semibold text-neutral-900">{displayId}</span>
          <span className="truncate text-xs md:text-[13px]">{session.cwd}</span>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span className="font-medium">{session.cliVersion}</span>
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
