import type { Product, ProductImage } from "@markala/types";

/**
 * AJA-386 — TEK görsel çözümleme kaynağı (bug #4 dahil).
 *
 * Kart, ürün detayı ve galeri AYNI mantığı kullanır: hepsi `resolveProductImage`'e gider.
 * Böylece "kategoriye uygun görsel eşleştirme" (A7 broşüre A7 görseli) tek yerde garanti
 * altına alınır ve üç yüzeyde tutarsızlık olmaz.
 *
 * Çözümleme zinciri (yukarıdan aşağı, ilk dolu olan kazanır):
 *   1. Gerçek ürün görselleri  → `product.coverImage`/`product.gallery` (yeni kontrat)
 *                                 veya eski `product.images` (URL dizisi).
 *   2. Kategori-bazlı fallback → `/images/categories/{kategori}.jpg` (repo'da MEVCUT gerçek
 *                                foto). "Görsel yoksa kategoriye uygun görsel" kuralı BURADA
 *                                karşılanır — jenerik gri kutu yerine A7 broşür fotosu gelir.
 *   3. Marka jenerik placeholder → `/api/mockup` (charcoal + amber logo + ürün adı, kategori
 *                                  illüstrasyonlu SVG). Her zaman render eder, asla boş kalmaz.
 *
 * `/api/mockup` SVG'leri "gerçek görsel" SAYILMAZ — JSON-LD ve og:image dışında tutulur
 * (Google/sosyal crawler raster ister). `isRealImage` bu ayrımı yapar.
 */

/** Çözümlenmiş görsel — `src` her zaman doludur; `fallback` gerçek foto olmadığını işaretler. */
export interface ResolvedImage extends ProductImage {
  /** true → 2./3. adım fallback (kategori fotosu veya jenerik mockup), gerçek ürün fotosu değil. */
  fallback: boolean;
}

/**
 * `public/images/categories/` içinde GERÇEKTEN dosyası olan kategori slug'ları.
 * Yalnız bu slug'lar için kategori-fotoğrafı fallback'i verilir; listede olmayan kategori
 * doğrudan jenerik mockup'a düşer (var olmayan dosyaya 404 atmaktansa).
 * Not: dosya adları .jpg; yeni kategori görseli eklenirse buraya slug'ı da eklenmeli.
 */
const CATEGORY_PHOTO_SLUGS = new Set<string>([
  "afis",
  "amerikan-servis",
  "antetli-kagit",
  "arac-magneti",
  "arac-sticker",
  "bloknot",
  "brosur",
  "canta-kese",
  "cepli-dosya",
  "dekota-baski",
  "el-ilani",
  "etiket",
  "folyo",
  "fosforlu-folyo",
  "guvenlik-uyari-levhalari",
  "kapi-aski-brosur",
  "kartvizit",
  "kase",
  "kirlangic-bayrak",
  "kupa",
  "lightbox",
  "madalya",
  "magnet",
  "makam-bayragi",
  "makbuz",
  "masa-bayragi",
  "oto-paspas",
  "plaket",
  "plastik-reklam-dubasi",
  "rollup",
  "vinil-branda-afis",
  "yelken-bayrak",
  "zarf",
]);

/** Kare fallback görsellerinin varsayılan boyutu (CLS için width/height gerekli). */
const FALLBACK_DIM = 1200;

/** Bir URL'in gerçek (raster, optimize edilebilir) ürün görseli olup olmadığı. */
export function isRealImage(src: string | undefined | null): boolean {
  return typeof src === "string" && src.length > 0 && !src.includes("/api/mockup");
}

/** Eski `images: string[]` öğesini ProductImage'e sarar (id = kararlı, src'den türer). */
function fromLegacyUrl(src: string, index: number, name: string): ProductImage {
  return {
    id: `img-${index}`,
    src,
    // İlk görsel ürün adının kendisi; sonrakiler "… görsel N" ile benzersizleşir (SEO: her
    // görselde benzersiz alt). Backend gerçek alt gönderdiğinde bu satır devreye girmez.
    alt: index === 0 ? name : `${name} — görsel ${index + 1}`,
    width: FALLBACK_DIM,
    height: FALLBACK_DIM,
    type: index === 0 ? "product" : "detail",
  };
}

/** Kategori-bazlı fallback görseli (bug #4) — slug'ın gerçek dosyası varsa. */
function categoryFallback(product: Product): ResolvedImage | null {
  const slug = product.categorySlug;
  if (!slug || !CATEGORY_PHOTO_SLUGS.has(slug)) return null;
  return {
    id: `cat-${slug}`,
    src: `/images/categories/${slug}.jpg`,
    // Anlamlı Türkçe alt — "kategori görseli" olduğu açık, ürün adı korunur.
    alt: `${product.name} — kategori görseli`,
    width: FALLBACK_DIM,
    height: FALLBACK_DIM,
    type: "context",
    fallback: true,
  };
}

/** Marka jenerik placeholder — her zaman çalışır (charcoal + amber logo + ürün adı SVG). */
export function genericFallback(product: Product): ResolvedImage {
  return {
    id: "generic",
    src: `/api/mockup?slug=${encodeURIComponent(product.slug)}&w=1200&h=1200`,
    alt: `${product.name} — Markala ürün görseli`,
    width: FALLBACK_DIM,
    height: FALLBACK_DIM,
    type: "product",
    fallback: true,
  };
}

/** onError zincirinde bir sonraki adım: kategori fotosu → jenerik mockup. */
export function nextFallbackSrc(product: Product): string {
  const cat = categoryFallback(product);
  return cat ? cat.src : genericFallback(product).src;
}

/**
 * Ürünün TÜM görsel katmanını çözer: `{ cover, gallery }`.
 *
 * - `gallery`: gösterime hazır sıralı ResolvedImage listesi (en az 1 öğe — asla boş değil).
 * - `cover`  : LCP adayı ana görsel (gallery[0] ile aynı; ayrıca `coverImage` kontratını onurlandırır).
 */
export function resolveProductImage(product: Product): {
  cover: ResolvedImage;
  gallery: ResolvedImage[];
} {
  // 1) Yeni kontrat: coverImage + gallery doluysa onu kullan.
  const rich: ProductImage[] = [];
  if (product.coverImage) rich.push(product.coverImage);
  if (Array.isArray(product.gallery)) {
    for (const g of product.gallery) {
      if (g && !rich.some((r) => r.id === g.id)) rich.push(g);
    }
  }

  // 2) Eski kontrat: images: string[] → ProductImage'e sar (yeni kontrat boşsa).
  const legacy: ProductImage[] =
    rich.length > 0
      ? []
      : (product.images ?? []).map((src, i) => fromLegacyUrl(src, i, product.name));

  const combined = rich.length > 0 ? rich : legacy;

  // Gerçek (raster) görseller — jenerik mockup URL'leri gerçek sayılmaz.
  const real = combined.filter((img) => isRealImage(img.src));

  if (real.length > 0) {
    const gallery: ResolvedImage[] = real.map((img) => ({ ...img, fallback: false }));
    return { cover: gallery[0]!, gallery };
  }

  // 3) Gerçek görsel yok → kategori fotosu, o da yoksa jenerik marka placeholder.
  const fallback = categoryFallback(product) ?? genericFallback(product);
  return { cover: fallback, gallery: [fallback] };
}

/**
 * Bir görsel id'sini çözülmüş galerideki index'e çevirir (varyant senkronu için).
 * Bulunamazsa -1. Konfigüratör `markala:gorsel-sec` olayında imageId gönderir, galeri
 * bunu index'e çevirir.
 */
export function galleryIndexOfId(gallery: ResolvedImage[], imageId: string): number {
  return gallery.findIndex((g) => g.id === imageId);
}
