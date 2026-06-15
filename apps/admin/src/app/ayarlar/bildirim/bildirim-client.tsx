"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Bell, FloppyDisk, EnvelopeSimple, ChatCircle, DeviceMobile } from "@phosphor-icons/react";
import { saveSettings } from "../actions";

interface NotifRow {
  event: string;
  key: string;
  desc: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const DEFAULT_ROWS: NotifRow[] = [
  { event: "Yeni Sipariş Geldi", key: "yeni-siparis", desc: "Müşteri sipariş verir vermez", email: true, sms: true, push: true },
  { event: "Ödeme Tahsil Edildi", key: "odeme-tahsil", desc: "iyzico'dan başarılı ödeme", email: true, sms: false, push: true },
  { event: "Tasarım Onayı Bekliyor", key: "tasarim-onayi", desc: "Müşteri tasarımı yükledi, onay lazım", email: true, sms: false, push: true },
  { event: "Üretim Tamamlandı", key: "uretim-tamamlandi", desc: "Üretim ekibi 'tamam' dedi", email: false, sms: false, push: true },
  { event: "Kargoya Verildi", key: "kargoya-verildi", desc: "DHL etiket basıldı", email: true, sms: true, push: false },
  { event: "Müşteri Yorum Yaptı", key: "musteri-yorum", desc: "Onay bekleyen yorum", email: true, sms: false, push: false },
  { event: "Düşük Stok Uyarısı", key: "dusuk-stok", desc: "Bir ürünün üretim kapasitesi azalıyor", email: true, sms: false, push: true },
  { event: "Müşteri İptal Etti", key: "musteri-iptal", desc: "Sipariş iptal talebi", email: true, sms: true, push: true },
];

function parseBool(v: unknown, fallback: boolean): boolean {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return fallback;
}

interface Props {
  initial: Record<string, unknown>;
}

export function BildirimClient({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<NotifRow[]>(() =>
    DEFAULT_ROWS.map((r) => ({
      ...r,
      email: parseBool(initial[`notification.${r.key}.email`], r.email),
      sms: parseBool(initial[`notification.${r.key}.sms`], r.sms),
      push: parseBool(initial[`notification.${r.key}.push`], r.push),
    })),
  );

  const [emailRecipients, setEmailRecipients] = useState(
    String(initial["notification.emailRecipients"] ?? "hasansylemezz@gmail.com"),
  );
  const [smsRecipients, setSmsRecipients] = useState(
    String(initial["notification.smsRecipients"] ?? ""),
  );

  function toggle(key: string, channel: "email" | "sms" | "push") {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [channel]: !r[channel] } : r)));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const values: Record<string, unknown> = {
          "notification.emailRecipients": emailRecipients,
          "notification.smsRecipients": smsRecipients,
        };
        for (const r of rows) {
          values[`notification.${r.key}.email`] = r.email;
          values[`notification.${r.key}.sms`] = r.sms;
          values[`notification.${r.key}.push`] = r.push;
        }
        await saveSettings("notification", values, "/ayarlar/bildirim");
        toast.success("Bildirim tercihleri kaydedildi.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 flex items-center gap-2">
          <Bell size={26} weight="bold" className="text-brand-700" />
          Bildirim Tercihleri
        </h1>
        <p className="text-ink-500 text-sm mt-1">
          Hangi olaylarda hangi kanaldan bildirim almak istediğinizi ayarlayın
        </p>
      </header>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Olay</th>
                <th className="text-center px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1.5">
                    <EnvelopeSimple size={12} /> E-posta
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1.5">
                    <ChatCircle size={12} /> SMS
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1.5">
                    <DeviceMobile size={12} /> Push
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-paper-100/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-900">{r.event}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{r.desc}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={r.email} onChange={() => toggle(r.key, "email")} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={r.sms} onChange={() => toggle(r.key, "sms")} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={r.push} onChange={() => toggle(r.key, "push")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="p-5 bg-paper-50 border border-paper-200 rounded-lg">
          <h3 className="font-semibold text-ink-900 text-sm mb-2">E-posta Alıcıları</h3>
          <input
            type="email"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
          />
          <p className="text-[11px] text-ink-500 mt-2">Birden fazla alıcı için virgülle ayırın</p>
        </div>
        <div className="p-5 bg-paper-50 border border-paper-200 rounded-lg">
          <h3 className="font-semibold text-ink-900 text-sm mb-2">SMS Alıcıları</h3>
          <input
            type="tel"
            value={smsRecipients}
            onChange={(e) => setSmsRecipients(e.target.value)}
            placeholder="+90 532 000 00 00"
            className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
          />
          <p className="text-[11px] text-ink-500 mt-2">NetGSM ile gönderilir. Birden fazla için virgül.</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-5 py-2 rounded-md text-sm font-semibold hover:bg-ink-700 disabled:opacity-60"
        >
          <FloppyDisk size={14} weight="bold" />
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </AdminShell>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-none ${checked ? "bg-brand-500" : "bg-paper-200"}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-paper-50 shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
