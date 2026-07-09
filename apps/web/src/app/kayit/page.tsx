"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container, Button } from "@markala/ui";
import { Sparkle, Gift, Lightning, Receipt, EnvelopeSimple, CheckCircle } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { PhoneInput } from "@/components/forms/phone-input";
import { TurnstileWidget, turnstileEnabled } from "@/components/turnstile-widget";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

/** TR telefon girişini (0532…, 532…, +90532…) API'nin beklediği E.164'e (+90XXXXXXXXXX) çevirir. Geçersizse undefined. */
function toE164TR(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  let national = digits;
  if (national.startsWith("90")) national = national.slice(2);
  else if (national.startsWith("0")) national = national.slice(1);
  return national.length === 10 && national.startsWith("5") ? `+90${national}` : undefined;
}

export default function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  // Katı doğrulama: kayıt sonrası oto-giriş YOK → "e-postanı doğrula" ekranı gösterilir.
  const [registered, setRegistered] = useState<{ email: string; emailSent: boolean } | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kayıt sonrası dönülecek site-içi hedef (HOSGELDIN ile gelip checkout'a dönen yeni müşteri).
  // Açık yönlendirme/oltalama yollarını ("//host", "http(s)://") reddet. Render'da window okuma
  // hydration uyumsuzluğu yapar → mount'ta state'e al.
  const [nextParam, setNextParam] = useState<string | null>(null);
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    setNextParam(n && n.startsWith("/") && !n.startsWith("//") ? n : null);
  }, []);
  const girisHref = nextParam ? `/giris?next=${encodeURIComponent(nextParam)}` : "/giris";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Kullanım koşullarını kabul etmelisiniz.");
      return;
    }
    if (!kvkkAccepted) {
      setError("KVKK aydınlatma metnini onaylamanız gerekiyor.");
      return;
    }
    // Telefon opsiyonel; girilmişse E.164'e normalize et (API +90… bekler).
    let normalizedPhone: string | undefined;
    if (phone.trim()) {
      normalizedPhone = toE164TR(phone);
      if (!normalizedPhone) {
        setError("Telefon numarası geçersiz. Örn: 0532 123 45 67");
        return;
      }
    }
    const res = await register({ email, password, fullName, phone: normalizedPhone, marketingConsent: marketingOptIn, turnstileToken: turnstileToken ?? undefined });
    if (res.ok) {
      // Oto-giriş yok — e-postayı doğrula ekranını göster.
      setRegistered({ email, emailSent: res.emailSent ?? true });
    } else setError(res.error ?? "Kayıt başarısız.");
  }

  // Kayıt tamam → "e-postanı doğrula" ekranı (oto-giriş yok, katı doğrulama).
  if (registered) {
    return (
      <Container className="py-16 md:py-24 max-w-md text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
          <CheckCircle size={36} weight="fill" />
        </div>
        <h1 className="mt-5 text-2xl md:text-3xl font-semibold text-ink-900">Hesabın oluşturuldu 🎉</h1>
        <p className="mt-3 text-ink-700">
          <strong>{registered.email}</strong> adresine bir doğrulama bağlantısı gönderdik. Giriş
          yapabilmen için maildeki bağlantıya tıklayıp e-postanı doğrula.
        </p>
        {!registered.emailSent && (
          <p className="mt-3 text-sm text-error">
            Mail şu an gönderilemedi olabilir. Birkaç dakika içinde gelmezse giriş ekranından yeniden
            iste ya da bizimle iletişime geç.
          </p>
        )}
        <div className="mt-4 p-3 bg-paper-100 rounded-lg text-sm text-ink-500 flex items-center justify-center gap-2">
          <EnvelopeSimple size={18} className="text-brand-700" /> Gelen kutunu (ve spam klasörünü) kontrol et.
        </div>
        <div className="mt-6">
          <Link href={girisHref}><Button size="lg">Giriş ekranına git</Button></Link>
        </div>
      </Container>
    );
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
              <input type="text" required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Hasan Söylemez" />
            </Field>
            <Field label="E-posta">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" placeholder="ornek@firma.com" />
            </Field>
            <PhoneInput value={phone} onChange={setPhone} label="Telefon (opsiyonel)" inputClassName={inputClass} placeholder="5XX XXX XX XX" />

            <Field label="Şifre">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} minLength={8} autoComplete="new-password" placeholder="En az 8 karakter — büyük, küçük harf ve rakam" />
            </Field>

            <label className="flex items-start gap-2 text-sm text-ink-700 mt-3">
              <input type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="rounded border-paper-200 mt-0.5" />
              <span>
                <Link href="/yasal/kullanim-kosullari" className="underline hover:text-ink-900">Kullanım Koşulları</Link>
                {"'nı okudum, kabul ediyorum."}
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-ink-700">
              <input type="checkbox" required checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)} className="mt-0.5" />
              <span>
                <Link href="/yasal/kvkk" className="underline hover:text-ink-900">KVKK aydınlatma metnini</Link> okudum,
                kişisel verilerimin işlenmesine onay veriyorum.
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-ink-700">
              <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5" />
              <span>
                Markala kampanya, indirim ve yeniliklerinden e-posta/SMS ile haberdar olmak istiyorum.{" "}
                <span className="text-ink-500">(Opsiyonel — istediğin zaman ayarlardan kapatabilirsin.)</span>
              </span>
            </label>

            {error && <div role="alert" className="p-3 bg-error/5 border border-error/20 rounded-md text-sm text-error">{error}</div>}

            {/* action="register" → api TurnstileService.verify beklediği action ile eşleşmeli. */}
            <TurnstileWidget action="register" onToken={setTurnstileToken} />
            <Button type="submit" size="lg" fullWidth disabled={isLoading || (turnstileEnabled && !turnstileToken)}>
              {isLoading ? "Hesap oluşturuluyor..." : "Hesabı Oluştur"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-paper-200 text-center">
            <p className="text-sm text-ink-700">
              Zaten hesabın var mı?{" "}
              <Link href={girisHref} className="text-brand-700 hover:underline font-semibold">Giriş yapın</Link>
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
