"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { Button } from "@markala/ui";
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

export function Configurator({ product, rating: ratingProp }: { product: Product; rating?: { average: number; count: number } }) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, dispatch] = useReducer(configuratorReducer, product, initState);
  const [kdvDahil, setKdvDahil] = useState(true);

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

  const total = useMemo(
    () => calculateTotal(product, effSel),
    [product, effSel],
  );

  const priceHintsMap = useMemo(
    () => optionPriceHints(product, effSel),
    [product, effSel],
  );

  const canBuy = total > 0;

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

        {/* KDV dahil / hariç toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-ink-700">KDV Dahil Fiyatlar</span>
          <button
            type="button"
            role="switch"
            aria-checked={kdvDahil}
            onClick={() => setKdvDahil((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
              kdvDahil ? "bg-ink-900" : "bg-paper-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-paper-50 shadow transition-transform ${
                kdvDahil ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="space-y-6 pt-2">
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
              hintMode={groupHintMode(product, group.groupKey)}
            />
          ))}
          <DesignUpload />
        </div>

        <PriceCard total={show(total)} kdvLabel={kdvDahil ? "KDV dahil" : "KDV hariç"} />

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

        <MobileCta
          total={show(total)}
          onAddToCart={canBuy ? handleAddToCart : handleQuoteClick}
        />

        <p className="text-xs text-ink-500 text-center">
          Sepete eklediğinizde üretim başlamaz — onay sonrası matbaa süreci başlar.
        </p>
      </div>
    </ConfiguratorContext.Provider>
  );
}
