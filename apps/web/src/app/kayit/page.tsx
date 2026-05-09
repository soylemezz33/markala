"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Button } from "@markala/ui";
import { Sparkle, Gift, Lightning, Receipt } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Kullanım koşullarını kabul etmelisiniz.");
      return;
    }
    const res = await register({ email, password, fullName, phone });
    if (res.ok) router.replace("/hesabim");
    else setError(res.error ?? "Kayıt başarısız.");
  }

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-12">
      {/* Sol: Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center">
        <Container className="py-16 md:py-24 max-w-md mx-auto w-full">
          <div className="mb-8">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Yeni hesap</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900">Markala'ya katıl</h1>
            <p className="mt-3 text-ink-700">İlk siparişinde %10 indirim seni bekliyor.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Ad Soyad">
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Hasan Söylemez" />
            </Field>
            <Field label="E-posta">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" placeholder="ornek@firma.com" />
            </Field>
            <Field label="Telefon (opsiyonel)">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0532 123 45 67" />
            </Field>
            <Field label="Şifre">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} minLength={6} placeholder="En az 6 karakter" />
            </Field>

            <label className="flex items-start gap-2 text-sm text-ink-700 mt-3">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="rounded border-paper-200 mt-0.5" />
              <span>
                <Link href="/yasal/kullanim-kosullari" className="underline hover:text-ink-900">Kullanım Koşulları</Link>
                {" "}ve{" "}
                <Link href="/yasal/kvkk" className="underline hover:text-ink-900">KVKK Aydınlatma Metni</Link>
                'ni okudum, kabul ediyorum.
              </span>
            </label>

            {error && <div className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">{error}</div>}

            <Button type="submit" size="lg" fullWidth disabled={isLoading}>
              {isLoading ? "Hesap oluşturuluyor..." : "Hesabı Oluştur"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-paper-200 text-center">
            <p className="text-sm text-ink-700">
              Zaten hesabın var mı?{" "}
              <Link href="/giris" className="text-brand-700 hover:underline font-semibold">Giriş yapın</Link>
            </p>
          </div>
        </Container>
      </div>

      {/* Sağ: Marka tanıtım */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-ink-900 text-paper-50 relative overflow-hidden">
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #F5B800, transparent 70%)" }} />
        <div className="relative max-w-lg mx-auto px-12 py-24 flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Gift size={12} weight="fill" /> Hoş geldin avantajları
          </span>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            İlk siparişine<br /><span className="text-brand-400">%10 indirim.</span>
          </h2>
          <p className="mt-5 text-paper-100/70 leading-relaxed">
            Üye olduğunda otomatik tanımlanır — sepette <code className="font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">HOSGELDIN</code> kuponu ile birlikte kullanılabilir.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              { icon: Lightning, title: "Hızlı tekrar sipariş", desc: "Geçmiş siparişlerden tek tıkla yenile" },
              { icon: Receipt, title: "Sipariş geçmişi", desc: "Tüm faturalar ve takip kodları tek panelde" },
              { icon: Sparkle, title: "Kurumsal cari hesap", desc: "B2B müşterilerimize özel açık hesap ve fatura takibi" },
            ].map((b) => (
              <li key={b.title} className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-md bg-brand-500/15 text-brand-400 grid place-items-center"><b.icon size={20} /></div>
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
