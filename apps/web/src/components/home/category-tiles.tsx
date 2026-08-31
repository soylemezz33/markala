import { Container } from "@markala/ui";
import type { Category, Product } from "@markala/types";
import type { NavCategory } from "@/components/site-header";
import { CategoryTileLink, type KategoriKutusu } from "@/components/home/category-tile-link";

/**
 * Hero altı kategori kutuları (2026-08-31) — ilk ekranda katalog girişi.
 *
 * Neden: Baymard'ın anasayfa şartı "ürün tiplerinin en az %40'ı temsil edilmeli"; ayrıca
 * MOBİLDE kategori menüsü hamburgerin arkasında olduğu için bu kutular masaüstünden daha
 * kritik. Eskiden ilk ekranda hiç kategori girişi yoktu.
 */

/** 8 = menüdeki grup sayısı. 6'da kesilince "İSG Uyarı Levhaları" ve "Sektörel Ürünler"
 *  dışarıda kalıyordu; oysa GA4'te (60 gün) en çok inilen beş kategori sayfasının İKİSİ
 *  İSG. Masaüstünde 4'lü iki sıra, etiketlere de 6 sütundan daha çok yer bırakıyor. */
const TILE_LIMIT = 8;

/**
 * Fiyatın "başlangıç fiyatı" olarak ANLAMLI sayıldığı üst sınır (₺, KDV dahil).
 *
 * Neden gerekli: kutudaki fiyat, grubun en ucuz ürünüdür. Ama menü grupları çok farklı
 * şeyleri topluyor ve bazılarının ucuz girişi hiç yok — "Sektörel Ürünler" (3 ürün:
 * Amerikan Servis, Kapı Askı Broşür, Çanta; hepsi toplu üretim) 4.725 ₺, "Promosyon &
 * Hediye" 1.326 ₺ (magnetin 1.000'lik fiyatı) gösteriyordu. Anasayfada bu sayılar
 * kategoriyi açtırmaz, kaçırır — üstelik katalogda 34 ₺ levha, 105 ₺ makam bayrağı gibi
 * gerçek giriş fiyatları varken ucuzluk iddiamızın tersini söylüyorlardı.
 *
 * Bu bir GÖSTERİM kuralıdır, fiyat kuralı değil: tavanın üstündeki grupta sayı basmak
 * yerine nötr "Ürünleri incele" yazılır; gerçek fiyatlar kategori sayfasında aynen durur.
 */
const FIYAT_CIPA_TAVANI = 1000;

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

/** Grubun temsili görseli: görseli olan İLK kategori. Hepsi görselsizse null. */
function temsiliGorsel(categories: Category[], slugs: string[]): string | null {
  for (const s of slugs) {
    const c = categories.find((x) => x.slug === s);
    if (c?.imageUrl) return c.imageUrl;
  }
  return null;
}

export function CategoryTiles({
  nav,
  products,
  categories,
}: {
  nav: NavCategory[] | null;
  products: Product[];
  categories: Category[];
}) {
  // Menü okunamazsa kutular basılmaz — uydurma kategori listesi üretmektense hiç göstermemek
  // doğru; başlıktaki menü zaten kendi yedeğine (DEFAULT_NAV) düşüyor.
  if (!nav || nav.length === 0) return null;

  const tiles: KategoriKutusu[] = nav.slice(0, TILE_LIMIT).map((n) => {
    const slugs = hedefKategoriler(n.href);
    const min = enDusukFiyat(products, slugs);
    return {
      label: n.label,
      href: n.href,
      imageUrl: temsiliGorsel(categories, slugs),
      fiyat: min > 0 && min <= FIYAT_CIPA_TAVANI ? min : 0,
      izlemeId: slugs[0] ?? n.label,
    };
  });

  return (
    <section className="bg-paper-50">
      <Container className="pb-8 md:pb-10">
        <h2 className="sr-only">Kategoriler</h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          {tiles.map((t) => (
            <li key={t.href}>
              <CategoryTileLink kutu={t} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
