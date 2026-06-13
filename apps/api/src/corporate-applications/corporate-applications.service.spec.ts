import { describe, it, expect, vi } from "vitest";
import { CorporateApplicationsService } from "./corporate-applications.service";

function mockPrisma() {
  return {
    corporateApplication: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", status: "pending", companyName: "X" }]),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("CorporateApplicationsService", () => {
  it("findAll status filtresi uygular", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    await svc.findAll("pending");
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("findAll status yoksa filtre koymaz", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    await svc.findAll();
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
    });
  });

  it("setStatus status'u günceller", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    const res = await svc.setStatus("a", "approved");
    expect(res.status).toBe("approved");
  });
});
