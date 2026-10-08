import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowRight, CursorClick, PaintBrush, Truck, WhatsappLogo, ShieldCheck, PenNib, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getCategories } from "@/lib/catalog";
import { formatPriceDisplay } from "@/lib/format";
import { InisKategoriKutusu, type InisKutusu } from "./inis-kategori-kutusu";

// Katalog fetch'iyle aynı pencere (anasayfa gibi) — fiyat çıpaları bayatlamasın.
export const revalidate = 300;

/**
 * Instagram/Meta reklam iniş sayfası — "Ürününü seç" (2026-10-08).
 *
 * Neden ayrı sayfa: /kategoriler SEO hub'ı mobilde 27.000 px, 111 kart ve ürün sayısına göre
 * sıralı (en üstte İSG levhaları). Reklam "ürününü seç → tasarımını yaparız → kapına gelsin"
 * diyor; iniş de aynı 3 adımı, en çok sipariş alan 8 kategoriyi ve WhatsApp yolunu tek ekranda
 * vermeli. Sıra = son 90 günün ödenmiş sipariş sayısı (DB, 8 Eki 2026). Sayfa noindex:
 * reklam inişi, arama sonucu değil; hub'ın kanonik rolü değişmez.
 */
export const metadata: Metadata = {
  title: "Ürününü Seç — Tasarımını Biz Yapalım",
  description:
    "Kartvizit, branda, folyo, bayrak, broşür… Ürününü seç, tasarımını ücretsiz yapalım, 81 ile kargoyla kapına gelsin.",
  robots: { index: false, follow: true },
};

/** En çok sipariş alan kategoriler (90 gün) + reklam dilinde tek satır not. */
const KUTULAR: { slug: string; not: string }[] = [
  { slug: "vinil-branda-afis", not: "Dış mekân afiş, dükkân önü, etkinlik" },
  { slug: "kartvizit", not: "Klasik, kabartmalı, yaldızlı seçenekler" },
  { slug: "folyo", not: "Vitrin, cam, duvar ve araç uygulaması" },
  { slug: "yelken-bayrak", not: "Mağaza önü ve fuar için dikkat çekici" },
  { slug: "brosur", not: "El ilanı, katlamalı broşür, katalog" },
  { slug: "dekota-baski", not: "Tabela ve levha, iç-dış mekân" },
  { slug: "masa-bayragi", not: "Ofis, toplantı masası, protokol" },
  { slug: "magnet", not: "Buzdolabı ve araç magneti, promosyon" },
];

const ADIMLAR = [
  { icon: CursorClick, baslik: "Ürününü seç", aciklama: "Ebat ve adedi seç, fiyatı anında gör." },
  { icon: PaintBrush, baslik: "Tasarımını yaparız", aciklama: "Dosyan yoksa ekibimiz ücretsiz hazırlar, onayına sunar." },
  { icon: Truck, baslik: "Kapına gelir", aciklama: "Üretim sonrası 81 ile güvenli kargo." },
];

const WHATSAPP_NUMBER = "903244333351"; // sabit hat 0324 433 33 51 (floating-actions ile aynı)
const WHATSAPP_MESAJ = "Merhaba, Instagram'daki reklamınızı gördüm. Bir ürün hakkında bilgi almak istiyorum.";

export default async function UrununuSecPage() {
  const categories = await getCategories();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const kutular: InisKutusu[] = KUTULAR.flatMap(({ slug, not }) => {
    const c = bySlug.get(slug);
    if (!c) return []; // kategori pasifse kutu sessizce düşer, sayfa kırılmaz
    return [{
      slug: c.slug,
      name: c.name,
      imageUrl: c.imageUrl || null,
      fiyat: c.startingPrice && c.startingPrice > 0 ? formatPriceDisplay(c.startingPrice) : null,
      not,
    }];
  });

  return (
    <>
      {/* Hero — kısa: başlık + vaat + güven satırı. İlk kutular ilk ekranda görünsün diye alçak. */}
      <section className="bg-[#2E1A5E] text-white">
        <Container className="py-8 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Online matbaa · markala.com.tr</p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] md:text-5xl">
            Ürününü seç,<br />tasarımını biz yapalım.
          </h1>
          <p className="mt-3 max-w-md text-base text-white/80 md:text-lg">
            Dosyan olsun ya da olmasın: seç, onayla, kapına gelsin.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/90">
            <li className="inline-flex items-center gap-1.5"><PenNib size={16} weight="bold" className="text-brand-500" /> Ücretsiz tasarım desteği</li>
            <li className="inline-flex items-center gap-1.5"><MapPin size={16} weight="bold" className="text-brand-500" /> 81 ile kargo</li>
            <li className="inline-flex items-center gap-1.5"><ShieldCheck size={16} weight="bold" className="text-brand-500" /> 3D Secure ödeme</li>
          </ul>
        </Container>
      </section>

      {/* Kategori kutuları — mobilde 2 sütun, büyük dokunma alanı */}
      <section className="bg-paper-100">
        <Container className="py-6 md:py-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-ink-900 md:text-2xl">En çok sipariş edilenler</h2>
            <Link href="/kategoriler" className="text-sm font-medium text-brand-700 hover:underline">
              Tüm kategoriler
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {kutular.map((k, i) => (
              <InisKategoriKutusu key={k.slug} kutu={k} sira={i} />
            ))}
          </div>
        </Container>
      </section>

      {/* 3 adım — reklamdaki akışın birebir karşılığı */}
      <section className="bg-paper-50 border-y border-paper-200">
        <Container className="py-8 md:py-12">
          <h2 className="text-lg font-semibold text-ink-900 md:text-2xl">Nasıl çalışır?</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3 md:gap-6">
            {ADIMLAR.map((a, i) => (
              <li key={a.baslik} className="flex items-start gap-3 rounded-xl border border-paper-200 bg-paper-100 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E1A5E] text-brand-500">
                  <a.icon size={20} weight="bold" />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Adım {i + 1}</span>
                  <span className="block font-semibold text-ink-900">{a.baslik}</span>
                  <span className="mt-0.5 block text-sm text-ink-700">{a.aciklama}</span>
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* WhatsApp — "önce sorayım" diyen müşteri için ikinci yol */}
      <section className="bg-paper-100">
        <Container className="py-8 md:py-12">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#2E1A5E] p-5 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-lg font-semibold md:text-2xl">Hangi ürün olduğundan emin değil misin?</p>
              <p className="mt-1 text-sm text-white/80 md:text-base">
                Ne yaptırmak istediğini yaz, grafik tasarım ekibimiz doğru ürünü ve ölçüyü önersin.
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESAJ)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-95"
            >
              <WhatsappLogo size={22} weight="fill" /> WhatsApp&apos;tan yaz
            </a>
          </div>
          <p className="mt-6 text-center text-sm text-ink-500">
            Aradığın ürün burada yok mu?{" "}
            <Link href="/kategoriler" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              750+ ürünün tamamına bak <ArrowRight size={14} weight="bold" />
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
