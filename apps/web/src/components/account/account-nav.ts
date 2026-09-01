import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour,
  Package,
  ArrowsClockwise,
  Receipt,
  Wallet,
  Coins,
  CreditCard,
  User,
  MapPin,
  Lock,
  Heart,
  ClockCounterClockwise,
  BellSimple,
  ShieldCheck,
} from "@phosphor-icons/react";

/**
 * HESAP ALANI ROTA KAYDI — TEK KAYNAK (2026-08-31).
 *
 * Neden var: /hesabim altında 14 sayfa vardı ama panoda yalnız 3 kısayol görünüyordu;
 * siparişlerim, faturalarım, puanlarım, cari hesabım, kartlarım, şifre, bildirim,
 * veri yönetimi ve önceden gezdiklerim hiçbir yerden ULAŞILAMIYORDU. Sebep, menünün
 * elle yazılmış olması ve yeni sayfa eklenince kimsenin oraya dönmemesi.
 *
 * Artık masaüstü kenar çubuğu, mobil şerit ve panodaki kısayollar HEP bu diziden okuyor.
 * Yeni sayfa eklerken buraya bir satır ekle — üç yüzeyde birden görünür.
 *
 * NOT: /hesabim/siparislerim/[orderId] bilerek menüde YOK — detay sayfası, üst rotadan
 * ulaşılır. (/hesabim/hesap-sil rotası 2026-09-01'de tamamen kaldırıldı: silme akışı
 * gerçekte hiçbir şey silmiyordu, talep artık /kvkk-basvuru formundan alınıyor.)
 */
export type AccountNavGroup = "is" | "odeme" | "hesap" | "listeler" | "tercihler";

export interface AccountNavItem {
  href: string;
  /** Menü, sayfa başlığı ve mobil şerit AYNI metni kullanır — ad kayması olmasın. */
  label: string;
  desc: string;
  icon: Icon;
  group: AccountNavGroup | null;
  /** Sayaç anahtarı — veri gelmeden yer rezerve edilir, madde zıplamaz. */
  countKey?: "orders" | "addresses";
  /** Koşullu maddeler: kurumsal hesap / sadakat programı açık olmalı. */
  when?: (ctx: AccountNavContext) => boolean;
  /** Mobil şeritte (maks 6 pill) görünsün mü. */
  inMobileTabs?: boolean;
}

export interface AccountNavContext {
  accountType?: string | null;
  loyaltyEnabled?: boolean;
  cariBakiye?: number | null;
}

export const ACCOUNT_GROUP_LABEL: Record<AccountNavGroup, string> = {
  is: "Siparişlerim",
  odeme: "Ödeme & Bakiye",
  hesap: "Hesabım",
  listeler: "Listelerim",
  tercihler: "Tercihler",
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  { href: "/hesabim", label: "Panom", desc: "Özet ve kısayollar", icon: SquaresFour, group: null, inMobileTabs: true },

  { href: "/hesabim/siparislerim", label: "Siparişlerim", desc: "Durum ve takip", icon: Package, group: "is", countKey: "orders", inMobileTabs: true },
  { href: "/hesabim/tekrar-siparis", label: "Tekrar Sipariş", desc: "Geçmişten tek tıkla yenile", icon: ArrowsClockwise, group: "is", inMobileTabs: true },
  { href: "/hesabim/faturalarim", label: "Faturalarım", desc: "E-arşiv kayıtların", icon: Receipt, group: "is", inMobileTabs: true },

  {
    href: "/hesabim/cari-hesabim",
    label: "Cari Hesabım",
    desc: "Bakiye ve ekstre",
    icon: Wallet,
    group: "odeme",
    inMobileTabs: true,
    // Bireysel müşteriye gösterme — sayfa kurumsal kredi metni içeriyor ve kafa karıştırıyor.
    when: (c) => c.accountType === "corporate" || (c.cariBakiye ?? 0) !== 0,
  },
  {
    href: "/hesabim/puanlarim",
    label: "Puanlarım",
    desc: "Kazanılan ve harcanan",
    icon: Coins,
    group: "odeme",
    when: (c) => c.loyaltyEnabled === true,
  },
  { href: "/hesabim/kartlarim", label: "Kayıtlı Kartlarım", desc: "Ödeme yöntemlerin", icon: CreditCard, group: "odeme" },

  { href: "/hesabim/bilgilerim", label: "Bilgilerim", desc: "Profil ve fatura bilgileri", icon: User, group: "hesap" },
  { href: "/hesabim/adreslerim", label: "Adreslerim", desc: "Teslimat adreslerin", icon: MapPin, group: "hesap", countKey: "addresses", inMobileTabs: true },
  { href: "/hesabim/sifre", label: "Şifre", desc: "Parolanı değiştir", icon: Lock, group: "hesap" },

  { href: "/favorilerim", label: "Favorilerim", desc: "Beğendiğin ürünler", icon: Heart, group: "listeler" },
  { href: "/hesabim/onceden-gezdiklerim", label: "Önceden Gezdiklerim", desc: "Son baktıkların", icon: ClockCounterClockwise, group: "listeler" },

  { href: "/hesabim/bildirim", label: "Bildirim Tercihleri", desc: "E-posta ve SMS", icon: BellSimple, group: "tercihler" },
  { href: "/hesabim/veri-yonetimi", label: "Veri Yönetimi", desc: "Verilerimi indir, KVKK", icon: ShieldCheck, group: "tercihler" },
];

/** Bağlama göre görünecek maddeler (koşulsuzlar her zaman girer). */
export function gorunurNav(ctx: AccountNavContext): AccountNavItem[] {
  return ACCOUNT_NAV.filter((i) => !i.when || i.when(ctx));
}

/** Aktif madde — detay sayfasında (ör. /siparislerim/abc) üst rotayı aktif sayar. */
export function aktifNav(pathname: string, ctx: AccountNavContext): AccountNavItem | undefined {
  const list = gorunurNav(ctx);
  const tam = list.find((i) => i.href === pathname);
  if (tam) return tam;
  return list
    .filter((i) => i.href !== "/hesabim" && pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
