"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { track as gaTrack } from "@/lib/analytics";
import { track as vaTrack } from "@/lib/visitor-analytics";

export interface InisKutusu {
  slug: string;
  name: string;
  imageUrl: string | null;
  /** Biçimlendirilmiş "1.234 ₺" metni; boşsa fiyat satırı yerine nötr metin basılır. */
  fiyat: string | null;
  /** Reklam dilindeki kısa açıklama (ne işe yarar), 1 satır. */
  not: string;
}

/**
 * Reklam iniş sayfası kategori kutusu (2026-10-08, Instagram "Ürününü seç" reklamı).
 * İstemci bileşeni: tıklama ölçümü için (hangi kutu dönüşüme gidiyor). Büyük dokunma alanı,
 * görsel üstte — mobilde iki sütun.
 */
export function InisKategoriKutusu({ kutu, sira }: { kutu: InisKutusu; sira: number }) {
  return (
    <Link
      href={`/kategori/${kutu.slug}`}
      onClick={() => {
        gaTrack("inis_kategori_click", { kategori: kutu.slug, sira });
        vaTrack("inis_kategori_click", { type: "inis_kategori_click", productSlug: kutu.slug });
      }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-paper-200 bg-paper-50 shadow-sm transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-paper-100">
        {kutu.imageUrl && (
          <Image
            src={kutu.imageUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width:1024px) 25vw, 50vw"
            priority={sira < 4}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </span>
      <span className="flex flex-1 flex-col p-3">
        <span className="text-[15px] font-semibold leading-tight text-ink-900">{kutu.name}</span>
        <span className="mt-1 text-xs leading-snug text-ink-500">{kutu.not}</span>
        <span className="mt-2 flex items-center justify-between text-sm">
          {kutu.fiyat ? (
            <span className="text-ink-700">
              <span className="font-semibold tabular-nums text-ink-900">{kutu.fiyat}</span>
              <span className="ml-1 text-xs text-ink-500">&apos;den</span>
            </span>
          ) : (
            <span className="text-xs text-ink-500">Fiyatı anında gör</span>
          )}
          <ArrowRight size={16} weight="bold" className="text-brand-700" />
        </span>
      </span>
    </Link>
  );
}
