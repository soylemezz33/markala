"use client";

import { useState } from "react";
import { Button } from "@markala/ui";
import { Bell, EnvelopeSimple, ChatCircle, CheckCircle, FloppyDisk } from "@phosphor-icons/react";

interface Pref {
  id: string;
  label: string;
  desc: string;
  email: boolean;
  sms: boolean;
}

const initialPrefs: Pref[] = [
  { id: "order_status", label: "Sipariş durumu güncellemeleri", desc: "Üretim, kalite kontrol, kargo, teslim aşamaları", email: true, sms: true },
  { id: "order_design", label: "Tasarım onay bildirimleri", desc: "Tasarım taslağı hazır olduğunda", email: true, sms: false },
  { id: "delivery", label: "Teslimat günü bildirimi", desc: "DHL kurye yola çıktığında SMS", email: false, sms: true },
  { id: "campaigns", label: "Kampanya ve indirimler", desc: "Aylık kampanyalar, sezonluk fırsatlar", email: true, sms: false },
  { id: "newsletter", label: "Bülten — sektör haberleri & rehberler", desc: "Aylık matbaa rehberi, blog yazıları", email: false, sms: false },
  { id: "review_reminder", label: "Yorum hatırlatması", desc: "Teslim sonrası 7 gün içinde yorum daveti", email: true, sms: false },
];

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);

  function toggle(id: string, ch: "email" | "sms") {
    setPrefs((p) => p.map((x) => (x.id === id ? { ...x, [ch]: !x[ch] } : x)));
  }

  function unsubscribeAll() {
    setPrefs((p) => p.map((x) => ({ ...x, email: false, sms: false })));
  }

  function onSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Bell size={24} weight="bold" className="text-brand-700" />
          Bildirim Tercihleri
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Markala size hangi olaylarda hangi kanaldan bildirim göndersin? İstediğiniz zaman değiştirebilirsiniz.
        </p>
      </header>

      <div className="bg-paper-50 border border-paper-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-paper-200 bg-paper-100/40 grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
          <div className="col-span-7 md:col-span-8">Konu</div>
          <div className="col-span-2 md:col-span-2 text-center inline-flex items-center justify-center gap-1">
            <EnvelopeSimple size={12} /> E-posta
          </div>
          <div className="col-span-3 md:col-span-2 text-center inline-flex items-center justify-center gap-1">
            <ChatCircle size={12} /> SMS
          </div>
        </div>
        <div className="divide-y divide-paper-200">
          {prefs.map((p) => (
            <div key={p.id} className="px-5 py-4 grid grid-cols-12 gap-3 items-center hover:bg-paper-100/40">
              <div className="col-span-7 md:col-span-8">
                <div className="font-semibold text-ink-900 text-sm">{p.label}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{p.desc}</div>
              </div>
              <div className="col-span-2 md:col-span-2 text-center">
                <Toggle checked={p.email} onChange={() => toggle(p.id, "email")} />
              </div>
              <div className="col-span-3 md:col-span-2 text-center">
                <Toggle checked={p.sms} onChange={() => toggle(p.id, "sms")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={unsubscribeAll}
          className="text-sm text-error hover:underline font-medium"
        >
          Tüm bildirimleri kapat
        </button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle size={16} weight="fill" /> Tercihleriniz kaydedildi
            </span>
          )}
          <Button onClick={onSave}>
            <FloppyDisk size={14} weight="bold" /> Kaydet
          </Button>
        </div>
      </div>

      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-xs text-ink-700 leading-relaxed">
        <strong className="text-ink-900 block mb-1">Yasal Bilgi:</strong>
        Sipariş durumu ve teslimat bildirimleri sözleşme gereği zorunludur ve kapatılsa dahi
        kritik durumlarda gönderilebilir. Pazarlama amaçlı bildirimler (kampanya, bülten)
        tamamen isteğe bağlıdır ve KVKK kapsamında 6698 sayılı kanun çerçevesinde işlenir.
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors mx-auto ${checked ? "bg-brand-500" : "bg-paper-200"}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-paper-50 shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
