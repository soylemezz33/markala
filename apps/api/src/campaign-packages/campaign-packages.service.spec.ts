import { describe, it, expect, vi } from "vitest";
import { CampaignPackagesService } from "./campaign-packages.service";

function mockPrisma() {
  return {
    campaignPackage: {
      findMany: vi.fn().mockResolvedValue([
        { id: "p1", slug: "esnaf-baslangic", name: "Esnaf Başlangıç", category: "esnaf", sortOrder: 0, listPrice: "950.00", packagePrice: "749.00", isActive: true },
        { id: "p2", slug: "kurumsal-tanitim", name: "Kurumsal Tanıtım", category: "kurumsal", sortOrder: 0, listPrice: "12500.00", packagePrice: "9499.00", isActive: true },
      ]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("CampaignPackagesService", () => {
  it("findAll category+sortOrder sıralı getirir", async () => {
    const prisma = mockPrisma();
    const svc = new CampaignPackagesService(prisma as never);
    const res = await svc.findAll();
    expect(prisma.campaignPackage.findMany).toHaveBeenCalledWith({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    expect(res).toHaveLength(2);
  });

  it("create listPrice ve packagePrice'ı Prisma.Decimal'e dönüştürür", async () => {
    const prisma = mockPrisma();
    const svc = new CampaignPackagesService(prisma as never);
    const res = await svc.create({
      slug: "test-paket",
      name: "Test Paket",
      category: "esnaf",
      contents: "500 kartvizit + 1 kaşe",
      listPrice: 500,
      packagePrice: 399,
    });
    expect(prisma.campaignPackage.create).toHaveBeenCalledOnce();
    const callData = prisma.campaignPackage.create.mock.calls[0][0].data;
    expect(callData.listPrice.toString()).toBe("500");
    expect(callData.packagePrice.toString()).toBe("399");
    expect(res.id).toBe("new");
  });

  it("create endDate string ise Date nesnesine çevirir", async () => {
    const prisma = mockPrisma();
    const svc = new CampaignPackagesService(prisma as never);
    await svc.create({
      slug: "sureli-paket",
      name: "Süreli Paket",
      category: "promosyon",
      contents: "Promosyon içerik",
      listPrice: 1000,
      packagePrice: 750,
      endDate: "2026-12-31",
    });
    const callData = prisma.campaignPackage.create.mock.calls[0][0].data;
    expect(callData.endDate).toBeInstanceOf(Date);
    expect(callData.endDate.toISOString()).toContain("2026-12-31");
  });

  it("remove isActive=false yaparak soft delete uygular", async () => {
    const prisma = mockPrisma();
    const svc = new CampaignPackagesService(prisma as never);
    await svc.remove("p1");
    expect(prisma.campaignPackage.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
  });
});
