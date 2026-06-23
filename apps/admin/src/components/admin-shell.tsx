"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChartLineUp, Package, Storefront, ShoppingCart, Users, Tag, FileText,
  Gear, SignOut, Sliders, ImageSquare, Bell, List, X,
  PaintBrush, Image as ImageIcon, Plug, Translate, ArrowSquareOut,
  ChatCircle, CurrencyCircleDollar, Receipt, Buildings, CaretDown, UserCircle,
  Pulse, Medal, EnvelopeSimple, PaperPlaneTilt, ListBullets,
} from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import { ToastContainer } from "@/components/toast";

interface CurrentUser {
  email: string;
  name: string;
  role: "super_admin" | "admin";
}

const navGroups: Array<{
  title: string;
  links: Array<{ href: string; label: string; icon: typeof ChartLineUp; badge?: string }>;
}> = [
  {
    title: "Genel",
    links: [
      { href: "/", label: "Dashboard", icon: ChartLineUp },
      { href: "/analitik", label: "Ziyaretçi Analizi", icon: Pulse },
      { href: "/siparisler", label: "Siparişler", icon: ShoppingCart },
      { href: "/musteriler", label: "Müşteriler", icon: Users },
      { href: "/musteriler/kurumsal-basvurular", label: "Kurumsal Başvurular", icon: Buildings },
      { href: "/iletisim-mesajlari", label: "Gelen Kutusu", icon: EnvelopeSimple },
      { href: "/bulten-aboneleri", label: "Bülten Aboneleri", icon: PaperPlaneTilt },
    ],
  },
  {
    title: "Katalog",
    links: [
      { href: "/urunler", label: "Ürünler", icon: Package },
      { href: "/urunler/fiyat-toplu", label: "Toplu Fiyat Güncelleme", icon: CurrencyCircleDollar },
      { href: "/kategoriler", label: "Kategoriler", icon: Storefront },
      { href: "/kuponlar", label: "Kuponlar", icon: Tag },
      { href: "/kampanya-paketleri", label: "Kampanya Paketleri", icon: ImageIcon },
    ],
  },
  {
    title: "İçerik & Medya",
    links: [
      { href: "/menu", label: "Header Menü", icon: ListBullets },
      { href: "/slider", label: "Anasayfa Slider", icon: Sliders },
      { href: "/banner", label: "Banner Yönetimi", icon: ImageSquare },
      { href: "/blog", label: "Blog Yazıları", icon: FileText },
      { href: "/yorumlar", label: "Yorumlar", icon: ChatCircle },
      { href: "/referanslar", label: "Referanslar", icon: Medal },
      { href: "/sss", label: "SSS Yönetimi", icon: Translate },
    ],
  },
  {
    title: "Sistem",
    links: [
      { href: "/yasal", label: "Yasal Sayfalar", icon: Receipt },
      { href: "/ayarlar/genel", label: "Genel Ayarlar", icon: Gear },
      { href: "/ayarlar/api", label: "API & Entegrasyonlar", icon: Plug },
      { href: "/ayarlar/seo", label: "SEO Ayarları", icon: PaintBrush },
      { href: "/ayarlar/bildirim", label: "Bildirim Tercihleri", icon: Bell },
    ],
  },
];

// Bildirimler artık /api/notifications (admin BFF → stats) üzerinden dinamik gelir.

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [notifs, setNotifs] = useState<{ count: number; items: Array<{ label: string; href: string }> }>({
    count: 0,
    items: [],
  });
  // Sistem sağlığı: null = bilinmiyor (ilk yükleme), true = ok, false = sorun var.
  const [systemOk, setSystemOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (!cancelled) setUser(d.user);
      })
      .catch((err) => {
        console.error("[admin-shell] /api/auth/me fetch başarısız:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bildirimler — bekleyen işler (stats'tan türetilir)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { count: 0, items: [] }))
      .then((d) => {
        if (!cancelled) setNotifs({ count: d.count ?? 0, items: d.items ?? [] });
      })
      .catch((err) => {
        console.error("[admin-shell] /api/notifications fetch başarısız:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sistem sağlığı — periyodik yoklama (footer rozeti). Hata → "Sorun var".
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      fetch("/api/system-health")
        .then((r) => (r.ok ? r.json() : { ok: false }))
        .then((d) => {
          if (!cancelled) setSystemOk(!!d.ok);
        })
        .catch(() => {
          if (!cancelled) setSystemOk(false);
        });
    check();
    const id = setInterval(check, 60000); // 60 sn'de bir
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Bildirim dropdown dışına tıklayınca kapan
  useEffect(() => {
    if (!notifOpen) return;
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Dropdown dışına tıklayınca kapan
  useEffect(() => {
    if (!userMenuOpen) return;
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-paper-100">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex w-64 bg-ink-900 text-paper-100 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent pathname={pathname} onNavigate={() => {}} onLogout={logout} />
      </aside>

      {/* Sidebar — Mobile slide-in */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 bg-ink-900 text-paper-100 z-50 flex flex-col">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              onLogout={logout}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-paper-50 border-b border-paper-200 px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md text-ink-700 hover:bg-paper-100"
            aria-label="Menü"
          >
            <List size={20} />
          </button>

          {/* Global arama kaldırıldı: işlevsel bir arama route'u yok (dekoratif idi). */}
          <div className="flex-1" />

          <a
            href="https://markala.com.tr"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-700 hover:text-ink-900 px-2 py-1 rounded hover:bg-paper-100"
          >
            <ArrowSquareOut size={12} /> Siteyi Aç
          </a>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-md text-ink-700 hover:bg-paper-100"
              aria-label={`Bildirimler${notifs.count > 0 ? ` (${notifs.count} yeni)` : ""}`}
              aria-haspopup="menu"
              aria-expanded={notifOpen}
            >
              <Bell size={18} />
              {notifs.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-paper-50 text-[10px] font-bold grid place-items-center leading-none">
                  {notifs.count > 9 ? "9+" : notifs.count}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-72 bg-paper-50 border border-paper-200 rounded-lg shadow-lg overflow-hidden z-30"
              >
                <div className="px-4 py-3 border-b border-paper-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">Bildirimler</span>
                  <span className="text-[11px] text-ink-500">{notifs.count} bekleyen</span>
                </div>
                {notifs.items.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-ink-500">Bekleyen iş yok 🎉</div>
                ) : (
                  notifs.items.map((n, i) => (
                    <Link
                      key={i}
                      href={n.href}
                      onClick={() => setNotifOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-paper-100 border-b border-paper-200 last:border-0"
                    >
                      <Bell size={14} className="text-brand-700 flex-none" /> {n.label}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-paper-100"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <span className="w-8 h-8 rounded-full bg-brand-500 text-ink-900 grid place-items-center font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
              <div className="hidden md:block leading-tight text-left">
                <div className="text-sm font-medium text-ink-900">{user?.name ?? "..."}</div>
                <div className="text-[11px] text-ink-500">
                  {user?.role === "super_admin" ? "Süper Admin" : user?.role ?? ""}
                </div>
              </div>
              <CaretDown size={12} className="hidden md:block text-ink-500" />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-60 bg-paper-50 border border-paper-200 rounded-lg shadow-lg overflow-hidden z-30"
              >
                <div className="px-4 py-3 border-b border-paper-200">
                  <div className="text-sm font-semibold text-ink-900 truncate">
                    {user?.name ?? "..."}
                  </div>
                  <div className="text-xs text-ink-500 truncate">{user?.email ?? ""}</div>
                </div>
                <Link
                  href="/ayarlar/genel"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-paper-100"
                >
                  <UserCircle size={16} /> Hesap Ayarları
                </Link>
                <button
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 border-t border-paper-200"
                >
                  <SignOut size={16} /> Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>

        {/* Footer */}
        <footer className="border-t border-paper-200 bg-paper-50 px-6 py-4 text-xs text-ink-500 flex flex-wrap items-center justify-between gap-2">
          <span>Markala Admin v0.9 · 324 Ajans</span>
          <span>
            Sistem durumu:{" "}
            {systemOk === null ? (
              <span className="text-ink-400 font-medium">● Kontrol ediliyor…</span>
            ) : systemOk ? (
              <span className="text-success font-medium">● Operasyonel</span>
            ) : (
              <span className="text-error font-medium">● Sorun var</span>
            )}
          </span>
        </footer>
      </div>

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" onClick={onNavigate} className="text-xl font-semibold text-paper-50">
          Markala<span className="text-brand-400">.</span>
          <span className="ml-2 text-xs text-paper-100/60 font-normal">admin</span>
        </Link>
        <button
          onClick={onNavigate}
          className="lg:hidden p-1.5 -mr-1 rounded text-paper-100/70 hover:text-paper-50 hover:bg-white/5"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper-100/40">
              {group.title}
            </div>
            <div className="mt-1 space-y-0.5">
              {group.links.map((l) => {
                const isActive =
                  l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-ink-900"
                        : "text-paper-100/80 hover:bg-white/5 hover:text-paper-50",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <l.icon size={16} weight={isActive ? "fill" : "regular"} />
                      {l.label}
                    </span>
                    {l.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          isActive
                            ? "bg-ink-900/15 text-ink-900"
                            : "bg-error text-paper-50",
                        )}
                      >
                        {l.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          className="w-full px-3 py-2 rounded text-sm font-medium text-paper-100/70 hover:bg-white/5 hover:text-paper-50 flex items-center gap-2"
          onClick={() => {
            onNavigate();
            onLogout();
          }}
        >
          <SignOut size={16} /> Çıkış Yap
        </button>
      </div>
    </>
  );
}
