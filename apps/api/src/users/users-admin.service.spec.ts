import { describe, it, expect, vi } from "vitest";
import { UsersService } from "./users.service";

function mockPrisma() {
  return {
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "u1", email: "a@b.c", fullName: "A", _count: { orders: 2 } }]),
      findUnique: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }),
    },
  };
}

describe("UsersService admin metotları", () => {
  it("listForAdmin müşterileri sayımla döner", async () => {
    const prisma = mockPrisma();
    const svc = new UsersService(prisma as never);
    const res = await svc.listForAdmin({ take: 50, skip: 0 });
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res[0].orderCount).toBe(2);
  });

  it("getForAdmin tek kullanıcı döner", async () => {
    const prisma = mockPrisma();
    const svc = new UsersService(prisma as never);
    const res = await svc.getForAdmin("u1");
    expect(res?.id).toBe("u1");
  });
});
