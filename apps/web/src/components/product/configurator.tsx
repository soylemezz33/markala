"use client";

import { useMemo, useReducer } from "react";
import { Button } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, ChatCircleText } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import { calculateTotal, buildSelectionSummary } from "@/lib/configurator";
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

export function Configurator({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, dispatch] = useReducer(configuratorReducer, product, initState);

  const total = useMemo(
    () => calculateTotal(product, state.selections),
    [product, state.selections],
  );

  const canBuy = total > 0;

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
        selections: state.selections,
        summary: buildSelectionSummary(product, state.selections, state.needsDesign),
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
            {product.rating && (
              <>
                <span className="text-brand-500">★</span>
                <span className="font-medium text-ink-900">
                  {product.rating.average.toFixed(1)}
                </span>
                <span>({product.rating.count} yorum)</span>
                <span className="mx-1 text-paper-200">·</span>
              </>
            )}
            <span>Üretim: {product.productionTime}</span>
          </div>
        </div>

        <p className="text-ink-700 leading-relaxed">{product.shortDescription}</p>

        <EstimatedDelivery productionTime={product.productionTime} />

        <div className="space-y-6 pt-2">
          {groups.map((group) => (
            <OptionGroup
              key={group.groupKey}
              groupKey={group.groupKey}
              groupLabel={group.groupLabel}
              options={group.options}
              selected={state.selections[group.groupKey] ?? ""}
              locked={group.locked}
              onSelect={(optionKey) =>
                dispatch({ type: "SET_SELECTION", groupKey: group.groupKey, optionKey })
              }
            />
          ))}
          <DesignUpload />
        </div>

        <PriceCard total={total} />

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
          total={total}
          onAddToCart={canBuy ? handleAddToCart : handleQuoteClick}
        />

        <p className="text-xs text-ink-500 text-center">
          Sepete eklediğinizde üretim başlamaz — onay sonrası matbaa süreci başlar.
        </p>
      </div>
    </ConfiguratorContext.Provider>
  );
}
