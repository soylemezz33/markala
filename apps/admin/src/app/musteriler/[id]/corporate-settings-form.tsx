"use client";

import { useState, useTransition } from "react";
import { updateCorporateSettings } from "./actions";

interface Props {
  userId: string;
  initialDiscount: number | null;
  initialCreditLimit: number | null;
  initialPaymentTermDays: number | null;
}

/** Admin: kurumsal müşteri başına indirim (%) + kredi limiti (₺) + vade (gün). */
export function CorporateSettingsForm({
  userId,
  initialDiscount,
  initialCreditLimit,
  initialPaymentTermDays,
}: Props) {
  const [discount, setDiscount] = useState(initialDiscount != null ? String(initialDiscount) : "");
  const [creditLimit, setCreditLimit] = useState(initialCreditLimit != null ? String(initialCreditLimit) : "");
  const [termDays, setTermDays] = useState(initialPaymentTermDays != null ? String(initialPaymentTermDays) : "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSaved(false);
    const d = discount.trim() === "" ? undefined : Number(discount);
    const c = creditLimit.trim() === "" ? undefined : Number(creditLimit);
    const t = termDays.trim() === "" ? undefined : Number(termDays);
    if (d !== undefined && (Number.isNaN(d) || d < 0 || d > 100)) return setError("İndirim 0-100 arası olmalı.");
    if (c !== undefined && (Number.isNaN(c) || c < 0)) return setError("Kredi limiti 0 veya üzeri olmalı.");
    if (t !== undefined && (!Number.isInteger(t) || t < 0 || t > 365)) return setError("Vade 0-365 gün olmalı.");
    startTransition(async () => {
      try {
        await updateCorporateSettings(userId, {
          corporateDiscount: d,
          corporateCreditLimit: c,
          corporatePaymentTermDays: t,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setError("Kaydedilemedi, tekrar deneyin.");
      }
    });
  }

  const field = "mt-1 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm text-ink-900 tabular-nums";
  return (
    <div className="mt-3 pt-3 border-t border-paper-200 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-ink-500">İndirim (%)</span>
          <input type="number" min={0} max={100} step={0.01} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" className={field} />
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">Kredi limiti (₺)</span>
          <input type="number" min={0} step={0.01} value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="boş=limitsiz" className={field} />
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">Vade (gün)</span>
          <input type="number" min={0} max={365} step={1} value={termDays} onChange={(e) => setTermDays(e.target.value)} placeholder="30" className={field} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={pending} className="px-4 py-2 rounded-md bg-ink-900 text-paper-50 text-sm font-medium disabled:opacity-50">
          {pending ? "Kaydediliyor…" : "Kurumsal ayarları kaydet"}
        </button>
        {saved && <span className="text-sm text-success">✓ Kaydedildi</span>}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    </div>
  );
}
