import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Kurumsal Baskı Çözümleri | Markala",
  description:
    "Şirketiniz için toplu baskı hizmetleri. Kartvizit, broşür, katalog, afiş ve daha fazlası. %10–30 toplu indirim, e-arşiv fatura, anlaşmalı kargo, 81 ile teslimat.",
  openGraph: {
    title: "Kurumsal Baskı Çözümleri | Markala",
    description:
      "Toplu baskı siparişlerinde %10–30 indirim, e-arşiv fatura ve öncelikli üretim. Markala kurumsal çözümleri için teklif alın.",
    url: "https://markala.com.tr/kurumsal",
    siteName: "Markala",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Kurumsal Baskı Çözümleri" }],
    type: "website",
    locale: "tr_TR",
  },
};

// ─── Veri ────────────────────────────────────────────────────────────────────

const WHATSAPP_URL = whatsappUrl("Merhaba, kurumsal baskı teklifi almak istiyorum.");

const advantages = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "%10–30 Toplu İndirim",
    desc: "500 adet ve üzeri siparişlerde otomatik kademeli indirim. Hacim arttıkça kazancınız büyür.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "E-Arşiv Fatura",
    desc: "Her siparişe yasal e-arşiv fatura. KDV'li veya KDV'siz. Muhasebe entegrasyonu tam uyumlu.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Anlaşmalı Kargo",
    desc: "Büyük siparişlerde kargo ücretini iade ediyoruz. Türkiye geneli 81 ile kapıdan kapıya.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Öncelikli Üretim",
    desc: "Kurumsal siparişler üretim kuyruğunda öncelik kazanır. Acil teslimat opsiyonu mevcuttur.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Özel Ambalaj",
    desc: "Logolu kutu, kurumsal hediye paketi ve özel ambalaj tasarımı. Markanızı yansıtın.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-7 h-7" aria-hidden>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Özel Hesap Yöneticisi",
    desc: "Büyük hacimli hesaplara ayrılmış iletişim hattı. Tek muhatap, hızlı çözüm.",
  },
] as const;

const services = [
  {
    emoji: "💼",
    name: "Kartvizit",
    desc: "500–10.000 adet",
    detail: "Tek/çift taraflı, selefon & parlak seçenek",
    href: "/urun/klasik-kartvizit",
  },
  {
    emoji: "📄",
    name: "Broşür",
    desc: "A4, A5, Üçlü Katlama",
    detail: "115 gr'dan 200 gr'a kağıt seçeneği",
    href: "/urun/brosur",
  },
  {
    emoji: "📚",
    name: "Katalog",
    desc: "Dikişli / Spiralli",
    detail: "Renk tutarlılığı garantili cilt seçenekleri",
    href: "/urunler",
  },
  {
    emoji: "🖼️",
    name: "Afiş & Poster",
    desc: "A1'den A0'a",
    detail: "Matt / parlak selefon, UV lak",
    href: "/urunler",
  },
  {
    emoji: "🏷️",
    name: "Etiket",
    desc: "Rulo / Tabaka",
    detail: "Özel kesim, şeffaf veya kraft",
    href: "/urunler",
  },
  {
    emoji: "📦",
    name: "Ambalaj",
    desc: "Kutulama / Wrap",
    detail: "Kurumsal hediye seti, logolu ambalaj",
    href: "/urunler",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Teklif İste",
    desc: "WhatsApp veya form aracılığıyla ürün, adet ve teslimat tarihinizi bildirin. 30 dakika içinde yanıt veriyoruz.",
    color: "from-[#4B3AA0] to-[#6B54C9]",
  },
  {
    n: "02",
    title: "Tasarım Gönder",
    desc: "Hazır tasarımınızı (PDF/AI/PSD) paylaşın. Yoksa ücretsiz şablon gönderebiliriz.",
    color: "from-[#322768] to-[#4B3AA0]",
  },
  {
    n: "03",
    title: "Teslim Al",
    desc: "Üretim tamamlanır, e-arşiv fatura ile birlikte 81 ile anlaşmalı kargo kapınıza gelir.",
    color: "from-[#241C54] to-[#322768]",
  },
] as const;

/** Gerçek veya temsili sektör referansları */
const references = [
  { initials: "AH", name: "Aras Holding", sector: "Holding & Yatırım", bg: "bg-[#1a1a2e]", text: "text-white" },
  { initials: "PR", name: "Prizma Reklam", sector: "Ajans & Medya", bg: "bg-[#4B3AA0]", text: "text-white" },
  { initials: "BM", name: "Bursa Medikal", sector: "Sağlık", bg: "bg-emerald-700", text: "text-white" },
  { initials: "NK", name: "Nova Kozmetik", sector: "Perakende", bg: "bg-pink-700", text: "text-white" },
  { initials: "TL", name: "Tekno Lojistik", sector: "Lojistik", bg: "bg-blue-700", text: "text-white" },
  { initials: "GD", name: "Güneş Dağıtım", sector: "Dağıtım & Tedarik", bg: "bg-orange-700", text: "text-white" },
] as const;

const faqs = [
  {
    q: "Minimum sipariş adeti nedir?",
    a: "Kurumsal fiyatlandırma için minimum 500 adet önerilir. Daha küçük adetler için standart fiyatlarımız geçerlidir, sitemizden sipariş verebilirsiniz.",
  },
  {
    q: "Fatura kesiyor musunuz?",
    a: "Evet. Her siparişe e-arşiv fatura kesilir. Şirket unvanı, vergi numarası ve adresinizi bildirmeniz yeterli; fatura otomatik olarak gönderilir.",
  },
  {
    q: "Hangi dosya formatlarını kabul ediyorsunuz?",
    a: "CMYK renk modunda baskıya hazır PDF tercih edilir. AI veya PSD dosyaları da kabul edilir. Tasarımınız yoksa brief'inizi göndermeniz yeterli; şablon hazırlıyoruz.",
  },
  {
    q: "Kargo süresi ne kadar?",
    a: "Üretim süresi ürüne göre 2–5 iş günüdür. Kargo 1–2 iş günü ek süre ekler. Acil siparişler için lütfen önce iletişime geçin.",
  },
  {
    q: "Yıllık anlaşma yapılabiliyor mu?",
    a: "Evet. Yıllık sipariş hacmine göre özel fiyatlandırma, öncelikli üretim sırası ve ayrılmış hesap yöneticisi anlaşmaları yapılabilir.",
  },
] as const;

// ─── Sayfa ───────────────────────────────────────────────────────────────────

export default function KurumsalPage() {
  return (
    <main className="bg-paper-50">
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#241C54] via-[#322768] to-[#4B3AA0] text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-300 bg-white/10 rounded-full px-4 py-1 mb-6">
            Kurumsal &amp; Toplu Sipariş
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
            Kurumsal Baskı<br className="hidden sm:block" /> Çözümleri
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-purple-100 leading-relaxed">
            Şirketinizin baskı ihtiyaçlarını tek çatı altında karşılıyoruz. Toplu indirim, e-arşiv fatura
            ve öncelikli üretimle kurumsal standartlarınıza uyum sağlıyoruz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold py-4 px-9 rounded-full text-base hover:bg-brand-400 transition-colors shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp&apos;tan Teklif Al
            </a>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold py-4 px-8 rounded-full text-base hover:bg-white/10 transition-colors"
            >
              Form ile İletişim
            </Link>
          </div>
          <p className="mt-6 text-purple-200 text-sm">Minimum 500 adet · 30 dk içinde yanıt · 81 ile teslimat</p>
        </div>
      </section>

      {/* ── 2. Avantajlar ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-3">Kurumsal Avantajlar</h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Markala kurumsal müşterileri için özel ayrıcalıklar
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advantages.map((a) => (
              <div
                key={a.title}
                className="group bg-white border border-paper-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-[#4B3AA0]/30 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-[#4B3AA0]/10 text-[#4B3AA0] flex items-center justify-center mb-4 group-hover:bg-[#4B3AA0] group-hover:text-white transition-colors">
                  {a.icon}
                </div>
                <h3 className="font-bold text-ink-900 text-lg mb-1">{a.title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Hizmetler Grid ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-paper-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-3">Baskı Hizmetlerimiz</h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Kurumsal siparişe uygun tüm baskı ürünleri tek çatı altında
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="group bg-white rounded-2xl p-5 text-center shadow-sm border border-paper-200 hover:border-[#4B3AA0]/40 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{s.emoji}</div>
                <h3 className="font-bold text-ink-900 text-sm mb-1">{s.name}</h3>
                <p className="text-ink-500 text-xs">{s.desc}</p>
                <p className="text-[#4B3AA0] text-xs mt-1 font-medium hidden group-hover:block leading-tight">{s.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Nasıl Çalışır ─────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-3">Nasıl Çalışır?</h2>
            <p className="text-ink-500 text-lg">Üç adımda kurumsal sipariş süreci</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-[#4B3AA0] via-[#322768] to-[#241C54]" aria-hidden />
            {steps.map((s) => (
              <div key={s.n} className="relative flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${s.color} text-white font-black text-2xl flex items-center justify-center mb-5 shadow-lg relative z-10`}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-ink-900 text-xl mb-2">{s.title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Minimum Sipariş Banner ─────────────────────────────────────── */}
      <section className="py-10 px-4 bg-gradient-to-r from-[#241C54] via-[#322768] to-[#4B3AA0] text-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold">Minimum Sipariş: 500 adet</p>
            <p className="text-purple-200 text-sm mt-0.5">
              500 adet ve üzeri siparişlerde kurumsal fiyatlandırma &amp; indirimler aktif olur.
            </p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-brand-500 text-ink-900 font-bold py-3 px-7 rounded-full hover:bg-brand-400 transition-colors text-sm whitespace-nowrap"
          >
            Hemen Teklif Al
          </a>
        </div>
      </section>

      {/* ── 6. Referanslar ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-paper-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-3">Güvenilir Ortaklarımız</h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Farklı sektörlerden şirketler Markala ile kurumsal baskı ihtiyaçlarını karşılıyor
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {references.map((r) => (
              <div
                key={r.name}
                className="flex flex-col items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-paper-200"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${r.bg} ${r.text} font-black text-xl flex items-center justify-center select-none`}
                  aria-label={r.name}
                >
                  {r.initials}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-ink-900 text-xs leading-tight">{r.name}</p>
                  <p className="text-ink-500 text-[10px] mt-0.5">{r.sector}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-ink-500 text-xs mt-8">
            * Temsili referanslar. Detaylı portföy için{" "}
            <Link href="/referanslar" className="text-[#4B3AA0] underline hover:no-underline">
              referanslar sayfamızı
            </Link>{" "}
            inceleyebilirsiniz.
          </p>
        </div>
      </section>

      {/* ── 7. SSS ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-3">Sık Sorulan Sorular</h2>
            <p className="text-ink-500 text-lg">Kurumsal müşterilerimizin en çok merak ettikleri</p>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group bg-white border border-paper-200 rounded-2xl overflow-hidden"
              >
                <summary className="font-semibold text-ink-900 cursor-pointer list-none flex items-center justify-between gap-4 p-6 hover:bg-paper-50 transition-colors">
                  <span>{f.q}</span>
                  <span
                    className="shrink-0 w-7 h-7 rounded-full border-2 border-[#4B3AA0] text-[#4B3AA0] flex items-center justify-center font-bold text-lg leading-none group-open:rotate-45 transition-transform"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 -mt-1">
                  <p className="text-ink-500 text-sm leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Son CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-paper-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
            Kurumsal Teklifinizi Alın
          </h2>
          <p className="text-ink-500 text-lg mb-10 leading-relaxed">
            Ürün, adet ve teslimat tarihinizi bildirin, size özel fiyat ve üretim planı 30 dakika içinde hazırlayalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold py-4 px-9 rounded-full text-base hover:bg-brand-400 transition-colors shadow-md"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp&apos;tan Teklif Al
            </a>
            <Link
              href="/teklif-al"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#4B3AA0] text-[#4B3AA0] font-bold py-4 px-8 rounded-full text-base hover:bg-[#4B3AA0]/5 transition-colors"
            >
              Online Form Doldur
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
