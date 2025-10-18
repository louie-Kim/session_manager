'use client';

import { useToastQueue } from '@/lib/toast';

import { ToastMessage } from './ToastMessage';

export function ToastViewport() {
  const { toasts } = useToastQueue();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
