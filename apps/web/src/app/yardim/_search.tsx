"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";

export interface SearchItem {
  q: string;
  href: string;
  category: string;
  keywords: string[];
}

/** Türkçe duyarlı normalize — "İ/ı" tuzağına düşmeden karşılaştırma. */
function norm(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

/**
 * Yardım merkezi istemci tarafı arama — dış servis yok, tüm makale başlıkları ve
 * anahtar kelimeler props ile gelir (30 makale ≈ birkaç KB; ağ maliyeti ihmal edilebilir).
 */
export function HelpSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (q.length < 2) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return items
      .filter((it) => {
        const haystack = norm(`${it.q} ${it.category} ${it.keywords.join(" ")}`);
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, 8);
  }, [query, items]);

  const showEmpty = query.trim().length >= 2 && results.length === 0;

  return (
    <div className="relative max-w-xl mx-auto">
      <div className="relative">
        <MagnifyingGlass
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sorunuzu yazın: kargo ücreti, CMYK, iade…"
          aria-label="Yardım merkezinde ara"
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-paper-300 bg-white text-ink-900 placeholder:text-ink-500/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
        />
      </div>

      {(results.length > 0 || showEmpty) && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-paper-200 rounded-xl shadow-lg overflow-hidden text-left">
          {results.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper-100 transition-colors border-b border-paper-100 last:border-b-0"
            >
              <span>
                <span className="block text-sm font-medium text-ink-900">{r.q}</span>
                <span className="block text-xs text-ink-500 mt-0.5">{r.category}</span>
              </span>
              <ArrowRight size={14} className="flex-none text-ink-500" />
            </Link>
          ))}
          {showEmpty && (
            <div className="px-4 py-3 text-sm text-ink-500">
              Sonuç bulunamadı,{" "}
              <Link href="/iletisim" className="text-brand-700 font-medium hover:underline">
                bize sorun
              </Link>
              .
            </div>
          )}
        </div>
      )}
    </div>
  );
}
