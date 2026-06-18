"use client";

import { useEffect, useMemo, useState } from "react";
import { products as mockProducts } from "@markala/mock-data";
import type { Product } from "@markala/types";
import { apiClient } from "@/lib/api";
import { ArrowSquareOut, Calculator } from "@phosphor-icons/react";

const SITE = "https://markala.com.tr";

interface PackageOption {
  id: string;
  label: string;
  unitPrice: number;
}

interface QuantityOption {
  id: string;
  label: string;
  multiplier: number;
}

/**
 * Bir matrix-tipi parametreden paket ve adet seçeneklerini çıkar.
 * Konfigüratör mantığının basitleştirilmiş kopyası.
 */
function getMatrixData(p: Product): {
  packages: PackageOption[];
  quantities: QuantityOption[];
  baseCells: Map<string, number>;
} | null {
  const matrix = p.parameters?.find((par) => par.kind === "matrix");
  if (!matrix?.rows || !matrix.cols || !matrix.cells) return null;

  const packages: PackageOption[] = matrix.rows.map((r) => ({
    id: r.id,
    label: r.label,
    unitPrice: 0,
  }));
  const quantities: QuantityOption[] = matrix.cols.map((c, i) => ({
    id: c.id,
    label: c.label,
    multiplier: i,
  }));
  const baseCells = new Map<string, number>();
  for (const cell of matrix.cells) {
    baseCells.set(`${cell.rowId}|${cell.colId}`, cell.price);
  }
  return { packages, quantities, baseCells };
}

/** Matrix-tipi parametresi olan (fiyat tablosu çıkarılabilen) ürünler. */
function filterEligible(list: Product[]): Product[] {
  return list.filter((p) => p.parameters?.some((par) => par.kind === "matrix"));
}

export default function FiyatHesaplaWidget() {
  // Ürünler CANLI API'den (admin'in eklediği ürünler de hesaplayıcıda çıksın);
  // API hatası/boş → mock fallback ile widget boş kalmaz.
  const [products, setProducts] = useState<Product[]>(mockProducts);
  useEffect(() => {
    let active = true;
    apiClient.products
      .list({ take: 200 })
      .then((list) => {
        if (active && Array.isArray(list) && list.length > 0) setProducts(list);
      })
      .catch(() => {
        /* mock fallback korunur */
      });
    return () => {
      active = false;
    };
  }, []);

  const eligible = useMemo(() => filterEligible(products), [products]);
  const [productSlug, setProductSlug] = useState("");
  // Liste hazır olunca (veya seçili slug listede yoksa) select'i ilk uygun ürüne sabitle.
  useEffect(() => {
    if (eligible.length === 0) return;
    if (!eligible.some((p) => p.slug === productSlug)) {
      setProductSlug(eligible[0]!.slug);
    }
  }, [eligible, productSlug]);
  const product = useMemo(
    () => products.find((p) => p.slug === productSlug) ?? eligible[0],
    [products, eligible, productSlug],
  );
  const matrix = useMemo(() => (product ? getMatrixData(product) : null), [product]);

  const [packageId, setPackageId] = useState("");
  const [quantityId, setQuantityId] = useState("");

  const selectedPrice = useMemo(() => {
    if (!matrix || !packageId || !quantityId) return null;
    return matrix.baseCells.get(`${packageId}|${quantityId}`) ?? null;
  }, [matrix, packageId, quantityId]);

  const productUrl = product ? `${SITE}/urun/${product.slug}` : SITE;

  return (
    <div className="max-w-md mx-auto p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-500 grid place-items-center text-ink-900">
          <Calculator size={18} weight="bold" />
        </div>
        <div>
          <div className="text-sm font-semibold text-ink-900">Markala Fiyat Hesaplayıcı</div>
          <div className="text-[11px] text-ink-500">Anlık fiyat · KDV dahil</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="widget-urun" className="block text-xs font-medium text-ink-700 mb-1">Ürün</label>
          <select
            id="widget-urun"
            value={productSlug}
            onChange={(e) => {
              setProductSlug(e.target.value);
              setPackageId("");
              setQuantityId("");
            }}
            className="w-full px-3 py-2 border border-paper-200 rounded-md text-sm text-ink-900 bg-paper-50 outline-none focus:border-brand-500"
          >
            {eligible.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {matrix && (
          <>
            <div>
              <label htmlFor="widget-paket" className="block text-xs font-medium text-ink-700 mb-1">Paket / Tip</label>
              <select
                id="widget-paket"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full px-3 py-2 border border-paper-200 rounded-md text-sm text-ink-900 bg-paper-50 outline-none focus:border-brand-500"
              >
                <option value="">Seç...</option>
                {matrix.packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="widget-adet" className="block text-xs font-medium text-ink-700 mb-1">Adet</label>
              <select
                id="widget-adet"
                value={quantityId}
                onChange={(e) => setQuantityId(e.target.value)}
                className="w-full px-3 py-2 border border-paper-200 rounded-md text-sm text-ink-900 bg-paper-50 outline-none focus:border-brand-500"
              >
                <option value="">Seç...</option>
                {matrix.quantities.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 p-4 bg-paper-100 border border-paper-200 rounded-lg">
        <div className="text-[11px] text-ink-500 mb-1">Toplam (KDV dahil)</div>
        {selectedPrice !== null ? (
          <div className="text-2xl font-bold text-ink-900 tabular-nums">
            {selectedPrice.toLocaleString("tr-TR")} ₺
          </div>
        ) : (
          <div className="text-sm text-ink-500">Paket ve adet seç...</div>
        )}
      </div>

      <a
        href={productUrl}
        target="_top"
        className="mt-3 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
      >
        Ürünü İncele <ArrowSquareOut size={14} />
      </a>

      <p className="mt-3 text-center text-[10px] text-ink-500">
        Powered by{" "}
        <a href={SITE} target="_top" className="font-semibold text-brand-700 hover:underline">
          Markala
        </a>
      </p>
    </div>
  );
}
