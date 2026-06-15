import Link from "next/link";
import { Container } from "@markala/ui";
import {
  Question, FileText, Truck, CreditCard, Package, ArrowsClockwise, ArrowRight,
  PaintBrush, Receipt, Question as QMark, ShieldCheck, ChatCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yardım Merkezi — Sıkça Sorulanlar, Dosya Hazırlama, Kargo, İade",
  description:
    "Markala yardım merkezi: dosya hazırlama rehberi, sipariş süreci, kargo ve teslimat, iade-değişim, ödeme ve fatura, tasarım desteği, kurumsal hesap.",
  alternates: { canonical: "/yardim" },
  openGraph: {
    type: "website",
    title: "Markala Yardım Merkezi",
    description: "Dosya hazırlama, kargo, iade ve daha fazlası — tüm sorularınızın cevabı.",
    url: "/yardim",
    images: [{ url: "/api/mockup?theme=brand&w=1200&h=630", width: 1200, height: 630, alt: "Markala Yardım Merkezi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala Yardım Merkezi",
    description: "Dosya hazırlama, kargo, iade ve daha fazlası — tüm sorularınızın cevabı.",
    images: ["/api/mockup?theme=brand&w=1200&h=630"],
  },
};

const topics = [
  { href: "/yardim/sss", title: "Sıkça Sorulanlar", desc: "En çok sorulan 30+ soru ve cevabı", icon: QMark },
  { href: "/yardim/dosya-hazirlama", title: "Dosya Hazırlama Rehberi", desc: "CMYK, çözünürlük, taşma payı, format", icon: FileText },
  { href: "/yardim/siparis", title: "Sipariş Süreci", desc: "Konfigüratörden teslimata kadar", icon: Package },
  { href: "/yardim/kargo", title: "Kargo & Teslimat", desc: "DHL, süreler, ücretler, takip", icon: Truck },
  { href: "/yardim/iade", title: "İade & Değişim", desc: "Üretim hatası, hasar, iptal", icon: ArrowsClockwise },
  { href: "/yardim/odeme", title: "Ödeme & Fatura", desc: "iyzico, taksit, e-Arşiv, kurumsal", icon: CreditCard },
  { href: "/yardim/tasarim-destegi", title: "Tasarım Desteği", desc: "Ücretsiz tasarım nasıl çalışır", icon: PaintBrush },
  { href: "/yardim/kurumsal", title: "Kurumsal Hesap", desc: "B2B cari hesap, açık fatura, indirim", icon: ShieldCheck },
];

const popularFaqs = [
  { q: "Tasarım dosyamı hangi formatta göndermeliyim?", href: "/yardim/dosya-hazirlama" },
  { q: "Kaç günde elime ulaşır?", href: "/yardim/kargo" },
  { q: "Selefon ile UV lak farkı nedir?", href: "/yardim/sss#selefon-uv" },
  { q: "Üretim toleransı nedir? %1-5 fire ne demek?", href: "/yasal/iade" },
  { q: "Kurumsal cari hesap nasıl açılır?", href: "/yardim/kurumsal" },
  { q: "Siparişimi nasıl iptal ederim?", href: "/yardim/iade" },
];

export default function YardimPage() {
  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 grid place-items-center text-brand-700 mb-4">
            <Question size={28} weight="bold" />
          </div>
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Yardım Merkezi</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Aradığınızı bulmanıza yardım edelim
          </h1>
          <p className="mt-4 text-lg text-ink-700 max-w-xl mx-auto">
            Sipariş süreci, dosya hazırlama, kargo ve teslimat, iade — her konuda detaylı rehberler.
          </p>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {/* Konu kartları */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Konular</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-3">
                  <t.icon size={22} />
                </div>
                <h3 className="font-semibold text-ink-900 text-sm">{t.title}</h3>
                <p className="text-xs text-ink-500 mt-1">{t.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:gap-2 transition-all">
                  Aç <ArrowRight size={10} weight="bold" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popüler sorular */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Popüler Sorular</h2>
          <div className="bg-paper-50 border border-paper-200 rounded-xl divide-y divide-paper-200">
            {popularFaqs.map((f) => (
              <Link
                key={f.q}
                href={f.href}
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-paper-100 group transition-colors"
              >
                <span className="text-sm text-ink-900 font-medium">{f.q}</span>
                <ArrowRight size={14} className="text-ink-500 group-hover:text-brand-700 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* İletişim CTA */}
        <section className="mt-16 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <ChatCircle size={32} weight="fill" className="text-brand-400 mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
            Cevabınızı bulamadınız mı?
          </h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Müşteri hizmetleri ekibimiz WhatsApp, telefon ve e-posta ile 09:00-18:00 arası destek veriyor.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/iletisim" className="px-5 py-2.5 bg-brand-500 text-ink-900 rounded-lg text-sm font-semibold">
              İletişim Formu
            </Link>
            <a href="https://wa.me/903244333351" className="px-5 py-2.5 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5">
              WhatsApp
            </a>
          </div>
        </section>
      </Container>
    </>
  );
}
