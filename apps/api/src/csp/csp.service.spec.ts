import { describe, it, expect, vi } from "vitest";
import { CspService } from "./csp.service";

describe("CspService.normalizeUri", () => {
  it("sorgu dizesini ATAR — aksi halde her istek yeni satır açardı", () => {
    // Gerçek örnek: 31 Ağustos raporlarında en sık görülen ihlal. auid her ziyaretçide
    // farklı geldiği için normalize edilmezse tablo sınırsız büyürdü.
    expect(
      CspService.normalizeUri("https://ad.doubleclick.net/ccm/s/collect?auid=238980195.178&gtm=x"),
    ).toBe("https://ad.doubleclick.net/ccm/s/collect");
  });

  it("aynı kaynağın farklı sorguları TEK satıra düşer", () => {
    const a = CspService.normalizeUri("https://ad.doubleclick.net/ccm/s/collect?auid=1");
    const b = CspService.normalizeUri("https://ad.doubleclick.net/ccm/s/collect?auid=2");
    expect(a).toBe(b);
  });

  it("URL olmayan anahtar kelimeler olduğu gibi kalır", () => {
    expect(CspService.normalizeUri("blob")).toBe("blob");
    expect(CspService.normalizeUri("inline")).toBe("inline");
    expect(CspService.normalizeUri("eval")).toBe("eval");
    expect(CspService.normalizeUri("data")).toBe("data");
  });

  it("boş/geçersiz girdi çökertmez", () => {
    expect(CspService.normalizeUri(undefined)).toBe("(bos)");
    expect(CspService.normalizeUri("")).toBe("(bos)");
    expect(CspService.normalizeUri(null)).toBe("(bos)");
    expect(CspService.normalizeUri(42)).toBe("(bos)");
  });

  it("bozuk URL kırpılarak korunur", () => {
    const uzun = "https://" + "a".repeat(600);
    expect(CspService.normalizeUri(uzun).length).toBeLessThanOrEqual(400);
  });
});

describe("CspService.kaydet", () => {
  function mockPrisma() {
    return { cspViolation: { upsert: vi.fn().mockResolvedValue({}) } };
  }

  it("aynı ihlalde sayaç artırır, yeni ihlalde satır açar", async () => {
    const prisma = mockPrisma();
    const svc = new CspService(prisma as never);
    await svc.kaydet({
      directive: "connect-src",
      blockedUri: "https://ad.doubleclick.net/ccm/s/collect?auid=9",
      documentUri: "https://markala.com.tr/?utm_source=x",
    });
    const arg = prisma.cspViolation.upsert.mock.calls[0][0];
    expect(arg.where.directive_blockedUri).toEqual({
      directive: "connect-src",
      blockedUri: "https://ad.doubleclick.net/ccm/s/collect",
    });
    expect(arg.update.count).toEqual({ increment: 1 });
    // Örnek sayfa da normalize edilir (sorgu dizesi atılır).
    expect(arg.create.sampleDocumentUri).toBe("https://markala.com.tr/");
  });

  it("veritabanı hatası FIRLATMAZ — rapor toplama sayfayı etkilememeli", async () => {
    const prisma = { cspViolation: { upsert: vi.fn().mockRejectedValue(new Error("db down")) } };
    const svc = new CspService(prisma as never);
    await expect(
      svc.kaydet({ directive: "script-src", blockedUri: "https://x.example/y" }),
    ).resolves.toBeUndefined();
  });

  it("directive yoksa '(bilinmiyor)' ile kaydeder", async () => {
    const prisma = mockPrisma();
    const svc = new CspService(prisma as never);
    await svc.kaydet({ blockedUri: "blob" });
    expect(prisma.cspViolation.upsert.mock.calls[0][0].create.directive).toBe("(bilinmiyor)");
  });
});
