import Link from "next/link";
import { Container } from "@markala/ui";
import {
  Buildings, ShieldCheck, FileText, Receipt, Package, ChartLineUp,
  ArrowRight, Phone, EnvelopeSimple, CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurumsal Hesap — B2B Cari, Açık Fatura, %10-15 İndirim",
  description:
    "Markala kurumsal hesap: cari hesap, 30 gün açık fatura, ay sonu kapanış, %10-15 ek indirim, özelleştirilmiş katalog, dedicated müşteri temsilcisi.",
  alternates: { canonical: "/kurumsal" },
};

const benefits = [
  {
    icon: Receipt,
    title: "30 Gün Açık Fatura",
    desc: "Cari hesap onayı sonrası ay sonu toplu fatura, EFT/havale ile ödeme.",
  },
  {
    icon: ChartLineUp,
    title: "%10-15 Ek İndirim",
    desc: "Bireysel fiyatların üzerine yıllık ciroya göre kademeli iskonto.",
  },
  {
    icon: Package,
    title: "Öncelikli Üretim",
    desc: "Kurumsal siparişler kuyrukta öne alınır, acil işlerde 24 saatte bitirme.",
  },
  {
    icon: ShieldCheck,
    title: "Dedicated Temsilci",
    desc: "Tek noktadan iletişim, WhatsApp & telefon doğrudan hat.",
  },
];

const requirements = [
  "Vergi levhası (PDF veya görsel)",
  "İmza sirküleri (yetkili kişi)",
  "Vergi numarası ve vergi dairesi",
  "Şirket faturalama adresi",
];

export default function KurumsalPage() {
  return (
    <>
      <div className="bg-ink-900 text-paper-50">
        <Container className="py-12 md:py-20 max-w-3xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-500 grid place-items-center text-ink-900 mb-4">
            <Buildings size={28} weight="bold" />
          </div>
          <p className="text-sm text-brand-400 font-semibold uppercase tracking-wider">B2B Hesap</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold leading-tight">
            Kurumsal müşterilere özel avantajlar
          </h1>
          <p className="mt-4 text-lg text-paper-100/70 max-w-xl mx-auto">
            Cari hesap, açık fatura, ek indirim ve dedicated temsilci.
            Yıllık 50.000 ₺+ matbaa harcaması yapan firmalara açık.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/kurumsal/basvuru"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Başvuru Yap <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href="tel:+903244333351"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              <Phone size={14} /> 0324 433 33 51
            </a>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        {/* Avantajlar */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Avantajlar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="p-5 bg-paper-50 border border-paper-200 rounded-xl"
              >
                <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-3">
                  <b.icon size={22} />
                </div>
                <h3 className="font-semibold text-ink-900 text-sm">{b.title}</h3>
                <p className="text-xs text-ink-500 mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gereksinimler */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Başvuru için gerekenler</h2>
          <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
            {requirements.map((r) => (
              <div key={r} className="flex items-center gap-2 px-4 py-3 bg-paper-50 border border-paper-200 rounded-lg">
                <CheckCircle size={16} weight="fill" className="text-success shrink-0" />
                <span className="text-sm text-ink-900">{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Süreç */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-ink-900 mb-6">Süreç (3 adım)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "1", t: "Başvuru", d: "Form doldur, vergi levhası yükle. 5 dakika." },
              { n: "2", t: "Onay", d: "Mali ekibimiz 1-2 iş günü içinde değerlendirir." },
              { n: "3", t: "Aktivasyon", d: "Onay sonrası kurumsal hesap aktif, ek indirimler otomatik tanımlanır." },
            ].map((s) => (
              <div key={s.n} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-brand-500 text-ink-900 grid place-items-center font-bold mb-3">
                  {s.n}
                </div>
                <h3 className="font-semibold text-ink-900">{s.t}</h3>
                <p className="text-sm text-ink-500 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 p-8 md:p-12 bg-brand-100 border border-brand-200 rounded-2xl text-center">
          <FileText size={32} weight="fill" className="text-brand-700 mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-ink-900">
            Hemen başvuru yap, 1-2 iş gününde onaylan
          </h2>
          <p className="mt-3 text-ink-700 max-w-xl mx-auto">
            Bireysel hesabını kurumsal hesaba dönüştürmek de mümkün. Mevcut siparişlerin korunur.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/kurumsal/basvuru"
              className="px-6 py-3 bg-ink-900 text-paper-50 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Başvuru Formuna Git <ArrowRight size={14} weight="bold" />
            </Link>
            <a
              href="mailto:kurumsal@markala.com.tr"
              className="px-6 py-3 border border-ink-300 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <EnvelopeSimple size={14} /> kurumsal@markala.com.tr
            </a>
          </div>
        </section>
      </Container>
    </>
  );
}
