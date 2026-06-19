import { describe, it, expect, vi } from "vitest";
import { CorporateApplicationsService } from "./corporate-applications.service";

function mockPrisma() {
  return {
    corporateApplication: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", status: "pending", companyName: "X" }]),
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: "a", status: "pending", companyName: "X", userId: null, email: "x@firma.com", contactName: "Y", phone: "0555", taxOffice: "-", taxNumber: "1" }),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "u-new", email: "x@firma.com" }),
      update: vi.fn().mockResolvedValue({}),
    },
    passwordResetToken: {
      updateMany: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    },
  };
}
const mockConfig = { get: vi.fn().mockReturnValue(undefined) };
const mockMail = { sendCorporateInviteEmail: vi.fn().mockResolvedValue(true) };

function buildSvc(prisma: ReturnType<typeof mockPrisma>) {
  return new CorporateApplicationsService(prisma as never, mockConfig as never, mockMail as never);
}

describe("CorporateApplicationsService", () => {
  it("findAll status filtresi uygular", async () => {
    const prisma = mockPrisma();
    await buildSvc(prisma).findAll("pending");
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("findAll status yoksa filtre koymaz", async () => {
    const prisma = mockPrisma();
    await buildSvc(prisma).findAll();
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
  });

  it("review status'u günceller + reviewedAt + reviewedById yazar", async () => {
    const prisma = mockPrisma();
    const res = await buildSvc(prisma).review("a", "reviewer-1", "approved");
    expect(res.status).toBe("approved");
    const data = prisma.corporateApplication.update.mock.calls[0][0].data;
    expect(data.reviewedAt).toBeInstanceOf(Date);
    expect(data.reviewedById).toBe("reviewer-1");
  });

  it("onayda bağlı kullanıcı yoksa hesap oluşturur + davet e-postası gönderir", async () => {
    const prisma = mockPrisma();
    await buildSvc(prisma).review("a", "reviewer-1", "approved");
    expect(prisma.user.create).toHaveBeenCalled();
    expect(mockMail.sendCorporateInviteEmail).toHaveBeenCalled();
  });

  it("review reviewNote'u doğru kolona yazar (başvuranın notes'unu EZMEZ)", async () => {
    const prisma = mockPrisma();
    await buildSvc(prisma).review("a", "reviewer-1", "rejected", "Vergi levhası eksik");
    const data = prisma.corporateApplication.update.mock.calls[0][0].data;
    expect(data.reviewNote).toBe("Vergi levhası eksik");
    expect(data.notes).toBeUndefined();
  });
});
