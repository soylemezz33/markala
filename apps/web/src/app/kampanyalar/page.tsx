"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Container, Button, Price, cn } from "@markala/ui";
import {
  ShoppingBagOpen,
  CheckCircle,
  Sparkle,
  Tag,
  ArrowRight,
  PaintBrush,
  Lightning,
  Package,
  Storefront,
  Buildings,
  Confetti,
  Gift,
} from "@phosphor-icons/react";
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

// Boş durum + hero için sektör kartları (paket eklenince de "neler var" hissi verir).
const sectors: { id: CampaignBundleCategory; label: string; desc: string; icon: typeof Storefront }[] = [
  { id: "esnaf", label: "Esnaf", desc: "Dükkan & küçük işletme", icon: Storefront },
  { id: "kurumsal", label: "Kurumsal", desc: "Ofis & marka kimliği", icon: Buildings },
  { id: "etkinlik", label: "Etkinlik", desc: "Fuar, lansman, organizasyon", icon: Confetti },
  { id: "acilis", label: "Açılış", desc: "Yeni açılan mekanlar", icon: Sparkle },
  { id: "promosyon", label: "Promosyon", desc: "Hediyelik & tanıtım", icon: Gift },
];

const valueProps = [
  { icon: Lightning, title: "Tek tıkla sepet", desc: "Paket hazır, anında ekle" },
  { icon: Package, title: "Tek seferde teslim", desc: "Tüm ürünler birlikte gelir" },
  { icon: PaintBrush, title: "Tasarım dahil", desc: "Ücretsiz tasarım desteği" },
  { icon: Tag, title: "Paket indirimi", desc: "Tek tek almaktan ucuz" },
];

export default function KampanyalarPage() {
  const [filter, setFilter] = useState<CampaignBundleCategory | "all">("all");
  // CANLI paketler (admin yönetir, DB'den). API boş → zengin boş durum gösterilir.
  const [bundles, setBundles] = useState<CampaignBundle[]>([]);
  useEffect(() => {
    fetch("/api/kampanyalar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.bundles) && d.bundles.length) setBundles(d.bundles as CampaignBundle[]);
      })
      .catch(() => {});
  }, []);
  const items = useMemo(
    () => (filter === "all" ? bundles : bundles.filter((b) => b.category === filter)),
    [filter, bundles],
  );
  const hasBundles = bundles.length > 0;

  return (
    <div className="bg-paper-50 min-h-screen">
      {/* Hero — kompakt, koyu premium, sağda tasarruf görseli */}
      <section className="relative overflow-hidden bg-ink-900 text-paper-50">
        <div
          aria-hidden
          className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #F5B800, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 w-[380px] h-[380px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #00D9FF, transparent 70%)" }}
        />
        <Container className="relative py-12 md:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Sol — metin */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkle size={12} weight="fill" /> Kampanya Paketleri
            </span>
            <h1 className="mt-5 text-display-lg font-serif leading-[1.05]">
              Hazır paketlerle <span className="text-brand-400">daha az öde</span>, tek teslimde al
            </h1>
            <p className="mt-4 text-paper-100/70 text-lg leading-relaxed max-w-xl">
              Açılış, esnaf, kurumsal ve etkinlik için önceden kurgulanmış paketler. Tek tıkla
              sepete, tek seferde teslim — tasarım desteği dahil.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper-100/80">
              {["Tek tıkla sepet", "Tasarım dahil", "Tek teslim"].map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" className="text-brand-400" /> {c}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#paketler">
                <Button size="lg">
                  Paketleri Gör <ArrowRight size={16} weight="bold" />
                </Button>
              </a>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 px-5 h-12 rounded-lg border border-paper-100/20 text-paper-50 hover:bg-paper-50/10 transition-colors font-medium"
              >
                Özel Teklif Al
              </Link>
            </div>
          </div>

          {/* Sağ — tasarruf görseli (CSS, görsel gerektirmez) */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-sm">
              <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-900 p-7 shadow-2xl">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Paket avantajı
                </div>
                <div className="mt-1 text-5xl font-serif font-semibold leading-none">
                  %25<span className="text-2xl">'e varan</span>
                </div>
                <div className="mt-1 text-lg font-semibold">tasarruf</div>
                <div className="mt-4 pt-4 border-t border-ink-900/15 text-sm font-medium">
                  Tek tek almak yerine paketle al, hem indirim kazan hem tek teslimde topla.
                </div>
              </div>
              {/* Floating mini paket çipleri */}
              <div className="absolute -top-4 -left-6 rotate-[-6deg] rounded-xl bg-surface-2 border border-surface-4 px-3 py-2 shadow-card-dark text-xs text-on-dark-200 inline-flex items-center gap-1.5">
                <Package size={14} className="text-brand-400" /> Açılış Paketi
              </div>
              <div className="absolute -bottom-5 -right-4 rotate-[5deg] rounded-xl bg-surface-2 border border-surface-4 px-3 py-2 shadow-card-dark text-xs text-on-dark-200 inline-flex items-center gap-1.5">
                <Storefront size={14} className="text-brand-400" /> Esnaf Paketi
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Değer şeridi */}
      <section className="border-b border-paper-200 bg-paper-50">
        <Container className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-paper-200 overflow-hidden rounded-none">
          {valueProps.map((v) => (
            <div key={v.title} className="bg-paper-50 px-4 py-5 flex items-start gap-3">
              <div className="flex-none w-10 h-10 rounded-lg bg-brand-100 text-brand-700 grid place-items-center">
                <v.icon size={20} weight="fill" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-900">{v.title}</div>
                <div className="text-xs text-ink-500 mt-0.5">{v.desc}</div>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <Container className="py-10 md:py-14" id="paketler">
        {/* Filtre tabs — yalnız paket varken anlamlı */}
        {hasBundles && (
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
        )}

        {hasBundles ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((bundle) => (
              <BundleCard key={bundle.slug} bundle={bundle} />
            ))}
            {items.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 py-16 text-center bg-paper-100 rounded-lg border border-paper-200">
                <p className="text-ink-700">Bu kategoride henüz paket yok.</p>
              </div>
            )}
          </div>
        ) : (
          /* Zengin boş durum — paket yokken sayfa yine değerli ve çekici */
          <EmptyState />
        )}

        {/* B2B kurumsal CTA */}
        <section className="mt-16 overflow-hidden rounded-2xl border border-paper-200 bg-gradient-to-br from-paper-100 to-paper-50 p-8 md:p-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-serif text-ink-900">İhtiyacın özel mi?</h3>
            <p className="mt-2 text-ink-700 max-w-xl">
              Hazır paketler işine uymuyorsa sana özel bir kombinasyon hazırlayalım. Toplu
              siparişlerde ek indirim, kurumsal cari hesap imkânı.
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

function EmptyState() {
  return (
    <div className="text-center">
      <div className="mx-auto max-w-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center">
          <Gift size={30} weight="fill" />
        </div>
        <h2 className="mt-5 text-2xl md:text-3xl font-serif text-ink-900">
          Sana özel paket hazırlayalım
        </h2>
        <p className="mt-3 text-ink-700 leading-relaxed">
          Hazır paketlerimiz çok yakında burada. O zamana kadar ürünlerimizi keşfedebilir ya da
          işine birebir uyan bir kombinasyon için özel teklif alabilirsin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/urunler">
            <Button size="lg">
              Ürünleri Keşfet <ArrowRight size={16} weight="bold" />
            </Button>
          </Link>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 px-5 h-12 rounded-lg border border-paper-200 text-ink-900 hover:bg-paper-100 transition-colors font-medium"
          >
            Özel Paket İste
          </Link>
        </div>
      </div>

      {/* Sektör kartları — "neler hazırlıyoruz" */}
      <div className="mt-12">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-4">
          Sektörüne göre paketler
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sectors.map((s) => (
            <div
              key={s.id}
              className="flex flex-col items-center text-center gap-2 rounded-xl border border-paper-200 bg-paper-50 px-3 py-5"
            >
              <div className="w-11 h-11 rounded-lg bg-paper-100 text-brand-700 grid place-items-center">
                <s.icon size={22} weight="fill" />
              </div>
              <div className="text-sm font-semibold text-ink-900">{s.label}</div>
              <div className="text-[11px] text-ink-500 leading-snug">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BundleCard({ bundle }: { bundle: CampaignBundle }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const [added, setAdded] = useState(false);

  const savings = bundle.originalPrice - bundle.bundlePrice;
  const savingsPercent = Math.round((savings / bundle.originalPrice) * 100);

  // Mock paketlerin statik /images/bundles/*.jpg dosyaları yok (404). Hem mock hem DB paketleri için
  // kategori bazlı branded mockup'a düş (DB paketleri zaten /api/mockup imageUrl'ü taşıyor).
  const imgSrc =
    bundle.imageUrl && !bundle.imageUrl.startsWith("/images/bundles/")
      ? bundle.imageUrl
      : `/api/mockup?category=${bundle.category}&w=800&h=600&theme=brand`;

  function handleAdd() {
    const summary = bundle.contents
      .map((c) => `${c.quantity} × ${c.productName}`)
      .join(" · ");
    addItem({
      productSlug: bundle.slug,
      productName: bundle.name,
      productImage: imgSrc,
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
          src={imgSrc}
          alt={bundle.name}
          fill
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
