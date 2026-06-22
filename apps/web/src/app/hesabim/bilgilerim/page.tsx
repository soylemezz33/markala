"use client";

import { useState } from "react";
import { Button } from "@markala/ui";
import { CheckCircle, User as UserIcon, Receipt } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { PhoneInput } from "@/components/forms/phone-input";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  // Fatura (firma) bilgileri — opsiyonel. Doluysa checkout fatura adımı bundan otomatik dolar.
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [taxNumber, setTaxNumber] = useState(user?.taxNumber ?? "");
  const [taxOffice, setTaxOffice] = useState(user?.taxOffice ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await updateProfile({
      fullName,
      phone,
      companyName: companyName.trim(),
      taxNumber: taxNumber.trim(),
      taxOffice: taxOffice.trim(),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } else {
      setError(res.error ?? "Kaydedilemedi.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900">Profil Bilgilerim</h2>
        <p className="mt-1 text-sm text-ink-500">Hesap bilgilerinizi güncelleyin.</p>
      </header>

      <form onSubmit={handleSave} className="p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-6 border-b border-paper-200">
          <div className="w-16 h-16 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-2xl font-bold">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-ink-900">{user.fullName}</div>
            <div className="text-sm text-ink-500">{user.email}</div>
          </div>
        </div>

        <Field label="E-posta">
          <input value={user.email} readOnly disabled className={`${inputClass} bg-paper-100 cursor-not-allowed`} />
          <span className="text-xs text-ink-500 mt-1 block">E-posta değişikliği için iletişime geçin.</span>
        </Field>
        <Field label="Ad Soyad">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </Field>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          label="Telefon"
          inputClassName={inputClass}
        />

        {/* Fatura bilgileri — opsiyonel firma faturası kimliği. Doluysa ödeme adımı otomatik dolar. */}
        <div className="pt-5 border-t border-paper-200 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt size={18} weight="bold" className="text-brand-700" />
            <div>
              <h3 className="font-semibold text-ink-900">Fatura Bilgileri</h3>
              <p className="text-xs text-ink-500">
                Firma faturası için doldurun; ödeme adımında otomatik dolar. Boş bırakırsanız
                bireysel fatura kesilir.
              </p>
            </div>
          </div>
          <Field label="Firma Ünvanı">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Örn. Lisan Fen Eğitim Kurumları"
              className={inputClass}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Vergi No (VKN)">
              <input
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                maxLength={11}
                inputMode="numeric"
                placeholder="10-11 haneli"
                className={inputClass}
              />
            </Field>
            <Field label="Vergi Dairesi">
              <input
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                placeholder="Örn. Mersin"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3">
          <Button type="submit" disabled={saving}><UserIcon size={16} weight="bold" /> {saving ? "Kaydediliyor…" : "Kaydet"}</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle size={16} weight="fill" /> Kaydedildi
            </span>
          )}
          {error && <span className="text-sm text-error font-medium">{error}</span>}
        </div>
      </form>

      {/* Hesap bilgisi banner */}
      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-sm text-ink-700">
        <strong className="text-ink-900">Hesap türü:</strong> {user.accountType === "individual" ? "Bireysel" : "Kurumsal"}
        {" · "}
        <strong className="text-ink-900">Üye id:</strong> <code className="font-mono text-xs">{user.id}</code>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
