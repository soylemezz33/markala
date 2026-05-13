"use client";

import { create } from "zustand";
import { CheckCircle, X, Warning, Info } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4000,
    );
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Helper for non-React contexts (event handlers etc). */
export const toast = {
  success: (msg: string) => useToast.getState().show(msg, "success"),
  error: (msg: string) => useToast.getState().show(msg, "error"),
  info: (msg: string) => useToast.getState().show(msg, "info"),
};

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm animate-in slide-in-from-bottom-2 ${
            t.type === "success"
              ? "bg-success text-paper-50"
              : t.type === "error"
                ? "bg-error text-paper-50"
                : "bg-ink-900 text-paper-50"
          }`}
        >
          {t.type === "success" && <CheckCircle size={16} weight="fill" />}
          {t.type === "error" && <Warning size={16} weight="fill" />}
          {t.type === "info" && <Info size={16} weight="fill" />}
          <span className="text-sm flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Kapat"
            className="p-1 -mr-1 hover:bg-white/10 rounded"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
