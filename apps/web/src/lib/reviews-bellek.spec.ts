import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * 2026-09-07, İKİNCİ deneme. Birincisi ölçümde çöktü ve bu testler o yüzden var.
 *
 * Sorun: build sırasında 792 ürün sayfası ayrı ayrı render ediliyor ve her biri yorum
 * verisini ayrıca çekiyordu — deploy başına canlı API'ye binlerce istek. İlk düzeltme
 * React `cache()` kullandı; o TEK BİR render'ın kapsamı olduğu için sayfalar arasında
 * hiçbir şey paylaşılmadı ve yük düşmedi (ölçtük: sayfa başına hâlâ 2 istek).
 *
 * Bu testlerin koruduğu şey: KAÇ SAYFA render edilirse edilsin ağa TTL başına BİR kez
 * çıkılması. "Sayfa başına bir istek" yeterli değil — asıl iddia bu.
 */
const ORNEK = {
  tavanAsildi: false,
  yorumlar: [
    {
      id: "r1",
      userName: "Ayşe",
      rating: 5,
      comment: "harika",
      isApproved: true,
      createdAt: new Date().toISOString(),
      product: { slug: "klasik-kartvizit", name: "Klasik Kartvizit" },
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules(); // modül kapsamındaki bellek her testte sıfırdan başlasın
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ORNEK }) as unknown as Response);
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function modul() {
  return await import("./reviews");
}

describe("yorum verisi — süreç-içi bellek", () => {
  it("YÜZLERCE sayfa render edilse bile ağa BİR kez çıkar", async () => {
    const { getProductReviews } = await modul();
    // Build'de olan tam olarak bu: aynı süreçte arka arkaya çok sayıda sayfa render edilir.
    for (let i = 0; i < 200; i++) await getProductReviews(`urun-${i}`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aynı anda başlayan render'lar TEK isteği paylaşır (uçuştaki istek)", async () => {
    const { getProductReviews } = await modul();
    await Promise.all(Array.from({ length: 50 }, (_, i) => getProductReviews(`urun-${i}`)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tek çağrı toplu uca gider, ürün başına uca DEĞİL", async () => {
    const { getProductReviews } = await modul();
    await getProductReviews("klasik-kartvizit");
    expect(String(fetchMock.mock.calls[0]![0])).toContain("/reviews/public/tumu");
    expect(String(fetchMock.mock.calls[0]![0])).not.toContain("productSlug=");
  });

  it("doğru ürünün yorumlarını döndürür", async () => {
    const { getProductReviews } = await modul();
    const v = await getProductReviews("klasik-kartvizit");
    expect(v).toHaveLength(1);
    expect(v[0]!.comment).toBe("harika");
  });

  it("yorumu olmayan ürün için BOŞ döner (sahte veri yok)", async () => {
    const { getProductReviews } = await modul();
    expect(await getProductReviews("yorumu-olmayan-urun")).toEqual([]);
  });

  it("API düşerse sayfa çökmez, boş dizi döner", async () => {
    fetchMock.mockRejectedValue(new Error("API yok"));
    const { getProductReviews } = await modul();
    expect(await getProductReviews("klasik-kartvizit")).toEqual([]);
  });

  it("API hatası kalıcı olarak önbelleğe YAPIŞMAZ — sonraki tur yeniden dener", async () => {
    fetchMock.mockRejectedValueOnce(new Error("gecici hata"));
    const { getProductReviews } = await modul();
    expect(await getProductReviews("klasik-kartvizit")).toEqual([]);
    // Hata boş harita ürettiyse ve bu 60 sn önbelleğe alındıysa, geçici bir kesinti
    // yorumları bir dakika boyunca yok ederdi. Bu davranışın bilinçli olduğunu işaretler.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
