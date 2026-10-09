import Image from "next/image";
import Link from "next/link";
import type { Category } from "@markala/types";
import { CaretDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PRODUCT_GROUPS } from "@/lib/product-groups";
import { formatPriceDisplay } from "@/lib/format";

/**
 * Kategorileri ürün gruplarına göre derli toplu listeler (2026-10-08).
 *
 * Neden: /kategoriler 111 kartlık düz bir ızgaraydı (mobilde 27.000 px), ürün sayısına göre
 * sıralı olduğu için en üstte İSG levhaları çıkıyordu; müşteri aradığını bulamıyordu.
 * Burada her kategori yalnız BİR grupta görünür (ilk eşleşen grup — footer/menüyle aynı
 * kural), grup sırası PRODUCT_GROUPS'tur, satırlar kompakt (56 px görsel + ad + fiyat).
 *
 * Kartvizit hiçbir grupta değil (kendi sayfası hub'ın kopyası olurdu) → en üstte tek
 * başlık. Gruba girmeyen diğer kategoriler → sonda "Diğer".
 *
 * mod="akordeon": native <details> — JS yok, mobilde dokunmayla açılır (reklam inişi).
 * mod="acik": bölümler açık, başlıklar #id ile çipten atlanabilir (hub sayfası).
 */
export interface KategoriGrubu {
  id: string;
  label: string;
  /** Grup hub sayfası; yoksa (Kartvizit/Diğer) bağlantı basılmaz. */
  href?: string;
  categories: Category[];
}

export function kategorileriGrupla(categories: Category[]): KategoriGrubu[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const gruplar: KategoriGrubu[] = [];

  const kartvizit = bySlug.get("kartvizit");
  if (kartvizit) gruplar.push({ id: "kartvizit", label: "Kartvizit", categories: [kartvizit] });

  // Her grup KENDİ tam listesini gösterir; bir kategori birden fazla grupta görünebilir
  // (2026-10-09 düzeltmesi, Hasan: "Dijital Baskı'da sadece folyo/dekota/fosforlu var").
  // Önceki sürüm her kategoriyi YALNIZ ilk eşleşen gruba koyuyordu; sonuç bozuktu:
  // vinil branda afiş "Bayrak & Stand"a düşüyor, "Dijital Baskı" brandasız kalıyor,
  // "Reklam Tabela" folyo ve dekotasız görünüyordu. Müşteri ürünü beklediği başlığın
  // altında arar — tekrar, eksik listeden iyidir. Menü/grup hub'ları da böyle davranır.
  for (const g of PRODUCT_GROUPS) {
    const list = g.categorySlugs.map((slug) => bySlug.get(slug)).filter((c): c is Category => Boolean(c));
    if (list.length) gruplar.push({ id: g.slug, label: g.label, href: `/kategoriler/${g.slug}`, categories: list });
  }

  // Hiçbir grupta geçmeyen kategoriler kaybolmasın.
  const grupludur = new Set(PRODUCT_GROUPS.flatMap((g) => g.categorySlugs).concat("kartvizit"));
  const kalan = categories
    .filter((c) => !grupludur.has(c.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  if (kalan.length) gruplar.push({ id: "diger", label: "Diğer", categories: kalan });
  return gruplar;
}

function KategoriSatiri({ c }: { c: Category }) {
  return (
    <Link
      href={`/kategori/${c.slug}`}
      // min-w-0: grid öğesi varsayılan min-width:auto ile içeriğe göre genişleyip satırı taşırıyordu
      // (uzun açıklama kısalmıyor, fiyat ekran dışına çıkıyordu — 8 Eki mobil denetimi).
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-paper-200 bg-paper-50 p-2.5 transition hover:border-ink-300 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-100">
        {c.imageUrl && (
          <Image src={c.imageUrl} alt="" aria-hidden="true" fill sizes="56px" className="object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink-900">{c.name}</span>
        <span className="block truncate text-xs text-ink-500">{c.shortDescription}</span>
      </span>
      <span className="shrink-0 text-right">
        {c.startingPrice > 0 ? (
          <>
            <span className="block text-sm font-semibold tabular-nums text-ink-900">{formatPriceDisplay(c.startingPrice)}</span>
            <span className="block text-[11px] text-ink-500">&apos;den</span>
          </>
        ) : (
          <ArrowRight size={16} weight="bold" className="text-brand-700" />
        )}
      </span>
    </Link>
  );
}

export function KategoriGruplari({ categories, mod }: { categories: Category[]; mod: "akordeon" | "acik" }) {
  const gruplar = kategorileriGrupla(categories);

  if (mod === "akordeon") {
    return (
      <div className="divide-y divide-paper-200 overflow-hidden rounded-2xl border border-paper-200 bg-paper-50">
        {gruplar.map((g) => (
          <details key={g.id} className="group/d">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
              <span>
                {g.label}
                <span className="ml-2 text-xs font-normal text-ink-500">{g.categories.length} kategori</span>
              </span>
              <CaretDown size={18} weight="bold" className="shrink-0 text-ink-500 transition-transform group-open/d:rotate-180" />
            </summary>
            <div className="grid gap-2 bg-paper-100 px-3 pb-3 pt-1 md:grid-cols-2">
              {g.categories.map((c) => (
                <KategoriSatiri key={c.slug} c={c} />
              ))}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {gruplar.map((g) => (
        <section key={g.id} id={`grup-${g.id}`} className="scroll-mt-28">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink-900 md:text-2xl">{g.label}</h2>
            {g.href && (
              <Link href={g.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Grup sayfası <ArrowRight size={14} weight="bold" />
              </Link>
            )}
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {g.categories.map((c) => (
              <KategoriSatiri key={c.slug} c={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
