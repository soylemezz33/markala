/**
 * Birinci-parti ziyaretçi davranış izleme (storefront → admin "Ziyaretçi Analizi").
 *
 * KVKK: İzleme YALNIZCA analytics consent varsa çalışır. Consent yoksa tüm fonksiyonlar
 * NO-OP'tur (hiçbir olay kuyruğa girmez/gönderilmez). Consent okuması lib/analytics.ts ile
 * birebir aynı desendir (markala_cookie_consent cookie → analytics flag).
 *
 * Tüm tarayıcı API'leri (window/localStorage/navigator/document) guard'lıdır → SSR güvenli.
 *
 * Olaylar bir kuyruğa eklenir ve:
 *   - kısa debounce (DEBOUNCE_MS) sonrası, veya
 *   - sayfa gizlenince (visibilitychange→hidden) / pagehide anında
 * navigator.sendBeacon ile (yoksa fetch keepalive) /api/analytics/collect'e batch gönderilir.
 *
 * sessionId + device + referrer + utmSource her olaya otomatik eklenir.
 */

const COLLECT_ENDPOINT = "/api/analytics/collect";
const VID_KEY = "mk_vid";
const DEBOUNCE_MS = 1500;

type Device = "mobile" | "tablet" | "desktop";

export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "begin_checkout"
  | string;

interface RawEvent {
  type: AnalyticsEventType;
  path?: string;
  productSlug?: string;
  dwellMs?: number;
  value?: number;
}

interface OutgoingEvent extends RawEvent {
  sessionId: string;
  device: Device;
  referrer?: string;
  utmSource?: string;
}

// ─── Ortam guard'ları ───────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Cookie consent'i dinamik olarak okur — lib/analytics.ts ile aynı desen, circular import yok. */
function consentForAnalytics(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const m = document.cookie.match(/(?:^|; )markala_cookie_consent=([^;]+)/);
    if (!m || !m[1]) return false;
    const state = JSON.parse(decodeURIComponent(m[1]));
    return Boolean(state?.analytics);
  } catch {
    return false;
  }
}

// ─── Kalıcı ziyaretçi id ────────────────────────────────────────────────────

function randomUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fallback altta */
  }
  // RFC4122-benzeri fallback (crypto.randomUUID yoksa)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Kalıcı ziyaretçi id'si (localStorage `mk_vid`). Oturum için de bu yeterli — basit tutuldu.
 * localStorage erişilemezse (gizli sekme/quota) bellekteki geçici id'ye düşer.
 */
let memoryVid: string | null = null;

export function getSessionId(): string {
  if (!isBrowser()) return "ssr";
  try {
    const existing = window.localStorage.getItem(VID_KEY);
    if (existing) return existing;
    const fresh = randomUuid();
    window.localStorage.setItem(VID_KEY, fresh);
    return fresh;
  } catch {
    if (!memoryVid) memoryVid = randomUuid();
    return memoryVid;
  }
}

// ─── Cihaz tespiti ──────────────────────────────────────────────────────────

function detectDevice(): Device {
  if (!isBrowser()) return "desktop";
  try {
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
      if (window.matchMedia("(max-width: 1024px)").matches) return "tablet";
    }
    const ua = navigator.userAgent || "";
    if (/iPad|Tablet/i.test(ua)) return "tablet";
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  } catch {
    /* desktop'a düş */
  }
  return "desktop";
}

function getUtmSource(): string | undefined {
  if (!isBrowser()) return undefined;
  try {
    const v = new URLSearchParams(window.location.search).get("utm_source");
    return v ? v.toLowerCase().replace(/\s+/g, "_") : undefined;
  } catch {
    return undefined;
  }
}

function getReferrer(): string | undefined {
  if (!isBrowser()) return undefined;
  const r = document.referrer;
  return r ? r : undefined;
}

// ─── Kuyruk + flush ─────────────────────────────────────────────────────────

let queue: OutgoingEvent[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function clearDebounce() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/** Kuyruğu /api/analytics/collect'e gönderir. İzleme asla kullanıcıyı etkilemez → hatalar yutulur. */
function flush(): void {
  if (!isBrowser()) return;
  clearDebounce();
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];

  const payload = JSON.stringify({ events: batch });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      // text/plain → preflight yok; BFF body'yi req.text() ile okuyor.
      const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      const ok = navigator.sendBeacon(COLLECT_ENDPOINT, blob);
      if (ok) return;
    }
  } catch {
    /* fetch'e düş */
  }

  // sendBeacon yoksa/başarısızsa keepalive fetch (sayfa kapanırken bile gider).
  try {
    void fetch(COLLECT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* sessizce yok say */
  }
}

function ensureListeners(): void {
  if (listenersBound || !isBrowser()) return;
  listenersBound = true;
  const onHide = () => flush();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", onHide);
}

// ─── Genel API ──────────────────────────────────────────────────────────────

/**
 * Bir olayı kuyruğa ekler. Consent yoksa NO-OP.
 * sessionId/device/referrer/utmSource otomatik eklenir; kısa debounce ile flush edilir.
 */
export function track(type: AnalyticsEventType, payload: RawEvent = { type }): void {
  if (!isBrowser()) return;
  if (!consentForAnalytics()) return;

  const event: OutgoingEvent = {
    type,
    path: payload.path,
    productSlug: payload.productSlug,
    dwellMs: payload.dwellMs,
    value: payload.value,
    sessionId: getSessionId(),
    device: detectDevice(),
    referrer: getReferrer(),
    utmSource: getUtmSource(),
  };

  queue.push(event);
  ensureListeners();

  clearDebounce();
  debounceTimer = setTimeout(flush, DEBOUNCE_MS);
}

/** Sayfa görüntüleme olayı. */
export function trackPageView(path: string): void {
  track("page_view", { type: "page_view", path });
}

/**
 * Ürün inceleme süresi izleme. Çağrılınca zamanlayıcı başlar ve bir stop() döner.
 * stop() çağrılınca dwellMs hesaplanıp `product_view` olayı gönderilir (yalnız bir kez).
 * Consent yoksa stop() de NO-OP'tur (start zaten olay üretmez).
 */
export function trackProductView(slug: string): () => void {
  const startedAt = isBrowser() ? Date.now() : 0;
  let stopped = false;

  return function stop(): void {
    if (stopped) return;
    stopped = true;
    if (!isBrowser()) return;
    const dwellMs = Math.max(0, Date.now() - startedAt);
    track("product_view", { type: "product_view", productSlug: slug, dwellMs });
  };
}
