"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Arama modalı AYRI chunk (P2/TBT 2026-08-25): kod ilk AÇILIŞTA yüklenir, başlangıç
// bundle'ına girmez. ssr:false — modal SSR çıktısında zaten yer almıyordu (open=false).
const SearchModal = dynamic(() => import("./search-modal").then((m) => m.SearchModal), {
  ssr: false,
});
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
  CaretRight,
  Star,
  PencilSimple,
  Lightning,
  Truck,
  WhatsappLogo,
  Phone,
  ArrowRight,
  Heart,
  Tag,
  Gift,
  SquaresFour,
} from "@phosphor-icons/react";
import { Container, cn } from "@markala/ui";
import type { Category, Product } from "@markala/types";
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
  { href: "/kurumsal", label: "Kurumsal" },
  { href: "/kargo-takip", label: "Kargo Takip" },
  { href: "/yardim", label: "Yardım" },
  { href: "/iletisim", label: "İletişim" },
];

// === Header navigasyon tipi (Faz 1: admin /menu yönetir, storefront API'den okur) ===
export type NavFeatured = { slug: string; label: string; theme?: "brand" | "paper" | "ink" };
export type NavCategory = {
  label: string;
  href: string;
  /** Mega menu — alt kategori listesi gösterilir */
  groups?: Array<{ title: string; items: Array<{ label: string; href: string; badge?: string }> }>;
  /** Mega menu sağ blok — öne çıkan ürünler (fiyat YOK; /api/mockup görselli) */
  featured?: NavFeatured[];
  highlight?: "fire" | "new";
};

/** Nav grubunun "Tümünü gör" hedefi — /urunler çoklu-kategori ön-filtresi.
 * Nav grupları birden çok düz DB kategorisine yayılır (İSG=10 kategori); düz
 * `/urunler` "Hepsi"ye düşer, bu yüzden grup kategorileri query ile taşınır. */
const groupHref = (label: string, slugs: string[]) =>
  `/urunler?kategoriler=${slugs.join(",")}&grup=${encodeURIComponent(label)}`;

// Varsayılan/yedek menü — admin /menu kaydı (header_nav) yoksa/boş/bozuksa bu kullanılır.
const DEFAULT_NAV: NavCategory[] = [
  {
    label: "Kartvizit & Kırtasiye",
    href: groupHref("Kartvizit & Kırtasiye", ["kartvizit", "antetli-kagit", "zarf", "cepli-dosya", "makbuz"]),
    groups: [
      {
        title: "Kartvizit",
        items: [
          {
            label: "Klasik Kartvizit (21 paket)",
            href: "/urun/klasik-kartvizit",
            badge: "POPÜLER",
          },
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
    featured: [
      { slug: "klasik-kartvizit", label: "Klasik Kartvizit", theme: "brand" },
      { slug: "antetli-kagit", label: "Antetli Kağıt", theme: "paper" },
    ],
  },
  {
    label: "Broşür & El İlanı",
    href: groupHref("Broşür & El İlanı", ["brosur", "kapi-aski-brosur", "el-ilani", "afis", "etiket"]),
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
    featured: [
      { slug: "selefonlu-brosur", label: "Selefonlu Broşür", theme: "paper" },
      { slug: "el-ilani", label: "El İlanı 105 gr", theme: "brand" },
    ],
  },
  {
    // Vinil ve Mesh branda "Dijital Baskı" sekmesine taşındı (2026-08-28) — ikisi de
    // m² solvent/UV baskı. Sekmede branda kalmayınca ad da "Bayrak & Stand" oldu.
    label: "Bayrak & Stand",
    href: groupHref("Bayrak & Stand", ["yelken-bayrak", "kirlangic-bayrak", "masa-bayragi", "makam-bayragi", "rollup"]),
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
        title: "Stand",
        items: [{ label: "Rollup 85×200", href: "/urun/rollup-standart" }],
      },
    ],
    featured: [
      { slug: "yelken-bayrak-damla", label: "Yelken Bayrak", theme: "ink" },
      { slug: "rollup-standart", label: "Roll-Up Banner", theme: "brand" },
    ],
  },
  {
    label: "Promosyon & Hediye",
    href: groupHref("Promosyon & Hediye", ["kupa", "magnet", "plaket", "madalya", "bloknot"]),
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
    featured: [
      { slug: "klasik-beyaz-kupa", label: "Sublime Kupa", theme: "brand" },
      { slug: "magnet-promosyon", label: "Promosyon Magnet", theme: "paper" },
    ],
  },
  {
    // Dekota, Folyo Çeşitleri ve Araç Sticker "Dijital Baskı"ya taşındı (2026-08-28).
    // Bu sekmede yalnız HAZIR/monte ürünler kalır — baskı hizmetleri yandaki sekmede.
    label: "Reklam Tabela",
    href: groupHref("Reklam Tabela", ["lightbox", "guvenlik-uyari-levhalari", "fosforlu-folyo", "plastik-reklam-dubasi", "arac-magneti"]),
    groups: [
      {
        title: "Tabela & Levha",
        items: [
          { label: "Lightbox LED", href: "/urun/lightbox-led-100cm" },
          { label: "Güvenlik Levhası", href: "/urun/guvenlik-levhasi-sigorta" },
          { label: "Fosforlu Acil Çıkış", href: "/urun/fosforlu-cikis-folyo" },
          { label: "Plastik Duba", href: "/urun/plastik-duba-baskili" },
          { label: "Araç Magneti", href: "/urun/arac-magneti-30x40" },
        ],
      },
    ],
    featured: [
      { slug: "lightbox-led-100cm", label: "Lightbox LED", theme: "ink" },
      { slug: "arac-magneti-30x40", label: "Araç Magneti", theme: "paper" },
    ],
  },
  {
    // DİJİTAL BASKI (2026-08-28, Hasan) — m² hesaplı baskı hizmetleri tek sekmede.
    // Reklam Tabela'nın YANINA konumlandı. Çakışma bırakılmadı: buraya taşınan
    // ürünler eski sekmelerinden ÇIKARILDI, iki yerde birden görünmüyorlar.
    // Baskes Folyo, Duvar Kağıdı, Pleksi, Kompozit, Kanvas ve UV DTF eklendiğinde
    // "Levha & Özel" grubuna ve featured kartlarına buradan bağlanacak.
    label: "Dijital Baskı",
    href: groupHref("Dijital Baskı", ["vinil-branda-afis", "folyo", "dekota-baski", "arac-sticker"]),
    groups: [
      {
        title: "Vinil & Branda",
        items: [
          { label: "Vinil Branda 440 gr", href: "/urun/vinil-branda-440gr", badge: "POPÜLER" },
          { label: "Mesh Branda", href: "/urun/mesh-branda" },
        ],
      },
      {
        title: "Folyo & Levha",
        items: [
          { label: "Folyo Çeşitleri", href: "/urun/folyo-cesitleri" },
          { label: "Dekota / Foreks Baskı", href: "/urun/dekota-baski-5mm" },
          { label: "Araç Sticker", href: "/urun/arac-sticker-yan" },
        ],
      },
    ],
    featured: [
      { slug: "vinil-branda-440gr", label: "Vinil Branda", theme: "brand" },
      { slug: "dekota-baski-5mm", label: "Dekota Baskı", theme: "paper" },
    ],
  },
  {
    label: "Restoran & Otel",
    href: groupHref("Restoran & Otel", ["amerikan-servis", "oto-paspas", "canta-kese", "kase"]),
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
    featured: [
      { slug: "amerikan-servis", label: "Amerikan Servis", theme: "paper" },
      { slug: "trodat-printy-4912", label: "Trodat Kaşe", theme: "brand" },
    ],
  },
  {
    label: "İSG Uyarı Levhaları",
    href: groupHref("İSG Uyarı Levhaları", [
      "is-guvenligi-uyari-ikaz",
      "is-guvenligi-yasaklayici",
      "is-guvenligi-emredici-kkd",
      "is-guvenligi-acil-ilk-yardim",
      "is-guvenligi-yangin",
      "is-guvenligi-elektrik-voltaj",
      "is-guvenligi-ges",
      "is-guvenligi-trafik-saha",
      "is-guvenligi-kalite-kontrol",
      "is-guvenligi-bilgilendirme-talimat",
    ]),
    groups: [
      {
        title: "İş Güvenliği Levhaları",
        items: [
          {
            label: "Uyarı / İkaz Levhaları",
            href: "/kategori/is-guvenligi-uyari-ikaz",
            badge: "YENİ",
          },
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
          {
            label: "Bilgilendirme & Talimat",
            href: "/kategori/is-guvenligi-bilgilendirme-talimat",
          },
        ],
      },
    ],
    // Öne çıkanlar (Hasan 2026-08-25): İSG panelinde sağ blok boş kalıyordu.
    // Admin header_nav kaydına da aynı iki ürün eklendi (canlı oradan okur).
    featured: [
      { slug: "sigara-icmek-ve-acik-alev-yasaktir", label: "Sigara İçmek ve Açık Alev Yasaktır", theme: "brand" },
      { slug: "dikkat-yuksek-gerilim-yaklasma-levhasi", label: "Dikkat Yüksek Gerilim", theme: "ink" },
    ],
  },
  {
    label: "Kurumsal",
    href: "/kurumsal",
  },
];

export function SiteHeader({ nav }: { nav?: NavCategory[] } = {}) {
  // Admin /menu kaydı (header_nav) varsa onu, yoksa koddaki DEFAULT_NAV'ı kullan.
  const NAV: NavCategory[] = nav && nav.length > 0 ? nav : DEFAULT_NAV;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Modal chunk'ı yalnız İLK açılışta yüklensin; sonra mount kalır (açılış animasyonu korunur).
  const [searchEverOpened, setSearchEverOpened] = useState(false);
  useEffect(() => {
    if (searchOpen) setSearchEverOpened(true);
  }, [searchOpen]);
  const [mounted, setMounted] = useState(false);
  // Mega menü — iki mod:
  //  "all"    → en soldaki "Tüm Ürünler" butonu: dikey kategori listesi (rail) + aktif kategori içeriği
  //  "single" → tek kategori sekmesi: yalnız o kategorinin menüsü (rail YOK)
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaMode, setMegaMode] = useState<"all" | "single">("all");
  const [megaIndex, setMegaIndex] = useState(0);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Panelde gösterilebilir kategoriler — alt menüsü olmayanlar (ör. Kurumsal) rail'e girmez
  const megaItems = useMemo(() => NAV.filter((n) => n.groups && n.groups.length > 0), [NAV]);

  const openAll = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    setMegaMode("all");
    setMegaOpen(true);
  };
  const openSingle = (i: number) => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    setMegaMode("single");
    setMegaIndex(i);
    setMegaOpen(true);
  };
  // Küçük gecikmeli kapanma — sekme→panel geçişinde yanlışlıkla kapanmayı önler
  const scheduleMegaClose = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };
  const cancelMegaClose = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
  };

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

  // Effect 3: route değişince mobil menüyü + mega menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
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
        {/* Top utility bar — scroll'da gizlenir. Zemin: hero slider'ın koyu mor tonları (slide görselinden örneklendi) */}
        <AnimatePresence initial={false}>
          {!scrolled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-gradient-to-r from-[#241C54] via-[#322768] to-[#4B3AA0] text-paper-100 overflow-hidden"
            >
              <Container className="relative flex items-center justify-between py-2 text-xs whitespace-nowrap">
                {/* Orta — Kampanyalar (premium koyu pill + nabız nokta). lg+ ortada,
                    sol/sağ gruplarla çakışmaması için küçük ekranda gizli.
                    GEÇİCİ GİZLENDİ (Hasan talebi 2026-07-06): daha sonra açmak için
                    aşağıdaki `false` değerini `true` yap. */}
                {false && (
                  <Link
                    href="/kampanyalar"
                    className="hidden lg:inline-flex absolute left-1/2 -translate-x-1/2 items-center gap-2 rounded-full bg-surface-2 border border-surface-4 text-paper-50 font-semibold px-4 py-1.5 hover:border-brand-400/60 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    <Tag size={13} weight="fill" className="text-brand-400" /> Kampanyalar
                  </Link>
                )}
                <div className="flex items-center gap-4 md:gap-5">
                  <a
                    href="tel:+903244333351"
                    className="flex items-center gap-1.5 hover:text-brand-400 transition-colors"
                  >
                    <Phone size={12} weight="fill" /> 0324 433 33 51
                  </a>
                  <a
                    href="https://wa.me/905057417028"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 hover:text-brand-400 transition-colors"
                  >
                    <WhatsappLogo size={12} weight="fill" /> WhatsApp
                  </a>
                  <span className="hidden lg:flex items-center gap-1.5 text-paper-100/70">
                    <Truck size={12} weight="fill" /> 81 ile teslimat
                  </span>
                  {/* İlk-sipariş teşviki üst çubukta HER sayfada görünür — CRO denetimi
                      2026-08-01: kupon yalnız sayfa diplerindeydi, duvara gelen müşteri
                      %10'u hiç görmüyordu. */}
                  <span className="hidden md:flex items-center gap-1.5 text-brand-400 font-semibold">
                    <Gift size={12} weight="fill" /> İlk siparişe %10:{" "}
                    <code className="rounded bg-brand-500/15 px-1.5 py-0.5 font-mono text-[11px]">HOSGELDIN</code>
                  </span>
                </div>
                <nav className="flex items-center gap-4 md:gap-5">
                  {/* İndirimli Paketler — üst şeritte (Hasan 2026-08-25: kategori nav'ına
                      koymak menüyü sıkıştırıp başlıkları iki satıra kırdırdı; burada bol yer
                      var, her sayfada görünür). Mobil erişim hamburger menünün en üstünde. */}
                  <Link
                    href="/kampanyalar"
                    className="hidden sm:flex items-center gap-1.5 font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <Tag size={13} weight="fill" /> İndirimli Paketler
                  </Link>
                  <Link
                    href="/teklif-al"
                    className="rounded-md bg-brand-500 px-2.5 py-1 font-semibold text-ink-900 hover:bg-brand-400 transition-colors"
                  >
                    Teklif Al
                  </Link>
                  {TOP_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="hidden md:inline-block text-paper-100/80 hover:text-paper-50 transition-colors"
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
          <Container
            className={cn(
              "flex items-center gap-4 md:gap-8 transition-all duration-200",
              // Scroll'da daha kompakt (Trendyol tarzı slim sticky); normalde de eskisinden alçak
              scrolled ? "py-2 md:py-2.5" : "py-3 md:py-3.5",
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex-none group" aria-label="Markala — ana sayfa">
              <img
                src="/markala-logo.svg"
                alt="markala.com.tr"
                width={119}
                height={40}
                className="h-9 md:h-10 w-auto"
              />
            </Link>

            {/* Search — büyük command-bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 items-center gap-3 max-w-2xl px-5 h-11 rounded-xl bg-paper-100 border border-paper-200 hover:border-ink-300 hover:bg-paper-50 transition-all group"
            >
              <MagnifyingGlass size={18} className="text-ink-500 group-hover:text-ink-700" />
              <span className="text-ink-500 text-sm flex-1 text-left">
                Ne bastıracaksın?
              </span>
              {/* Türk KOBİ kitlesi ağırlıkla Windows — Mac ⌘ sembolü "bozuk karakter" gibi
                  algılanıyordu; kısayol her iki platformda da çalışır, gösterim Ctrl K. */}
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-ink-500 bg-paper-50 border border-paper-200">
                Ctrl K
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

          {/* Bottom category nav — sekmeler + tek paylaşılan mega panel (Varyant B).
              Scroll'da gizlenir → üstte yalnız kompakt ana bar kalır (Trendyol tarzı). */}
          {!scrolled && (
          <div
            className="hidden lg:block border-t border-paper-200 relative"
            onMouseEnter={cancelMegaClose}
            onMouseLeave={scheduleMegaClose}
          >
            <Container className="flex items-center gap-1">
              {/* Tüm Ürünler — en solda, hover'da tüm kategorileri dikey listeleyen panel */}
              <Link
                href="/urunler"
                onMouseEnter={openAll}
                onFocus={openAll}
                aria-haspopup="true"
                aria-expanded={megaOpen && megaMode === "all"}
                className={cn(
                  "my-1.5 mr-2 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                  megaOpen && megaMode === "all"
                    ? "bg-ink-900 text-paper-50"
                    : "bg-paper-100 text-ink-900 hover:bg-ink-900 hover:text-paper-50",
                )}
              >
                <SquaresFour size={16} weight="bold" />
                Tüm Ürünler
                <CaretDown
                  size={10}
                  weight="bold"
                  className={cn("transition-transform", megaOpen && megaMode === "all" && "rotate-180")}
                />
              </Link>
              <span aria-hidden className="h-5 w-px bg-paper-200 mr-1" />
              {NAV.map((nav) => {
                const mi = megaItems.indexOf(nav);
                const isActive = megaOpen && megaMode === "single" && mi >= 0 && megaIndex === mi;
                return (
                  <Link
                    key={nav.label}
                    href={nav.href}
                    onMouseEnter={() => (mi >= 0 ? openSingle(mi) : scheduleMegaClose())}
                    onFocus={() => {
                      if (mi >= 0) openSingle(mi);
                    }}
                    aria-haspopup={mi >= 0 ? "true" : undefined}
                    aria-expanded={mi >= 0 ? isActive : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "text-ink-900" : "text-ink-700 hover:text-ink-900",
                    )}
                  >
                    {nav.highlight === "fire" && <Lightning size={14} weight="fill" className="text-error" />}
                    {nav.label}
                    {nav.highlight === "new" && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-paper-50 bg-error">YENİ</span>
                    )}
                    {mi >= 0 && (
                      <CaretDown
                        size={10}
                        weight="bold"
                        className={cn("transition-transform", isActive && "rotate-180")}
                      />
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </Container>

            <MegaPanel
              items={megaItems}
              activeIndex={megaIndex}
              open={megaOpen}
              mode={megaMode}
              onActive={setMegaIndex}
              onClose={() => setMegaOpen(false)}
            />
          </div>
          )}
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
                role="dialog"
                aria-modal="true"
                aria-label="Menü"
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
                      🔥 İndirimli Paketler
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

                  {/* Teklif Al — birincil dönüşüm CTA'sı (masaüstü utility bar paritesi) */}
                  <Link
                    href="/teklif-al"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between gap-2 p-3 mb-1 rounded-lg bg-ink-900 text-paper-50 font-semibold text-sm"
                  >
                    <span className="flex items-center gap-2">📝 Teklif Al</span>
                    <span className="text-[11px] font-normal text-paper-100/70">Özel fiyat · 24 saatte dönüş</span>
                  </Link>

                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 px-2 py-1.5 mt-3">
                    Kategoriler
                  </div>
                  {NAV.map((n) => (
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
                  <MobileLink href="/iletisim" onClick={() => setMenuOpen(false)}>
                    💬 Tasarım Desteği
                  </MobileLink>
                  <MobileLink href="/kargo-takip" onClick={() => setMenuOpen(false)}>
                    📦 Kargo Takip
                  </MobileLink>
                  <MobileLink href="/yardim" onClick={() => setMenuOpen(false)}>
                    ❓ Yardım Merkezi
                  </MobileLink>
                  <MobileLink href="/iletisim" onClick={() => setMenuOpen(false)}>
                    📞 İletişim
                  </MobileLink>
                  <MobileLink href="/hakkimizda" onClick={() => setMenuOpen(false)}>
                    ℹ️ Hakkımızda
                  </MobileLink>

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
      {searchEverOpened && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}

/**
 * Öne çıkan ürün kartı — mega menü sağ bloğu.
 * Görsel /api/mockup'tan (marka tonunda SVG). FİYAT GÖSTERİLMEZ
 * (canlıda çoğu ürün "Teklif Al" — yanlış fiyat yanıltır).
 */
function FeaturedCard({
  slug,
  label,
  theme = "brand",
}: {
  slug: string;
  label: string;
  theme?: "brand" | "paper" | "ink";
}) {
  return (
    <Link
      href={`/urun/${slug}`}
      className="group block bg-paper-50 border border-paper-200 rounded-xl overflow-hidden transition-all hover:border-ink-300 hover:shadow-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[4/3] bg-paper-100 overflow-hidden">
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold tracking-wide bg-ink-900 text-brand-400 px-1.5 py-0.5 rounded">
          ÖNE ÇIKAN
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.markala.com.tr/uploads/products/${slug}.webp?v=3`}
          alt={label}
          loading="lazy"
          onError={(e) => {
            // Gerçek foto yoksa marka-tonlu mockup'a düş (tek seferlik, döngü önler)
            const t = e.currentTarget;
            if (t.dataset.fb !== "1") {
              t.dataset.fb = "1";
              t.src = `/api/mockup?slug=${encodeURIComponent(slug)}&theme=${theme}&w=320&h=240`;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[13px] font-semibold text-ink-900 leading-tight">{label}</div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 group-hover:text-brand-900">
          İncele <ArrowRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Tek paylaşılan mega menü paneli — iki mod:
 *  mode="all"    → "Tüm Ürünler" butonu: sol dikey kategori rail'i + aktif kategorinin içeriği
 *  mode="single" → kategori sekmesi: rail YOK, yalnız o kategorinin alt-grup sütunları
 * Sağ: öne çıkan kartlar. Alt: "Tümünü gör" + güven rozetleri.
 * Panel .catnav'a (tam genişlik) tutturulur; Container ile aynı max-w/padding
 * kullanılarak nav ile hizalanır. NOT: framer-motion `y` animasyonu transform'u
 * inline yazdığı için ortalama `-translate-x-1/2` ile DEĞİL `left-0 right-0 mx-auto`
 * ile yapılır (yoksa transform çakışıp panel sağa kayar).
 */
function MegaPanel({
  items,
  activeIndex,
  open,
  mode,
  onActive,
  onClose,
}: {
  items: NavCategory[];
  activeIndex: number;
  open: boolean;
  mode: "all" | "single";
  onActive: (i: number) => void;
  onClose: () => void;
}) {
  const nav = items[activeIndex];
  return (
    <AnimatePresence>
      {open && nav && (
        <motion.div
          // mode değişince paneli remount et → "all"↔"single" geçişi temiz animasyonla olur
          key={mode}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="absolute left-0 right-0 top-full mx-auto max-w-content px-6 md:px-10 lg:px-16 z-50"
          role="region"
          aria-label={mode === "all" ? "Tüm ürün kategorileri menüsü" : `${nav.label} kategorisi menüsü`}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        >
          <div className="bg-paper-50 border border-paper-200 border-t-[3px] border-t-brand-500 rounded-b-2xl shadow-lg overflow-hidden">
            <div className={cn("grid", mode === "all" ? "grid-cols-[248px_1fr]" : "grid-cols-1")}>
              {/* Sol rail — tüm kategoriler (yalnız "Tüm Ürünler" modunda) */}
              {mode === "all" && (
                <div className="bg-paper-100 border-r border-paper-200 p-3">
                  {items.map((it, i) => (
                    <Link
                      key={it.label}
                      href={it.href}
                      onMouseEnter={() => onActive(i)}
                      onFocus={() => onActive(i)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-left transition-colors",
                        i === activeIndex
                          ? "bg-paper-50 text-brand-700 shadow-sm"
                          : "text-ink-700 hover:bg-paper-50 hover:text-ink-900",
                      )}
                    >
                      <span>{it.label}</span>
                      <CaretRight
                        size={13}
                        weight="bold"
                        className={i === activeIndex ? "text-brand-600" : "text-ink-300"}
                      />
                    </Link>
                  ))}
                  <Link
                    href="/urunler"
                    className="mt-2 flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-900 hover:bg-paper-50 border-t border-paper-200 transition-colors"
                  >
                    Tüm ürünleri gör <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              )}

              {/* Sağ içerik — aktif kategori */}
              <div
                className={cn(
                  "grid grid-cols-1 xl:grid-cols-[1.55fr_1.15fr]",
                  mode === "all" ? "min-h-[280px]" : "min-h-[220px]",
                )}
              >
                <div
                  className="grid gap-x-7 gap-y-1 p-7 content-start"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(Math.max(nav.groups?.length ?? 1, 1), 3)}, minmax(0, 1fr))`,
                  }}
                >
                  {nav.groups?.map((g) => (
                    <div key={g.title}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 pb-2.5">
                        {g.title}
                      </div>
                      {g.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center justify-between gap-2 -mx-2.5 px-2.5 py-2 rounded-lg text-[13.5px] text-ink-700 hover:bg-paper-100 hover:text-ink-900 transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500 text-ink-900">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                {nav.featured && nav.featured.length > 0 && (
                  <div className="hidden xl:block bg-paper-100 border-l border-paper-200 p-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3.5">
                      <Star size={12} weight="fill" className="text-brand-600" /> Öne Çıkanlar
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      {nav.featured.map((f) => (
                        <FeaturedCard key={f.slug} {...f} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alt şerit */}
            <div className="flex items-center justify-between gap-4 px-7 py-3.5 border-t border-paper-200 bg-paper-50">
              <Link
                href={nav.href}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:text-brand-900"
              >
                Tüm {nav.label} ürünlerini gör <ArrowRight size={14} weight="bold" />
              </Link>
              <div className="hidden md:flex items-center gap-4 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Truck size={13} weight="fill" className="text-brand-600" /> 1-2 iş günü üretim
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PencilSimple size={13} weight="fill" className="text-brand-600" /> Ücretsiz tasarım desteği
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
        highlight ? "text-error font-medium" : "text-ink-700 hover:text-ink-900 hover:bg-paper-100",
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavGroup({ nav, onClose }: { nav: NavCategory; onClose: () => void }) {
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
        aria-expanded={open}
        className="w-full flex items-center justify-between py-2.5 px-3 rounded text-sm font-medium text-ink-900 hover:bg-paper-100 transition-colors"
      >
        <span>{nav.label}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={cn("transition-transform text-ink-500", open && "rotate-180")}
        />
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

              {nav.featured && nav.featured.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2">
                    <Star size={11} weight="fill" className="text-brand-600" /> Öne Çıkanlar
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {nav.featured.map((f) => (
                      <Link
                        key={f.slug}
                        href={`/urun/${f.slug}`}
                        onClick={onClose}
                        className="group flex flex-col rounded-lg border border-paper-200 overflow-hidden bg-paper-50 active:bg-paper-100"
                      >
                        <span className="relative block aspect-[4/3] bg-paper-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.markala.com.tr/uploads/products/${f.slug}.webp?v=3`}
                            alt={f.label}
                            loading="lazy"
                            onError={(e) => {
                              const t = e.currentTarget;
                              if (t.dataset.fb !== "1") {
                                t.dataset.fb = "1";
                                t.src = `/api/mockup?slug=${encodeURIComponent(f.slug)}&theme=${f.theme ?? "brand"}&w=240&h=180`;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        </span>
                        <span className="px-2 py-1.5 text-[12px] font-medium text-ink-900 leading-tight">
                          {f.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
          <div className="text-sm font-medium text-ink-900 truncate max-w-[100px]">
            {user.fullName.split(" ")[0]}
          </div>
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
            <UserMenuLink href="/hesabim" icon={<House size={14} />}>
              Hesap Özeti
            </UserMenuLink>
            <UserMenuLink href="/hesabim/siparislerim" icon={<Package size={14} />}>
              Siparişlerim
            </UserMenuLink>
            <UserMenuLink href="/favorilerim" icon={<Heart size={14} />}>
              Favorilerim
            </UserMenuLink>
            <UserMenuLink href="/hesabim/bilgilerim" icon={<User size={14} />}>
              Bilgilerim
            </UserMenuLink>
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

function UserMenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
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

