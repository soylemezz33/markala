"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

// Header ile aynı modal, aynı tembel yükleme: kod yalnız kutuya dokununca iner.
const SearchModal = dynamic(() => import("@/components/search-modal").then((m) => m.SearchModal), { ssr: false });

/**
 * Reklam iniş sayfası arama kutusu (2026-10-08). Hasan: "müşteri burada istediğini bulamazsa
 * /kategoriler'e gidecek, orası dağınık". Çözüm: aradığını sayfadan çıkmadan yazsın —
 * header'daki arama modalı burada büyük bir giriş kutusu gibi açılır.
 */
export function AramaKutusu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-paper-200 bg-paper-50 px-4 py-3.5 text-left text-ink-500 shadow-sm transition hover:border-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
        aria-label="Ürün ara"
      >
        <MagnifyingGlass size={20} weight="bold" className="shrink-0 text-ink-700" />
        <span className="truncate text-[15px]">Ne yaptıracaksın? kartvizit, branda, bayrak…</span>
      </button>
      {open && <SearchModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
