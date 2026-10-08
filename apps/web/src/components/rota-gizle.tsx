"use client";

import { usePathname } from "next/navigation";

/**
 * Belirli rotalarda sarmaladığı içeriği gizler (2026-10-08).
 *
 * Neden: kök layout'taki CtaBanner (hoş geldin kuponu) her sayfada çıkıyor; reklam iniş
 * sayfasında (/urununu-sec) dikkat dağıtan büyük bir şerit oluyordu. Layout sunucu bileşeni,
 * pathname bilmez — bu ince istemci sarmalayıcı çocukları (sunucu bileşeni olsa da) rota
 * eşleşince hiç render etmez. Eşleşme: tam yol veya alt yol.
 */
export function RotaGizle({ yollar, children }: { yollar: string[]; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const gizli = yollar.some((y) => pathname === y || pathname.startsWith(`${y}/`));
  if (gizli) return null;
  return <>{children}</>;
}
