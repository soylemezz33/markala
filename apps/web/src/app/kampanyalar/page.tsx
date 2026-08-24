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

// Boş durum + hero için sektör kartları. `quote` = /teklif-al SECTORS listesindeki BİREBİR değer
// (tıklanınca sektörü ön-seçer; eşleşmeyen değer sessizce hiçbir şey yapar).
const sectors: {
  id: CampaignBundleCategory;
  label: string;
  desc: string;
  icon: typeof Storefront;
  quote: string;
}[] = [
  { id: "esnaf", label: "Esnaf", desc: "Dükkan & küçük işletme", icon: Storefront, quote: "Mağaza & Perakende" },
  { id: "kurumsal", label: "Kurumsal", desc: "Ofis & marka kimliği", icon: Buildings, quote: "Kurumsal / Ofis" },
  { id: "etkinlik", label: "Etkinlik", desc: "Fuar, lansman, organizasyon", icon: Confetti, quote: "Etkinlik & Organizasyon" },
  { id: "acilis", label: "Açılış", desc: "Yeni açılan mekanlar", icon: Sparkle, quote: "Diğer" },
  { id: "promosyon", label: "Promosyon", desc: "Hediyelik & tanıtım", icon: Gift, quote: "Diğer" },
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
      {/* Kompakt başlık — eski dev hero + değer şeridi kaldırıldı (Hasan, 2026-08-25:
          "çok büyük ve yer kaplıyor"). Paketler ilk ekranda görünür. */}
      <section className="border-b border-paper-200 bg-paper-50">
        <Container className="py-8 md:py-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-ink-900">İndirimli Paketler</h1>
            <p className="mt-2 text-ink-700 max-w-2xl">
              Açılış, esnaf, kurumsal ve etkinlik için hazır kurgulanmış paketler — tek tıkla
              sepete, tasarım desteği dahil, tek tek almaktan daha ucuz.
            </p>
          </div>
          <Link
            href="/teklif-al"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            Özel Teklif Al <ArrowRight size={14} weight="bold" />
          </Link>
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
                    ? "bg-[#4B3AA0] text-paper-50"
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

        {/* B2B kurumsal CTA — yalnız paket VARKEN göster (boş durumda EmptyState zaten
            özel-teklif CTA'sını taşıyor; tekrar + boşluk olmasın). */}
        {hasBundles && (
          <section className="mt-16 overflow-hidden rounded-2xl border border-paper-200 bg-gradient-to-br from-paper-100 to-paper-50 p-8 md:p-10 grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-serif text-ink-900">İhtiyacın özel mi?</h3>
              <p className="mt-2 text-ink-700 max-w-xl">
                Hazır paketler işine uymuyorsa sana özel bir kombinasyon hazırlayalım. Toplu
                siparişlerde ek indirim, kurumsal cari hesap imkânı.
              </p>
            </div>
            <div className="md:text-right">
              <Link href="/teklif-al">
                <Button size="lg">
                  Özel Teklif Al <ArrowRight size={16} weight="bold" />
                </Button>
              </Link>
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}

function EmptyState() {
  const steps = [
    { n: "1", icon: CheckCircle, title: "İhtiyacını seç", desc: "Ürünleri ve adetleri birlikte belirleyelim" },
    { n: "2", icon: Lightning, title: "24 saatte teklif", desc: "Paket fiyatını ve tasarımı hazırlayalım" },
    { n: "3", icon: Package, title: "Tek teslimde al", desc: "Hepsi birlikte basılır, tek seferde gelir" },
  ];
  return (
    <div className="text-center">
      <div className="mx-auto max-w-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center">
          <Gift size={30} weight="fill" />
        </div>
        <h2 className="mt-5 text-2xl md:text-3xl font-serif text-ink-900">
          Sana özel paket kuruyoruz
        </h2>
        <p className="mt-3 text-ink-700 leading-relaxed">
          İşine göre ürünleri seçip indirimli tek pakette topluyoruz — tasarım dahil, tek
          teslimde. Ne lazım olduğunu söyle, 24 saat içinde sana özel teklifi hazırlayalım.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/teklif-al">
            <Button size="lg">
              Özel Paket İste <ArrowRight size={16} weight="bold" />
            </Button>
          </Link>
          <Link
            href="/urunler"
            className="inline-flex items-center gap-2 px-5 h-12 rounded-lg border border-paper-200 text-ink-900 hover:bg-paper-100 transition-colors font-medium"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </div>

      {/* Nasıl çalışır — 3 adım (boş sayfayı bilgilendirici içerikle doldurur) */}
      <div className="mt-12 grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-paper-200 bg-paper-50 p-5">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-sm font-bold tabular-nums">
                {s.n}
              </span>
              <s.icon size={18} weight="fill" className="text-brand-700" />
            </div>
            <div className="mt-3 text-sm font-semibold text-ink-900">{s.title}</div>
            <div className="mt-1 text-[13px] text-ink-500 leading-snug">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Sektör kartları — tıklanınca sektör ön-seçili teklif formuna gider */}
      <div className="mt-12">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-4">
          Sektörüne göre paket iste
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sectors.map((s) => (
            <Link
              key={s.id}
              href={`/teklif-al?sektor=${encodeURIComponent(s.quote)}`}
              className="group flex flex-col items-center text-center gap-2 rounded-xl border border-paper-200 bg-paper-50 px-3 py-5 hover:border-ink-300 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-lg bg-paper-100 text-brand-700 grid place-items-center group-hover:bg-brand-100 transition-colors">
                <s.icon size={22} weight="fill" />
              </div>
              <div className="text-sm font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                {s.label}
              </div>
              <div className="text-[11px] text-ink-500 leading-snug">{s.desc}</div>
            </Link>
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
  // Pakete özel tasarlanmış görseller (public/images/kampanyalar) indirim yüzdesini ve
  // logoyu ZATEN içerir — rozet bindirmek bilgiyi çiftler, logonun üstüne biner. Mockup
  // fallback'inde rozetler kalır (o görselde bilgi yok).
  const customArt = imgSrc.startsWith("/images/kampanyalar/");

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
        {!customArt && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-1 rounded-sm text-[11px] font-medium tracking-wide bg-error text-paper-50">
            {bundle.badge}
          </span>
          <span className="px-2.5 py-1 rounded-sm text-[11px] font-medium tracking-wide bg-brand-500 text-ink-900">
            %{savingsPercent} İNDİRİM
          </span>
        </div>
        )}
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
        {/* min-h + line-clamp: açıklama 1 ya da 2 satır olsa da kartlar aynı hizada kalır
            (Hasan, 2026-08-25: kartlar arası yazı hizası tutarsızdı). */}
        <p className="mt-2 text-sm text-ink-700 leading-relaxed line-clamp-2 min-h-[2.85rem]">{bundle.description}</p>

        {/* İçerik — mb-5: fiyat bloğu mt-auto ile alta yaslandığında bile asgari boşluk kalsın */}
        <div className="mt-4 mb-5 p-4 bg-paper-100 rounded-lg">
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

        {/* Fiyat + CTA — mt-auto: içerik listesi kısa/uzun fark etmeksizin fiyat ve buton
            tüm kartlarda AYNI hizada (alta yaslı) durur. */}
        <div className="mt-auto pt-5 border-t border-paper-200 flex items-end justify-between gap-3">
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
