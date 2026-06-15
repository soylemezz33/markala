import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { LegalService } from "./legal.service";

function mockPrisma() {
  return {
    legalPage: {
      findMany: vi.fn().mockResolvedValue([
        { id: "p1", slug: "kvkk", title: "KVKK Aydınlatma Metni", content: "<p>İçerik A</p>", version: "v3.1", isActive: true, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-05-01") },
        { id: "p2", slug: "gizlilik", title: "Gizlilik İlkesi", content: "<p>İçerik B</p>", version: "v2.0", isActive: true, createdAt: new Date("2026-01-02"), updatedAt: new Date("2026-05-02") },
      ]),
      findUnique: vi.fn(),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("LegalService", () => {
  it("findAll title sıralaması ile getiriyor", async () => {
    const prisma = mockPrisma();
    const svc = new LegalService(prisma as never);
    const res = await svc.findAll();
    expect(prisma.legalPage.findMany).toHaveBeenCalledWith({
      orderBy: { title: "asc" },
    });
    expect(res).toHaveLength(2);
  });

  it("findBySlug bulunamayınca NotFoundException fırlatır", async () => {
    const prisma = mockPrisma();
    prisma.legalPage.findUnique.mockResolvedValue(null);
    const svc = new LegalService(prisma as never);
    await expect(svc.findBySlug("yok")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("create dto verilerini doğru iletir", async () => {
    const prisma = mockPrisma();
    const svc = new LegalService(prisma as never);
    const res = await svc.create({
      slug: "cerez",
      title: "Çerez Politikası",
      content: "<p>Çerez içeriği</p>",
      version: "v1.0",
    });
    expect(prisma.legalPage.create).toHaveBeenCalledOnce();
    const callData = prisma.legalPage.create.mock.calls[0][0].data;
    expect(callData.slug).toBe("cerez");
    expect(callData.title).toBe("Çerez Politikası");
    expect(callData.version).toBe("v1.0");
    expect(res.id).toBe("new");
  });

  it("remove isActive=false yaparak soft delete uygular", async () => {
    const prisma = mockPrisma();
    const svc = new LegalService(prisma as never);
    await svc.remove("p1");
    expect(prisma.legalPage.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
  });
});
