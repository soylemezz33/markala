import type { Metadata } from "next";
import { Container } from "@markala/ui";
import { getCategories } from "@/lib/catalog";
import { KategoriGruplari, kategorileriGrupla } from "@/components/kategori-gruplari";

export const metadata: Metadata = {
  title: "Tüm Kategoriler | Matbaa & Reklam Ürünleri",
  description:
    "Markala kataloğundaki 20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket, antetli kağıt, zarf, magnet, çanta. Her kategoride detaylı ürün seçenekleri.",
  alternates: { canonical: "/kategoriler" },
  openGraph: {
    type: "website",
    title: "Tüm Matbaa & Reklam Ürün Kategorileri | Markala",
    description: "20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket ve daha fazlası.",
    url: "/kategoriler",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Kategoriler" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tüm Matbaa & Reklam Ürün Kategorileri | Markala",
    description: "20+ kategori: kartvizit, broşür, afiş, branda, kupa, etiket ve daha fazlası.",
    images: ["/og-default.png"],
  },
};

// Katalogla aynı pencere; kategori adı/görseli/fiyatı DB'den geliyor.
export const revalidate = 300;

/**
 * Kategori hub'ı — yeniden düzen (2026-10-08, Hasan: "dağınık, filtreleme zor, kullanışsız").
 *
 * Eskisi: 111 kartlık düz ızgara, ürün SAYISINA göre sıralı (en üstte 10 İSG levha kategorisi),
 * mobilde 27.000 px. Yenisi: kompakt hero + gruba atlayan çipler + ürün gruplarına göre
 * bölümler; her kategori tek bir grupta, satırlar kompakt (görsel + ad + açıklama + fiyat).
 * Grup bölümleri /kategoriler/[grup] hub'larına bağlanmaya devam eder (SEO yapısı korunur).
 */
export default async function CategoriesPage() {
  const categories = await getCategories();
  const gruplar = kategorileriGrupla(categories);

  return (
    <>
      <div className="border-b border-paper-200 bg-paper-100">
        <Container className="py-8 md:py-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Kategoriler</p>
          <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight text-ink-900 md:text-4xl">
            Tüm matbaa & reklam ürün kategorileri
          </h1>
          <p className="mt-2 max-w-2xl text-base text-ink-700 md:text-lg">
            {categories.length} kategori, ürün gruplarına göre. Her birinde ebat, adet ve paket seçenekleri; fiyat anında görünür.
          </p>
          {/* Grup çipleri: sayfa içi atlama — mobilde yatay kaydırılabilir */}
          <nav aria-label="Ürün grupları" className="-mx-4 mt-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex w-max gap-2 md:flex-wrap">
              {gruplar.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#grup-${g.id}`}
                    className="inline-block whitespace-nowrap rounded-full border border-paper-200 bg-paper-50 px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900"
                  >
                    {g.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        <KategoriGruplari categories={categories} mod="acik" />
      </Container>
    </>
  );
}
