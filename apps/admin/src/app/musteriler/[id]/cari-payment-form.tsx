"use client";

import { useState, useTransition } from "react";
import { recordCorporatePayment } from "./actions";

/** Admin: kurumsal müşterinin cari hesabına tahsilat (ödeme) girişi. */
export function CariPaymentForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return setError("Tutar 0'dan büyük olmalı.");
    startTransition(async () => {
      try {
        await recordCorporatePayment(userId, a, desc.trim() || undefined);
        setAmount("");
        setDesc("");
      } catch {
        setError("Tahsilat kaydedilemedi.");
      }
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-paper-200">
      <div className="text-xs text-ink-500 mb-2">Tahsilat gir (ödeme alındı → bakiyeyi düşürür)</div>
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="number" min={0} step={0.01} value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="Tutar ₺"
          className="w-32 px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm tabular-nums"
        />
        <input
          type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Açıklama (örn. Havale 12.06)" maxLength={200}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
        />
        <button
          type="button" onClick={handleSave} disabled={pending}
          className="px-4 py-2 rounded-md bg-success/90 text-white text-sm font-medium disabled:opacity-50"
        >
          {pending ? "…" : "Tahsilat Kaydet"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
