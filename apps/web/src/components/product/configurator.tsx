"use client";

import { useMemo, useReducer } from "react";
import { Button } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import { buildSummary, calculatePrice } from "@/lib/configurator";
import { useCartStore } from "@/lib/cart-store";
import {
  ConfiguratorContext,
  configuratorReducer,
  initState,
  ParameterField,
  DesignUpload,
  PriceCard,
  MobileCta,
} from "./configurator-fields";
import { EstimatedDelivery } from "./estimated-delivery";

export function Configurator({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, dispatch] = useReducer(configuratorReducer, product, initState);

  const breakdown = useMemo(
    () => calculatePrice(product, { selections: state.selections }),
    [product, state.selections],
  );

  function handleAddToCart() {
    addItem({
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images[0] || `/api/mockup?slug=${product.slug}&w=200&h=200`,
      configuration: {
        selections: state.selections,
        summary: buildSummary(product, { selections: state.selections }, state.needsDesign),
        totalPrice: breakdown.total,
        needsDesign: state.needsDesign,
        uploadedFileName: state.uploadedFileName,
      },
    });
    dispatch({ type: "MARK_ADDED", value: true });
    setTimeout(() => dispatch({ type: "MARK_ADDED", value: false }), 1500);
  }

  return (
    <ConfiguratorContext.Provider value={{ state, dispatch, product }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-display-md font-serif text-ink-900">{product.name}</h1>
          {product.rating && (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
              <span className="text-brand-500">★</span>
              <span className="font-medium text-ink-900">{product.rating.average.toFixed(1)}</span>
              <span>({product.rating.count} yorum)</span>
              <span className="mx-1 text-paper-200">·</span>
              <span>Üretim: {product.productionTime}</span>
            </div>
          )}
        </div>

        <p className="text-ink-700 leading-relaxed">{product.shortDescription}</p>

        <EstimatedDelivery productionTime={product.productionTime} />

        <div className="space-y-6 pt-2">
          {product.parameters.map((param) => (
            <ParameterField key={param.id} param={param} />
          ))}
          <DesignUpload />
        </div>

        <PriceCard breakdown={breakdown} />

        <Button size="lg" fullWidth onClick={handleAddToCart} disabled={state.justAdded}>
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

        <MobileCta total={breakdown.total} onAddToCart={handleAddToCart} />

        <p className="text-xs text-ink-500 text-center">
          Sepete eklediğinizde üretim başlamaz — onay sonrası matbaa süreci başlar.
        </p>
      </div>
    </ConfiguratorContext.Provider>
  );
}
