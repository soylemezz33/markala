"use client";

import { useMemo, useState } from "react";
import { Container } from "@markala/ui";
import {
  CaretDown, FunnelSimple, X, MagnifyingGlass,
  CaretLeft, CaretRight,
} from "@phosphor-icons/react";
import type { BadgeKind, Product, Category } from "@markala/types";
import { ProductCard } from "@/components/product-card";
import { getDisplayPrice } from "@/lib/configurator";

type SortKey = "popular" | "newest" | "price-asc" | "price-desc";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "popular", label: "En çok satan" },
  { value: "newest", label: "Yeniler önce" },
  { value: "price-asc", label: "Fiyat (artan)" },
  { value: "price-desc", label: "Fiyat (azalan)" },
];

const badgeOptions: { value: BadgeKind; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "firsat", label: "Fırsat" },
  { value: "cok-satilan", label: "Çok Satılan" },
  { value: "hizli-sevkiyat", label: "Hızlı Sevkiyat" },
  { value: "tukenmek-uzere", label: "Tükenmek Üzere" },
];

const PAGE_SIZE = 12;
const PRICE_MIN = 0;

/** Ürünler API'den (server parent) props ile gelir; filtreleme/sıralama client-side. */
export function AllProductsClient({
  products,
  categories,
  initialCategory = null,
  hideHero = false,
  hideCategoryFilter = false,
}: {
  products: Product[];
  categories: Category[];
  /** Kategori sayfasında ön-seçili kategori slug'ı. */
  initialCategory?: string | null;
  /** Kategori sayfası kendi SEO hero'sunu gösterdiğinden buradaki hero gizlenir. */
  hideHero?: boolean;
  /** Kategori sayfasında ürünler zaten kategoriye-kapsamlı geldiğinden kategori filtresi gizlenir. */
  hideCategoryFilter?: boolean;
}) {
  // Fiyat aralığı max — gelen ürünlerden hesaplanır
  const allPrices = products.map((p) => getDisplayPrice(p));
  const PRICE_MAX = allPrices.length > 0 ? Math.ceil(Math.max(...allPrices) / 100) * 100 : 1000;

  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [activeBadges, setActiveBadges] = useState<Set<BadgeKind>>(new Set());
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [sort, setSort] = useState<SortKey>("popular");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory) {
      list = list.filter((p) => p.categorySlug === activeCategory);
    }

    if (activeBadges.size > 0) {
      list = list.filter((p) =>
        p.badges?.some((b) => activeBadges.has(b)),
      );
    }

    list = list.filter((p) => getDisplayPrice(p) <= priceMax);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case "newest":
        list = list.slice().reverse();
        break;
      case "price-asc":
        list = list.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
        break;
      case "price-desc":
        list = list.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
        break;
      default:
        list = list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    }

    return list;
  }, [products, activeCategory, activeBadges, priceMax, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeCat = categories.find((c) => c.slug === activeCategory);
  const hasFilters =
    activeCategory !== null ||
    activeBadges.size > 0 ||
    priceMax < PRICE_MAX ||
    search.trim() !== "";

  function toggleBadge(b: BadgeKind) {
    setActiveBadges((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
    setPage(1);
  }

  function clearAll() {
    setActiveCategory(null);
    setActiveBadges(new Set());
    setPriceMax(PRICE_MAX);
    setSearch("");
    setPage(1);
  }

  return (
    <>
      {!hideHero && (
        <div className="bg-paper-100 border-b border-paper-200">
          <Container className="py-10 md:py-14">
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
              Katalog
            </p>
            <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
              {activeCat ? activeCat.name : "Tüm Ürünler"}
            </h1>
            <p className="mt-3 text-lg text-ink-700 max-w-2xl">
              {activeCat
                ? activeCat.longDescription
                : "Matbaa baskıdan büyük format reklam ürünlerine — tüm katalog tek ekranda. Tasarım desteği her siparişte ücretsiz."}
            </p>
          </Container>
        </div>
      )}

      <Container className="py-10 md:py-14">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-500">
              <span className="font-semibold text-ink-900">{filtered.length}</span>{" "}
              ürün
            </span>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-brand-700 hover:text-brand-900 font-medium"
              >
                Filtreleri temizle
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Ürün ara..."
                className="pl-9 pr-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30 w-44 md:w-56"
              />
            </div>

            <button
              onClick={() => setFilterOpen((s) => !s)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-paper-200 text-ink-900 text-sm bg-paper-50"
            >
              <FunnelSimple size={14} /> Filtre
              {(activeBadges.size > 0 || priceMax < PRICE_MAX) && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none pl-3 pr-9 py-2 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm cursor-pointer"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeCat && (
              <Chip
                label={activeCat.name}
                onRemove={() => {
                  setActiveCategory(null);
                  setPage(1);
                }}
              />
            )}
            {Array.from(activeBadges).map((b) => (
              <Chip
                key={b}
                label={badgeOptions.find((o) => o.value === b)?.label ?? b}
                onRemove={() => toggleBadge(b)}
              />
            ))}
            {priceMax < PRICE_MAX && (
              <Chip
                label={`En fazla ${priceMax.toLocaleString("tr-TR")} ₺`}
                onRemove={() => setPriceMax(PRICE_MAX)}
              />
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside
            className={`lg:col-span-3 ${filterOpen ? "block" : "hidden lg:block"}`}
          >
            <div className="lg:sticky lg:top-24 space-y-5">
              {/* Kategoriler */}
              {!hideCategoryFilter && (
              <FilterCard title="Kategoriler">
                <ul
                  className="space-y-1 max-h-80 overflow-y-auto pr-1"
                  style={{ scrollbarWidth: "thin" }}
                >
                  <li>
                    <CategoryButton
                      active={!activeCategory}
                      label="Hepsi"
                      count={products.length}
                      onClick={() => {
                        setActiveCategory(null);
                        setPage(1);
                        setFilterOpen(false);
                      }}
                    />
                  </li>
                  {categories.map((cat) => {
                    const count = products.filter(
                      (p) => p.categorySlug === cat.slug,
                    ).length;
                    return (
                      <li key={cat.slug}>
                        <CategoryButton
                          active={activeCategory === cat.slug}
                          label={cat.name}
                          count={count}
                          onClick={() => {
                            setActiveCategory(cat.slug);
                            setPage(1);
                            setFilterOpen(false);
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              </FilterCard>
              )}

              {/* Fiyat */}
              <FilterCard title="Fiyat Aralığı">
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={50}
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full accent-brand-500"
                />
                <div className="mt-2 flex items-baseline justify-between text-xs text-ink-700">
                  <span>{PRICE_MIN} ₺</span>
                  <span className="font-semibold text-ink-900">
                    en fazla {priceMax.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              </FilterCard>

              {/* Etiketler */}
              <FilterCard title="Etiketler">
                <div className="flex flex-wrap gap-1.5">
                  {badgeOptions.map((b) => {
                    const active = activeBadges.has(b.value);
                    return (
                      <button
                        key={b.value}
                        onClick={() => toggleBadge(b.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? "bg-ink-900 text-paper-50 border-ink-900"
                            : "bg-paper-50 text-ink-700 border-paper-200 hover:border-ink-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </FilterCard>
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-9">
            {filtered.length === 0 ? (
              <div className="py-20 text-center bg-paper-100 rounded-xl border border-paper-200">
                <MagnifyingGlass size={32} className="mx-auto text-ink-300" />
                <p className="mt-4 text-ink-700 font-medium">
                  Aradığınız ürün bulunamadı
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 text-sm font-medium text-brand-700 hover:text-brand-900"
                >
                  Filtreleri temizle →
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                  {paginated.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onChange={(n) => {
                      setPage(n);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

function FilterCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-paper-50 rounded-xl border border-paper-200">
      <h2 className="font-semibold text-ink-900 mb-4 text-sm">{title}</h2>
      {children}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-medium hover:bg-brand-200"
    >
      {label} <X size={12} weight="bold" />
    </button>
  );
}

function CategoryButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-baseline justify-between ${
        active
          ? "bg-ink-900 text-paper-50 font-medium"
          : "text-ink-700 hover:bg-paper-100"
      } ${count === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span>{label}</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  // Hangi sayfa numaralarını göstereceğiz: 1, ..., n-1, n, n+1, ..., last
  const pages: (number | "...")[] = [];
  const window = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1.5"
      aria-label="Sayfalandırma"
    >
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Önceki sayfa"
        className="p-2 rounded-md border border-paper-200 bg-paper-50 text-ink-700 disabled:opacity-30 hover:bg-paper-100"
      >
        <CaretLeft size={14} weight="bold" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-ink-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`min-w-[36px] h-9 px-2 rounded-md text-sm font-medium ${
              p === currentPage
                ? "bg-ink-900 text-paper-50"
                : "bg-paper-50 text-ink-700 border border-paper-200 hover:bg-paper-100"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Sonraki sayfa"
        className="p-2 rounded-md border border-paper-200 bg-paper-50 text-ink-700 disabled:opacity-30 hover:bg-paper-100"
      >
        <CaretRight size={14} weight="bold" />
      </button>
    </nav>
  );
}
