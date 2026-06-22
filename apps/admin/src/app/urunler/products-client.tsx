"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, MagnifyingGlass, Eye, PencilSimple, Trash, Package, ArrowsDownUp, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { removeProduct } from "./actions";

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
  productionTime: string;
  isActive?: boolean;
  categoryId?: string | null;
  category?: { id: string; slug: string; name: string } | null;
}

interface Props {
  products: ProductRow[];
  categories: CategoryRow[];
}

export function ProductsClient({ products, categories }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "all" ||
        p.category?.slug === categoryFilter ||
        p.categoryId === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [search, categoryFilter, products]);

  // Sayfalama: filtre/arama değişince başa dön — aksi halde "sayfa 5'te boş ekran" tuzağı.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Filtre sonucu küçüldüyse mevcut sayfa aralık dışı kalabilir → güvenli sınıra çek.
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

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

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg">
          <MagnifyingGlass size={16} className="text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Ürün adı, slug veya SKU ara..."
            className="flex-1 bg-transparent outline-none text-sm text-ink-900"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 min-w-[200px]"
        >
          <option value="all">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ürün</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Kategori</th>
                <th className="text-right px-4 py-3 font-semibold">Başlangıç ₺</th>
                <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Üretim</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {paged.map((p) => {
                const categoryName = p.category?.name ?? "—";
                const startingPrice = Number(p.startingPrice ?? p.basePrice);
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
                    <td className="px-4 py-3 font-mono text-xs text-ink-500 hidden md:table-cell">{p.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">{categoryName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {startingPrice > 0 ? `${startingPrice.toLocaleString("tr-TR")} ₺` : "—"}
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
