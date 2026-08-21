"use client";

import { createContext, useContext } from "react";

/**
 * İzinleri SUNUCUDAN, ilk render'da taşır (2026-08-21).
 *
 * Neden gerekti: AdminShell izinleri tarayıcıda useEffect ile çekiyordu. Her sayfa
 * geçişinde bileşen sıfırdan kurulduğu için izinler bir an bilinmiyor, "bilinmiyorsa
 * filtreleme yapma" dalı devreye giriyor ve TAM MENÜ parlıyordu — tasarımcı her
 * tıklamada Ciro & Kâr gibi yetkisi olmayan menüleri görüyordu (Hasan bildirdi).
 *
 * Sunucu tarafında oturum zaten var; izinler ilk boyamada hazır geldiği için
 * yanıp sönme (flash) tamamen ortadan kalkar.
 *
 * null = sunucu izinleri getiremedi (API hatası). O durumda AdminShell kendi
 * client fetch'ine düşer; güvenlik sınırı yine uçlardaki RolesGuard'dır.
 */
const PermsContext = createContext<string[] | null>(null);

export function PermsProvider({
  value,
  children,
}: {
  value: string[] | null;
  children: React.ReactNode;
}) {
  return <PermsContext.Provider value={value}>{children}</PermsContext.Provider>;
}

export function useServerPerms(): string[] | null {
  return useContext(PermsContext);
}
