"use client";

/**
 * Arama modalı (Cmd+K / "/") — site-header'dan AYRI dosyaya taşındı (2026-08-25, P2/TBT).
 * Header her sayfanın kritik JS'inde; modal ise yalnız kullanıcı aramayı AÇINCA gerekiyor.
 * SiteHeader bunu next/dynamic ile ilk açılışta yükler → modal kodu + bağımlılıkları
 * başlangıç bundle'ından çıkar. Davranış birebir aynı.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Sparkle,
  Truck,
  Question,
  EnvelopeSimple,
  Tag,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Category, Product } from "@markala/types";
import { apiClient } from "@/lib/api";

const SEARCH_HISTORY_KEY = "markala_search_history";

/**
 * Türkçe katlamalı küçük harf — kategori önerisi eşleşmesi için ("DE" → "de", "Kağıt" → "kagit").
 * API'deki foldTr (products.service) ile aynı mantık: önce tr-TR lowercase (İ→i, I→ı),
 * sonra aksanlı harfler sadeleştirilir; müşteri "kagit" yazsa da "Kağıt" bulunur.
 */
function foldTr(s: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return s.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (ch) => map[ch] ?? ch);
}

function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function saveSearch(query: string) {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const history = loadSearchHistory();
    const next = [trimmed, ...history.filter((q) => q !== trimmed)].slice(0, 5);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // sessizce yut — localStorage quota / SSR
  }
}

/**
 * Arama + mega-menü kataloğunu CANLI API'den lazy çeker (admin'in eklediği ürün/kategori
 * aramada ve "Popüler Kategoriler"de çıksın). `enabled` true olunca (modal açılınca) bir kez
 * çekilir; API hatası/boş → boş dizi (hiç kategori gösterilmez).
 */
function useLiveCategories(enabled: boolean): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    let active = true;
    apiClient.categories
      .list()
      .then((list) => {
        if (active && Array.isArray(list) && list.length > 0) setCategories(list);
      })
      .catch(() => {
        /* mock fallback korunur */
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return categories;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const categories = useLiveCategories(open);

  // Açılırken query reset + ilk inputa odaklan + history yükle
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setHistory(loadSearchHistory());
    const firstInput = document.querySelector<HTMLInputElement>("[data-search-input]");
    firstInput?.focus();
  }, [open]);

  // Enter ile aramayı kaydet
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveSearch(query);
    setHistory(loadSearchHistory());
  };

  // Focus trap — Tab tuşu modal içinde dönsün
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = modalRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Sunucu-taraflı arama (debounce) — katalog 870+ ürün; tümünü client'a indirip filtrelemek
  // yerine backend isme göre filtreler (q, çok-kelime AND). En az 2 karakterde tetiklenir.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      apiClient.products
        .list({ q: term, take: 12 })
        .then((list) => {
          if (active && Array.isArray(list)) setResults(list);
        })
        .catch(() => {
          if (active) setResults([]);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Kategori önerileri — "de" yazınca "Dekota Baskı" görünsün (test geri bildirimi: müşteri
  // ürünün tam adını yazmak zorunda kalmasın). Kategoriler zaten canlı çekili; client-side
  // Türkçe-katlamalı eşleşme yeterli. Başta-eşleşen önce gelir.
  const categorySuggestions = useMemo(() => {
    const term = foldTr(query.trim());
    if (term.length < 2) return [];
    return categories
      .map((c) => ({ c, pos: foldTr(c.name).indexOf(term) }))
      .filter((m) => m.pos >= 0)
      .sort((a, b) => a.pos - b.pos || a.c.name.length - b.c.name.length)
      .slice(0, 4)
      .map((m) => m.c);
  }, [query, categories]);

  if (!open) return null;

  const popularCategories = categories.slice(0, 6);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 grid items-start pt-[10vh] px-4"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-auto bg-paper-50 rounded-xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-3 px-5 py-4 border-b border-paper-200"
          >
            <MagnifyingGlass size={20} className="text-ink-500" />
            <input
              data-search-input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ne bastıracaksın? (kartvizit, branda, kupa...)"
              className="flex-1 bg-transparent outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:rounded text-base text-ink-900 placeholder:text-ink-500"
              aria-label="Site içi arama"
              aria-describedby="search-esc-hint"
            />
            <kbd id="search-esc-hint" className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-500 bg-paper-100 border border-paper-200" aria-label="Kapatmak için ESC tuşuna basın">
              ESC
            </kbd>
          </form>

          {!query && (
            <div className="p-5">
              {history.length > 0 && (
                <div className="mb-5 pb-5 border-b border-paper-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      Son Aramalar
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(SEARCH_HISTORY_KEY);
                        } catch {
                          // no-op
                        }
                        setHistory([]);
                      }}
                      className="text-[11px] text-ink-500 hover:text-error transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setQuery(q);
                          saveSearch(q);
                          setHistory(loadSearchHistory());
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-100 hover:bg-brand-100 text-ink-700 hover:text-brand-900 text-sm transition-colors"
                      >
                        <MagnifyingGlass size={12} />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
                Popüler Kategoriler
              </div>
              <div className="grid grid-cols-2 gap-1">
                {popularCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kategori/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-paper-100 group"
                  >
                    <span className="text-sm font-medium text-ink-900">{c.name}</span>
                    <ArrowRight
                      size={14}
                      className="text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-paper-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
                  Hızlı Erişim
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickLink
                    href="/kampanyalar"
                    onClose={onClose}
                    icon={<Sparkle size={12} weight="fill" />}
                  >
                    İndirimli Paketler
                  </QuickLink>
                  <QuickLink
                    href="/kargo-takip"
                    onClose={onClose}
                    icon={<Truck size={12} weight="fill" />}
                  >
                    Kargo Takip
                  </QuickLink>
                  <QuickLink href="/iletisim" onClose={onClose}>
                    Tasarım Desteği
                  </QuickLink>
                  <QuickLink
                    href="/yardim"
                    onClose={onClose}
                    icon={<Question size={12} weight="fill" />}
                  >
                    Yardım
                  </QuickLink>
                  <QuickLink
                    href="/iletisim"
                    onClose={onClose}
                    icon={<EnvelopeSimple size={12} weight="fill" />}
                  >
                    İletişim
                  </QuickLink>
                </div>
              </div>
            </div>
          )}

          {query && (
            <div className="p-3 max-h-[55vh] overflow-y-auto">
              {categorySuggestions.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Kategoriler
                  </div>
                  <ul>
                    {categorySuggestions.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/kategori/${c.slug}`}
                          onClick={() => {
                            saveSearch(query);
                            onClose();
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors group"
                        >
                          <Tag size={15} className="text-brand-700 flex-none" />
                          <span className="text-sm font-medium text-ink-900 truncate">{c.name}</span>
                          <ArrowRight
                            size={14}
                            className="ml-auto text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.length === 0 && categorySuggestions.length === 0 ? (
                <div className="p-5 text-center text-sm text-ink-500">
                  "<span className="text-ink-900 font-medium">{query}</span>" için sonuç bulunamadı.
                  <br />
                  <span className="text-xs">
                    Farklı bir kelime deneyin veya kategorilere göz atın.
                  </span>
                </div>
              ) : (
                <>
                  {categorySuggestions.length > 0 && results.length > 0 && (
                    <div className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-t border-paper-200">
                      Ürünler
                    </div>
                  )}
                  <ul className="divide-y divide-paper-200">
                    {results.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/urun/${p.slug}`}
                          onClick={() => {
                            saveSearch(query);
                            onClose();
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors"
                        >
                          <MagnifyingGlass size={15} className="text-ink-500 flex-none" />
                          <span className="text-sm font-medium text-ink-900 truncate">{p.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function QuickLink({
  href,
  icon,
  children,
  onClose,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-100 hover:bg-brand-100 text-ink-700 hover:text-brand-900 text-sm transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
