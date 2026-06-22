"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Wrench, FloppyDisk, Info } from "@phosphor-icons/react";
import { saveSettings } from "../actions";

interface Props {
  initial: Record<string, unknown>;
}

export function BakimClient({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  const [enabled, setEnabled] = useState(initial["maintenance.enabled"] === true);
  const [title, setTitle] = useState(String(initial["maintenance.title"] ?? ""));
  const [message, setMessage] = useState(String(initial["maintenance.message"] ?? ""));

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettings(
          "maintenance",
          {
            "maintenance.enabled": enabled,
            "maintenance.title": title,
            "maintenance.message": message,
          },
          "/ayarlar/bakim",
        );
        toast.success(
          enabled ? "Bakım modu AÇIK olarak kaydedildi." : "Bakım modu kapatıldı.",
        );
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Bakım Modu</h1>
        <p className="text-ink-500 text-sm mt-1">
          Site ziyaretçilere kapatılır ve bakım ekranı gösterilir. Siz yönetici girişi yaparak
          siteyi normal gezebilirsiniz.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Durum" icon={Wrench}>
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="font-semibold text-ink-900 text-sm">Bakım modu</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {enabled ? "Site ziyaretçilere KAPALI" : "Site açık"}
                <span className="text-ink-400"> · Kaydet'e basınca geçerli olur</span>
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                enabled ? "bg-red-500" : "bg-paper-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <span
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              enabled
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${enabled ? "bg-red-500" : "bg-emerald-500"}`}
            />
            {enabled ? "Bakım açık" : "Yayında"}
          </span>
        </Card>

        <Card title="Bakım Ekranı Metni" icon={FloppyDisk}>
          <Field label="Başlık">
            <input
              className={cls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kısa bir aradayız"
            />
          </Field>
          <Field label="Mesaj">
            <textarea
              rows={4}
              className={cls}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Sitemizde kısa süreli bir bakım çalışması yapıyoruz. Çok yakında tekrar buradayız."
            />
            <span className="text-[11px] text-ink-500 mt-1 block">
              Boş bırakırsanız varsayılan metin gösterilir. İletişim bilgileri (telefon/WhatsApp/
              e-posta) Genel Ayarlar'dan otomatik gelir.
            </span>
          </Field>
        </Card>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-paper-200 bg-paper-100/40 p-4">
        <Info size={18} className="text-brand-700 mt-0.5 shrink-0" />
        <div className="text-sm text-ink-700">
          <p className="font-semibold text-ink-900 mb-1">Nasıl çalışır?</p>
          <p>
            Bakımı açtıktan sonra siteyi görebilmek için{" "}
            <span className="font-medium">markala.com.tr/giris</span> adresinden yönetici
            hesabınızla giriş yapın. Tarayıcınız siteyi normal gösterir; diğer ziyaretçiler bakım
            ekranını görür. Çıkış yapınca veya bakımı kapatınca site herkese normale döner.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
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

const cls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm focus:border-ink-900 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
        {label}
      </span>
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
  icon: typeof Wrench;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40 flex items-center gap-2">
        <Icon size={16} className="text-brand-700" />
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
