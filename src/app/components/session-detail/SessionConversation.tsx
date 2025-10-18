import { useEffect, useState } from 'react';

import type { SessionConversationTurn } from '@/lib/types';

import { SectionTitle } from './SectionTitle';
import { formatKstDateTime } from './utils';

interface SessionConversationProps {
  sessionPath: string;
}

export function SessionConversation({ sessionPath }: SessionConversationProps) {
  const [turns, setTurns] = useState<SessionConversationTurn[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!sessionPath) {
      setTurns([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const loadConversation = async () => {
      setLoading(true);
      setError(null);
      setTurns(null);

      try {
        const response = await fetch('/api/session-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionPath }),
          cache: 'no-store',
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          turns?: SessionConversationTurn[];
          error?: string;
        };

        if (!response.ok) {
          const message = typeof payload.error === 'string' ? payload.error : 'Unable to load conversation.';
          throw new Error(message);
        }

        if (!cancelled) {
          setTurns(Array.isArray(payload.turns) ? payload.turns : []);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        if (!cancelled) {
          const message = fetchError instanceof Error ? fetchError.message : 'Unable to load conversation.';
          setError(message);
          setTurns([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConversation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sessionPath]);

  if (!sessionPath) {
    return null;
  }

  const resolvedTurns = turns ?? [];

  const formatTimestamp = (value: string): string => {
    if (!value) {
      return 'Timestamp unavailable';
    }
    const asDate = new Date(value);
    if (Number.isNaN(asDate.getTime())) {
      return value;
    }
    return formatKstDateTime(asDate);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle>Conversation</SectionTitle>
        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          className="text-sm font-medium text-neutral-600 underline transition hover:text-neutral-900"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>
      {collapsed ? null : loading ? (
        <p className="mt-3 text-sm text-neutral-500">Loading conversation...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : resolvedTurns.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No conversation events captured.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {resolvedTurns.map((turn, index) => {
            const keyBase = turn.user?.timestamp ?? turn.agent?.timestamp ?? `turn-${index}`;
            return (
              <div key={`${keyBase}-${index}`} className="space-y-2">
                {turn.user ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-800 shadow-sm">
                      <p className="whitespace-pre-wrap">{turn.user.text}</p>
                      <span className="mt-2 block text-xs text-neutral-500">{formatTimestamp(turn.user.timestamp)}</span>
                    </div>
                  </div>
                ) : null}
                {turn.reasonings.map((reasoning, reasoningIndex) => (
                  <div key={`${keyBase}-reasoning-${reasoningIndex}`} className="flex justify-center">
                    <div className="max-w-[70%] text-center text-xs italic text-neutral-500">
                      <p className="whitespace-pre-wrap">{reasoning.text}</p>
                      <span className="mt-1 block text-[10px] text-neutral-400">{formatTimestamp(reasoning.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {turn.agent ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-800 shadow-sm">
                      <p className="whitespace-pre-wrap">{turn.agent.text}</p>
                      <span className="mt-2 block text-xs text-neutral-500 text-right">
                        {formatTimestamp(turn.agent.timestamp)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
