'use client';

import { useToastQueue } from '@/lib/toast';

export function ToastViewport() {
  const { toasts } = useToastQueue();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'pointer-events-auto rounded-md border px-4 py-3 shadow-lg',
            toast.variant === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toast.variant === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : toast.variant === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-neutral-200 bg-white text-neutral-800',
          ].join(' ')}
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs text-neutral-500">{toast.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
