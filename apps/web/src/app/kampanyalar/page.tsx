"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Container, Button, Price, cn } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, Sparkle, Tag, ArrowRight } from "@phosphor-icons/react";
import { campaignBundles } from "@markala/mock-data";
import type { CampaignBundle, CampaignBundleCategory } from "@markala/types";
import { useCartStore } from "@/lib/cart-store";

const filters: { id: CampaignBundleCategory | "all"; label: string }[] = [
  { id: "all", label: "Hepsi" },
  { id: "esnaf", label: "Esnaf" },
  { id: "kurumsal", label: "Kurumsal" },
  { id: "etkinlik", label: "Etkinlik" },
  { id: "acilis", label: "Açılış" },
  { id: "promosyon", label: "Promosyon" },
];

export default function KampanyalarPage() {
  const [filter, setFilter] = useState<CampaignBundleCategory | "all">("all");
  const items = useMemo(
    () =>
      filter === "all"
        ? campaignBundles
        : campaignBundles.filter((b) => b.category === filter),
    [filter],
  );

  return (
    <div className="bg-paper-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-ink-900">
        <Container className="py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 text-brand-300 text-xs font-medium tracking-wide">
              <Sparkle size={12} weight="fill" /> AÇILIŞA ÖZEL
            </span>
            <h1 className="mt-5 text-display-xl font-serif leading-[1.05]">
              Hazır kampanya paketleri
            </h1>
            <p className="mt-5 text-lg md:text-xl leading-relaxed max-w-2xl">
              Açılış, esnaf, kurumsal ve etkinlik için önceden kurgulanmış paketler. Tek tıkla sepete, tek seferde teslim — tasarım desteği dahil.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        {/* Filtre tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {filters.map((f) => (
            <button
          key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === f.id
                  ? "bg-ink-900 text-paper-50"
                  : "bg-paper-100 text-ink-700 hover:bg-paper-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bundle grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {items.map((bundle) => (
            <BundleCard key={bundle.slug} bundle={bundle} />
          ))}
        </div>

        {items.length === 0 && (
          <div className="py-16 text-center bg-paper-100 rounded-lg border border-paper-200">
            <p className="text-ink-700">Bu kategoride henüz paket yok.</p>
          </div>
        )}

        {/* B2B kurumsal CTA */}
        <section className="mt-16 p-8 md:p-10 bg-paper-100 rounded-xl border border-paper-200 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-serif text-ink-900">İhtiyacın özel mi?</h3>
            <p className="mt-2 text-ink-700">
              Yukarıdaki paketler işine uymuyorsa size özel bir kombinasyon hazırlayalım. Toplu siparişlerde ek indirim.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/iletisim">
              <Button size="lg">
                Özel Teklif Al <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
}

function BundleCard({ bundle }: { bundle: CampaignBundle }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const [added, setAdded] = useState(false);

  const savings = bundle.originalPrice - bundle.bundlePrice;
  const savingsPercent = Math.round((savings / bundle.originalPrice) * 100);

  function handleAdd() {
    const summary = bundle.contents
      .map((c) => `${c.quantity} × ${c.productName}`)
      .join(" · ");
    addItem({
      productSlug: bundle.slug,
      productName: bundle.name,
      productImage: bundle.imageUrl,
      configuration: {
        selections: { __bundle: bundle.slug },
        summary: `Hazır paket · ${summary}${bundle.designSupport ? " · Tasarım dahil" : ""}`,
        totalPrice: bundle.bundlePrice,
        needsDesign: bundle.designSupport,
      },
    });
    setAdded(true);
    setTimeout(() => {
      openCart();
      setAdded(false);
    }, 800);
  }

  return (
    <article className="flex flex-col bg-paper-50 border border-paper-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-ink-300 transition-all duration-300">
      {/* Görsel + badge */}
      <div className="relative aspect-[4/3] bg-paper-100 overflow-hidden">
        <Image
          src={bundle.imageUrl}
          alt={bundle.name}
          fill unoptimized
              sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-1 rounded-sm text-[11px] font-medium tracking-wide bg-error text-paper-50">
            {bundle.badge}
          </span>
          <span className="px-2.5 py-1 rounded-sm text-[11px] font-medium tracking-wide bg-brand-500 text-ink-900">
            %{savingsPercent} İNDİRİM
          </span>
        </div>
        {bundle.highlight && (
          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ink-900/85 backdrop-blur text-paper-50 text-[11px] font-medium">
              <Sparkle size={10} weight="fill" className="text-brand-400" />
              {bundle.highlight}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-serif text-xl text-ink-900 leading-tight">{bundle.name}</h2>
        <p className="mt-1 text-sm text-brand-700 font-medium">{bundle.tagline}</p>
        <p className="mt-2 text-sm text-ink-700 leading-relaxed">{bundle.description}</p>

        {/* İçerik */}
        <div className="mt-4 p-4 bg-paper-100 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-medium mb-2">
            Paket içeriği
          </div>
          <ul className="space-y-1.5">
            {bundle.contents.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <CheckCircle size={14} weight="fill" className="text-brand-500 flex-none mt-0.5" />
                <span className="text-ink-900">
                  <span className="font-medium tabular-nums">{item.quantity.toLocaleString("tr-TR")}</span> ×{" "}
                  {item.productSlug ? (
                    <Link href={`/urun/${item.productSlug}`} className="hover:underline">
                      {item.productName}
                    </Link>
                  ) : (
                    <span>{item.productName}</span>
                  )}
                  {item.note && <span className="text-ink-500 text-xs"> — {item.note}</span>}
                </span>
              </li>
            ))}
            {bundle.designSupport && (
              <li className="flex gap-2 text-sm pt-1.5 border-t border-paper-200 mt-2">
                <Sparkle size={14} weight="fill" className="text-brand-500 flex-none mt-0.5" />
                <span className="text-ink-900 font-medium">Ücretsiz tasarım desteği dahil</span>
              </li>
            )}
          </ul>
        </div>

        {/* Fiyat + CTA */}
        <div className="mt-5 pt-5 border-t border-paper-200 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <Price amount={bundle.bundlePrice} size="xl" className="text-ink-900" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm line-through text-ink-500 tabular-nums">
                {bundle.originalPrice.toLocaleString("tr-TR")} ₺
              </span>
              <span className="text-xs font-medium text-success inline-flex items-center gap-0.5">
                <Tag size={11} weight="fill" /> {savings.toLocaleString("tr-TR")} ₺ tasarruf
              </span>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          fullWidth
          className="mt-4"
          onClick={handleAdd}
          disabled={added}
        >
          {added ? (
            <>
              <CheckCircle size={18} weight="bold" /> Sepete Eklendi
            </>
          ) : (
            <>
              <ShoppingBagOpen size={18} weight="bold" /> Sepete Ekle
            </>
          )}
        </Button>
        <p className="text-xs text-ink-500 text-center mt-2">
          Hazır paket — anında sepete, çıkışta ödemeye geç
        </p>
      </div>
    </article>
  );
}
