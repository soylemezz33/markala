"use client";

import { useState, useTransition } from "react";
import { updateCorporateSettings } from "./actions";

interface Props {
  userId: string;
  initialDiscount: number | null;
  initialCreditLimit: number | null;
}

/** Admin: kurumsal müşteri başına indirim oranı (%) + kredi limiti (₺) düzenleme. */
export function CorporateSettingsForm({ userId, initialDiscount, initialCreditLimit }: Props) {
  const [discount, setDiscount] = useState(initialDiscount != null ? String(initialDiscount) : "");
  const [creditLimit, setCreditLimit] = useState(initialCreditLimit != null ? String(initialCreditLimit) : "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSaved(false);
    const d = discount.trim() === "" ? undefined : Number(discount);
    const c = creditLimit.trim() === "" ? undefined : Number(creditLimit);
    if (d !== undefined && (Number.isNaN(d) || d < 0 || d > 100)) {
      setError("İndirim 0-100 arası olmalı.");
      return;
    }
    if (c !== undefined && (Number.isNaN(c) || c < 0)) {
      setError("Kredi limiti 0 veya üzeri olmalı.");
      return;
    }
    startTransition(async () => {
      try {
        await updateCorporateSettings(userId, { corporateDiscount: d, corporateCreditLimit: c });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setError("Kaydedilemedi, tekrar deneyin.");
      }
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-paper-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-ink-500">İndirim oranı (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="örn. 10"
            className="mt-1 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm text-ink-900 tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">Kredi limiti (₺)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="boş = limitsiz"
            className="mt-1 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm text-ink-900 tabular-nums"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="px-4 py-2 rounded-md bg-ink-900 text-paper-50 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {saved && <span className="text-sm text-success">✓ Kaydedildi</span>}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
      <p className="text-xs text-ink-500">
        İndirim, kurumsal müşterinin tüm siparişlerine otomatik uygulanır. Kredi limiti açık hesap (cari) için kullanılır.
      </p>
    </div>
  );
}
