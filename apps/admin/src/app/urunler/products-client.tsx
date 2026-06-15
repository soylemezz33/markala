"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, MagnifyingGlass, Eye, PencilSimple, Trash, Package, ArrowsDownUp } from "@phosphor-icons/react";

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
              {filtered.map((p) => {
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
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success">
                        Aktif
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
                          className="p-1.5 rounded text-ink-500 hover:bg-error/10 hover:text-error"
                          title="Sil"
                          onClick={() => toast.info(`"${p.name}" silinecek`)}
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
      </div>
    </AdminShell>
  );
}
