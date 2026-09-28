import { describe, it, expect, vi } from "vitest";
import { PaymentsService } from "./payments.service";

/**
 * Reconcile — iyzico KESİN hata döndüğünde siparişi "başarısız" işaretleme (2026-09-28).
 *
 * Gerçek vaka: MK-MUKVO846-X3V3. Müşteri ödemeyi denedi, iyzico "10208 Üye işyeri kategori
 * kodu hatalı" döndü, callback hiç gelmedi. Reconcile `status !== "success"` olan her yanıtı
 * sessizce atladığı için sipariş sonsuza dek "beklemede" göründü ve hata hiçbir yere
 * yazılmadı — ne müşteri ne biz ne olduğunu gördük, müşteri de vazgeçti.
 *
 * Buradaki testler iki yönlü güvenceyi koruyor: gerçek hata KAYDEDİLİR, ama sepet terki
 * ve geçici ağ hatası siparişi YANLIŞLIKLA başarısız yapmaz.
 */

function makeConfig() {
  return { get: vi.fn((k: string) => (k === "WEB_ORIGIN" ? "http://web.test" : k === "JWT_SECRET" ? "s" : undefined)) };
}

function makeIyzico(retrieveResult: Record<string, unknown>) {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    retrieveCheckoutForm: vi.fn().mockResolvedValue(retrieveResult),
    initializeCheckoutForm: vi.fn(),
  };
}

function makeSvc(retrieveResult: Record<string, unknown>, updateCount = 1) {
  const pendingOrder = { id: "ord1", orderNumber: "MK-1", total: 200, iyzicoCheckoutToken: "tok" };
  const prisma = {
    order: {
      findMany: vi.fn().mockResolvedValue([pendingOrder]),
      updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
    },
  };
  const svc = new PaymentsService(
    prisma as never,
    makeIyzico(retrieveResult) as never,
    makeConfig() as never,
    { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true), sendNewOrderAdminEmail: vi.fn().mockResolvedValue(true) } as never,
    { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never,
    { earnForOrder: () => Promise.resolve() } as never,
  );
  return { svc, prisma };
}

describe("reconcile — kesin ödeme hatası kaydedilir", () => {
  it("10208 gibi gerçek hata: sipariş 'basarisiz' işaretlenir, kod ve mesaj yazılır", async () => {
    const { svc, prisma } = makeSvc({
      status: "failure",
      paymentStatus: "FAILURE",
      errorCode: "10208",
      errorMessage: "Üye işyeri kategori kodu hatalı",
      basketId: "MK-1",
    });

    const res = await svc.reconcilePendingPayments();

    expect(res.recovered).toBe(0); // kurtarma değil, başarısız işaretleme
    const cagri = prisma.order.updateMany.mock.calls[0][0];
    expect(cagri.where).toMatchObject({ id: "ord1", paymentStatus: "beklemede" });
    expect(cagri.data).toMatchObject({
      paymentStatus: "basarisiz",
      paymentErrorCode: "10208",
      paymentErrorMessage: "Üye işyeri kategori kodu hatalı",
    });
  });

  it("5122 (müşteri formu hiç göndermemiş) → DOKUNULMAZ, beklemede kalır", async () => {
    const { svc, prisma } = makeSvc({
      status: "failure",
      errorCode: "5122",
      errorMessage: "Gönderilen tokena ait ödeme bilgisi bulunamadı",
    });

    await svc.reconcilePendingPayments();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it("geçici ağ hatası (errorCode yok) → DOKUNULMAZ", async () => {
    const { svc, prisma } = makeSvc({ status: "failure", paymentStatus: "ERROR", errorMessage: "retrieve_error" });
    await svc.reconcilePendingPayments();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it("basketId BAŞKA siparişe aitse → DOKUNULMAZ (yanlış siparişi bozma)", async () => {
    const { svc, prisma } = makeSvc({
      status: "failure",
      errorCode: "10208",
      errorMessage: "Üye işyeri kategori kodu hatalı",
      basketId: "MK-BASKA",
    });
    await svc.reconcilePendingPayments();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it("başarılı ödeme yolu bozulmadı: hâlâ kurtarılıyor", async () => {
    const { svc } = makeSvc({ status: "success", basketId: "MK-1", price: 200, paymentId: "iyz-1" });
    const res = await svc.reconcilePendingPayments();
    expect(res.recovered).toBe(1);
  });
});
