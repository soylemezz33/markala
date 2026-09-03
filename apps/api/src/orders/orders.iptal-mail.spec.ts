import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdersService } from "./orders.service";

/**
 * updateStatus → "iptal-edildi" akışında iptal maili KİMİN için atılır?
 *
 * Saf kural iptal-mail-kurali.spec.ts'te ayrıca test ediliyor; buradaki testler
 * KURALIN SERVİSE DOĞRU BAĞLANDIĞINI çakıyor. Kuralın kendisi doğru olup çağrı
 * yerinde uygulanmamış olması daha önce yaşandı — kural + bağlantı ayrı test edilir.
 */

const MAIL = {
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderAdminEmail: vi.fn(),
  sendOrderInProductionEmail: vi.fn(),
  sendOrderShippedEmail: vi.fn(),
  sendOrderDeliveredEmail: vi.fn(),
  sendOrderCancelledEmail: vi.fn().mockResolvedValue(true),
};

function makeService(order: { paymentMethod: string | null; paymentStatus: string | null }) {
  const prisma = {
    order: {
      // Geçiş kontrolü mevcut durumu okur; ödeme bekleyen sipariş "Sipariş Alındı" statüsünde durur.
      findUnique: vi.fn().mockResolvedValue({ status: "siparis_alindi" }),
      update: vi.fn().mockResolvedValue({ id: "ord1", ...order }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const loyalty = { refundForOrder: vi.fn().mockResolvedValue(undefined) };
  const svc = new OrdersService(
    prisma as never,
    {} as never,
    { isEnabled: () => false } as never,
    MAIL as never,
    loyalty as never,
    {} as never,
  );
  return { svc };
}

describe("OrdersService.updateStatus — iptal maili", () => {
  beforeEach(() => {
    MAIL.sendOrderCancelledEmail.mockClear();
  });

  it("ödemesi alınmamış siparişin iptalinde müşteriye mail GİTMEZ", async () => {
    const { svc } = makeService({ paymentMethod: "kart", paymentStatus: "beklemede" });
    await svc.updateStatus("ord1", "iptal-edildi");
    expect(MAIL.sendOrderCancelledEmail).not.toHaveBeenCalled();
  });

  it("ödenmemiş havale siparişinin iptalinde mail GİTMEZ", async () => {
    const { svc } = makeService({ paymentMethod: "havale", paymentStatus: "beklemede" });
    await svc.updateStatus("ord1", "iptal-edildi");
    expect(MAIL.sendOrderCancelledEmail).not.toHaveBeenCalled();
  });

  it("ödemesi alınmış siparişin iptalinde mail GİDER", async () => {
    const { svc } = makeService({ paymentMethod: "kart", paymentStatus: "basarili" });
    await svc.updateStatus("ord1", "iptal-edildi");
    expect(MAIL.sendOrderCancelledEmail).toHaveBeenCalledWith("ord1");
  });

  it("cari siparişin iptalinde mail GİDER", async () => {
    const { svc } = makeService({ paymentMethod: "cari", paymentStatus: "beklemede" });
    await svc.updateStatus("ord1", "iptal-edildi");
    expect(MAIL.sendOrderCancelledEmail).toHaveBeenCalledWith("ord1");
  });
});
