import * as React from 'react';
import { createPortal } from 'react-dom';

import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'destructive' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? 'confirm-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4 backdrop-blur-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl outline-none transition dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-2 text-left">
          <h2 id="confirm-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          {description ? (
            <p id="confirm-description" className="text-sm text-neutral-600 dark:text-neutral-300">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
