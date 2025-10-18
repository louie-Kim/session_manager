import type { SessionDetail as SessionDetailType } from '@/lib/types';

import { badgeStyles, formatKstDateTime } from './utils';

interface SessionHeaderProps {
  session: SessionDetailType;
  showMeta?: boolean;
}

export function SessionHeader({ session, showMeta = true }: SessionHeaderProps) {
  const statusClass = badgeStyles[session.status === 'ok' ? 'ok' : 'warning'];

  return (
    <div className="space-y-2">
      <div className="min-w-0 space-y-1">
        <h2 className="font-mono text-sm font-semibold text-neutral-900">{session.id}</h2>
        <p className="text-xs text-neutral-500">
          Created at: {formatKstDateTime(new Date(session.createdAtIso))} | CLI {session.cliVersion}
        </p>
      </div>
      {showMeta ? (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}
          >
            {session.status}
          </span>
          <span className="inline-block h-4 w-px bg-neutral-200" />
          <span>CLI {session.cliVersion}</span>
        </div>
      ) : null}
    </div>
  );
}
