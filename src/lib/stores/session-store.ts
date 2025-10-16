'use client';

import { create } from 'zustand';

import type { SessionDetail, SessionListItem } from '../types';

interface SessionStoreState {
  sessions: SessionListItem[];
  selectedId: string | null;
  detail: SessionDetail | null;
  loadingSessions: boolean;
  loadingDetail: boolean;
  error: string | null;
  detailError: string | null;
  setSessions: (sessions: SessionListItem[]) => void;
  setSelectedId: (id: string | null) => void;
  setDetail: (detail: SessionDetail | null) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingDetail: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDetailError: (error: string | null) => void;
  upsertSession: (session: SessionListItem) => void;
  removeSession: (sessionId: string) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],
  selectedId: null,
  detail: null,
  loadingSessions: false,
  loadingDetail: false,
  error: null,
  detailError: null,
  setSessions: (sessions) =>
    set((state) => {
      let selectedId = state.selectedId;
      if (sessions.length === 0) {
        selectedId = null;
      } else if (!selectedId || !sessions.some((session) => session.id === selectedId)) {
        selectedId = sessions[0].id;
      }
      return { sessions, selectedId };
    }),
  setSelectedId: (id) =>
    set((state) => ({
      selectedId: id,
      detail: id && state.detail?.id === id ? state.detail : null,
      detailError: null,
    })),
  setDetail: (detail) =>
    set(() => ({
      detail,
      detailError: null,
    })),
  setLoadingSessions: (loading) => set(() => ({ loadingSessions: loading })),
  setLoadingDetail: (loading) => set(() => ({ loadingDetail: loading })),
  setError: (error) => set(() => ({ error })),
  setDetailError: (detailError) => set(() => ({ detailError })),
  upsertSession: (session) =>
    set((state) => {
      const existingIndex = state.sessions.findIndex((item) => item.id === session.id);
      let updatedSessions: SessionListItem[];
      if (existingIndex === -1) {
        updatedSessions = [session, ...state.sessions];
      } else {
        updatedSessions = [...state.sessions];
        updatedSessions[existingIndex] = session;
      }
      return { sessions: updatedSessions };
    }),
  removeSession: (sessionId) =>
    set((state) => {
      const updatedSessions = state.sessions.filter((session) => session.id !== sessionId);
      let selectedId = state.selectedId;
      let detail: SessionDetail | null = state.detail;
      if (selectedId === sessionId) {
        selectedId = updatedSessions[0]?.id ?? null;
        detail = null;
      }
      return {
        sessions: updatedSessions,
        selectedId,
        detail,
        detailError: null,
      };
    }),
}));
