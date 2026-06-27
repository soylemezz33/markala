"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { CurrencyDollar, Percent, FloppyDisk } from "@phosphor-icons/react";
import { saveSettings } from "../actions";

interface Props {
  initial: Record<string, unknown>;
}

export function FiyatClient({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [kur, setKur] = useState(Number(initial["pricing.kur"] ?? 46));
  const [marj, setMarj] = useState(Number(initial["pricing.marj"] ?? 1.5));
  const [kdv, setKdv] = useState(Number(initial["pricing.kdv"] ?? 0.2));
  const [minM2, setMinM2] = useState(Number(initial["pricing.minM2"] ?? 1));

  const dahilCarpan = marj * (1 + kdv);

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettings(
          "pricing",
          {
            "pricing.kur": kur,
            "pricing.marj": marj,
            "pricing.kdv": kdv,
            "pricing.minM2": minM2,
          },
          "/ayarlar/fiyat",
        );
        toast.success("Fiyat ayarları kaydedildi.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Fiyat Ayarları (m²)</h1>
        <p className="text-ink-500 text-sm mt-1">
          m² bazlı ürünlerde satış = maliyet × marj × kur. Bu değerleri değiştirince tüm
          area ürünleri anında güncellenir.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Kur & Marj" icon={CurrencyDollar}>
          <Field label="Dolar Kuru (₺)">
            <input
              type="number"
              step="0.5"
              className={cls}
              value={kur}
              onChange={(e) => setKur(Number(e.target.value))}
            />
          </Field>
          <Field label="Kâr Marjı (× net)">
            <input
              type="number"
              step="0.05"
              className={cls}
              value={marj}
              onChange={(e) => setMarj(Number(e.target.value))}
            />
          </Field>
        </Card>

        <Card title="KDV & Minimum" icon={Percent}>
          <Field label="KDV Oranı (örn. 0.20 = %20)">
            <input
              type="number"
              step="0.01"
              className={cls}
              value={kdv}
              onChange={(e) => setKdv(Number(e.target.value))}
            />
          </Field>
          <Field label="Minimum İş Alanı (m²)">
            <input
              type="number"
              step="0.25"
              className={cls}
              value={minM2}
              onChange={(e) => setMinM2(Number(e.target.value))}
            />
          </Field>
        </Card>
      </div>

      <div className="mt-5 rounded-lg border border-paper-300 bg-paper-50 p-4 text-sm text-ink-700">
        Efektif KDV-dahil çarpan:{" "}
        <strong className="text-ink-900 tabular-nums">×{dahilCarpan.toFixed(2)}</strong> (maliyet ₺
        → satış KDV dahil). Örn. 2,20 $/m² × {kur} ×{" "}
        {dahilCarpan.toFixed(2)} ={" "}
        <strong className="text-ink-900 tabular-nums">
          {(2.2 * kur * dahilCarpan).toFixed(2)} ₺/m²
        </strong>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink-900 px-5 py-2.5 text-paper-50 font-medium disabled:opacity-60"
      >
        <FloppyDisk size={18} /> {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </AdminShell>
  );
}

const cls =
  "w-full rounded-lg border border-paper-300 px-3 py-2 text-ink-900 focus:border-ink-900 focus:outline-none tabular-nums";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="mb-1 block text-sm text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof CurrencyDollar;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-paper-300 bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
        <Icon size={18} /> {title}
      </h2>
      {children}
    </section>
  );
}
