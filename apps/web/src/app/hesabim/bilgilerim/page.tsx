"use client";

import { useState } from "react";
import { Button } from "@markala/ui";
import { CheckCircle, User as UserIcon } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ fullName, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
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
        <Field label="Telefon">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0532 ..." />
        </Field>

        <div className="flex items-center gap-3 pt-3">
          <Button type="submit"><UserIcon size={16} weight="bold" /> Kaydet</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle size={16} weight="fill" /> Kaydedildi
            </span>
          )}
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
