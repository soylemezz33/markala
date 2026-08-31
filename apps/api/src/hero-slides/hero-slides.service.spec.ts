import { describe, it, expect, vi } from "vitest";
import { HeroSlidesService, MAX_AKTIF_SLAYT } from "./hero-slides.service";

function mockPrisma(opts: { aktifSayisi?: number; mevcutAktif?: boolean } = {}) {
  return {
    heroSlide: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", title: "T", sortOrder: 0, isActive: true }]),
      count: vi.fn().mockResolvedValue(opts.aktifSayisi ?? 0),
      findUnique: vi.fn().mockResolvedValue({ isActive: opts.mevcutAktif ?? false }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      update: vi
        .fn()
        .mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: vi.fn().mockResolvedValue({ id: "a" }),
    },
  };
}

describe("HeroSlidesService", () => {
  it("findAll yalnız aktifleri sortOrder'a göre döner (default)", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.findAll(false);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    expect(res).toHaveLength(1);
  });

  it("findAll(includeInactive=true) hepsini döner", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    await svc.findAll(true);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: "asc" } });
  });

  it("create dto'yu prisma'ya iletir", async () => {
    const prisma = mockPrisma({ aktifSayisi: 1 });
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.create({ title: "Yeni", imageUrl: "/x.jpg" });
    expect(res.title).toBe("Yeni");
  });

  // ─── 4 slayt tavanı ───────────────────────────────────────────────────────

  it(`tavan doluyken YENİ AKTİF slayt oluşturulamaz (${MAX_AKTIF_SLAYT})`, async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT });
    const svc = new HeroSlidesService(prisma as never);
    await expect(svc.create({ title: "Beşinci", imageUrl: "/x.jpg" })).rejects.toThrow(
      /en fazla 4 slayt/i,
    );
    expect(prisma.heroSlide.create).not.toHaveBeenCalled();
  });

  it("tavan doluyken PASİF slayt oluşturulabilir", async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT });
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.create({ title: "Taslak", imageUrl: "/x.jpg", isActive: false });
    expect(res.title).toBe("Taslak");
    expect(prisma.heroSlide.count).not.toHaveBeenCalled();
  });

  it("tavan doluyken pasif slayt AKTİFLEŞTİRİLEMEZ", async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT, mevcutAktif: false });
    const svc = new HeroSlidesService(prisma as never);
    await expect(svc.update("x", { isActive: true })).rejects.toThrow(/en fazla 4 slayt/i);
    expect(prisma.heroSlide.update).not.toHaveBeenCalled();
  });

  it("ZATEN AKTİF slaydın düzenlenmesi tavanı tetiklemez (kendini iki kez saymaz)", async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT, mevcutAktif: true });
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.update("x", { isActive: true, title: "Yeni başlık" });
    expect(res.title).toBe("Yeni başlık");
    expect(prisma.heroSlide.count).not.toHaveBeenCalled();
  });

  it("pasifleştirme her zaman serbest", async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT });
    const svc = new HeroSlidesService(prisma as never);
    await svc.update("x", { isActive: false });
    expect(prisma.heroSlide.update).toHaveBeenCalled();
    expect(prisma.heroSlide.count).not.toHaveBeenCalled();
  });

  it("tavanın ALTINDAYKEN aktifleştirme geçer", async () => {
    const prisma = mockPrisma({ aktifSayisi: MAX_AKTIF_SLAYT - 1, mevcutAktif: false });
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.update("x", { isActive: true });
    expect(res.isActive).toBe(true);
  });
});
