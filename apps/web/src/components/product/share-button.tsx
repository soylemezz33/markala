"use client";

import { useState } from "react";
import { Share, Check } from "@phosphor-icons/react";

/**
 * Ürün paylaş butonu. ÖNCEDEN: onClick'siz ölü <button> (hiçbir şey yapmıyordu).
 * Artık: mobilde Web Share API (yerel paylaşım menüsü), masaüstünde pano-kopyalama + onay.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    const shareData = { title: `${title} — Markala`, text: `${title} — markala.com.tr`, url };

    // Web Share API (mobil) → yerel paylaşım menüsü
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Kullanıcı iptal etti veya desteklenmedi → panoya kopyalamaya düş
      }
    }

    // Fallback: linki panoya kopyala
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano API yoksa sessiz geç
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Ürünü paylaş"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-paper-200 text-sm text-ink-700 hover:border-ink-300 hover:bg-paper-100 transition-colors"
    >
      {copied ? (
        <>
          <Check size={16} className="text-success" /> Link kopyalandı
        </>
      ) : (
        <>
          <Share size={16} /> Paylaş
        </>
      )}
    </button>
  );
}
