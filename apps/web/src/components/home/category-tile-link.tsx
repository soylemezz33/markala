"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { track as gaTrack } from "@/lib/analytics";
import { track as vaTrack } from "@/lib/visitor-analytics";

export interface KategoriKutusu {
  label: string;
  href: string;
  /** Temsili kategori görseli; yoksa görsel alanı nötr zemin olarak kalır. */
  imageUrl: string | null;
  /** 0 → fiyat çıpası basılmaz, yerine nötr metin yazılır. */
  fiyat: number;
  /** Ölçüm kimliği — grubun ilk kategori slug'ı (yoksa etiket). */
  izlemeId: string;
}

/**
 * Kategori kutusu (2026-08-31).
 *
 * Neden istemci bileşeni: tıklama ölçümü için. CategoryTiles sunucuda kalır ve fiyatı
 * 778 ürünlük listeden hesaplar; buraya yalnız 8 küçük nesne geçer, RSC yükü artmaz.
 *
 * Görsel: kategorilerin HEPSİNDE görsel var (45/45), yeni varlık üretmeye gerek yok.
 * Eski hâlinde kutular düz metindi ve tıklanabilir görünmüyordu — ok + hover yükseltmesi
 * o eksiği kapatıyor.
 */
export function CategoryTileLink({ kutu }: { kutu: KategoriKutusu }) {
  return (
    <Link
      href={kutu.href}
      onClick={() => {
        gaTrack("kategori_kutusu_click", {
          kategori: kutu.izlemeId,
          etiket: kutu.label,
        });
        vaTrack("kategori_kutusu_click", {
          type: "kategori_kutusu_click",
          productSlug: kutu.izlemeId,
        });
      }}
      className="group flex h-full items-center gap-3 rounded-lg border border-paper-200 bg-paper-50 p-2.5 transition-all duration-200 hover:border-ink-300 hover:bg-paper-50 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-paper-100">
        {kutu.imageUrl && (
          <Image
            src={kutu.imageUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="48px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-snug text-ink-900">
          {kutu.label}
        </span>
        {kutu.fiyat > 0 ? (
          <span className="mt-0.5 block text-xs font-semibold tabular-nums text-brand-700">
            {kutu.fiyat.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺&apos;den
          </span>
        ) : (
          // Fiyat çıpa değilse sayı basmıyoruz. "Teklif Al" yazmak "fiyat gizliyorlar"
          // algısı yaratıyordu (CategoryCard'da kayıtlı karar) — nötr keşif metni.
          <span className="mt-0.5 block text-xs font-medium text-ink-500">Ürünleri incele</span>
        )}
      </span>

      <ArrowRight
        size={14}
        weight="bold"
        aria-hidden="true"
        className="shrink-0 -translate-x-1 text-ink-500 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </Link>
  );
}
