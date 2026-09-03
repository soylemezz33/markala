import { describe, it, expect, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrderNoteService } from "./order-note.service";

function makeService(
  opts: {
    order?: { id: string } | null;
    note?: { id: string; authorId: string | null } | null;
    user?: { fullName: string | null; email: string } | null;
  } = {},
) {
  const prisma = {
    order: {
      findFirst: vi.fn().mockResolvedValue(opts.order === undefined ? { id: "ord1" } : opts.order),
    },
    user: { findUnique: vi.fn().mockResolvedValue(opts.user ?? null) },
    orderNote: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(opts.note ?? null),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "n1", ...data })),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
  return { svc: new OrderNoteService(prisma as never), prisma };
}

describe("OrderNoteService", () => {
  it("not eklerken metni kırpar ve yazarı kaydeder", async () => {
    const { svc, prisma } = makeService({ user: { fullName: "Hasan Söylemez", email: "h@x.com" } });
    const res = await svc.add("ord1", "   Müşteri aradı, acil.  ", {
      id: "u1",
      email: "h@x.com",
      role: "admin",
    });
    expect(prisma.orderNote.create).toHaveBeenCalled();
    expect(res.body).toBe("Müşteri aradı, acil.");
    expect(res.authorName).toBe("Hasan Söylemez");
    expect(res.authorRole).toBe("admin");
  });

  it("kullanıcının adı yoksa e-postaya düşer", async () => {
    const { svc } = makeService({ user: { fullName: "  ", email: "kargo@markala.com.tr" } });
    const res = await svc.add("ord1", "Kutu ezik geldi.", { id: "u2", email: "x@y.com" });
    expect(res.authorName).toBe("kargo@markala.com.tr");
  });

  it("silinmiş/olmayan siparişe not yazılamaz", async () => {
    const { svc } = makeService({ order: null });
    await expect(svc.add("yok", "not", { id: "u1" })).rejects.toThrow(NotFoundException);
  });

  it("silinmiş siparişin notları listelenemez", async () => {
    const { svc } = makeService({ order: null });
    await expect(svc.list("yok")).rejects.toThrow(NotFoundException);
  });

  it("kendi notunu silebilir", async () => {
    const { svc, prisma } = makeService({ note: { id: "n1", authorId: "u1" } });
    await expect(svc.remove("ord1", "n1", { id: "u1", role: "kargo" })).resolves.toEqual({
      ok: true,
    });
    expect(prisma.orderNote.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });

  it("BAŞKASININ notunu silemez", async () => {
    const { svc, prisma } = makeService({ note: { id: "n1", authorId: "u9" } });
    await expect(svc.remove("ord1", "n1", { id: "u1", role: "kargo" })).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.orderNote.delete).not.toHaveBeenCalled();
  });

  it("admin başkasının notunu silebilir", async () => {
    const { svc, prisma } = makeService({ note: { id: "n1", authorId: "u9" } });
    await expect(svc.remove("ord1", "n1", { id: "u1", role: "admin" })).resolves.toEqual({
      ok: true,
    });
    expect(prisma.orderNote.delete).toHaveBeenCalled();
  });

  it("olmayan not silinemez", async () => {
    const { svc } = makeService({ note: null });
    await expect(svc.remove("ord1", "yok", { id: "u1", role: "admin" })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("notlar yeniden eskiye sıralanır", async () => {
    const { svc, prisma } = makeService();
    await svc.list("ord1");
    expect(prisma.orderNote.findMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: "desc" });
  });
});
