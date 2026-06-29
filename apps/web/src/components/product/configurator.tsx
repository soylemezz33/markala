"use client";

import { useCallback, useMemo, useReducer, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, ChatCircleText, PaintBrush } from "@phosphor-icons/react";
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
  DEFAULT_PRICING,
  type PricingSettings,
  type OptionRulesLite,
} from "@/lib/configurator";
import { exVat } from "@/lib/vat";
import { useCartStore } from "@/lib/cart-store";
import { designSpecKeyForProduct } from "@/lib/design/canvas-spec";
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

  const total = useMemo(() => {
    if (isArea) {
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
      return computeAreaPrice(product.options as never, rows, effSel, pricing).dahil;
    }
    return calculateTotal(product, effSel);
  }, [isArea, product, effSel, pricing]);

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

  const router = useRouter();
  // Online tasarım aracı: ürün editör spec'ine eşleşiyorsa "Online Tasarla" CTA gösterilir.
  const designSpecKey = useMemo(
    () =>
      designSpecKeyForProduct({
        slug: product.slug,
        name: product.name,
        categorySlug: (product as { categorySlug?: string }).categorySlug,
      }),
    [product],
  );

  // Mevcut konfigürasyon (seçim + fiyat) editöre taşınır → "Sepete Ekle"de doğru fiyatla geri döner.
  function openDesigner() {
    if (!designSpecKey) return;
    try {
      sessionStorage.setItem(
        "mk_design_ctx",
        JSON.stringify({
          productSlug: product.slug,
          productName: product.name,
          productImage: product.images[0] || `/api/mockup?slug=${product.slug}&w=200&h=200`,
          selections: effSel,
          summary: buildSelectionSummary(product, effSel, state.needsDesign),
          totalPrice: total,
          quantity: state.quantity,
          specKey: designSpecKey,
        }),
      );
    } catch {
      /* sessionStorage erişilemezse editör boş bağlamla açılır */
    }
    router.push(`/tasarim-araci?urun=${designSpecKey}&from=${encodeURIComponent(product.slug)}`);
  }

  function handleAddToCart() {
    if (!canBuy) return;
    addItem({
      productSlug: product.slug,
      productName: product.name,
      productImage:
        product.images[0] || `/api/mockup?slug=${product.slug}&w=200&h=200`,
      configuration: {
        selections: effSel,
        summary: buildSelectionSummary(product, effSel, state.needsDesign),
        totalPrice: total,
        needsDesign: state.needsDesign,
        uploadedFileName: state.uploadedFileName,
        uploadedFileUrl: state.uploadedFileUrl,
      },
      quantity: state.quantity,
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

        <EstimatedDelivery productionTime={product.productionTime} />

        <div className="space-y-6 pt-2">
          {isArea && <AreaField minM2={pricing.minM2} />}
          {groups.map((group) => (
            <OptionGroup
              key={group.groupKey}
              groupKey={group.groupKey}
              groupLabel={group.groupLabel}
              options={
                dimFilter && group.groupKey === dimFilter.groupKey
                  ? group.options.filter((o) => dimFilter.keys.has(o.optionKey))
                  : group.options
              }
              selected={effSel[group.groupKey] ?? baseSelections[group.groupKey] ?? ""}
              locked={group.locked}
              disabled={resolved.disabledGroups.has(group.groupKey)}
              onSelect={(optionKey) => handleSelect(group.groupKey, optionKey)}
              priceHints={displayedPriceHints[group.groupKey]}
              hintMode={isArea && group.groupKey === "malzeme" ? "total" : groupHintMode(product, group.groupKey)}
              layout={isArea && group.groupKey === "malzeme" ? "cards" : "auto"}
              unitSuffix={isArea && group.groupKey === "malzeme" ? "/m²" : undefined}
            />
          ))}
          {designSpecKey && (
            <button
              type="button"
              onClick={openDesigner}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-ink-900 text-paper-50 font-semibold hover:bg-ink-800 transition-colors"
            >
              <PaintBrush size={18} weight="fill" /> Online Tasarla
            </button>
          )}
          <DesignUpload />
        </div>

        <PriceCard total={show(total)} kdvLabel={kdvDahil ? "KDV dahil" : "KDV hariç"} />

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
            ? "Sepete eklediğinizde üretim başlamaz — onay sonrası matbaa süreci başlar."
            : "Bu ürün için size özel fiyat veriyoruz. Teklif Al'a tıklayın, 24 saat içinde size dönelim — hiçbir ödeme veya taahhüt yok."}
        </p>
      </div>
    </ConfiguratorContext.Provider>
  );
}
