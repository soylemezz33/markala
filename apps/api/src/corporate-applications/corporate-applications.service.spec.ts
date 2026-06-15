import { describe, it, expect, vi } from "vitest";
import { CorporateApplicationsService } from "./corporate-applications.service";

function mockPrisma() {
  return {
    corporateApplication: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", status: "pending", companyName: "X" }]),
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: "a", status: "pending", companyName: "X", userId: null }),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    user: { update: vi.fn().mockResolvedValue({}) },
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
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
  });

  it("review status'u günceller + reviewedAt + reviewedById yazar", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    const res = await svc.review("a", "reviewer-1", "approved");
    expect(res.status).toBe("approved");
    const data = prisma.corporateApplication.update.mock.calls[0][0].data;
    expect(data.reviewedAt).toBeInstanceOf(Date);
    expect(data.reviewedById).toBe("reviewer-1");
  });

  it("review reviewNote'u doğru kolona yazar (başvuranın notes'unu EZMEZ)", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    await svc.review("a", "reviewer-1", "rejected", "Vergi levhası eksik");
    const data = prisma.corporateApplication.update.mock.calls[0][0].data;
    expect(data.reviewNote).toBe("Vergi levhası eksik");
    expect(data.notes).toBeUndefined();
  });
});
