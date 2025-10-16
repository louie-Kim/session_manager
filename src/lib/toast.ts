'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();

export function pushToast(toast: Omit<ToastMessage, 'id'>): void {
  const enrichedToast: ToastMessage = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    ...toast,
  };

  listeners.forEach((listener) => listener(enrichedToast));
}

export function useToastQueue(timeout = 4000) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener: ToastListener = (toast) => {
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, timeout);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [timeout]);

  return { toasts };
}
