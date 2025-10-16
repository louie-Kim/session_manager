'use client';

import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSessionStore } from '@/lib/stores/session-store';
import type { SessionListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

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
    <aside className="flex h-full w-full max-w-full flex-col border-b border-neutral-200 bg-neutral-50/60 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/30 md:w-[360px] md:flex-shrink-0 md:border-b-0 md:border-r">
      <Card className="border-none bg-transparent shadow-none dark:bg-transparent">
        <CardHeader className="px-6 pb-1 pt-6">
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Browse Codex CLI sessions on this machine.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefresh}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>
      <Separator />
      {error ? (
        <div className="px-6 py-3 text-xs text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      <ScrollArea className="flex-1 px-4 pb-4">
        {sessions.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <ul className="grid gap-3">
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
      </ScrollArea>
    </aside>
  );
});

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
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
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      onClick={() => onSelect(session.id)}
      className={cn(
        'h-auto w-full items-start rounded-xl border px-4 py-4 text-left transition-all',
        active
          ? 'border-neutral-900 shadow-sm dark:border-neutral-200'
          : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700',
      )}
    >
      <div className="w-full space-y-3 text-left">
        <div className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-600 dark:text-neutral-300 md:text-sm">{timestampLabel}</span>
          <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100 break-all">
            {displayId}
          </span>
          <span className="truncate text-xs md:text-[13px]">{session.cwd}</span>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">{session.cliVersion}</span>
          <Badge variant={badge.variant} className="text-[11px]">
            {badge.label}
          </Badge>
        </div>
      </div>
    </Button>
  );
});

function getStatusBadge(status: SessionListItem['status']) {
  switch (status) {
    case 'corrupted':
      return { label: 'Corrupted', variant: 'destructive' as const };
    case 'missing':
      return { label: 'Missing', variant: 'warning' as const };
    default:
      return { label: 'Ready', variant: 'success' as const };
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
