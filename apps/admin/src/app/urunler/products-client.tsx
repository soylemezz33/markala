"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, Eye, PencilSimple, Trash, Package, ArrowsDownUp, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { removeProduct } from "./actions";
import {
  useTableSort,
  SortTh,
  TableToolbar,
  FilterChips,
  FilterSelect,
  TableEmpty,
  aramaEslesir,
  type SortAccessors,
} from "@/components/data-table";

/** Tek sayfada gösterilecek ürün sayısı (client-side sayfalama). */
const PAGE_SIZE = 25;

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  basePrice: unknown; // Decimal string from API
  startingPrice?: unknown | null; // Decimal string from API
  displayPrice?: number | null; // GERÇEK fiyat = min(product_prices); null → henüz fiyatlanmadı
  productionTime: string;
  isActive?: boolean;
  categoryId?: string | null;
  category?: { id: string; slug: string; name: string } | null;
}

interface Props {
  products: ProductRow[];
  categories: CategoryRow[];
}

type ProdSort = "name" | "sku" | "category" | "price" | "production" | "active";
const PROD_ACCESSORS: SortAccessors<ProductRow, ProdSort> = {
  name: (p) => p.name,
  sku: (p) => p.sku ?? null,
  category: (p) => p.category?.name ?? null,
  // Fiyatsız ürünler (displayPrice null/0) boş sayılır → her iki yönde de sona gider,
  // böylece "en pahalı" ve "en ucuz" sıralamalarının ikisi de anlamlı kalır.
  price: (p) => (p.displayPrice && p.displayPrice > 0 ? p.displayPrice : null),
  production: (p) => p.productionTime,
  active: (p) => p.isActive !== false,
};

export function ProductsClient({ products, categories }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [durum, setDurum] = useState<"all" | "aktif" | "pasif" | "fiyatsiz">("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  function handleDelete(p: ProductRow) {
    if (!confirm(`"${p.name}" ürünü kalıcı olarak silinecek. Emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await removeProduct(p.id);
        toast.success(`"${p.name}" silindi.`);
      } catch {
        toast.error("Silme başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        categoryFilter === "all" ||
        p.category?.slug === categoryFilter ||
        p.categoryId === categoryFilter;
      const fiyatsiz = !p.displayPrice || p.displayPrice <= 0;
      const matchDurum =
        durum === "all" ||
        (durum === "aktif" && p.isActive !== false) ||
        (durum === "pasif" && p.isActive === false) ||
        (durum === "fiyatsiz" && fiyatsiz);
      return matchCat && matchDurum && aramaEslesir(search, p.name, p.slug, p.sku);
    });
  }, [search, categoryFilter, durum, products]);
  const { rows: siraliUrunler, thProps } = useTableSort(filtered, PROD_ACCESSORS, {
    key: "name",
    dir: "asc",
  });
  const filtreAktif = search !== "" || categoryFilter !== "all" || durum !== "all";
  const temizle = () => {
    setSearch("");
    setCategoryFilter("all");
    setDurum("all");
  };

  // Sayfalama: filtre/arama değişince başa dön — aksi halde "sayfa 5'te boş ekran" tuzağı.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, durum]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Filtre sonucu küçüldüyse mevcut sayfa aralık dışı kalabilir → güvenli sınıra çek.
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return siraliUrunler.slice(start, start + PAGE_SIZE);
  }, [siraliUrunler, currentPage]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Ürünler</h1>
          <p className="text-ink-500 text-sm mt-1">
            Toplam <strong className="text-ink-900">{products.length}</strong> ürün ·{" "}
            {filtered.length !== products.length && (
              <span>filtreli: <strong className="text-ink-900">{filtered.length}</strong></span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/urunler/fiyat-toplu"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100"
          >
            <ArrowsDownUp size={14} weight="bold" /> Toplu Fiyat
          </Link>
          <Link
            href="/urunler/yeni"
            className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700"
          >
            <Plus size={14} weight="bold" /> Yeni Ürün
          </Link>
        </div>
      </header>

      {/* Table */}
      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <TableToolbar
          search={{
            id: "urun-ara",
            value: search,
            onChange: setSearch,
            placeholder: "Ürün adı, slug veya SKU ara…",
            className: "w-72",
          }}
          count={{ gosterilen: filtered.length, toplam: products.length, birim: "ürün" }}
          onClear={filtreAktif ? temizle : null}
        >
          <FilterChips
            label="Durum"
            value={durum}
            onChange={setDurum}
            options={[
              { value: "all", label: "Tümü" },
              { value: "aktif", label: "Aktif", count: products.filter((p) => p.isActive !== false).length },
              { value: "pasif", label: "Pasif", count: products.filter((p) => p.isActive === false).length },
              {
                value: "fiyatsiz",
                label: "Fiyatsız",
                count: products.filter((p) => !p.displayPrice || p.displayPrice <= 0).length,
              },
            ]}
          />
          <FilterSelect
            id="urun-kategori"
            label="Kategori"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "Tüm kategoriler" },
              ...categories.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
        </TableToolbar>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <SortTh sortKey="name" {...thProps} className="text-left px-4 py-3 font-semibold">Ürün</SortTh>
                <SortTh sortKey="sku" {...thProps} className="text-left px-4 py-3 font-semibold hidden md:table-cell">SKU</SortTh>
                <SortTh sortKey="category" {...thProps} className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Kategori</SortTh>
                <SortTh sortKey="price" {...thProps} align="right" className="text-right px-4 py-3 font-semibold" title="Fiyata göre sırala; fiyatsız ürünler sona gider">Fiyat (min) ₺</SortTh>
                <SortTh sortKey="production" {...thProps} align="center" className="text-center px-4 py-3 font-semibold hidden md:table-cell">Üretim</SortTh>
                <SortTh sortKey="active" {...thProps} align="center" className="text-center px-4 py-3 font-semibold">Durum</SortTh>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {paged.length === 0 && (
                <TableEmpty colSpan={7} filtreli={filtreAktif} onClear={temizle} bosMesaj="Ürün yok." />
              )}
              {paged.map((p) => {
                const categoryName = p.category?.name ?? "-";
                // GERÇEK fiyat = displayPrice (min product_prices). null/0 → henüz fiyatlanmadı.
                const displayPrice = p.displayPrice ?? null;
                return (
                  <tr key={p.slug} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-none w-10 h-10 rounded bg-paper-100 grid place-items-center text-ink-500">
                          <Package size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-900 truncate max-w-[280px]">{p.name}</div>
                          <div className="text-[11px] text-ink-500 font-mono">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500 hidden md:table-cell">{p.sku ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">{categoryName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {displayPrice && displayPrice > 0 ? (
                        `${displayPrice.toLocaleString("tr-TR")} ₺`
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning">
                          Fiyatsız
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-ink-500 hidden md:table-cell">{p.productionTime}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.isActive === false
                            ? "bg-paper-200 text-ink-500"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {p.isActive === false ? "Pasif" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`https://markala.com.tr/urun/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded text-ink-500 hover:bg-paper-100 hover:text-ink-900"
                          title="Sitede gör"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/urunler/${p.slug}`}
                          className="p-1.5 rounded text-ink-500 hover:bg-paper-100 hover:text-brand-700"
                          title="Düzenle"
                        >
                          <PencilSimple size={14} />
                        </Link>
                        <button
                          className="p-1.5 rounded text-ink-500 hover:bg-error/10 hover:text-error disabled:opacity-50"
                          title="Sil"
                          disabled={isPending}
                          onClick={() => handleDelete(p)}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-500 text-sm">
                    Bu kriterlere uyan ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama — yalnız birden fazla sayfa varsa göster */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-paper-200 bg-paper-100/40">
            <p className="text-xs text-ink-500">
              <strong className="text-ink-900">{rangeStart}</strong>–
              <strong className="text-ink-900">{rangeEnd}</strong> / {filtered.length} ürün
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border border-paper-200 text-ink-700 hover:bg-paper-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CaretLeft size={14} weight="bold" /> Önceki
              </button>
              <span className="px-3 py-1.5 text-sm text-ink-700 tabular-nums">
                Sayfa <strong className="text-ink-900">{currentPage}</strong> / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border border-paper-200 text-ink-700 hover:bg-paper-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sonraki <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
