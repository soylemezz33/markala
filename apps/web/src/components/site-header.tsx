"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  ShoppingBag,
  User,
  List,
  X,
  SignOut,
  Package,
  House,
  CaretDown,
  Lightning,
  Sparkle,
  Truck,
  Question,
  EnvelopeSimple,
  WhatsappLogo,
  Phone,
  ArrowRight,
  Heart,
} from "@phosphor-icons/react";
import { Container, cn } from "@markala/ui";
import type { Category, Product } from "@markala/types";
import { categories as mockCategories } from "@markala/mock-data";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Premium 3-katlı header:
 * 1. Top Utility Bar — küçük linkler (Kampanyalar, Yardım, Blog, Telefon, WhatsApp)
 * 2. Main Bar — Logo · Büyük search · Hesap · Sepet
 * 3. Category Nav — kategori sekmeleri + mega menu
 *
 * Scroll davranışı: 80px sonrası üst utility bar gizlenir,
 * ana bant + kategori nav glass-blur ile yukarıda kalır.
 */

// Üst utility bar — minimal: sadece kritik 2-3 link.
// Kampanyalar / Tasarım Desteği / Kargo Takip ana navigasyonda zaten var.
const TOP_LINKS = [
  { href: "/kargo-takip", label: "Kargo Takip" },
  { href: "/yardim", label: "Yardım" },
  { href: "/iletisim", label: "İletişim" },
];

// Alt nav — ana kategori grupları (mega menu için)
const MAIN_NAV: Array<{
  label: string;
  href: string;
  /** Mega menu — alt kategori listesi gösterilir */
  groups?: Array<{ title: string; items: Array<{ label: string; href: string; badge?: string }> }>;
  highlight?: "fire" | "new";
}> = [
  {
    label: "Kartvizit & Kırtasiye",
    href: "/urunler",
    groups: [
      {
        title: "Kartvizit",
        items: [
          { label: "Klasik Kartvizit (21 paket)", href: "/urun/klasik-kartvizit", badge: "POPÜLER" },
        ],
      },
      {
        title: "Kâğıt Ürünleri",
        items: [
          { label: "Antetli Kağıt", href: "/urun/antetli-kagit" },
          { label: "Diplomat Zarf — Tek Renk", href: "/urun/zarf-diplomat-tek-renk" },
          { label: "Diplomat Zarf — Renkli", href: "/urun/zarf-diplomat-renkli" },
          { label: "Torba Zarf 24×32", href: "/urun/zarf-torba" },
          { label: "Cepli Dosya", href: "/urun/cepli-dosya" },
          { label: "Makbuz NCR", href: "/urun/makbuz" },
        ],
      },
    ],
  },
  {
    label: "Broşür & El İlanı",
    href: "/urunler",
    groups: [
      {
        title: "Broşür",
        items: [
          { label: "Broşür 115 gr Çift Yön", href: "/urun/brosur" },
          { label: "Pro Broşür 128 gr", href: "/urun/pro-brosur", badge: "YENİ" },
          { label: "Selefonlu Broşür 200 gr", href: "/urun/selefonlu-brosur" },
          { label: "Kapı Askı Broşür", href: "/urun/kapi-aski-brosur" },
        ],
      },
      {
        title: "Diğer",
        items: [
          { label: "El İlanı 105 gr", href: "/urun/el-ilani" },
          { label: "Afiş 105 gr", href: "/urun/afis-105gr" },
          { label: "Etiket Çıkartma", href: "/urun/etiket" },
        ],
      },
    ],
  },
  {
    label: "Bayrak & Branda",
    href: "/urunler",
    groups: [
      {
        title: "Bayrak",
        items: [
          { label: "Yelken Bayrak", href: "/urun/yelken-bayrak-damla" },
          { label: "Kırlangıç Bayrak", href: "/urun/kirlangic-bayrak-3m" },
          { label: "Masa Bayrağı", href: "/urun/masa-bayragi-krom" },
          { label: "Makam Bayrağı", href: "/urun/makam-bayragi-puskullu" },
        ],
      },
      {
        title: "Branda & Stand",
        items: [
          { label: "Vinil Branda 440 gr", href: "/urun/vinil-branda-440gr" },
          { label: "Mesh Branda", href: "/urun/mesh-branda" },
          { label: "Roll-up 85×200", href: "/urun/rollup-standart" },
        ],
      },
    ],
  },
  {
    label: "Promosyon & Hediye",
    href: "/urunler",
    groups: [
      {
        title: "Promosyon",
        items: [
          { label: "Sublime Kupa", href: "/urun/klasik-beyaz-kupa" },
          { label: "Promosyon Magnet 46×68", href: "/urun/magnet-promosyon" },
          { label: "Plaket", href: "/urun/kristal-plaket" },
          { label: "Madalya", href: "/urun/madalya-7cm-kurdela" },
        ],
      },
      {
        title: "Bloknot Ailesi",
        items: [
          { label: "Küp Bloknot", href: "/urun/kup-bloknot" },
          { label: "Spiralli Bloknot", href: "/urun/spiralli-bloknot" },
          { label: "Kapaklı Bloknot", href: "/urun/kapakli-bloknot" },
          { label: "Notluk Premium", href: "/urun/notluk" },
        ],
      },
    ],
  },
  {
    label: "Reklam Tabela",
    href: "/urunler",
    groups: [
      {
        title: "Tabela & Levha",
        items: [
          { label: "Lightbox LED", href: "/urun/lightbox-led-100cm" },
          { label: "Dekota Baskı", href: "/urun/dekota-baski-5mm" },
          { label: "Güvenlik Levhası", href: "/urun/guvenlik-levhasi-sigorta" },
          { label: "Fosforlu Acil Çıkış", href: "/urun/fosforlu-cikis-folyo" },
          { label: "Plastik Duba", href: "/urun/plastik-duba-baskili" },
        ],
      },
      {
        title: "Folyo & Araç",
        items: [
          { label: "Cam Vitrin Folyo", href: "/urun/cam-folyosu-kesimli" },
          { label: "Araç Magneti", href: "/urun/arac-magneti-30x40" },
          { label: "Araç Sticker", href: "/urun/arac-sticker-yan" },
        ],
      },
    ],
  },
  {
    label: "Restoran & Otel",
    href: "/urunler",
    groups: [
      {
        title: "Hizmet Sektörü",
        items: [
          { label: "Amerikan Servis", href: "/urun/amerikan-servis" },
          { label: "Selefonlu Menü", href: "/urun/selefonlu-brosur" },
          { label: "Oto Paspas", href: "/urun/oto-paspas" },
          { label: "Çantalar", href: "/urun/canta" },
          { label: "Trodat Kaşe", href: "/urun/trodat-printy-4912" },
        ],
      },
    ],
  },
  {
    label: "İSG Uyarı Levhaları",
    href: "/urunler",
    groups: [
      {
        title: "İş Güvenliği Levhaları",
        items: [
          { label: "Uyarı / İkaz Levhaları", href: "/kategori/is-guvenligi-uyari-ikaz", badge: "YENİ" },
          { label: "Yasaklayıcı Levhalar", href: "/kategori/is-guvenligi-yasaklayici" },
          { label: "Emredici / KKD Levhaları", href: "/kategori/is-guvenligi-emredici-kkd" },
          { label: "Acil Durum & İlk Yardım", href: "/kategori/is-guvenligi-acil-ilk-yardim" },
          { label: "Yangınla Mücadele", href: "/kategori/is-guvenligi-yangin" },
        ],
      },
      {
        title: "Özel & Sektörel Levhalar",
        items: [
          { label: "Elektrik & Voltaj", href: "/kategori/is-guvenligi-elektrik-voltaj" },
          { label: "Güneş Enerjisi (GES)", href: "/kategori/is-guvenligi-ges" },
          { label: "Trafik, Saha & Otopark", href: "/kategori/is-guvenligi-trafik-saha" },
          { label: "Kalite Kontrol Etiketleri", href: "/kategori/is-guvenligi-kalite-kontrol" },
          { label: "Bilgilendirme & Talimat", href: "/kategori/is-guvenligi-bilgilendirme-talimat" },
        ],
      },
    ],
  },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.open);
  const user = useAuthStore((s) => s.user);

  // Effect 1: mounted flag — hidrasyon-sonrası client-only render gate
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect 2: scroll (rAF debounced) + keyboard (Cmd+K aç, Escape kapat)
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setScrolled(window.scrollY > 80));
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      // "/" skip-to-search (Twitter/GitHub paterni) — input/textarea focus'unda devre dışı
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };

    // Mount anında mevcut scroll pozisyonunu yakala
    setScrolled(window.scrollY > 80);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Effect 3: route değişince mobil menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Effect 4: Search modal return-focus (WCAG 2.4.3 Focus Order)
  // Modal açılırken tetikleyen element kaydedilir; kapanırken oraya geri odaklan.
  useEffect(() => {
    if (searchOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [searchOpen]);

  // Effect 5: Mobile drawer veya search modal açıkken body scroll kilidi
  // (basit focus/scroll containment — ek trap'e gerek yok)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const locked = menuOpen || searchOpen;
    const prev = document.body.style.overflow;
    if (locked) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Top utility bar — scroll'da gizlenir */}
        <AnimatePresence initial={false}>
          {!scrolled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-ink-900 text-paper-100 overflow-hidden"
            >
              <Container className="flex items-center justify-between py-2 text-xs whitespace-nowrap">
                <div className="flex items-center gap-4 md:gap-5">
                  <a href="tel:+903244333351" className="flex items-center gap-1.5 hover:text-brand-400 transition-colors">
                    <Phone size={12} weight="fill" /> 0324 433 33 51
                  </a>
                  <a
                    href="https://wa.me/905319004102"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 hover:text-brand-400 transition-colors"
                  >
                    <WhatsappLogo size={12} weight="fill" /> WhatsApp
                  </a>
                  <span className="hidden lg:flex items-center gap-1.5 text-paper-100/70">
                    <Truck size={12} weight="fill" /> 81 ile teslimat
                  </span>
                </div>
                <nav className="flex items-center gap-4 md:gap-5">
                  {TOP_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-paper-100/80 hover:text-paper-50 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main bar */}
        <div
          className={cn(
            "bg-paper-50 transition-shadow duration-300",
            scrolled ? "shadow-sm border-b border-paper-200" : "border-b border-paper-200",
          )}
        >
          <Container className="flex items-center gap-4 md:gap-8 py-4 md:py-5">
            {/* Logo */}
            <Link href="/" className="flex-none group">
              <span className="text-2xl md:text-[28px] font-semibold tracking-tight text-ink-900">
                markala<span className="inline-flex items-baseline">
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-brand-500 text-ink-900 text-xs font-bold tracking-tight">.com.tr</span>
                </span>
              </span>
            </Link>

            {/* Search — büyük command-bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 items-center gap-3 max-w-2xl px-5 h-12 rounded-xl bg-paper-100 border border-paper-200 hover:border-ink-300 hover:bg-paper-50 transition-all group"
            >
              <MagnifyingGlass size={18} className="text-ink-500 group-hover:text-ink-700" />
              <span className="text-ink-500 text-sm flex-1 text-left">Ne bastırmak istiyorsunuz?</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-500 bg-paper-50 border border-paper-200">
                ⌘K
              </kbd>
            </button>

            {/* Sağ aksiyonlar */}
            <div className="flex items-center gap-2 md:gap-3 flex-none ml-auto">
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2.5 rounded-lg text-ink-700 hover:bg-paper-100"
                aria-label="Ara"
              >
                <MagnifyingGlass size={20} />
              </button>

              <UserBlock mounted={mounted} user={user} />

              <WishlistHeaderButton mounted={mounted} />

              <CartButton itemCount={itemCount} mounted={mounted} onClick={openCart} />

              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="lg:hidden p-2.5 rounded-lg text-ink-900 hover:bg-paper-100"
                aria-label="Menü"
              >
                {menuOpen ? <X size={20} /> : <List size={20} />}
              </button>
            </div>
          </Container>

          {/* Bottom category nav */}
          <div className="hidden lg:block border-t border-paper-200">
            <Container className="flex items-center gap-1">
              {MAIN_NAV.map((nav) => (
                <NavItem key={nav.label} nav={nav} />
              ))}
              <Link
                href="/urunler"
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 px-3 py-2.5"
              >
                Tüm Ürünler <ArrowRight size={14} weight="bold" />
              </Link>
            </Container>
          </div>
        </div>

        {/* Mobile drawer — full-width slide-in with accordion mega-menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-paper-50 shadow-2xl z-50 overflow-y-auto"
              >
                <div className="sticky top-0 bg-ink-900 text-paper-50 px-5 py-4 flex items-center justify-between z-10 border-b border-white/10">
                  <span className="font-semibold">Menü</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 -mr-2 rounded-md text-paper-100 hover:bg-white/10"
                    aria-label="Kapat"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-3 space-y-1">
                  {/* Hızlı kartlar */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Link
                      href="/kampanyalar"
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col gap-1 p-3 bg-error/10 border border-error/20 rounded-lg text-error font-semibold text-sm"
                    >
                      🔥 Kampanyalar
                      <span className="text-[11px] text-ink-700 font-normal">Hazır paketler</span>
                    </Link>
                    <Link
                      href="/urunler"
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col gap-1 p-3 bg-brand-100 border border-brand-300 rounded-lg text-ink-900 font-semibold text-sm"
                    >
                      🛒 Tüm Ürünler
                      <span className="text-[11px] text-ink-500 font-normal">30+ kategori</span>
                    </Link>
                  </div>

                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 px-2 py-1.5 mt-3">
                    Kategoriler
                  </div>
                  {MAIN_NAV.map((n) => (
                    // key'e menuOpen durumunu ekleyerek drawer kapanınca remount → nested
                    // submenu state'i (açık/kapalı) otomatik reset.
                    <MobileNavGroup
                      key={`${n.label}-${menuOpen ? "open" : "closed"}`}
                      nav={n}
                      onClose={() => setMenuOpen(false)}
                    />
                  ))}

                  <div className="border-t border-paper-200 my-3" />

                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 px-2 py-1.5">
                    Yardım & İletişim
                  </div>
                  <MobileLink href="/iletisim" onClick={() => setMenuOpen(false)}>💬 Tasarım Desteği</MobileLink>
                  <MobileLink href="/kargo-takip" onClick={() => setMenuOpen(false)}>📦 Kargo Takip</MobileLink>
                  <MobileLink href="/yardim" onClick={() => setMenuOpen(false)}>❓ Yardım Merkezi</MobileLink>
                  <MobileLink href="/iletisim" onClick={() => setMenuOpen(false)}>📞 İletişim</MobileLink>
                  <MobileLink href="/hakkimizda" onClick={() => setMenuOpen(false)}>ℹ️ Hakkımızda</MobileLink>

                  <div className="border-t border-paper-200 my-3" />

                  {mounted && !user && (
                    <Link
                      href="/giris"
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 px-3 rounded-lg bg-ink-900 text-paper-50 text-center text-sm font-semibold"
                    >
                      Giriş Yap / Üye Ol
                    </Link>
                  )}
                  {mounted && user && (
                    <Link
                      href="/hesabim"
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 px-3 rounded-lg bg-ink-900 text-paper-50 text-center text-sm font-semibold"
                    >
                      Hesabım — {user.fullName.split(" ")[0]}
                    </Link>
                  )}

                  <div className="text-center text-[11px] text-ink-500 mt-4 pb-2">
                    324 Ajans · Markala — markala.com.tr
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Command-K Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavItem({ nav }: { nav: (typeof MAIN_NAV)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      <Link
        href={nav.href}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors relative",
          "text-ink-700 hover:text-ink-900",
          open && "text-ink-900",
        )}
      >
        {nav.highlight === "fire" && (
          <Lightning size={14} weight="fill" className="text-error" />
        )}
        {nav.label}
        {nav.highlight === "new" && (
          <span className="ml-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-paper-50 bg-error">YENİ</span>
        )}
        {nav.groups && <CaretDown size={10} weight="bold" className={cn("transition-transform", open && "rotate-180")} />}
        {open && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />}
      </Link>

      <AnimatePresence>
        {open && nav.groups && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 pt-1 z-50"
          >
            <div className="bg-paper-50 border border-paper-200 rounded-lg shadow-lg min-w-[280px] overflow-hidden">
              {nav.groups.map((g) => (
                <div key={g.title} className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    {g.title}
                  </div>
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between px-3 py-2 rounded text-sm text-ink-700 hover:bg-paper-100 hover:text-ink-900 transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500 text-ink-900">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
              <Link
                href={nav.href}
                className="block px-5 py-2.5 text-sm font-medium text-brand-700 hover:text-brand-900 border-t border-paper-200 hover:bg-paper-100 transition-colors"
              >
                Tümünü Gör →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileLink({
  href,
  highlight,
  onClick,
  children,
}: {
  href: string;
  highlight?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block py-2.5 px-3 rounded text-sm transition-colors",
        highlight
          ? "text-error font-medium"
          : "text-ink-700 hover:text-ink-900 hover:bg-paper-100",
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavGroup({
  nav,
  onClose,
}: {
  nav: (typeof MAIN_NAV)[number];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!nav.groups || nav.groups.length === 0) {
    return (
      <Link
        href={nav.href}
        onClick={onClose}
        className="block py-2.5 px-3 rounded text-sm font-medium text-ink-900 hover:bg-paper-100"
      >
        {nav.label}
      </Link>
    );
  }
  return (
    <div className="rounded overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between py-2.5 px-3 rounded text-sm font-medium text-ink-900 hover:bg-paper-100 transition-colors"
      >
        <span>{nav.label}</span>
        <CaretDown size={12} weight="bold" className={cn("transition-transform text-ink-500", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-paper-200 ml-3 my-1">
              {nav.groups.map((g) => (
                <div key={g.title} className="py-1">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    {g.title}
                  </div>
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-between py-2 px-3 rounded text-sm text-ink-700 hover:bg-paper-100 hover:text-ink-900"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500 text-ink-900">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
              <Link
                href={nav.href}
                onClick={onClose}
                className="block px-3 py-2 text-xs font-semibold text-brand-700 hover:text-brand-900"
              >
                Tümünü Gör →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserBlock({
  mounted,
  user,
}: {
  mounted: boolean;
  user: ReturnType<typeof useAuthStore.getState>["user"];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!mounted || !user) {
    return (
      <Link
        href="/giris"
        className="hidden sm:flex items-center gap-2.5 px-4 h-11 rounded-lg border border-paper-200 hover:border-ink-300 hover:bg-paper-100 transition-all"
      >
        <User size={20} className="text-ink-700" />
        <div className="text-left leading-tight">
          <div className="text-sm font-medium text-ink-900">Üye Girişi</div>
          <div className="text-[11px] text-ink-500">veya Üye Ol</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2.5 px-3 h-11 rounded-lg border border-paper-200 hover:border-ink-300 hover:bg-paper-100 transition-all"
      >
        <span className="w-7 h-7 rounded-full bg-brand-500 text-ink-900 grid place-items-center text-xs font-bold">
          {user.fullName.charAt(0).toUpperCase()}
        </span>
        <div className="text-left leading-tight">
          <div className="text-[11px] text-ink-500">Merhaba</div>
          <div className="text-sm font-medium text-ink-900 truncate max-w-[100px]">{user.fullName.split(" ")[0]}</div>
        </div>
        <CaretDown size={10} weight="bold" className="text-ink-500" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-paper-50 border border-paper-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-paper-200">
            <div className="text-sm font-medium text-ink-900 truncate">{user.fullName}</div>
            <div className="text-xs text-ink-500 truncate">{user.email}</div>
          </div>
          <div className="p-1">
            <UserMenuLink href="/hesabim" icon={<House size={14} />}>Hesap Özeti</UserMenuLink>
            <UserMenuLink href="/hesabim/siparislerim" icon={<Package size={14} />}>Siparişlerim</UserMenuLink>
            <UserMenuLink href="/favorilerim" icon={<Heart size={14} />}>Favorilerim</UserMenuLink>
            <UserMenuLink href="/hesabim/bilgilerim" icon={<User size={14} />}>Bilgilerim</UserMenuLink>
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-ink-700 hover:bg-paper-100 hover:text-error border-t border-paper-200 mt-1 pt-2"
            >
              <SignOut size={14} /> Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-ink-700 hover:bg-paper-100 hover:text-ink-900"
    >
      {icon}
      {children}
    </Link>
  );
}

function WishlistHeaderButton({ mounted }: { mounted: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    function load() {
      try {
        const raw = localStorage.getItem("markala_wishlist");
        const list = raw ? (JSON.parse(raw) as string[]) : [];
        setCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setCount(0);
      }
    }
    load();
    window.addEventListener("markala:wishlist-changed", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("markala:wishlist-changed", load);
      window.removeEventListener("storage", load);
    };
  }, [mounted]);

  return (
    <Link
      href="/favorilerim"
      className="hidden sm:flex relative w-11 h-11 rounded-lg border border-paper-200 hover:border-ink-300 hover:bg-paper-100 items-center justify-center transition-all"
      aria-label="Favorilerim"
    >
      <Heart size={18} className="text-ink-700" weight={count > 0 ? "fill" : "regular"} />
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-paper-50 text-[11px] font-bold grid place-items-center tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}

function CartButton({
  itemCount,
  mounted,
  onClick,
}: {
  itemCount: number;
  mounted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2.5 px-4 h-11 rounded-lg border border-paper-200 hover:border-ink-300 hover:bg-paper-100 transition-all"
      aria-label="Sepetim"
    >
      <ShoppingBag size={20} className="text-ink-700" />
      <div className="hidden sm:block text-left leading-tight">
        <div className="text-[11px] text-ink-500">Sepetim</div>
        <div className="text-sm font-medium text-ink-900 tabular-nums">
          {mounted ? `${itemCount} ürün` : "—"}
        </div>
      </div>
      {mounted && itemCount > 0 && (
        <span className="sm:hidden absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-ink-900 text-[11px] font-bold grid place-items-center tabular-nums">
          {itemCount}
        </span>
      )}
    </button>
  );
}

const SEARCH_HISTORY_KEY = "markala_search_history";

function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function saveSearch(query: string) {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const history = loadSearchHistory();
    const next = [trimmed, ...history.filter((q) => q !== trimmed)].slice(0, 5);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // sessizce yut — localStorage quota / SSR
  }
}

/**
 * Arama + mega-menü kataloğunu CANLI API'den lazy çeker (admin'in eklediği ürün/kategori
 * aramada ve "Popüler Kategoriler"de çıksın). `enabled` true olunca (modal açılınca) bir kez
 * çekilir; API hatası/boş → mock fallback korunur (arama ASLA kırılmaz).
 */
function useLiveCategories(enabled: boolean): Category[] {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    let active = true;
    apiClient.categories
      .list()
      .then((list) => {
        if (active && Array.isArray(list) && list.length > 0) setCategories(list);
      })
      .catch(() => {
        /* mock fallback korunur */
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return categories;
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const categories = useLiveCategories(open);

  // Açılırken query reset + ilk inputa odaklan + history yükle
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setHistory(loadSearchHistory());
    const firstInput = document.querySelector<HTMLInputElement>("[data-search-input]");
    firstInput?.focus();
  }, [open]);

  // Enter ile aramayı kaydet
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveSearch(query);
    setHistory(loadSearchHistory());
  };

  // Focus trap — Tab tuşu modal içinde dönsün
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = modalRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Sunucu-taraflı arama (debounce) — katalog 870+ ürün; tümünü client'a indirip filtrelemek
  // yerine backend isme göre filtreler (q, çok-kelime AND). En az 2 karakterde tetiklenir.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      apiClient.products
        .list({ q: term, take: 12 })
        .then((list) => {
          if (active && Array.isArray(list)) setResults(list);
        })
        .catch(() => {
          if (active) setResults([]);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!open) return null;

  const popularCategories = categories.slice(0, 6);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 grid items-start pt-[10vh] px-4"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-auto bg-paper-50 rounded-xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={onSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-paper-200">
            <MagnifyingGlass size={20} className="text-ink-500" />
            <input
              data-search-input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ne bastırmak istiyorsunuz? (kartvizit, branda, kupa...)"
              className="flex-1 bg-transparent outline-none text-base text-ink-900 placeholder:text-ink-500"
              aria-label="Site içi arama"
            />
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-500 bg-paper-100 border border-paper-200">
              ESC
            </kbd>
          </form>

          {!query && (
            <div className="p-5">
              {history.length > 0 && (
                <div className="mb-5 pb-5 border-b border-paper-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      Son Aramalar
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(SEARCH_HISTORY_KEY);
                        } catch {
                          // no-op
                        }
                        setHistory([]);
                      }}
                      className="text-[11px] text-ink-500 hover:text-error transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setQuery(q);
                          saveSearch(q);
                          setHistory(loadSearchHistory());
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-100 hover:bg-brand-100 text-ink-700 hover:text-brand-900 text-sm transition-colors"
                      >
                        <MagnifyingGlass size={12} />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
                Popüler Kategoriler
              </div>
              <div className="grid grid-cols-2 gap-1">
                {popularCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kategori/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-paper-100 group"
                  >
                    <span className="text-sm font-medium text-ink-900">{c.name}</span>
                    <ArrowRight
                      size={14}
                      className="text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-paper-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
                  Hızlı Erişim
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickLink href="/kampanyalar" onClose={onClose} icon={<Sparkle size={12} weight="fill" />}>
                    Kampanyalar
                  </QuickLink>
                  <QuickLink href="/kargo-takip" onClose={onClose} icon={<Truck size={12} weight="fill" />}>
                    Kargo Takip
                  </QuickLink>
                  <QuickLink href="/iletisim" onClose={onClose}>
                    Tasarım Desteği
                  </QuickLink>
                  <QuickLink href="/yardim" onClose={onClose} icon={<Question size={12} weight="fill" />}>
                    Yardım
                  </QuickLink>
                  <QuickLink href="/iletisim" onClose={onClose} icon={<EnvelopeSimple size={12} weight="fill" />}>
                    İletişim
                  </QuickLink>
                </div>
              </div>
            </div>
          )}

          {query && (
            <div className="p-3 max-h-[55vh] overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-5 text-center text-sm text-ink-500">
                  "<span className="text-ink-900 font-medium">{query}</span>" için sonuç bulunamadı.
                  <br />
                  <span className="text-xs">Farklı bir kelime deneyin veya kategorilere göz atın.</span>
                </div>
              ) : (
                <ul className="divide-y divide-paper-200">
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/urun/${p.slug}`}
                        onClick={() => { saveSearch(query); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors"
                      >
                        <MagnifyingGlass size={15} className="text-ink-400 flex-none" />
                        <span className="text-sm font-medium text-ink-900 truncate">{p.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function QuickLink({ href, icon, children, onClose }: { href: string; icon?: React.ReactNode; children: React.ReactNode; onClose: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-100 hover:bg-brand-100 text-ink-700 hover:text-brand-900 text-sm transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
