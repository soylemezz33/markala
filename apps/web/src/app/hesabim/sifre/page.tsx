"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@markala/ui";
import { Lock, Eye, EyeSlash, CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";

export default function PasswordChangePage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend complexity ile aynı: büyük + küçük + rakam, min 8.
  const isStrong = next.length >= 8 && /[a-z]/.test(next) && /[A-Z]/.test(next) && /[0-9]/.test(next);
  const matches = next === confirm && next.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current) return setError("Mevcut şifrenizi girin");
    if (!isStrong) return setError("Yeni şifre en az 8 karakter; büyük, küçük harf ve rakam içermeli");
    if (!matches) return setError("Yeni şifre eşleşmiyor");
    setLoading(true);
    try {
      await withRefresh(() => apiClient.auth.changePassword({ currentPassword: current, newPassword: next }));
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
      // Backend güvenlik için TÜM oturumları (refresh token) iptal etti → yeni şifreyle tekrar giriş.
      setTimeout(async () => {
        await logout();
        router.replace("/giris?sifre-degisti=1");
      }, 1600);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Şifre değiştirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Lock size={24} weight="bold" className="text-brand-700" />
          Şifre Değiştir
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Hesap güvenliğiniz için 90 günde bir şifrenizi yenilemenizi öneririz.
        </p>
      </header>

      <form onSubmit={onSubmit} className="p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-5">
        <Field label="Mevcut Şifre">
          <PasswordInput value={current} onChange={setCurrent} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
        </Field>
        <Field label="Yeni Şifre">
          <PasswordInput value={next} onChange={setNext} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
          <PasswordStrengthMeter pwd={next} isStrong={isStrong} />
        </Field>
        <Field label="Yeni Şifre (tekrar)">
          <PasswordInput value={confirm} onChange={setConfirm} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
          {confirm.length > 0 && (
            <span className={`text-xs mt-1.5 inline-flex items-center gap-1 ${matches ? "text-success" : "text-error"}`}>
              {matches ? <CheckCircle size={12} weight="fill" /> : "✗"}
              {matches ? "Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
            </span>
          )}
        </Field>

        {error && <div className="p-3 bg-error/10 border border-error/20 rounded-md text-sm text-error">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading || !matches || !isStrong}>
            <Lock size={14} weight="bold" /> {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle size={16} weight="fill" /> Şifreniz güncellendi — yeni şifreyle giriş yapın
            </span>
          )}
        </div>
      </form>

      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-sm">
        <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-success" />
          Güvenlik İpuçları
        </h3>
        <ul className="text-ink-700 space-y-1 text-xs leading-relaxed list-disc list-inside">
          <li>Şifreniz en az 8 karakter, büyük harf ve rakam içermeli</li>
          <li>Doğum tarihi, telefon numarası gibi tahmin edilebilir bilgileri kullanmayın</li>
          <li>Aynı şifreyi birden fazla sitede kullanmayın</li>
          <li>2FA (iki faktörlü doğrulama) yakında eklenecek — tercihen şifre yönetici uygulaması kullanın</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-2">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  value, onChange, show, onToggle,
}: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 pr-12 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-500 hover:text-ink-900"
        aria-label="Göster/Gizle"
      >
        {show ? <EyeSlash size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function PasswordStrengthMeter({ pwd, isStrong }: { pwd: string; isStrong: boolean }) {
  if (pwd.length === 0) return null;
  const score = (pwd.length >= 8 ? 1 : 0) + (/[A-Z]/.test(pwd) ? 1 : 0) + (/[0-9]/.test(pwd) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pwd) ? 1 : 0);
  const labels = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
  const colors = ["bg-error", "bg-error", "bg-warning", "bg-success", "bg-success"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score]! : "bg-paper-200"}`}
          />
        ))}
      </div>
      <span className={`text-[11px] mt-1 inline-block ${isStrong ? "text-success" : "text-ink-500"}`}>
        {labels[score] ?? "Zayıf"}
      </span>
    </div>
  );
}
