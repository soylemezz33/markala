"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Button } from "@markala/ui";
import { CheckCircle, Lock, EnvelopeSimple } from "@phosphor-icons/react";
import { apiClient } from "@/lib/api";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function PasswordResetPage() {
  return (
    <Container className="py-16 md:py-24 max-w-md">
      <Suspense fallback={<div className="text-center text-ink-400 text-sm">Yükleniyor…</div>}>
        <ResetFlow />
      </Suspense>
    </Container>
  );
}

function ResetFlow() {
  const params = useSearchParams();
  const token = params.get("token");
  return token ? <ResetForm token={token} /> : <RequestForm />;
}

/** Token YOK → e-posta ile sıfırlama bağlantısı talep et. */
function RequestForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Geçerli bir e-posta girin.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await apiClient.auth.forgotPassword(email.trim().toLowerCase());
      setSent(true); // backend daima ok döner (enumeration koruması)
    } catch {
      setSent(true); // ağ hatasında bile aynı mesaj — bilgi sızdırma
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/10 text-success grid place-items-center">
          <CheckCircle size={28} weight="fill" />
        </div>
        <h1 className="mt-5 text-2xl font-serif text-ink-900">Bağlantı gönderildi</h1>
        <p className="mt-3 text-sm text-ink-700 leading-relaxed">
          Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama bağlantısını <strong>{email}</strong> adresine
          gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et. Bağlantı 1 saat geçerlidir.
        </p>
        <Link href="/giris" className="mt-6 inline-block text-sm text-brand-700 font-medium hover:underline">
          ← Giriş ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-700 grid place-items-center">
          <EnvelopeSimple size={24} weight="bold" />
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-serif text-ink-900">Şifreni mi unuttun?</h1>
        <p className="mt-2 text-sm text-ink-700">
          Hesabının e-posta adresini gir; sana sıfırlama bağlantısı gönderelim.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-900">E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="ornek@firma.com"
            className={`mt-1.5 ${inputClass}`}
            autoComplete="email"
          />
        </label>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" fullWidth size="lg" disabled={sending}>
          {sending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Şifreni hatırladın mı?{" "}
        <Link href="/giris" className="text-brand-700 font-medium hover:underline">Giriş yap</Link>
      </p>
    </div>
  );
}

/** Token VAR → yeni şifre belirle. */
function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError("Şifre en az 8 karakter olmalı; büyük harf, küçük harf ve rakam içermeli.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.auth.resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => router.replace("/giris?reset=1"), 2500);
    } catch (err) {
      setError(
        (err as { message?: string })?.message ??
          "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden talep edin.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/10 text-success grid place-items-center">
          <CheckCircle size={28} weight="fill" />
        </div>
        <h1 className="mt-5 text-2xl font-serif text-ink-900">Şifren güncellendi</h1>
        <p className="mt-3 text-sm text-ink-700">
          Yeni şifrenle giriş yapabilirsin. Giriş ekranına yönlendiriliyorsun…
        </p>
        <Link href="/giris" className="mt-6 inline-block text-sm text-brand-700 font-medium hover:underline">
          Giriş yap →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-700 grid place-items-center">
          <Lock size={24} weight="bold" />
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-serif text-ink-900">Yeni şifre belirle</h1>
        <p className="mt-2 text-sm text-ink-700">Hesabın için güçlü bir şifre seç.</p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-900">Yeni şifre</span>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className={`mt-1.5 ${inputClass}`}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-900">Yeni şifre (tekrar)</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            className={`mt-1.5 ${inputClass}`}
            autoComplete="new-password"
          />
        </label>
        <p className="text-xs text-ink-500">En az 8 karakter · büyük harf · küçük harf · rakam</p>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" fullWidth size="lg" disabled={saving}>
          {saving ? "Kaydediliyor…" : "Şifreyi güncelle"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/giris" className="text-brand-700 font-medium hover:underline">Giriş ekranına dön</Link>
      </p>
    </div>
  );
}
