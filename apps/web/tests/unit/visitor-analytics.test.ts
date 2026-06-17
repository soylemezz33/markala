import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Ziyaretçi analizi (lib/visitor-analytics) — KVKK consent kapısı + kuyruk/flush davranışı.
 *
 * Modül seviyesinde state (kuyruk, listener bayrağı) tuttuğu için her testte vi.resetModules
 * ile taze import edilir. navigator.sendBeacon jsdom'da yok → mock'lanır.
 */

const CONSENT_COOKIE = "markala_cookie_consent";

function setConsent(analytics: boolean) {
  const val = encodeURIComponent(JSON.stringify({ analytics }));
  document.cookie = `${CONSENT_COOKIE}=${val}`;
}

function clearConsent() {
  document.cookie = `${CONSENT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

let beacon: ReturnType<typeof vi.fn>;
let realBlob: typeof Blob;

/** jsdom Blob.text() sağlamaz → parçaları saklayan, text() okunabilen hafif stub. */
class FakeBlob {
  private parts: unknown[];
  type: string;
  constructor(parts: unknown[] = [], opts?: { type?: string }) {
    this.parts = parts;
    this.type = opts?.type ?? "";
  }
  async text(): Promise<string> {
    return this.parts.map(String).join("");
  }
}

async function blobText(blob: unknown): Promise<string> {
  return (blob as FakeBlob).text();
}

async function freshModule() {
  vi.resetModules();
  return import("@/lib/visitor-analytics");
}

beforeEach(() => {
  vi.useFakeTimers();
  beacon = vi.fn(() => true);
  // jsdom navigator.sendBeacon sağlamaz — enjekte et.
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
  realBlob = globalThis.Blob;
  globalThis.Blob = FakeBlob as unknown as typeof Blob;
  window.localStorage.clear();
  clearConsent();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  globalThis.Blob = realBlob;
});

describe("visitor-analytics — KVKK consent kapısı", () => {
  it("consent YOKsa track() NO-OP'tur — hiçbir beacon gönderilmez", async () => {
    clearConsent();
    const m = await freshModule();
    m.track("page_view", { type: "page_view", path: "/" });
    vi.advanceTimersByTime(5000);
    expect(beacon).not.toHaveBeenCalled();
  });

  it("consent reddedilmişse (analytics:false) NO-OP'tur", async () => {
    setConsent(false);
    const m = await freshModule();
    m.trackPageView("/iletisim");
    vi.advanceTimersByTime(5000);
    expect(beacon).not.toHaveBeenCalled();
  });

  it("consent VARsa olay debounce sonrası beacon ile gönderilir", async () => {
    setConsent(true);
    const m = await freshModule();
    m.trackPageView("/kategori/kartvizit");
    expect(beacon).not.toHaveBeenCalled(); // debounce öncesi henüz gitmez
    vi.advanceTimersByTime(1500);
    expect(beacon).toHaveBeenCalledTimes(1);
  });
});

describe("visitor-analytics — payload & oturum", () => {
  it("gönderilen payload sessionId + device + olay alanlarını içerir", async () => {
    setConsent(true);
    const m = await freshModule();
    m.trackPageView("/hakkimizda");
    vi.advanceTimersByTime(1500);

    expect(beacon).toHaveBeenCalledTimes(1);
    const blob = beacon.mock.calls[0][1];
    const text = await blobText(blob);
    const body = JSON.parse(text);
    expect(Array.isArray(body.events)).toBe(true);
    const ev = body.events[0];
    expect(ev.type).toBe("page_view");
    expect(ev.path).toBe("/hakkimizda");
    expect(typeof ev.sessionId).toBe("string");
    expect(ev.sessionId.length).toBeGreaterThan(0);
    expect(["mobile", "tablet", "desktop"]).toContain(ev.device);
  });

  it("getSessionId localStorage'da kalıcıdır (mk_vid)", async () => {
    setConsent(true);
    const m = await freshModule();
    const id1 = m.getSessionId();
    const id2 = m.getSessionId();
    expect(id1).toBe(id2);
    expect(window.localStorage.getItem("mk_vid")).toBe(id1);
  });

  it("birden çok olay tek batch'te toplanır", async () => {
    setConsent(true);
    const m = await freshModule();
    m.trackPageView("/");
    m.track("add_to_cart", { type: "add_to_cart", productSlug: "afis", value: 250 });
    vi.advanceTimersByTime(1500);
    const blob = beacon.mock.calls[0][1];
    const body = JSON.parse(await blobText(blob));
    expect(body.events).toHaveLength(2);
  });
});

describe("visitor-analytics — trackProductView (dwell süresi)", () => {
  it("stop() çağrılınca product_view + dwellMs gönderir", async () => {
    setConsent(true);
    const m = await freshModule();
    const stop = m.trackProductView("kartvizit-mat");
    vi.advanceTimersByTime(3000); // 3 sn incele
    stop();
    vi.advanceTimersByTime(1500); // debounce flush
    const blob = beacon.mock.calls[0][1];
    const ev = JSON.parse(await blobText(blob)).events[0];
    expect(ev.type).toBe("product_view");
    expect(ev.productSlug).toBe("kartvizit-mat");
    expect(ev.dwellMs).toBeGreaterThanOrEqual(3000);
  });

  it("stop() iki kez çağrılırsa olay yalnızca bir kez gönderilir", async () => {
    setConsent(true);
    const m = await freshModule();
    const stop = m.trackProductView("afis");
    stop();
    stop();
    vi.advanceTimersByTime(1500);
    const blob = beacon.mock.calls[0][1];
    expect(JSON.parse(await blobText(blob)).events).toHaveLength(1);
  });

  it("consent yoksa trackProductView/stop NO-OP'tur", async () => {
    clearConsent();
    const m = await freshModule();
    const stop = m.trackProductView("afis");
    stop();
    vi.advanceTimersByTime(2000);
    expect(beacon).not.toHaveBeenCalled();
  });
});
