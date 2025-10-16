'use client';

import { useCallback, useEffect } from 'react';

import { fetchSessionDetail, fetchSessions } from '@/lib/session-client';
import { useSessionStore } from '@/lib/stores/session-store';
import { pushToast } from '@/lib/toast';
import { SessionDetailPanel } from './session-detail';
import { SessionList } from './session-list';
import { ToastViewport } from './toast-viewport';

export function SessionManager() {
  const setSessions = useSessionStore((state) => state.setSessions);
  const sessions = useSessionStore((state) => state.sessions);
  const setDetail = useSessionStore((state) => state.setDetail);
  const setLoadingSessions = useSessionStore((state) => state.setLoadingSessions);
  const setLoadingDetail = useSessionStore((state) => state.setLoadingDetail);
  const setError = useSessionStore((state) => state.setError);
  const setDetailError = useSessionStore((state) => state.setDetailError);
  const selectedId = useSessionStore((state) => state.selectedId);

  const loadSessions = useCallback(
    async (forceRefresh = false) => {
      setLoadingSessions(true);
      setError(null);
      try {
        const sessions = await fetchSessions({ forceRefresh });
        setSessions(sessions);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to read sessions from the Codex session store.';
        setError(message);
        pushToast({
          title: 'Failed to load sessions',
          description: message,
          variant: 'error',
        });
      } finally {
        setLoadingSessions(false);
      }
    },
    [setError, setLoadingSessions, setSessions],
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const selectedSession = sessions.find((session) => session.id === selectedId) ?? null;

    if (!selectedId || !selectedSession) {
      setDetail(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const detail = await fetchSessionDetail(selectedId, selectedSession.sessionPath);
        if (!cancelled) {
          if (detail) {
            setDetail(detail);
          } else {
            setDetailError('Session metadata is unavailable. Ensure Codex CLI has created the session.');
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to load session metadata. Try refreshing sessions.';
          setDetailError(message);
          pushToast({
            title: 'Failed to load session detail',
            description: message,
            variant: 'error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedId, sessions, setDetail, setDetailError, setLoadingDetail]);

  useEffect(() => {
    const bridge = typeof window !== 'undefined' ? window.codexSessions : null;
    if (!bridge?.onSessionEvent) {
      return;
    }

    const unsubscribe = bridge.onSessionEvent((event) => {
      if (event.type === 'updated') {
        void loadSessions(true);
      } else {
        pushToast({
          title: 'Watcher error',
          description: event.message,
          variant: 'warning',
        });
      }
    });

    return unsubscribe;
  }, [loadSessions]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] min-h-[540px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg md:flex-row md:gap-8 md:p-6">
      <SessionList onRefresh={() => loadSessions(true)} />
      <SessionDetailPanel />
      <ToastViewport />
    </div>
  );
}
