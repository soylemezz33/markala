import { describe, it, expect, vi, afterEach } from "vitest";
import { MarkalaApiClient } from "@markala/api-client";

/**
 * 2026-09-07: Sistem Sağlığı sayfası yayına çıktığında "Unauthorized" verdi. Sebep sessiz
 * ve sinsiydi — `request()` Authorization başlığını YALNIZ `{ auth: true }` verildiğinde
 * ekliyor, yeni metotta bu bayrak unutulmuştu. Tip denetimi de derleme de yakalamaz:
 * imza geçerli, çağrı geçerli, yalnız istek yetkisiz gider.
 *
 * Bu testler yetkili uçların tokeni GERÇEKTEN gönderdiğini doğrular. Yeni bir yönetici
 * metodu eklendiğinde buraya bir satır eklemek, aynı hatayı üretimde bulmaktan ucuzdur.
 */
const YETKILI_METOTLAR = ["sistemSagligi", "adminStats"] as const;

function istemciKur() {
  const cagrilar: Array<{ url: string; headers: Record<string, string> }> = [];
  const sahteFetch = vi.fn(async (url: unknown, init: unknown) => {
    cagrilar.push({
      url: String(url),
      headers: ((init as { headers?: Record<string, string> })?.headers ?? {}) as Record<string, string>,
    });
    return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", sahteFetch);
  const client = new MarkalaApiClient({
    baseUrl: "http://api.test",
    getToken: () => "TEST_TOKEN",
  });
  return { client, cagrilar };
}

afterEach(() => vi.unstubAllGlobals());

describe("api-client yetkili uçlar", () => {
  for (const ad of YETKILI_METOTLAR) {
    it(`${ad}() Authorization başlığını GÖNDERİR`, async () => {
      const { client, cagrilar } = istemciKur();
      await (client as unknown as Record<string, () => Promise<unknown>>)[ad]!();
      expect(cagrilar).toHaveLength(1);
      expect(cagrilar[0]!.headers.Authorization).toBe("Bearer TEST_TOKEN");
    });
  }

  it("sistemSagligi() doğru yola gider", async () => {
    const { client, cagrilar } = istemciKur();
    await client.sistemSagligi();
    expect(cagrilar[0]!.url).toBe("http://api.test/api/health/sistem");
  });

  it("herkese açık health() tokensiz de çalışır (yetki gerektirmez)", async () => {
    const { client, cagrilar } = istemciKur();
    await client.health();
    expect(cagrilar[0]!.headers.Authorization).toBeUndefined();
  });
});
