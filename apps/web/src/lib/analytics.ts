/**
 * GA4 + Meta Pixel analytics wrapper.
 *
 * KVKK consent zorunlu:
 *   - GA4 event'leri: hasConsent("analytics") true olmalı
 *   - Meta Pixel event'leri: hasConsent("marketing") true olmalı
 *
 * Env değişkenleri:
 *   NEXT_PUBLIC_GA4_ID       — gtag yüklenince aktif
 *   NEXT_PUBLIC_META_PIXEL_ID — fbq yüklenince aktif
 *
 * Her iki fonksiyon da consent yoksa sessizce yok sayar.
 * Dev modda console.debug ile event'ler görülebilir.
 */

type GtagParams = Record<string, unknown>;
type FbEventData = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (action: string, event: string, data?: FbEventData, options?: { eventID?: string }) => void;
    _fbq?: unknown;
  }
}

/** Cookie consent'i dinamik olarak okur — circular import olmadan. */
function consentFor(category: "analytics" | "marketing"): boolean {
  if (typeof document === "undefined") return false;
  try {
    const m = document.cookie.match(/(?:^|; )markala_cookie_consent=([^;]+)/);
    if (!m || !m[1]) return false;
    const state = JSON.parse(decodeURIComponent(m[1]));
    return Boolean(state?.[category]);
  } catch {
    return false;
  }
}

/** GA4 event. Consent yoksa yutulur. */
export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  if (!consentFor("analytics")) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics] analytics consent yok — event yutuldu:", event, params);
    }
    return;
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  } else if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics] gtag yok — event yutuldu:", event, params);
  }
}

/**
 * Meta Pixel event. Marketing consent yoksa yutulur.
 *
 * eventId verilirse fbq'ye `{ eventID }` olarak geçilir → sunucu Conversions API
 * aynı event_id ile aynı olayı gönderdiğinde Meta iki kaydı TEKİLLEŞTİRİR (dedup).
 * Purchase'ta eventId = sipariş numarası kullanılır.
 */
export function fbtrack(event: string, data: FbEventData = {}, eventId?: string): void {
  if (typeof window === "undefined") return;
  if (!consentFor("marketing")) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics] marketing consent yok — fb event yutuldu:", event, data);
    }
    return;
  }
  if (typeof window.fbq === "function") {
    if (eventId) window.fbq("track", event, data, { eventID: eventId });
    else window.fbq("track", event, data);
  } else if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics] fbq yok — fb event yutuldu:", event, data);
  }
}

// ─── E-ticaret event yardımcıları ───────────────────────────────────────────

export interface TrackableProduct {
  slug: string;
  name: string;
  categorySlug?: string;
  price?: number;
}

/** Ürün detay sayfası açıldığında (GA4: view_item, Meta: ViewContent). */
export function trackViewItem(product: TrackableProduct): void {
  track("view_item", {
    currency: "TRY",
    value: product.price ?? 0,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.categorySlug ?? "",
        price: product.price ?? 0,
        quantity: 1,
      },
    ],
  });
  fbtrack("ViewContent", {
    content_ids: [product.slug],
    content_name: product.name,
    content_type: "product",
    currency: "TRY",
    value: product.price ?? 0,
  });
}

/** Sepete ekleme (GA4: add_to_cart, Meta: AddToCart). */
export function trackAddToCart(
  product: TrackableProduct,
  qty: number,
  totalPrice: number,
): void {
  track("add_to_cart", {
    currency: "TRY",
    value: totalPrice,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.categorySlug ?? "",
        price: totalPrice / qty,
        quantity: qty,
      },
    ],
  });
  fbtrack("AddToCart", {
    content_ids: [product.slug],
    content_name: product.name,
    content_type: "product",
    currency: "TRY",
    value: totalPrice,
  });
}

/** Ödeme adımına geçildiğinde (GA4: begin_checkout, Meta: InitiateCheckout). */
export function trackBeginCheckout(value: number, itemCount: number): void {
  track("begin_checkout", { currency: "TRY", value, num_items: itemCount });
  fbtrack("InitiateCheckout", { currency: "TRY", value, num_items: itemCount });
}

/** Purchase kalem satırı — GA4 items[] + Meta content_ids/contents için ortak sade yapı. */
export interface PurchaseItem {
  /** Ürün kimliği: slug (yoksa ürün adı — çağıran karar verir). */
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Sipariş tamamlandığında (GA4: purchase, Meta: Purchase).
 * `items` verilirse GA4 ürün performans raporları (items[] dizisi zorunlu — sayı çöpe gider)
 * ve Meta katalog eşleşmesi (content_ids/contents) beslenir; verilmezse eski davranış korunur.
 */
export function trackPurchase(
  orderNumber: string,
  value: number,
  itemCount: number,
  items?: PurchaseItem[],
): void {
  track("purchase", {
    currency: "TRY",
    transaction_id: orderNumber,
    value,
    num_items: itemCount,
    ...(items?.length
      ? {
          items: items.map((i) => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }
      : {}),
  });
  // eventId = orderNumber → sunucu Conversions API'nin aynı Purchase'ı ile Meta'da dedup.
  fbtrack(
    "Purchase",
    {
      currency: "TRY",
      value,
      order_id: orderNumber,
      num_items: itemCount,
      ...(items?.length
        ? {
            content_type: "product",
            content_ids: items.map((i) => i.id),
            contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
          }
        : {}),
    },
    orderNumber,
  );
  trackAdsConversion(orderNumber, value);
}

/**
 * Google Ads dönüşüm ateşleme çekirdeği. Label, GH variable → build-arg → env zinciriyle gelir;
 * label boşsa no-op (dönüşüm panelde tanımlanmadan kod ateşlemez). Marketing consent'e bağlı.
 */
function fireAdsConversion(label: string | undefined, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  if (!label) return; // label girilmeden dönüşüm ateşlenmez
  if (!consentFor("marketing")) return; // KVKK: reklam onayı yoksa gönderme
  const adsId = process.env.NEXT_PUBLIC_ADS_CONVERSION_ID || "AW-18286908100";
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: `${adsId}/${label}`, ...params });
  }
}

/** Google Ads "Satın alma" dönüşümü (NEXT_PUBLIC_ADS_PURCHASE_LABEL). */
export function trackAdsConversion(orderNumber: string, value: number): void {
  fireAdsConversion(process.env.NEXT_PUBLIC_ADS_PURCHASE_LABEL, {
    value,
    currency: "TRY",
    transaction_id: orderNumber,
  });
}

// ─── Üyelik + lead event'leri (2026-07-31: üye toplama ölçümü) ─────────────

/** Üye kaydı: GA4 sign_up + Ads "Üye Kaydı" ikincil dönüşümü (NEXT_PUBLIC_ADS_SIGNUP_LABEL). */
export function trackSignUp(method: "email" | "google"): void {
  track("sign_up", { method });
  fireAdsConversion(process.env.NEXT_PUBLIC_ADS_SIGNUP_LABEL);
}

/** Giriş: yalnız GA4 login (Ads dönüşümü değil — mevcut üyenin girişi reklam getirisi sayılmaz). */
export function trackLogin(method: "email" | "google"): void {
  track("login", { method });
}

/**
 * Lead formu (teklif/iletişim/numune): GA4 generate_lead + Ads "Teklif Talebi" ikincil
 * dönüşümü (NEXT_PUBLIC_ADS_LEAD_LABEL). İSG gibi B2B kategorilerde gerçek dönüşüm budur.
 */
export function trackLead(method: string, params: GtagParams = {}): void {
  track("generate_lead", { method, ...params });
  fireAdsConversion(process.env.NEXT_PUBLIC_ADS_LEAD_LABEL);
}

// ─── UTM yardımcısı ─────────────────────────────────────────────────────────

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

/**
 * URL'deki UTM parametrelerini normalize ederek döner.
 * Küçük harf + boşlukları alt çizgiye çevirir.
 */
export function getUtmParams(search?: string): UtmParams {
  const q = typeof window !== "undefined"
    ? new URLSearchParams(search ?? window.location.search)
    : new URLSearchParams(search ?? "");

  function norm(val: string | null): string | undefined {
    if (!val) return undefined;
    return val.toLowerCase().replace(/\s+/g, "_");
  }

  return {
    source: norm(q.get("utm_source")),
    medium: norm(q.get("utm_medium")),
    campaign: norm(q.get("utm_campaign")),
    term: norm(q.get("utm_term")),
    content: norm(q.get("utm_content")),
  };
}
