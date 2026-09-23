import { describe, it, expect, vi } from "vitest";
import { InvoiceService } from "./invoice.service";

/**
 * FATURA KESİLMESİN (2026-09-23, Hasan: "manuellerin birçoğunu önden fatura kesiyorum,
 * tekrar kesinlikle fatura kesmemeli").
 *
 * Mükerrer fatura GERİ ALINAMAZ (Paraşüt'te belge resmileşir, e-Arşiv/e-Fatura gider).
 * Bu yüzden koruma İKİ katmanlı: (1) taslak hiç oluşturulmaz — orders.service
 * issueInvoiceIfNeeded, (2) taslak bir şekilde varsa finalize durdurur. Aşağıdakiler
 * ikinci katmanı ve cron seçimini kilitler; biri gevşerse test kırılır.
 */
describe("invoiceSkip — resmileştirme kalkanı", () => {
  function kur(order: unknown) {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue(order), update: vi.fn().mockResolvedValue({}), findMany: vi.fn().mockResolvedValue([]) },
    };
    const parasut = { finalizeEDocument: vi.fn(), isConfigured: () => true };
    const svc = new InvoiceService(prisma as never, parasut as never, {} as never, {} as never);
    return { svc, prisma, parasut };
  }

  it("invoiceSkip=true ise resmileştirme YAPILMAZ, Paraşüt'e hiç gidilmez", async () => {
    const { svc, parasut } = kur({
      id: "o1", orderNumber: "MK-1", parasutInvoiceId: "TASLAK-1",
      invoiceNumber: null, invoiceAttempts: 0, invoiceMailedAt: null, invoicePdfKey: null,
      invoiceSkip: true,
    });
    const r = await svc.finalize("o1");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/kesilmeyecek/i);
    expect(parasut.finalizeEDocument).not.toHaveBeenCalled();
  });

  it("invoiceSkip=false ise normal akış sürer (kalkan yanlışlıkla kapatmaz)", async () => {
    const { svc, parasut } = kur({
      id: "o1", orderNumber: "MK-1", parasutInvoiceId: "TASLAK-1",
      invoiceNumber: null, invoiceAttempts: 0, invoiceMailedAt: null, invoicePdfKey: null,
      invoiceSkip: false,
    });
    parasut.finalizeEDocument.mockResolvedValue({ invoiceNumber: "MS0-1", type: "e_archive", pdf: null });
    const r = await svc.finalize("o1");
    expect(parasut.finalizeEDocument).toHaveBeenCalledWith("o1");
    expect(r.ok !== undefined).toBe(true);
  });

  it("cron bekleyenleri seçerken invoiceSkip=false koşulunu KULLANIR", async () => {
    const { svc, prisma } = kur(null);
    await svc.retryPending();
    const where = prisma.order.findMany.mock.calls[0][0].where;
    expect(where.invoiceSkip).toBe(false);
  });
});
