import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Sezonluk kampanya şeridi (2026-09-10) — Cadılar Bayramı 2026.
 * Ana sayfada kategori kutularının altında; bitiş tarihinden sonra HİÇ çizilmez, kod kalır
 * (gelecek yıl tarih ve metin değişir). Sunucu bileşeni: gün sayısı ISR'de (300 sn) hesaplanır,
 * bir günlük sapma önemsiz. Kategori: scripts/katalog/cadilar-bayrami.mjs.
 */
const BITIS = new Date("2026-10-31T23:59:59+03:00");
const SON_SIPARIS = new Date("2026-10-27T23:59:59+03:00");

export function KampanyaSeridi() {
  const now = new Date();
  if (now > BITIS) return null;
  const gun = Math.max(0, Math.ceil((BITIS.getTime() - now.getTime()) / 86_400_000));
  const sonSiparisGecti = now > SON_SIPARIS;
  return (
    <section aria-label="Cadılar Bayramı kampanyası" className="px-4 sm:px-6 lg:px-8 mt-6">
      <Link
        href="/kategori/cadilar-bayrami"
        className="group mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-xl border border-[#3a2415] bg-[#17130f] px-5 py-4 text-[#f4ead8] transition-colors hover:border-[#e8641b]"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden="true" className="text-3xl leading-none">🎃</span>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">
              Cadılar Bayramı 2026: vitrin sticker, afiş, ayaklı bal kabağı, fosforlu sticker
            </div>
            <div className="mt-0.5 text-sm text-[#cdbfae]">
              Hazır tasarım ücretsiz, normal katalog fiyatı ·{" "}
              {sonSiparisGecti ? "31 Ekim için son siparişler alındı" : "31 Ekim için son sipariş 27 Ekim"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden sm:inline-flex items-baseline gap-1 rounded-lg bg-[#e8641b] px-3 py-1.5 text-[#17130f]">
            <span className="text-xl font-bold tabular-nums">{gun}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">gün</span>
          </span>
          <ArrowRight size={20} weight="bold" className="text-[#e8641b] transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </section>
  );
}
