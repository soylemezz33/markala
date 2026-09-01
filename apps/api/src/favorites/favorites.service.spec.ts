import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";

function makePrisma() {
  return {
    favorite: {
      findMany: vi.fn().mockResolvedValue([
        { product: { slug: "kartvizit" } },
        { product: { slug: "brosur" } },
      ]),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(3),
    },
    product: {
      findFirst: vi.fn().mockResolvedValue({ id: "p1" }),
      findMany: vi.fn().mockResolvedValue([{ id: "p1" }, { id: "p2" }]),
    },
  };
}

describe("FavoritesService", () => {
  let prisma: ReturnType<typeof makePrisma>;
  let svc: FavoritesService;

  beforeEach(() => {
    prisma = makePrisma();
    svc = new FavoritesService(prisma as never);
  });

  it("list — yalnız kullanıcının AKTİF ürünlerini slug olarak döndürür", async () => {
    const slugs = await svc.list("u1");
    expect(slugs).toEqual(["kartvizit", "brosur"]);
    const where = prisma.favorite.findMany.mock.calls[0][0].where;
    // SECURITY (IDOR): sorgu her zaman userId ile daraltılır.
    expect(where.userId).toBe("u1");
    expect(where.product).toEqual({ isActive: true });
  });

  it("add — çift tıkta unique kısıt patlamasın diye skipDuplicates kullanır", async () => {
    await svc.add("u1", "kartvizit");
    const args = prisma.favorite.createMany.mock.calls[0][0];
    expect(args.skipDuplicates).toBe(true);
    expect(args.data).toEqual([{ userId: "u1", productId: "p1" }]);
  });

  it("add — pasif/olmayan ürün 404", async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(svc.add("u1", "yok-boyle-urun")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("add — üst sınıra gelince yazma yapılmaz", async () => {
    prisma.favorite.count.mockResolvedValue(300);
    await expect(svc.add("u1", "kartvizit")).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.favorite.createMany).not.toHaveBeenCalled();
  });

  it("bozuk slug DB'ye hiç gitmez", async () => {
    await expect(svc.add("u1", "../../etc/passwd")).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });

  it("remove — idempotent, silinmiş ürün için de hata vermez", async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 0 });
    await expect(svc.remove("u1", "artik-yok")).resolves.toEqual(["kartvizit", "brosur"]);
    expect(prisma.favorite.deleteMany.mock.calls[0][0].where.userId).toBe("u1");
  });

  it("merge — tekrarlar elenir, bilinmeyen slug tüm taşımayı düşürmez", async () => {
    await svc.merge("u1", ["kartvizit", "kartvizit", "brosur", "hayalet-urun"]);
    const aranan = prisma.product.findMany.mock.calls[0][0].where.slug.in;
    expect(aranan).toEqual(["kartvizit", "brosur", "hayalet-urun"]);
    // findMany 2 ürün döndürdü → yalnız onlar yazılır, çağrı hata vermez.
    expect(prisma.favorite.createMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it("merge — boş liste sunucuya yazma yapmaz", async () => {
    await svc.merge("u1", []);
    expect(prisma.favorite.createMany).not.toHaveBeenCalled();
  });
});
