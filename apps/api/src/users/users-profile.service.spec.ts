import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersService } from "./users.service";

function makePrisma() {
  return {
    user: {
      update: vi.fn().mockResolvedValue({ id: "u1" }),
      findMany: vi.fn().mockResolvedValue([
        { id: "u1", email: "a@b.c", fullName: "A", _count: { orders: 1 } },
      ]),
      findUnique: vi.fn().mockResolvedValue({ id: "u1" }),
    },
    address: {
      findMany: vi.fn().mockResolvedValue([{ id: "addr1", label: "Ev", isDefault: true }]),
      create: vi.fn().mockResolvedValue({ id: "addr2" }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe("UsersService.updateProfile — mass assignment koruması", () => {
  let prisma: ReturnType<typeof makePrisma>;
  let svc: UsersService;

  beforeEach(() => {
    prisma = makePrisma();
    svc = new UsersService(prisma as never);
  });

  it("güvenli alanlar prisma.update'e geçer", async () => {
    await svc.updateProfile("u1", {
      fullName: "Hasan",
      phone: "5001112233",
      companyName: "324 Ajans",
      taxOffice: "Mersin",
      taxNumber: "1234567890",
    });
    const callData = prisma.user.update.mock.calls[0][0].data;
    expect(callData.fullName).toBe("Hasan");
    expect(callData.phone).toBe("5001112233");
  });

  it("role alanı DTO'da olmadığından prisma.update'e GEÇMEMELİ (mass assignment)", async () => {
    // DTO tipi role içermiyor ama runtime'da gelseydi
    await svc.updateProfile("u1", { fullName: "Saldirgan" } as never);
    const callData = prisma.user.update.mock.calls[0][0].data;
    expect(callData.role).toBeUndefined();
  });

  it("userId doğru scope ile kullanılır", async () => {
    await svc.updateProfile("u42", { fullName: "Test" });
    expect(prisma.user.update.mock.calls[0][0].where.id).toBe("u42");
  });
});

describe("UsersService.listAddresses", () => {
  it("userId ile scope edilmiş sorgu gönderilir (IDOR koruması)", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.listAddresses("u99");
    expect(prisma.address.findMany.mock.calls[0][0].where.userId).toBe("u99");
  });

  it("isDefault desc, createdAt desc sıralaması uygulanır", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.listAddresses("u1");
    const orderBy = prisma.address.findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toContainEqual({ isDefault: "desc" });
    expect(orderBy).toContainEqual({ createdAt: "desc" });
  });
});

describe("UsersService.createAddress", () => {
  it("isDefault belirtilmezse false varsayılan", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.createAddress("u1", {
      label: "İş",
      fullName: "Hasan S.",
      phone: "5001112233",
      city: "Mersin",
      district: "Yenişehir",
      fullAddress: "Atatürk Cad. No:1",
      zipCode: "33000",
    });
    const data = prisma.address.create.mock.calls[0][0].data;
    expect(data.isDefault).toBe(false);
    expect(data.userId).toBe("u1");
  });

  it("isDefault: true ile oluşturulunca true geçer", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.createAddress("u1", {
      label: "Ev",
      fullName: "A",
      phone: "500",
      city: "Mersin",
      district: "Toroslar",
      fullAddress: "Adres",
      zipCode: "33000",
      isDefault: true,
    });
    const data = prisma.address.create.mock.calls[0][0].data;
    expect(data.isDefault).toBe(true);
  });
});

describe("UsersService.updateAddress — IDOR koruması", () => {
  it("updateMany where koşulunda hem id hem userId zorunlu", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.updateAddress("u1", "addr1", { label: "Yeni" });
    const where = prisma.address.updateMany.mock.calls[0][0].where;
    expect(where.id).toBe("addr1");
    expect(where.userId).toBe("u1");
  });

  it("farklı kullanıcının adresi güncellenemez (where'de userId filtresi)", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    // u2 kendi userId'si; addr1 u1'e ait — prisma'da eşleşme olmaz (count: 0)
    prisma.address.updateMany.mockResolvedValue({ count: 0 });
    const result = await svc.updateAddress("u2", "addr1", { label: "Çalınmaya Çalışılan" });
    expect(result.count).toBe(0);
    expect(prisma.address.updateMany.mock.calls[0][0].where.userId).toBe("u2");
  });
});

describe("UsersService.deleteAddress — IDOR koruması", () => {
  it("deleteMany where koşulunda hem id hem userId zorunlu", async () => {
    const prisma = makePrisma();
    const svc = new UsersService(prisma as never);
    await svc.deleteAddress("u1", "addr1");
    const where = prisma.address.deleteMany.mock.calls[0][0].where;
    expect(where.id).toBe("addr1");
    expect(where.userId).toBe("u1");
  });
});
