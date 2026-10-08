import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { CursorClick, PaintBrush, Truck, WhatsappLogo, ShieldCheck, PenNib, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getCategories } from "@/lib/catalog";
import { formatPriceDisplay } from "@/lib/format";
import { KategoriGruplari } from "@/components/kategori-gruplari";
import { InisKategoriKutusu, type InisKutusu } from "./inis-kategori-kutusu";
import { AramaKutusu } from "./arama-kutusu";

// Katalog fetch'iyle aynı pencere (anasayfa gibi) — fiyat çıpaları bayatlamasın.
export const revalidate = 300;

/**
 * Instagram/Meta reklam iniş sayfası — "Ürününü seç" (2026-10-08).
 *
 * Neden ayrı sayfa: /kategoriler SEO hub'ı reklam inişi için fazla uzundu ve ürün sayısına
 * göre sıralıydı. Reklam "ürününü seç → tasarımını yaparız → kapına gelsin" diyor; iniş de
 * aynı 3 adımı, en çok sipariş alan 8 kategoriyi ve WhatsApp yolunu veriyor.
 *
 * Hasan geri bildirimi (8 Eki): müşteri 8 kutuda aradığını bulamazsa sayfadan ÇIKMASIN —
 * arama kutusu + gruplu tam kategori listesi (akordeon) aynı sayfada. Kupon şeridi bu rotada
 * gizli (layout > RotaGizle). Sayfa noindex: reklam inişi, arama sonucu değil.
 *
 * Kutu sırası = son 90 günün ödenmiş sipariş sayısı (DB, 8 Eki 2026).
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
      fiyat: c.startingPrice > 0 ? formatPriceDisplay(c.startingPrice) : null,
      not,
    }];
  });

  return (
    <>
      {/* Hero — alçak: başlık + güven satırı + arama. Kutular ilk ekranda başlasın. */}
      <section className="bg-[#2E1A5E] text-white">
        <Container className="pb-5 pt-6 md:pb-8 md:pt-10">
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] md:text-4xl">
            Ürününü seç, tasarımını biz yapalım.
          </h1>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-white/90 md:text-sm">
            <li className="inline-flex items-center gap-1.5"><PenNib size={15} weight="bold" className="text-brand-500" /> Ücretsiz tasarım</li>
            <li className="inline-flex items-center gap-1.5"><MapPin size={15} weight="bold" className="text-brand-500" /> 81 ile kargo</li>
            <li className="inline-flex items-center gap-1.5"><ShieldCheck size={15} weight="bold" className="text-brand-500" /> 3D Secure</li>
          </ul>
          <div className="mt-4">
            <AramaKutusu />
          </div>
        </Container>
      </section>

      {/* En çok sipariş edilen 8 kategori — mobilde 2 sütun */}
      <section className="bg-paper-100">
        <Container className="py-5 md:py-10">
          <h2 className="mb-3 text-lg font-semibold text-ink-900 md:text-2xl">En çok sipariş edilenler</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {kutular.map((k, i) => (
              <InisKategoriKutusu key={k.slug} kutu={k} sira={i} />
            ))}
          </div>
        </Container>
      </section>

      {/* Tüm kategoriler — gruplu akordeon; müşteri sayfadan çıkmadan bulur */}
      <section className="bg-paper-100">
        <Container className="pb-6 md:pb-10">
          <h2 className="mb-1 text-lg font-semibold text-ink-900 md:text-2xl">Aradığın yukarıda yok mu?</h2>
          <p className="mb-3 text-sm text-ink-500">Tüm ürün grupları — dokun, kategorileri gör.</p>
          <KategoriGruplari categories={categories} mod="akordeon" />
        </Container>
      </section>

      {/* 3 adım — reklamdaki akışın birebir karşılığı */}
      <section className="border-y border-paper-200 bg-paper-50">
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
        </Container>
      </section>
    </>
  );
}
