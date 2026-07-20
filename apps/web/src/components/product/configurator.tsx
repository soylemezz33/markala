"use client";

import { useCallback, useMemo, useReducer, useState, useRef, useEffect } from "react";
import { Button, Price } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, ChatCircleText } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import {
  calculateTotal,
  buildSelectionSummary,
  resolveRules,
  effectiveSelections,
  optionPriceHints,
  groupHintMode,
  availablePriceDimKeys,
  computeAreaPrice,
  adetTierBadges,
  DEFAULT_PRICING,
  type PricingSettings,
  type OptionRulesLite,
} from "@/lib/configurator";
import { exVat } from "@/lib/vat";
import { useCartStore } from "@/lib/cart-store";
import {
  ConfiguratorContext,
  configuratorReducer,
  initState,
  OptionGroup,
  DesignUpload,
  AreaField,
  PriceCard,
  MobileCta,
} from "./configurator-fields";
import { EstimatedDelivery } from "./estimated-delivery";

// Tip — API'den gelen product.options her satırı bu şekildedir
interface RawOption {
  groupKey: string;
  groupLabel: string;
  groupRole: "dimension" | "priced";
  groupSort: number;
  optionKey: string;
  optionLabel: string;
  optionSublabel?: string | null;
  optionSort: number;
  locked?: boolean;
  rules?: OptionRulesLite | null;
}

interface OptionGroupData {
  groupKey: string;
  groupLabel: string;
  groupSort: number;
  locked: boolean;
  options: Array<{
    optionKey: string;
    optionLabel: string;
    optionSublabel?: string | null;
    optionSort: number;
  }>;
}

function buildGroups(raw: unknown[]): OptionGroupData[] {
  const opts = raw as RawOption[];
  const map = new Map<string, OptionGroupData>();
  for (const o of opts) {
    if (!map.has(o.groupKey)) {
      map.set(o.groupKey, {
        groupKey: o.groupKey,
        groupLabel: o.groupLabel,
        groupSort: o.groupSort,
        locked: !!o.locked,
        options: [],
      });
    }
    map.get(o.groupKey)!.options.push({
      optionKey: o.optionKey,
      optionLabel: o.optionLabel,
      optionSublabel: o.optionSublabel,
      optionSort: o.optionSort,
    });
  }
  return [...map.values()].sort((a, b) => a.groupSort - b.groupSort);
}

export function Configurator({ product, rating: ratingProp, pricing = DEFAULT_PRICING }: { product: Product; rating?: { average: number; count: number }; pricing?: PricingSettings }) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, dispatch] = useReducer(configuratorReducer, product, initState);
  // Fiyatlar tüm sitede DAİMA KDV dahil gösterilir (B2C yasal gereği + sepet/ödeme ile tutarlı).
  // Eski KDV dahil/hariç toggle'ı kaldırıldı; gösterim mantığı sabit dahil olarak korunur.
  const kdvDahil = true;

  // Flat list of all options with their rules — memoized on product.options
  const optionsWithRules = useMemo(
    () =>
      ((product.options ?? []) as unknown as RawOption[]).map((o) => ({
        groupKey: o.groupKey,
        optionKey: o.optionKey,
        rules: o.rules ?? null,
      })),
    [product.options],
  );

  // Seyrek matris: fiyat-boyutu (adet) grubunun, seçili ebat için GEÇERLİ değerleri.
  // null → filtreleme yok (tam ızgara veya fiyatsız ürün).
  const dimFilter = useMemo(
    () => availablePriceDimKeys(product, state.selections),
    [product, state.selections],
  );

  // Geçersiz kalan fiyat-boyutu seçimini (örn. A5 + 2000) ilk GEÇERLİ değere çek —
  // sayfa "Teklif Al" yerine doğrudan fiyatlı açılsın. Ham kullanıcı niyeti state'te kalır;
  // düzeltme türetilmiştir (gizli option seçili kalmaz).
  const baseSelections = useMemo(() => {
    if (!dimFilter) return state.selections;
    const cur = state.selections[dimFilter.groupKey];
    if (cur && dimFilter.keys.has(cur)) return state.selections;
    const firstValid = ((product.options ?? []) as unknown as RawOption[])
      .filter((o) => o.groupKey === dimFilter.groupKey)
      .sort((a, b) => a.optionSort - b.optionSort)
      .find((o) => dimFilter.keys.has(o.optionKey));
    return firstValid
      ? { ...state.selections, [dimFilter.groupKey]: firstValid.optionKey }
      : state.selections;
  }, [state.selections, dimFilter, product.options]);

  const resolved = useMemo(
    () => resolveRules(optionsWithRules, baseSelections),
    [optionsWithRules, baseSelections],
  );

  const effSel = useMemo(
    () => effectiveSelections(baseSelections, resolved),
    [baseSelections, resolved],
  );

  const isArea = (product as { pricingMode?: string }).pricingMode === "area";

  // Area: geçerli ölçü = en>0 && boy>0. Ölçü girilmeden min-1m² clamp'i ile sahte fiyat
  // göstermeyi önler (müşteri ölçü girmeden fiyat görmesin / ölçüsüz sepete eklemesin).
  const hasValidSize = !isArea || (Number(effSel.en) > 0 && Number(effSel.boy) > 0);

  // Area: BİRİM (tek parça) fiyat — "adet" HARİÇ hesaplanır (adet artık sepet adedidir).
  const unitArea = useMemo(() => {
    if (!isArea) return 0;
    if (!(Number(effSel.en) > 0 && Number(effSel.boy) > 0)) return 0; // ölçü yok → fiyat yok
    const rows = ((product.prices ?? []) as unknown as Array<{
      groupKey: string | null;
      optionKey: string | null;
      dimKey: string | null;
      price: unknown;
      cost?: unknown;
    }>).map((r) => ({
      groupKey: r.groupKey,
      optionKey: r.optionKey,
      dimKey: r.dimKey,
      price: Number(r.price),
      cost: r.cost == null ? null : Number(r.cost),
    }));
    // adet="1" ZORLA → tek parça birim fiyatı. Toplam = birim × adet (aşağıda).
    return computeAreaPrice(product.options as never, rows, { ...effSel, adet: "1" }, pricing).dahil;
  }, [isArea, product, effSel, pricing]);

  // Girilen "adet" area'da SEPET ADEDİ olur (additive'de sepet adedi state.quantity=1).
  const areaAdet = isArea ? Math.max(1, Number(effSel.adet) || 1) : state.quantity;

  const total = useMemo(
    () => (isArea ? unitArea * areaAdet : calculateTotal(product, effSel)),
    [isArea, unitArea, areaAdet, product, effSel],
  );

  const priceHintsMap = useMemo(() => {
    // Area: her malzemenin 1 m² (KDV dahil) fiyatını ipucu olarak göster → müşteri
    // malzeme seçmeden fiyat farkını görür. computeAreaPrice ile birim-m² fiyat.
    if (isArea) {
      const rows = ((product.prices ?? []) as unknown as Array<{
        groupKey: string | null; optionKey: string | null; dimKey: string | null; price: unknown; cost?: unknown;
      }>).map((r) => ({
        groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey,
        price: Number(r.price), cost: r.cost == null ? null : Number(r.cost),
      }));
      const opts = (product.options ?? []) as never[];
      const matHints: Record<string, number> = {};
      for (const o of (product.options ?? []) as Array<{ groupKey: string; optionKey: string }>) {
        if (o.groupKey !== "malzeme") continue;
        matHints[o.optionKey] = computeAreaPrice(opts, rows, { malzeme: o.optionKey, en: "100", boy: "100", adet: "1" }, pricing).dahil;
      }
      return { malzeme: matHints };
    }
    return optionPriceHints(product, effSel);
  }, [isArea, product, effSel, pricing]);

  // Area: seçili malzemenin maxM2'sini aşan ölçü sipariş edilemez (basılamaz).
  const areaMaxExceeded = useMemo(() => {
    if (!isArea) return false;
    const en = Number(effSel.en) || 0;
    const boy = Number(effSel.boy) || 0;
    const alan = (en * boy) / 10000;
    if (alan <= 0) return false;
    const opt = ((product.options ?? []) as Array<{ groupKey: string; optionKey: string; rules?: { maxM2?: number } | null }>).find(
      (o) => o.groupKey === "malzeme" && o.optionKey === effSel.malzeme,
    );
    const maxM2 = opt?.rules?.maxM2;
    return typeof maxM2 === "number" && maxM2 > 0 && alan > maxM2;
  }, [isArea, effSel, product.options]);

  const canBuy = total > 0 && !areaMaxExceeded;

  // Area başlangıç fiyatı: ölçü girilmeden gösterilecek "X₺'den başlayan".
  // = minM2 × en-ucuz malzemenin m²-fiyatı (KDV dahil, priceHintsMap.malzeme'den).
  // Müşteri "Teklif Al" yerine erişilebilir bir giriş fiyatı görür; ölçü girince gerçek fiyata döner.
  const startingPrice = useMemo(() => {
    if (!isArea) return 0;
    const hints = Object.values(
      (priceHintsMap as { malzeme?: Record<string, number> }).malzeme ?? {},
    ).filter((v) => typeof v === "number" && v > 0);
    if (hints.length === 0) return 0;
    // Temiz üst tam sayı (kartla aynı: getDisplayPrice area'da Math.ceil) — "115,92'den" yerine "116'dan".
    return Math.ceil(pricing.minM2 * Math.min(...hints));
  }, [isArea, priceHintsMap, pricing.minM2]);

  // CTA "Teklif Al"a düştüğünde sebebi açıkla (buton sessizce değişmesin).
  const ctaReason = useMemo(() => {
    if (!isArea || canBuy) return null;
    if (!hasValidSize) return "Fiyat için en ve boy ölçüsünü girin.";
    if (areaMaxExceeded) return "Bu ölçü tek parça üretim sınırını aşıyor — özel teklif alın.";
    return null;
  }, [isArea, canBuy, hasValidSize, areaMaxExceeded]);

  /** Gösterim dönüşümü: KDV dahil modda ham değer, hariç modda exVat uygular. */
  const show = (n: number) => (kdvDahil ? n : exVat(n));

  /** Fiyat ipuçlarını kdvDahil durumuna göre dönüştür. */
  const displayedPriceHints = useMemo(() => {
    if (kdvDahil) return priceHintsMap;
    const result: typeof priceHintsMap = {};
    for (const [groupKey, hints] of Object.entries(priceHintsMap)) {
      if (!hints) { result[groupKey] = hints; continue; }
      const converted: Record<string, number> = {};
      for (const [optionKey, val] of Object.entries(hints)) {
        converted[optionKey] = Number.isFinite(val) ? exVat(val as number) : (val as number);
      }
      result[groupKey] = converted;
    }
    return result;
  }, [priceHintsMap, kdvDahil]);

  const groups = useMemo(
    () => buildGroups((product.options ?? []) as unknown[]),
    [product.options],
  );

  // Hacim indirimi YALNIZ "adet" ayrı çarpan-boyutu olan lineer ürünlerde (İSG) uygulanır: adet
  // dimension VAR ve BAŞKA bir dimension (ör. ebat) da var. Matris (kartvizit, tek dimension=adet
  // → adet fiyat-boyutu) ve area ürünler bu koşulu sağlamaz → rozet gösterilmez (fiyata da etkisiz).
  const hasVolumeAdet = useMemo(() => {
    const dims = new Set<string>();
    for (const o of (product.options ?? []) as RawOption[]) {
      if (o.groupRole === "dimension") dims.add(o.groupKey);
    }
    return dims.has("adet") && [...dims].some((k) => k !== "adet");
  }, [product.options]);

  // Sabit alt bar (fiyat + Sepete Ekle) görünürlüğü: gerçek (kolon-içi) CTA ekranda
  // görünürken bar gizlenir → footer örtülmez, çift buton olmaz; aksi halde bar görünür.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setStickyBarVisible(!entry.isIntersecting);
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function handleAddToCart() {
    if (!canBuy) return;
    addItem({
      productSlug: product.slug,
      productName: product.name,
      productImage:
        product.images[0] || `/api/mockup?slug=${product.slug}&w=200&h=200`,
      configuration: {
        // Area: "adet" sepet adedine taşınır → saklanan selections'ta adet="1"
        // (server computeAreaPrice(adet=1) × quantity = birim × adet ile aynı sonuç).
        selections: isArea ? { ...effSel, adet: "1" } : effSel,
        summary: buildSelectionSummary(product, effSel, state.needsDesign),
        totalPrice: isArea ? unitArea : total, // BİRİM fiyat (sepet satırı = totalPrice × quantity)
        needsDesign: state.needsDesign,
        uploadedFileName: state.uploadedFileName,
        uploadedFileUrl: state.uploadedFileUrl,
      },
      quantity: areaAdet, // area: girilen adet; additive: 1
    });
    dispatch({ type: "JUST_ADDED", value: true });
    setTimeout(() => dispatch({ type: "JUST_ADDED", value: false }), 1500);
  }

  const handleSelect = useCallback(
    (groupKey: string, optionKey: string) =>
      dispatch({ type: "SET_SELECTION", groupKey, optionKey }),
    [],
  );

  function handleQuoteClick() {
    const msg = encodeURIComponent(
      `Merhaba, "${product.name}" ürünü için teklif almak istiyorum.`,
    );
    window.open(`https://wa.me/905319004102?text=${msg}`, "_blank");
  }

  return (
    <ConfiguratorContext.Provider value={{ state, dispatch, product }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-display-md font-serif text-ink-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
            {(() => { const rating = ratingProp ?? product.rating; return rating && rating.count > 0 ? (
              <>
                <span className="text-brand-500">★</span>
                <span className="font-medium text-ink-900">
                  {rating.average.toFixed(1)}
                </span>
                <span>({rating.count} yorum)</span>
                <span className="mx-1 text-paper-200">·</span>
              </>
            ) : null; })()}
            <span>Üretim: {product.productionTime}</span>
          </div>
        </div>

        <p className="text-ink-700 leading-relaxed">{product.shortDescription}</p>

        {/* Büyük per-adet fiyat — ürünün yanında (KDV dahil). Fiyatsız üründe gizli;
            alttaki PriceCard zaten "Teklif Al"ı gösterir. Diğer içerik değişmedi. */}
        {canBuy ? (
          <div className="border-t border-paper-200 pt-5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Price amount={show(total)} size="xl" className="text-brand-600 tabular-nums" />
              {areaAdet > 1 && (
                <span className="text-base text-ink-500">/ {areaAdet} adet</span>
              )}
            </div>
            {areaAdet > 1 && (
              <p className="mt-1 text-sm text-ink-500">
                Birim:{" "}
                <Price amount={show(total / areaAdet)} size="sm" className="text-ink-700 align-baseline" />{" "}
                / adet · KDV dahil
              </p>
            )}
          </div>
        ) : isArea && startingPrice > 0 ? (
          // Ölçü girilmeden başlangıç fiyatı — "Teklif Al" hissini kırar, erişilebilir giriş fiyatı gösterir.
          <div className="border-t border-paper-200 pt-5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <Price amount={show(startingPrice)} size="xl" className="text-brand-600 tabular-nums" />
              <span className="text-base text-ink-500">'den başlayan</span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {kdvDahil ? "KDV dahil" : "KDV hariç"} · en/boy ölçüsünü girin, fiyatınız anında hesaplansın.
            </p>
          </div>
        ) : null}

        <EstimatedDelivery productionTime={product.productionTime} />

        <div className="space-y-6 pt-2">
          {isArea && <AreaField minM2={pricing.minM2} />}
          {groups.map((group) => {
            const visibleOptions =
              dimFilter && group.groupKey === dimFilter.groupKey
                ? group.options.filter((o) => dimFilter.keys.has(o.optionKey))
                : group.options;
            // Tiraj rozetleri ("Önerilen" / "En avantajlı") — yalnız adet grubunda ve
            // İSG -%N rozetiyle çakışmayacak ürünlerde. Gizli (seyrek matris) kademeler
            // rozet alamaz; band/eşik mantığı adetTierBadges'ta.
            const tierBadges =
              group.groupKey === "adet" && !isArea && !hasVolumeAdet
                ? adetTierBadges(
                    displayedPriceHints["adet"],
                    new Set(visibleOptions.map((o) => o.optionKey)),
                  )
                : undefined;
            return (
              <OptionGroup
                key={group.groupKey}
                groupKey={group.groupKey}
                groupLabel={group.groupLabel}
                options={visibleOptions}
                selected={effSel[group.groupKey] ?? baseSelections[group.groupKey] ?? ""}
                locked={group.locked}
                disabled={resolved.disabledGroups.has(group.groupKey)}
                onSelect={(optionKey) => handleSelect(group.groupKey, optionKey)}
                priceHints={displayedPriceHints[group.groupKey]}
                hintMode={isArea && group.groupKey === "malzeme" ? "total" : groupHintMode(product, group.groupKey)}
                layout={isArea && group.groupKey === "malzeme" ? "cards" : "auto"}
                unitSuffix={isArea && group.groupKey === "malzeme" ? "/m²" : undefined}
                volumeBadge={hasVolumeAdet && group.groupKey === "adet"}
                tierBadges={tierBadges}
              />
            );
          })}
          <DesignUpload />
        </div>

        <PriceCard
          total={show(total)}
          kdvLabel={kdvDahil ? "KDV dahil" : "KDV hariç"}
          // Fiyat şoku önleme: büyük rakamın NEYİN karşılığı olduğunu fiyatın yanında söyle
          // (ör. "1.000 adet için" / "60×150 cm için · 2 adet").
          context={
            isArea
              ? Number(effSel.en) > 0 && Number(effSel.boy) > 0
                ? `${effSel.en}×${effSel.boy} cm için${areaAdet > 1 ? ` · ${areaAdet} adet` : ""}`
                : undefined
              : effSel.adet && Number(effSel.adet) > 0
                ? `${Number(effSel.adet).toLocaleString("tr-TR")} adet için`
                : undefined
          }
        />

        {ctaReason && (
          <p className="text-xs text-ink-500 -mt-2">{ctaReason}</p>
        )}

        <div ref={ctaRef}>
          {canBuy ? (
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={state.justAdded}
            >
              {state.justAdded ? (
                <>
                  <CheckCircle size={20} weight="bold" /> Sepete Eklendi
                </>
              ) : (
                <>
                  <ShoppingBagOpen size={20} weight="bold" /> Sepete Ekle
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={handleQuoteClick}
            >
              <ChatCircleText size={20} weight="bold" /> Teklif Al / WhatsApp
            </Button>
          )}
        </div>

        <MobileCta
          total={show(total)}
          canBuy={canBuy}
          productName={product.name}
          visible={stickyBarVisible}
          onAddToCart={canBuy ? handleAddToCart : handleQuoteClick}
        />

        <p className="text-xs text-ink-500 text-center">
          {canBuy
            ? "Sepete eklediğinde üretim başlamaz — onay sonrası matbaa süreci başlar."
            : "Bu ürün için sana özel fiyat veriyoruz. Teklif Al'a tıkla, 24 saat içinde sana dönelim — hiçbir ödeme veya taahhüt yok."}
        </p>
      </div>
    </ConfiguratorContext.Provider>
  );
}
