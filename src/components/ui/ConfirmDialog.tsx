'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-fw-surface rounded-xl border border-fw-text/20 shadow-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-fw-text">{title}</h3>
        <p className="text-sm text-fw-text/70">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-bg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
              destructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-fw-accent hover:bg-fw-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
