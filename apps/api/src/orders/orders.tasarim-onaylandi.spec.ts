import { describe, it, expect, vi } from "vitest";
import { OrdersService, STATUS_ORDER, validStatusTransitions } from "./orders.service";

/**
 * "Tasarım Onaylandı" durumu (2026-09-03, Hasan): Tasarım Onayında → Tasarım Onaylandı → Üretimde.
 * Müşteriye mail YOK; yalnız üretim/kargo ekibine (MailService.sendDesignApprovedProductionEmail)
 * bildirim gider. Geri adımda (Üretimde → Tasarım Onaylandı) o bildirim de gitmez.
 */

function makeService(mevcut: string) {
  const MAIL = {
    sendOrderConfirmationEmail: vi.fn(),
    sendNewOrderAdminEmail: vi.fn(),
    sendOrderInProductionEmail: vi.fn().mockResolvedValue(true),
    sendOrderShippedEmail: vi.fn().mockResolvedValue(true),
    sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true),
    sendOrderCancelledEmail: vi.fn().mockResolvedValue(true),
    sendDesignApprovedProductionEmail: vi.fn().mockResolvedValue(true),
  };
  const prisma = {
    order: {
      findUnique: vi.fn().mockResolvedValue({ status: mevcut }),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "o1", paymentMethod: "havale", paymentStatus: "basarili", ...data })),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const svc = new OrdersService(prisma as never, {} as never, {} as never, MAIL as never, { isEnabled: () => false, refundForOrder: vi.fn() } as never, {} as never);
  return { svc, MAIL, prisma };
}

describe("Tasarım Onaylandı durumu", () => {
  it("sıralamada Tasarım Onayında ile Üretimde arasındadır ve geçiş tablosunda yer alır", () => {
    const i = STATUS_ORDER.indexOf("tasarim-onaylandi" as never);
    expect(i).toBe(STATUS_ORDER.indexOf("tasarim-onayindi" as never) + 1);
    expect(STATUS_ORDER[i + 1]).toBe("uretimde");
    expect(validStatusTransitions["tasarim-onayindi"]).toContain("tasarim-onaylandi");
    expect(validStatusTransitions["tasarim-onaylandi"]).toContain("uretimde");
  });

  it("ileri geçişte üretim ekibine bildirim gider, müşteriye HİÇBİR mail gitmez", async () => {
    const { svc, MAIL, prisma } = makeService("tasarim_onayindi");
    await svc.updateStatus("o1", "tasarim-onaylandi");
    expect(prisma.order.update.mock.calls[0][0].data.status).toBe("tasarim_onaylandi");
    await new Promise((r) => setImmediate(r));
    expect(MAIL.sendDesignApprovedProductionEmail).toHaveBeenCalledWith("o1");
    expect(MAIL.sendOrderInProductionEmail).not.toHaveBeenCalled();
    expect(MAIL.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(MAIL.sendOrderShippedEmail).not.toHaveBeenCalled();
  });

  it("geri adımda (Üretimde → Tasarım Onaylandı) bildirim gitmez", async () => {
    const { svc, MAIL } = makeService("uretimde");
    await svc.updateStatus("o1", "tasarim-onaylandi");
    await new Promise((r) => setImmediate(r));
    expect(MAIL.sendDesignApprovedProductionEmail).not.toHaveBeenCalled();
  });
});
