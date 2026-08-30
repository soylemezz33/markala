import Link from "next/link";
import { Container } from "@markala/ui";
import type { Product } from "@markala/types";
import type { NavCategory } from "@/components/site-header";

/**
 * Hero altı kategori kutuları (2026-08-31) — ilk ekranda katalog girişi.
 *
 * Neden: Baymard'ın anasayfa şartı "ürün tiplerinin en az %40'ı temsil edilmeli"; ayrıca
 * MOBİLDE kategori menüsü hamburgerin arkasında olduğu için bu kutular masaüstünden daha
 * kritik. Eskiden ilk ekranda hiç kategori girişi yoktu (CategoryGrid 2026-08-06'da
 * kaldırılmıştı ve zaten sayfanın çok altındaydı).
 *
 * Fiyatlar CANLI katalogdan hesaplanır — grubun kapsadığı kategorilerdeki en düşük
 * gösterim fiyatı. Fiyat bulunamazsa o kutuda fiyat satırı hiç basılmaz (uydurma yok).
 */
/** 8 = menüdeki grup sayısı. 6'da kesilince "İSG Uyarı Levhaları" ve "Sektörel Ürünler"
 *  dışarıda kalıyordu; oysa GA4'te (60 gün) en çok inilen beş kategori sayfasının İKİSİ
 *  İSG. Masaüstünde 4'lü iki sıra, etiketlere de 6 sütundan daha çok yer bırakıyor. */
const TILE_LIMIT = 8;

/** Nav grubunun hedeflediği DB kategori slug'ları.
 *  Grup href'i iki biçimde olabilir:
 *   - `/urunler?kategoriler=a,b,c&grup=...`  (çoklu kategori — groupHref)
 *   - `/kategori/<slug>`                      (tek kategori) */
function hedefKategoriler(href: string): string[] {
  const qs = href.indexOf("?");
  if (qs >= 0) {
    const params = new URLSearchParams(href.slice(qs + 1));
    const ham = params.get("kategoriler");
    if (ham) return ham.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const m = href.match(/^\/kategori\/([a-z0-9-]+)/i);
  return m ? [m[1]!] : [];
}

function enDusukFiyat(products: Product[], slugs: string[]): number {
  if (slugs.length === 0) return 0;
  const kume = new Set(slugs);
  let min = 0;
  for (const p of products) {
    if (!kume.has(p.categorySlug)) continue;
    const dp = (p as { displayPrice?: number | null }).displayPrice;
    const f = typeof dp === "number" && dp > 0 ? dp : (p.startingPrice ?? 0);
    if (f > 0 && (min === 0 || f < min)) min = f;
  }
  return min;
}

export function CategoryTiles({
  nav,
  products,
}: {
  nav: NavCategory[] | null;
  products: Product[];
}) {
  // Menü okunamazsa kutular basılmaz — uydurma kategori listesi üretmektense hiç göstermemek
  // doğru; başlıktaki menü zaten kendi yedeğine (DEFAULT_NAV) düşüyor.
  if (!nav || nav.length === 0) return null;

  const tiles = nav.slice(0, TILE_LIMIT).map((n) => ({
    label: n.label,
    href: n.href,
    fiyat: enDusukFiyat(products, hedefKategoriler(n.href)),
  }));

  return (
    <section className="bg-paper-50">
      <Container className="pb-8 md:pb-10">
        <h2 className="sr-only">Kategoriler</h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          {tiles.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="flex h-full flex-col justify-between rounded-lg border border-paper-200 bg-paper-100 px-3.5 py-3 transition-all hover:border-ink-300 hover:bg-paper-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
              >
                <span className="text-sm font-semibold leading-snug text-ink-900">{t.label}</span>
                {t.fiyat > 0 && (
                  <span className="mt-1.5 text-xs font-semibold text-brand-700 tabular-nums">
                    {t.fiyat.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺&apos;den
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
