"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Eye, EyeSlash, Spinner } from "@phosphor-icons/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Girişi · Markala";
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız.");
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-500 grid place-items-center text-ink-900 mb-3">
            <ShieldCheck size={24} weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold text-paper-50">
            Markala<span className="text-brand-400">.</span>
            <span className="ml-1 text-sm font-normal text-paper-100/60">admin</span>
          </h1>
          <p className="mt-1 text-sm text-paper-100/60">Yönetim paneline giriş</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-paper-50 rounded-2xl p-6 md:p-8 space-y-4 shadow-2xl"
        >
          {error && (
            <div className="px-3 py-2 rounded-md bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">E-posta</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper-100 border border-paper-200 rounded-md text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-paper-50"
              placeholder="hasansylemezz@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Şifre</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 bg-paper-100 border border-paper-200 rounded-md text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-paper-50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-500 hover:text-ink-900"
                aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner size={16} className="animate-spin" /> Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>

          <div className="pt-3 border-t border-paper-200 text-[11px] text-ink-500 leading-relaxed">
            <strong className="text-ink-700">Giriş:</strong> Yönetim hesabınızın e-posta ve şifresiyle giriş yapın.
            Hesap, API kullanıcı veritabanında <code className="px-1 py-0.5 rounded bg-paper-100">admin</code> veya{" "}
            <code className="px-1 py-0.5 rounded bg-paper-100">super_admin</code> rolünde olmalıdır.
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-paper-100/40">
          324 Ajans · Markala Admin v0.9
        </p>
      </div>
    </div>
  );
}
