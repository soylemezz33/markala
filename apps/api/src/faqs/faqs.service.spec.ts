import { describe, it, expect, vi } from "vitest";
import { FaqsService } from "./faqs.service";

function mockPrisma() {
  return {
    faq: {
      findMany: vi.fn().mockResolvedValue([
        { id: "f1", question: "Hangi formatta dosya göndermeliyim?", answer: "PDF veya AI formatında.", category: "tasarim", sortOrder: 0, isActive: true, createdAt: new Date("2026-01-01") },
        { id: "f2", question: "Kaç günde elime ulaşır?", answer: "İstanbul içi 1-2, diğer iller 3-5 iş günü.", category: "kargo", sortOrder: 0, isActive: true, createdAt: new Date("2026-01-02") },
      ]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      delete: vi.fn().mockResolvedValue({ id: "f1" }),
    },
  };
}

describe("FaqsService", () => {
  it("findAll kategori filtresi olmadan tüm kayıtları getirir", async () => {
    const prisma = mockPrisma();
    const svc = new FaqsService(prisma as never);
    const res = await svc.findAll();
    expect(prisma.faq.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    expect(res).toHaveLength(2);
  });

  it("findAll kategori filtresiyle where koşulu ekler", async () => {
    const prisma = mockPrisma();
    const svc = new FaqsService(prisma as never);
    await svc.findAll("tasarim");
    expect(prisma.faq.findMany).toHaveBeenCalledWith({
      where: { category: "tasarim" },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  });

  it("create zorunlu alanlarla prisma.faq.create çağırır", async () => {
    const prisma = mockPrisma();
    const svc = new FaqsService(prisma as never);
    const res = await svc.create({
      question: "Tasarım dosyam hazır değilse ne yapmalıyım?",
      answer: "Tasarım ekibimizle iletişime geçebilirsiniz.",
      category: "tasarim",
    });
    expect(prisma.faq.create).toHaveBeenCalledOnce();
    const callData = prisma.faq.create.mock.calls[0][0].data;
    expect(callData.question).toBe("Tasarım dosyam hazır değilse ne yapmalıyım?");
    expect(callData.category).toBe("tasarim");
    expect(res.id).toBe("new");
  });

  it("remove prisma.faq.delete ile hard delete yapar", async () => {
    const prisma = mockPrisma();
    const svc = new FaqsService(prisma as never);
    await svc.remove("f1");
    expect(prisma.faq.delete).toHaveBeenCalledWith({ where: { id: "f1" } });
  });
});
