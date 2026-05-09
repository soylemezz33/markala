import Link from "next/link";
import { Container, Button } from "@markala/ui";
import {
  CheckCircle, Lightning, ShieldCheck, Truck, PaintBrush, Sparkle, ArrowRight, Buildings, Handshake, Megaphone,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda — 324 Ajans Çatısı Altında Matbaa & Reklam",
  description:
    "Markala, 324 Ajans çatısı altında matbaa ve reklam ürünlerinde 10+ yıllık tecrübeyi e-ticaret modeline taşıyan butik markadır. Mersin merkezli, Türkiye geneli teslimat.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    title: "Markala Hakkında — 324 Ajans Çatısı",
    description:
      "324 Ajans çatısı altında matbaa ve reklam ürünleri e-ticareti. 10+ yıl tecrübe, ücretsiz tasarım, Türkiye geneli kargo.",
    url: "/hakkimizda",
    type: "website",
  },
};

const values = [
  { icon: Lightning, title: "Hızlı Üretim", desc: "Çoğu üründe 24-72 saat içinde teslim. Acil işler için özel hat." },
  { icon: PaintBrush, title: "Ücretsiz Tasarım", desc: "Profesyonel grafik ekibimizle çalışın — sınırsız revize." },
  { icon: ShieldCheck, title: "Kalite Garantisi", desc: "Hatalı baskıda ücretsiz değişim — kalitemizin arkasındayız." },
  { icon: Truck, title: "81 İl Teslimat", desc: "DHL anlaşması — Türkiye'nin her noktasına 1-3 iş günü." },
];

const stats = [
  { value: "10+", label: "Yıllık ajans tecrübesi" },
  { value: "20+", label: "Ürün kategorisi" },
  { value: "Aynı gün", label: "Üretim sonrası kargo" },
  { value: "0 ₺", label: "Tasarım ücreti" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-16 md:py-24 max-w-4xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Biz kimiz</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-semibold text-ink-900 leading-[1.05]">
            Markanıza dokunan{" "}
            <span className="marker">her detay</span> önemli.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ink-700 leading-relaxed">
            Markala, 324 Ajans çatısı altında — matbaa ve reklam ürünleri alanında 10+ yıllık ajans tecrübesini Türkiye geneli e-ticaret modeline taşıyan butik bir marka.
          </p>
        </Container>
      </div>

      {/* Stats bar */}
      <div className="bg-ink-900 text-paper-50">
        <Container className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-semibold text-brand-400 tabular-nums">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-paper-100/60">{s.label}</div>
            </div>
          ))}
        </Container>
      </div>

      {/* Hikaye */}
      <Container className="py-16 md:py-24 max-w-4xl">
        <section className="space-y-6 text-lg text-ink-700 leading-relaxed">
          <h2 className="text-3xl md:text-4xl font-semibold text-ink-900">Neden kurduk?</h2>

          <p>
            Klasik matbaa süreçlerindeki <strong className="text-ink-900">"git-getir, dosya gönder, taslak bekle, revize iste"</strong> döngüsünü tamamen ortadan kaldırmak için kuruldu.
          </p>

          <p>
            Online konfigüratörümüzle siparişinizi 60 saniyede oluşturun, profesyonel grafik ekibimizden ücretsiz tasarım desteği alın, 24-72 saat içinde kapınızda olsun.
          </p>

          <p>
            Sadece kartvizit basmıyoruz — sizin için ürettiğimiz her şey markanızın sokağa çıkan yüzü. O yüzden 350 gr mat kuşeden vinil branda afişe, sublime baskılı kupadan lazer kazımalı plakete kadar her ürünü kendi atölyemizde ya da denetlediğimiz çözüm ortaklarımızda üretiyoruz.
          </p>
        </section>

        {/* 324 Ajans Çatısı */}
        <section className="mt-20 p-8 md:p-10 bg-paper-100 border border-paper-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-none w-14 h-14 rounded-xl bg-ink-900 text-brand-400 grid place-items-center">
              <Buildings size={26} weight="fill" />
            </div>
            <div>
              <p className="text-xs text-brand-700 font-semibold uppercase tracking-wider">Çatı Markamız</p>
              <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-ink-900">324 Ajans</h2>
              <p className="mt-3 text-ink-700 leading-relaxed">
                Markala, <strong className="text-ink-900">324 Ajans</strong> çatısı altında faaliyet gösterir.
                324 Ajans, Mersin merkezli; reklam, matbaa, dijital pazarlama, kurumsal kimlik ve
                marka danışmanlığı alanlarında 10+ yıl boyunca yerel ve ulusal markalara hizmet vermiş bir
                ortak operasyondur. Markala, 324 Ajans'ın matbaa ve reklam ürünleri uzmanlığını
                <em> e-ticaret modeli ile herkesin erişimine açan</em> butik kanalıdır.
              </p>
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
                  <Handshake size={20} className="text-brand-700" />
                  <div className="mt-2 font-semibold text-ink-900 text-sm">Aynı çözüm ortakları</div>
                  <p className="mt-1 text-xs text-ink-500 leading-relaxed">
                    Ajans projelerinde kullanılan üretim hatları ve denetim disiplini Markala siparişlerinizde de aynen geçerli.
                  </p>
                </div>
                <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
                  <Megaphone size={20} className="text-brand-700" />
                  <div className="mt-2 font-semibold text-ink-900 text-sm">Kurumsal kimlik desteği</div>
                  <p className="mt-1 text-xs text-ink-500 leading-relaxed">
                    Sıfırdan logo, kurumsal kimlik, web tasarım gibi ihtiyaçlarda 324 Ajans ekibine yönlendiriyoruz.
                  </p>
                </div>
                <div className="p-4 bg-paper-50 border border-paper-200 rounded-lg">
                  <ShieldCheck size={20} className="text-brand-700" />
                  <div className="mt-2 font-semibold text-ink-900 text-sm">10+ yıl güven</div>
                  <p className="mt-1 text-xs text-ink-500 leading-relaxed">
                    Yerel esnaftan ulusal markalara kadar yüzlerce müşteriye hizmet ederek edinilen tecrübe.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-ink-500">
                <CheckCircle size={14} className="inline mr-1 text-success" weight="fill" />
                Resmi yazışma, kurumsal tanıtım ve marka danışmanlığı için <a href="https://324ajans.com" target="_blank" rel="noreferrer" className="text-brand-700 underline font-medium">324ajans.com</a>'a göz atabilirsiniz.
              </p>
            </div>
          </div>
        </section>

        {/* Değerler */}
        <section className="mt-20">
          <header className="mb-10">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Değerlerimiz</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900">
              Neden Markala?
            </h2>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <article key={v.title} className="p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-4">
                  <v.icon size={22} />
                </div>
                <h3 className="font-semibold text-ink-900 text-lg">{v.title}</h3>
                <p className="mt-2 text-ink-700 text-sm leading-relaxed">{v.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Hikaye sonu */}
        <section className="mt-20 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Sparkle size={32} weight="fill" className="text-brand-400 mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
            Markanızı sokağa çıkaralım.
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            İlk siparişinize <strong className="text-brand-400">%10 indirim</strong> hediyemiz. Kupon kodu: <code className="font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">HOSGELDIN</code>
          </p>
          <Link href="/urunler" className="inline-block mt-6">
            <Button size="lg">Ürünleri Keşfet <ArrowRight size={16} weight="bold" /></Button>
          </Link>
        </section>
      </Container>
    </>
  );
}
