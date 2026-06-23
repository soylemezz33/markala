"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Button } from "@markala/ui";
import { Sparkle, ShieldCheck, PaintBrush, Truck } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Giriş sonrası dönülecek hedef. Yalnız site-içi mutlak yol kabul edilir ("//host" veya
  // "http(s)://" gibi açık yönlendirme/oltalama yolları reddedilir). Yoksa /hesabim.
  function safeNext(): string {
    if (typeof window === "undefined") return "/hesabim";
    const n = new URLSearchParams(window.location.search).get("next");
    return n && n.startsWith("/") && !n.startsWith("//") ? n : "/hesabim";
  }
  // "next"i mount'ta state'e al (render sırasında window okumak hydration uyumsuzluğu yapar).
  const [nextParam, setNextParam] = useState<string | null>(null);
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    setNextParam(n && n.startsWith("/") && !n.startsWith("//") ? n : null);
  }, []);
  // Kayıt linki de "next"i taşısın — HOSGELDIN ile gelen yeni müşteri kayıt olup checkout'a dönsün.
  const kayitHref = nextParam ? `/kayit?next=${encodeURIComponent(nextParam)}` : "/kayit";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (res.ok) router.replace(safeNext());
    else setError(res.error ?? "Giriş başarısız.");
  }

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-12">
      {/* Sol: Form — üste hizalı + ölçülü boşluk (ikinci alan ilk ekranda görünsün, fold altında kalmasın) */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-start">
        <Container className="py-8 md:py-12 max-w-md mx-auto w-full">
          <div className="mb-6">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Hesap</p>
            <h1 className="mt-1.5 text-3xl md:text-4xl font-semibold text-ink-900">Giriş yapın</h1>
            <p className="mt-2 text-ink-700">
              Sipariş takibi, kayıtlı tasarımlar ve cari hesap için.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="E-posta">
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass} autoComplete="email"
                placeholder="ornek@firma.com"
              />
            </Field>
            <Field label="Şifre">
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass} autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">{error}</div>
            )}

            <Button type="submit" size="lg" fullWidth disabled={isLoading}>
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>

            <div className="text-center">
              <Link href="/sifre-sifirla" className="text-sm text-ink-500 hover:text-ink-900">
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-paper-200 text-center">
            <p className="text-sm text-ink-700">
              Hesabınız yok mu?{" "}
              <Link href={kayitHref} className="text-brand-700 hover:underline font-semibold">
                Hemen kayıt olun
              </Link>
            </p>

            <Link
              href="/kurumsal/basvuru"
              className="mt-4 flex flex-col items-center justify-center gap-0.5 rounded-lg border border-paper-200 bg-paper-50 px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-colors"
            >
              <span className="text-sm font-semibold text-ink-900">Kurumsal Başvuru</span>
              <span className="text-xs text-ink-500">Cari hesap &amp; kurumsal fiyatlandırma için başvurun</span>
            </Link>
          </div>
        </Container>
      </div>

      {/* Sağ: Marka tanıtım panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-ink-900 text-paper-50 relative overflow-hidden">
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #F5B800, transparent 70%)" }} />
        <div className="relative max-w-lg mx-auto px-12 py-24 flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkle size={12} weight="fill" /> Markala üyeliği
          </span>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Tek hesapla<br />tüm matbaa<br />ihtiyaçlarınız.
          </h2>
          <p className="mt-5 text-paper-100/70 leading-relaxed">
            Sipariş geçmişiniz, hızlı tekrar siparişler, kayıtlı adresler ve kurumsal cari hesap — hepsi tek panelde.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              { icon: PaintBrush, title: "Hızlı tekrar sipariş", desc: "Önceki konfigürasyonlarınız tek tıkla yeniden" },
              { icon: Truck, title: "Sipariş takibi", desc: "DHL kargo gerçek zamanlı durum" },
              { icon: ShieldCheck, title: "Güvenli ödeme", desc: "iyzico + 3D Secure altyapısı" },
            ].map((b) => (
              <li key={b.title} className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-md bg-brand-500/15 text-brand-400 grid place-items-center">
                  <b.icon size={20} />
                </div>
                <div>
                  <div className="font-semibold text-paper-50">{b.title}</div>
                  <div className="text-sm text-paper-100/60 mt-0.5">{b.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
