import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProducts, getCategories } from "@/lib/catalog";
import { ProductItemListJsonLd } from "@/components/seo/json-ld";
import { AllProductsClient } from "./all-products-client";
import { URUNLER_PAGE_SIZE } from "./page-size";

interface UrunlerSearchParams {
  kategoriler?: string | string[];
  grup?: string | string[];
  page?: string | string[];
}

/** Tekrarlı query anahtarı (?x=a&x=b) Next'te string[] gelir — ilkini al (crash guard). */
const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** ?page ayrıştır: yalnız 2+ anlamlıdır; boş/geçersiz/1 → 1 (sayfa 1 parametresiz kanonik). */
const parsePage = (raw: string): number => {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
};

/**
 * SEO sayfalaması: sayfa N'de title'a " — Sayfa N" eki + self-canonical (?page=N dahil).
 * Sayfa 1 parametresiz kanoniktir (?page=1 zaten redirect edilir, aşağıda).
 * Bu route zaten searchParams okuduğundan (kategoriler/grup) dynamic'ti — ek maliyet yok.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: UrunlerSearchParams;
}): Promise<Metadata> {
  const page = parsePage(first(searchParams?.page));
  // Kapsam dışı ?page → GERÇEK 404 BURADA verilir: urunler/loading.tsx yüzünden gövde
  // stream'i 200 ile açılıyor, gövdedeki notFound() yalnız soft-404 (noindex) üretebiliyor.
  // generateMetadata stream'den ÖNCE çözülür (PDP'deki bilinen desen) → statü 404 olur.
  // getProducts/getCategories fetch'leri sayfa gövdesiyle dedupe edilir — ek maliyet yok.
  // Boş katalog (API hatasında []) guard'ı ATLAR: "çekilemedi ≠ yok".
  if (page > 1) {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    if (products.length > 0) {
      const known = new Set(categories.map((c) => c.slug));
      const slugs = first(searchParams?.kategoriler)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => known.has(s));
      const listLength = slugs.length
        ? products.filter((p) => slugs.includes(p.categorySlug)).length
        : products.length;
      if (page > Math.max(1, Math.ceil(listLength / URUNLER_PAGE_SIZE))) notFound();
    }
  }
  const suffix = page > 1 ? ` — Sayfa ${page}` : "";
  const canonical = page > 1 ? `/urunler?page=${page}` : "/urunler";
  return {
    title: `Tüm Ürünler — 30+ Matbaa & Reklam Ürünü Kategorisi${suffix}`,
    description:
      "Matbaa baskıdan büyük format reklam ürünlerine — tüm Markala kataloğu tek ekranda. Kartvizit, broşür, branda, tabela ve daha fazlası. Tasarım desteği her siparişte ücretsiz.",
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `Tüm Ürünler — Markala Kataloğu${suffix}`,
      description: "30+ matbaa ve reklam ürünü kategorisi. Tasarım desteği her siparişte ücretsiz.",
      url: canonical,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala — Tüm Ürünler" }],
    },
  };
}

/** Server: ürünleri CANLI API'den çek (admin yönetir), interaktif filtreleme client'ta.
 *
 * `?kategoriler=a,b,c&grup=Etiket` — header mega menüsündeki "Tüm X ürünlerini gör"
 * linkleri buraya gelir: nav grubu birden çok düz kategoriye yayıldığından (İSG=10
 * kategori) tek kategori filtresi yetmez; grup ön-filtre olarak açılır. Bilinmeyen
 * slug'lar elenir; hiç geçerli slug kalmazsa normal (filtresiz) katalog gösterilir.
 *
 * `?page=N` — SEO sayfalaması: route dynamic render edildiğinden (searchParams erişimi)
 * AllProductsClient içindeki useSearchParams SSR'da da gerçek page değerini görür →
 * sayfa N'in ürün dilimi ve sayfalama <Link>'leri SSR HTML'inde yer alır (bot-crawl'lanır).
 */
export default async function AllProductsPage({
  searchParams,
}: {
  searchParams?: UrunlerSearchParams;
}) {
  // ?page=1 veya geçersiz page değeri → parametresiz kanonik URL'e KALICI redirect
  // (duplicate content önlenir; diğer parametreler — kategoriler/grup — korunur).
  const rawPage = first(searchParams?.page);
  if (rawPage !== "" && parsePage(rawPage) === 1) {
    const qs = new URLSearchParams();
    const kategoriler = first(searchParams?.kategoriler);
    const grup = first(searchParams?.grup);
    if (kategoriler) qs.set("kategoriler", kategoriler);
    if (grup) qs.set("grup", grup);
    const s = qs.toString();
    permanentRedirect(s ? `/urunler?${s}` : "/urunler");
  }

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const known = new Set(categories.map((c) => c.slug));
  const slugs = first(searchParams?.kategoriler)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => known.has(s));

  // Kapsam dışı sayfa (?page=999) → 404. Aksi halde sonsuz "geçerli" URL uzayı oluşur:
  // her sayı 200 + self-canonical + index döner (soft-404 / indeks şişmesi). Filtreli
  // görünümde sayfa sayısı filtrelenmiş listeye göre hesaplanır (client ile aynı mantık).
  // ⚠️ products.length===0 → guard ATLANIR: getProducts() API hatasında [] döner ("çekilemedi
  // ≠ yok" dersi) — API blip'inde tüm sayfalama URL'lerini hard-404'e düşürme.
  const page = parsePage(first(searchParams?.page));
  if (page > 1 && products.length > 0) {
    const listLength = slugs.length
      ? products.filter((p) => slugs.includes(p.categorySlug)).length
      : products.length;
    const totalPages = Math.max(1, Math.ceil(listLength / URUNLER_PAGE_SIZE));
    if (page > totalPages) notFound();
  }
  const initialGroup =
    slugs.length > 0
      ? { label: first(searchParams?.grup).trim() || "Seçili Kategoriler", slugs }
      : null;

  return (
    <>
      <ProductItemListJsonLd
        products={products}
        name="Markala — Tüm Matbaa & Reklam Ürünleri"
        url="/urunler"
      />
      <AllProductsClient products={products} categories={categories} initialGroup={initialGroup} />
    </>
  );
}
