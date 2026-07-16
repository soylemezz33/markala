import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowRight, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@markala/types";

/**
 * Hero altı CTA bandı — saf görsel slider'ın eylem/fiyat boşluğunu kapatır:
 * reklamdan gelen ziyaretçi ilk ekranda hem gerçek "X₺'den" fiyat çıpası hem de
 * tıklanabilir birincil aksiyon görür (slider görseline dokunmadan).
 * Çıpa fiyatları katalogdan canlı gelir; fiyatı olmayan aday gösterilmez.
 */
const ANCHOR_CANDIDATES: Array<{ slug: string; label: string }> = [
  { slug: "klasik-kartvizit", label: "Kartvizit" },
  { slug: "vinil-branda-440gr", label: "Branda afiş" },
  { slug: "brosur", label: "Broşür" },
];

function anchorPrice(p: Product): number {
  const dp = (p as { displayPrice?: number | null }).displayPrice;
  if (typeof dp === "number" && dp > 0) return dp;
  return p.startingPrice && p.startingPrice > 0 ? p.startingPrice : 0;
}

export function HeroCtaBand({ products }: { products: Product[] }) {
  const anchors = ANCHOR_CANDIDATES.map((c) => {
    const p = products.find((x) => x.slug === c.slug);
    return p ? { ...c, price: anchorPrice(p) } : null;
  })
    .filter((a): a is { slug: string; label: string; price: number } => !!a && a.price > 0)
    .slice(0, 2);

  return (
    <div className="bg-ink-900 border-t border-paper-50/10">
      <Container className="py-3.5 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {anchors.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-paper-100/80">
              {anchors.map((a) => (
                <Link
                  key={a.slug}
                  href={`/urun/${a.slug}`}
                  className="hover:text-paper-50 transition-colors"
                >
                  {a.label}{" "}
                  <strong className="text-brand-300 font-semibold tabular-nums">
                    {a.price.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                  </strong>
                  &apos;den
                </Link>
              ))}
              <span className="hidden md:inline text-paper-100/50 text-xs">KDV dahil fiyatlar</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 sm:ml-auto">
            <Link
              href="/urunler"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Ürünleri Keşfet <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/teklif-al"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 border border-paper-50/25 hover:border-paper-50/50 text-paper-50 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <ChatCircleText size={15} weight="bold" /> Teklif Al
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
