import { describe, it, expect, vi } from "vitest";
import { ReviewsService } from "./reviews.service";

/**
 * 2026-09-07 ölçümü: vitrin her ürün sayfası için ayrı yorum isteği atıyordu. 793 ürün var;
 * sayfa üretimi sırasında (CI build iki kez koşuyor + sayfa veriyi üç ayrı yerden istiyor)
 * her deploy CANLI API'ye ~4.000 istek gönderiyordu. O gün sitedeki onaylı yorum sayısı
 * SIFIRDI — dört bin istek boş dizi için atılıyordu ve bağlantı havuzunu zorluyordu.
 *
 * Bu uç aynı bilgiyi tek çağrıda verir. Testlerin koruduğu şey: tek sorgu, yalnız onaylı
 * yorumlar ve tavan aşıldığında bunun SESSİZ KALMAMASI.
 */
function servisKur(kayitlar: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(kayitlar);
  const prisma = { review: { findMany }, product: { findUnique: vi.fn() } };
  return { svc: new ReviewsService(prisma as never), findMany };
}

const yorum = (i: number) => ({
  id: `r${i}`,
  userName: "Müşteri",
  rating: 5,
  comment: "iyi",
  isApproved: true,
  createdAt: new Date(),
  product: { slug: `urun-${i}`, name: `Ürün ${i}` },
});

describe("ReviewsService.findAllApproved", () => {
  it("TEK sorgu yapar (ürün başına ayrı sorgu YOK)", async () => {
    const { svc, findMany } = servisKur([yorum(1), yorum(2), yorum(3)]);
    await svc.findAllApproved();
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("yalnız ONAYLI yorumları ister", async () => {
    const { svc, findMany } = servisKur([]);
    await svc.findAllApproved();
    expect(findMany.mock.calls[0]![0].where).toEqual({ isApproved: true });
  });

  it("ürün slug'ını birlikte döner — vitrin gruplayabilsin", async () => {
    const { svc } = servisKur([yorum(1)]);
    const r = await svc.findAllApproved();
    expect(r.yorumlar[0]!.product.slug).toBe("urun-1");
  });

  it("yorum yoksa boş döner (site bugün böyle: sıfır onaylı yorum)", async () => {
    const { svc } = servisKur([]);
    const r = await svc.findAllApproved();
    expect(r.yorumlar).toEqual([]);
    expect(r.tavanAsildi).toBe(false);
  });

  it("TAVAN aşılırsa bunu BİLDİRİR — sessizce eksik veri dönmez", async () => {
    // Tavan+1 kayıt: servis fazlasını kırpar ama bayrağı kaldırır.
    const cok = Array.from({ length: 4 }, (_, i) => yorum(i));
    const { svc } = servisKur(cok);
    const r = await svc.findAllApproved(3);
    expect(r.tavanAsildi).toBe(true);
    expect(r.yorumlar).toHaveLength(3);
  });

  it("tavana kadar olan durumda bayrak KALKMAZ", async () => {
    const { svc } = servisKur([yorum(1), yorum(2), yorum(3)]);
    const r = await svc.findAllApproved(3);
    expect(r.tavanAsildi).toBe(false);
    expect(r.yorumlar).toHaveLength(3);
  });
});
