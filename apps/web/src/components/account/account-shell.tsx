"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@markala/ui";
import { SignOut, WhatsappLogo } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import {
  ACCOUNT_GROUP_LABEL,
  aktifNav,
  gorunurNav,
  type AccountNavContext,
  type AccountNavGroup,
  type AccountNavItem,
} from "./account-nav";

/**
 * Hesap alanı kabuğu (2026-08-31, Hasan: "her şey çok dağınık, istenilen bulunamıyor").
 *
 * ÖNCESİ: layout.tsx yalnız metadata sarmalayıcısıydı. 14 alt sayfa vardı ama panoda
 * 3 kısayol görünüyordu; kalan 11'i hiçbir yerden ULAŞILAMIYORDU ve sayfalar arası
 * geçmek için tarayıcı geri tuşu gerekiyordu.
 *
 * ŞİMDİ: masaüstünde kalıcı kenar çubuğu, mobilde yatay kaydırmalı şerit. İkisi de
 * account-nav.ts'ten okuyor — yeni sayfa eklenince üç yüzeyde birden görünür.
 *
 * Mobilde İKİNCİ bir sticky bar KOYULMADI: header zaten sticky ve ürün sayfalarında
 * alt CTA barı var; üçüncü bir sabit katman dikey alanı yer.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const logout = useAuthStore((s) => s.logout);

  const [sayac, setSayac] = useState<{ orders?: number; addresses?: number }>({});
  const [ctx, setCtx] = useState<AccountNavContext>({});

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let iptal = false;
    withRefresh(() => apiClient.orders.listMine())
      .then((d) => !iptal && setSayac((s) => ({ ...s, orders: (d ?? []).length })))
      .catch(() => undefined);
    withRefresh(() => apiClient.users.listAddresses())
      .then((d) => !iptal && setSayac((s) => ({ ...s, addresses: (d ?? []).length })))
      .catch(() => undefined);
    withRefresh(() => apiClient.loyalty.me())
      .then((d) => !iptal && setCtx((c) => ({ ...c, loyaltyEnabled: d?.enabled === true })))
      .catch(() => undefined);
    return () => {
      iptal = true;
    };
  }, [user, isBootstrapping]);

  const bag: AccountNavContext = {
    ...ctx,
    accountType: (user as { accountType?: string } | null)?.accountType ?? null,
  };
  const maddeler = gorunurNav(bag);
  const aktif = aktifNav(pathname, bag);

  // Oturumsuz: kabuk çizme, sayfa kendi yönlendirmesini yapsın.
  if (!user) return <>{children}</>;

  const gruplar = ["is", "odeme", "hesap", "listeler", "tercihler"] as AccountNavGroup[];
  const panom = maddeler.find((m) => m.group === null);

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-10">
      {/* ---- MASAÜSTÜ KENAR ÇUBUĞU ---- */}
      <nav
        aria-label="Hesap menüsü"
        className="hidden lg:block w-[240px] flex-none sticky self-start top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <div className="pb-4 mb-4 border-b border-paper-200 flex items-center gap-3">
          <span className="w-10 h-10 flex-none rounded-full bg-brand-500 text-ink-900 grid place-items-center font-bold">
            {(user.fullName || user.email || "?").trim().charAt(0).toLocaleUpperCase("tr")}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink-900 truncate">{user.fullName || "Hesabım"}</span>
            <span className="block text-xs text-ink-500 truncate">{user.email}</span>
          </span>
        </div>

        {panom && <NavLink item={panom} aktif={aktif?.href === panom.href} sayac={sayac} />}

        {gruplar.map((g) => {
          const alt = maddeler.filter((m) => m.group === g);
          if (!alt.length) return null;
          return (
            <div key={g} className="mt-5">
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {ACCOUNT_GROUP_LABEL[g]}
              </div>
              {alt.map((m) => (
                <NavLink key={m.href} item={m} aktif={aktif?.href === m.href} sayac={sayac} />
              ))}
              {g === "listeler" && (
                <p className="px-3 pt-1.5 text-[11px] leading-snug text-ink-500">
                  Bu iki liste hesabına değil, bu cihaza kayıtlıdır.
                </p>
              )}
            </div>
          );
        })}

        <div className="mt-5 pt-4 border-t border-paper-200">
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full h-9 px-3 rounded-lg text-sm text-ink-500 hover:text-error hover:bg-paper-100 flex items-center gap-2.5 transition-colors"
          >
            <SignOut size={18} /> Çıkış Yap
          </button>
          <a
            href="https://wa.me/905057417028"
            className="mt-1 w-full h-9 px-3 rounded-lg text-xs text-ink-500 hover:text-ink-900 hover:bg-paper-100 flex items-center gap-2.5 transition-colors"
          >
            <WhatsappLogo size={16} /> Destek hattı
          </a>
        </div>
      </nav>

      {/* ---- MOBİL YATAY ŞERİT ---- */}
      <div className="min-w-0">
        <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 pb-3 mb-5 border-b border-paper-200 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {maddeler
            .filter((m) => m.inMobileTabs)
            .slice(0, 6)
            .map((m) => {
              const secili = aktif?.href === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={secili ? "page" : undefined}
                  className={cn(
                    // h-11: 44px dokunma hedefi
                    "h-11 px-4 rounded-full text-sm whitespace-nowrap inline-flex items-center flex-none transition-colors",
                    secili
                      ? "bg-ink-900 text-paper-50 font-semibold"
                      : "bg-paper-100 text-ink-700 hover:bg-paper-200",
                  )}
                >
                  {m.label}
                </Link>
              );
            })}
        </div>
        {children}
      </div>
    </div>
  );
}

function NavLink({
  item,
  aktif,
  sayac,
}: {
  item: AccountNavItem;
  aktif: boolean;
  sayac: { orders?: number; addresses?: number };
}) {
  const Ikon = item.icon;
  const n = item.countKey ? sayac[item.countKey] : undefined;
  return (
    <Link
      href={item.href}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "relative h-9 px-3 rounded-lg text-sm flex items-center gap-2.5 transition-colors",
        aktif
          ? "bg-brand-50 text-ink-900 font-semibold"
          : "text-ink-700 hover:bg-paper-100 hover:text-ink-900",
      )}
    >
      {aktif && <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500" />}
      <Ikon size={18} className={aktif ? "text-brand-700" : "text-ink-500"} />
      <span className="truncate">{item.label}</span>
      {/* min-w: sayaç async geliyor, yer rezerve edilmezse madde zıplıyor */}
      <span className="ml-auto min-w-[1.5rem] text-right text-xs tabular-nums text-ink-500">
        {n && n > 0 ? n : ""}
      </span>
    </Link>
  );
}
