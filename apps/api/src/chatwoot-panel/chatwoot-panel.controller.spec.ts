import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatwootPanelController } from "./chatwoot-panel.controller";

/**
 * Kabuk sayfanın iframe'de AÇILABİLİR kalmasını korur: helmet'in X-Frame-Options /
 * CORP başlıkları temizlenmezse Chatwoot panelinde boş beyaz kutu görünür ve sebebi
 * tarayıcı konsolunda kalır. Ayrıca panel.html'in derlemeye kopyalandığını doğrular.
 */
function resMock() {
  const headers: Record<string, string> = {};
  const removed: string[] = [];
  return {
    headers,
    removed,
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    removeHeader: (k: string) => {
      removed.push(k);
    },
  };
}

const svc = { lookup: vi.fn() } as never;

describe("ChatwootPanelController.page", () => {
  const ESKI = { ...process.env };
  beforeEach(() => {
    process.env.CHATWOOT_ORIGIN = "https://chat.324ajans.com";
    process.env.CHATWOOT_MARKALA_INBOXES = "5";
    process.env.CHATWOOT_PANEL_ORDER_URL = "https://panel.example/siparisler/{id}";
  });
  afterEach(() => {
    process.env = { ...ESKI };
  });

  it("panel.html'i okur ve __CONFIG__ yer tutucusunu doldurur", () => {
    const res = resMock();
    const html = new ChatwootPanelController(svc).page(res as never);
    expect(html).toContain("<!doctype html>");
    expect(html).not.toContain("__CONFIG__"); // doldurulmadıysa sayfa JS hatasıyla boş kalır
    expect(html).toContain('"chatwootOrigin":"https://chat.324ajans.com"');
    expect(html).toContain('"markalaInboxes":[5]');
  });

  it("iframe'i engelleyen başlıkları temizler / gevşetir", () => {
    const res = resMock();
    new ChatwootPanelController(svc).page(res as never);
    expect(res.removed).toContain("X-Frame-Options");
    expect(res.headers["Content-Security-Policy"]).toBe(
      "frame-ancestors 'self' https://chat.324ajans.com",
    );
    expect(res.headers["Cross-Origin-Resource-Policy"]).toBe("cross-origin");
    expect(res.headers["Cache-Control"]).toBe("no-store");
    expect(res.headers["X-Robots-Tag"]).toBe("noindex");
  });
});

describe("ChatwootPanelController.lookup", () => {
  const ESKI = { ...process.env };
  afterEach(() => {
    process.env = { ...ESKI };
    vi.clearAllMocks();
  });

  it("CHATWOOT_PANEL_KEY tanımsızsa hiçbir anahtar kabul edilmez (fail-closed)", async () => {
    delete process.env.CHATWOOT_PANEL_KEY;
    const c = new ChatwootPanelController(svc);
    await expect(c.lookup("905057417028", "", resMock() as never)).rejects.toThrow();
    await expect(c.lookup("905057417028", "herhangi", resMock() as never)).rejects.toThrow();
  });

  it("yanlış anahtarı reddeder, doğru anahtarla servise iletir", async () => {
    process.env.CHATWOOT_PANEL_KEY = "dogru-anahtar-123456";
    const c = new ChatwootPanelController(svc);
    await expect(
      c.lookup("905057417028", "yanlis-anahtar-12345", resMock() as never),
    ).rejects.toThrow();
    (svc as unknown as { lookup: ReturnType<typeof vi.fn> }).lookup.mockResolvedValue({
      found: false,
    });
    await c.lookup("905057417028", "dogru-anahtar-123456", resMock() as never);
    expect((svc as unknown as { lookup: ReturnType<typeof vi.fn> }).lookup).toHaveBeenCalledWith(
      "905057417028",
    );
  });

  it("telefon yoksa 400 verir", async () => {
    process.env.CHATWOOT_PANEL_KEY = "dogru-anahtar-123456";
    const c = new ChatwootPanelController(svc);
    await expect(c.lookup("", "dogru-anahtar-123456", resMock() as never)).rejects.toThrow();
  });
});
