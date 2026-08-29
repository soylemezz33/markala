import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DhlService } from "./dhl.service";

/**
 * DhlService.trackShipment — DHL Unified Tracking API entegrasyonu (2026-08-29).
 *
 * Kritik garantiler:
 *  - UYDURMA VERİ YOK: anahtar yoksa throw (eski stub sahte olay listesi dönerdi;
 *    public uca bağlıyken bu müşteriye sahte kargo durumu göstermek olurdu).
 *  - 404 → null (bulunamadı), diğer hatalar → throw (503'e çevrilir).
 *  - Önbellek DHL'in 250/gün kotasını korur; kişisel veri (teslim alan adı) sızmaz.
 */

function makeService(apiKey: string | undefined) {
  const config = { get: (k: string) => (k === "DHL_API_KEY" ? apiKey : undefined) };
  return new DhlService(config as never);
}

const ORNEK_YANIT = {
  shipments: [
    {
      id: "582839286786",
      status: {
        timestamp: "2026-08-29T09:00:00",
        statusCode: "transit",
        status: "TRANSFER",
        description: "Gönderiniz varış transfer merkezine ulaşmak üzere transfer edilmektedir.",
        location: { address: { addressLocality: "İstanbul" } },
      },
      estimatedTimeOfDelivery: "2026-08-31",
      details: {
        // Kişisel veri içerebilen alanlar — sonuçta YER ALMAMALI.
        proofOfDelivery: { signedByName: "AHMET YILMAZ" },
      },
      events: [
        {
          timestamp: "2026-08-29T09:00:00",
          statusCode: "transit",
          description: "Varış transfer merkezine ulaşmak üzere",
          location: { address: { addressLocality: "İstanbul" } },
        },
        {
          timestamp: "2026-08-28T14:00:00",
          statusCode: "pre-transit",
          description: "Gönderi bilgileri oluşturuldu",
        },
      ],
    },
  ],
};

describe("DhlService.trackShipment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("anahtar yoksa THROW eder — asla uydurma veri dönmez", async () => {
    const svc = makeService(undefined);
    await expect(svc.trackShipment("582839286786")).rejects.toThrow(/DHL_API_KEY/);
  });

  it("başarılı yanıtı sade şekle indirger", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ORNEK_YANIT,
    }));
    const svc = makeService("test-key");
    const r = await svc.trackShipment("582839286786");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("in-transit");
    expect(r!.estimatedDelivery).toBe("2026-08-31");
    expect(r!.events).toHaveLength(2);
    expect(r!.events[0]!.location).toBe("İstanbul");
  });

  it("kişisel veri (teslim alan adı) sonuca SIZMAZ", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ORNEK_YANIT,
    }));
    const svc = makeService("test-key");
    const r = await svc.trackShipment("582839286786");
    expect(JSON.stringify(r)).not.toContain("AHMET");
  });

  it("404 → null (bulunamadı)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({}),
    }));
    const svc = makeService("test-key");
    expect(await svc.trackShipment("111111111111")).toBeNull();
  });

  it("401/429/5xx → throw (çağıran 503'e çevirir, DHL sayfasına yönlendirir)", async () => {
    for (const status of [401, 429, 500]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false, status, json: async () => ({}),
      }));
      const svc = makeService("test-key");
      await expect(svc.trackShipment("582839286786")).rejects.toThrow();
    }
  });

  it("önbellek: aynı numara ikinci kez DHL'e GİTMEZ (250/gün kota koruması)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ORNEK_YANIT,
    });
    vi.stubGlobal("fetch", fetchMock);
    const svc = makeService("test-key");
    await svc.trackShipment("582839286786");
    await svc.trackShipment("582839286786");
    await svc.trackShipment("  582839286786  "); // trim de aynı anahtara düşmeli
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bulunamayan numara da (kısa süreli) önbelleklenir — numara taraması DHL'i dövemez", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    const svc = makeService("test-key");
    await svc.trackShipment("111111111111");
    await svc.trackShipment("111111111111");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("service=ecommerce-tr ve language=tr parametreleriyle sorgular", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ORNEK_YANIT,
    });
    vi.stubGlobal("fetch", fetchMock);
    const svc = makeService("test-key");
    await svc.trackShipment("582839286786");
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("service=ecommerce-tr");
    expect(url).toContain("language=tr");
    expect(url).toContain("trackingNumber=582839286786");
  });
});
