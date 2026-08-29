import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

/**
 * updateTracking — takip no/firma yazımı (2026-08-29).
 *
 * Bu ucun VAR OLMA SEBEBİ mail göndermemesi: updateStatus "kargoya-verildi"de müşteriye
 * kargo e-postası atıyor, dolayısıyla takip numarasını sonradan düzeltmek için o uç
 * kullanılamaz (her düzeltme müşteriye yeni mail demek olurdu). Testlerin çoğu bu
 * garantiyi ve kısmi-güncelleme davranışını koruyor.
 */

const MAIL = {
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderAdminEmail: vi.fn(),
  sendOrderInProductionEmail: vi.fn(),
  sendOrderShippedEmail: vi.fn(),
  sendOrderDeliveredEmail: vi.fn(),
  sendOrderCancelledEmail: vi.fn(),
};

function makeService(mevcut: { trackingNumber: string | null; trackingCarrier: string | null } | null) {
  const order = {
    findUnique: vi.fn().mockResolvedValue(mevcut),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mevcut, ...data })),
  };
  const prisma = {
    order,
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const svc = new OrdersService(
    prisma as never,
    {} as never,
    {} as never,
    MAIL as never,
    { isEnabled: () => false } as never,
    {} as never,
  );
  return { svc, prisma, order };
}

describe("OrdersService.updateTracking", () => {
  it("takip no ve firmayı yazar", async () => {
    const { svc, order } = makeService({ trackingNumber: null, trackingCarrier: null });
    const res = await svc.updateTracking("ord1", {
      trackingNumber: "1234567890",
      trackingCarrier: "DHL eCommerce",
    });
    expect(order.update).toHaveBeenCalledWith({
      where: { id: "ord1" },
      data: { trackingNumber: "1234567890", trackingCarrier: "DHL eCommerce" },
    });
    expect(res.trackingNumber).toBe("1234567890");
  });

  it("MÜŞTERİYE HİÇBİR MAİL GÖNDERMEZ (bu ucun asıl varlık sebebi)", async () => {
    const { svc } = makeService({ trackingNumber: "eski", trackingCarrier: "DHL eCommerce" });
    await svc.updateTracking("ord1", { trackingNumber: "yeni" });
    for (const fn of Object.values(MAIL)) expect(fn).not.toHaveBeenCalled();
  });

  it("sipariş durumuna DOKUNMAZ", async () => {
    const { svc, order } = makeService({ trackingNumber: null, trackingCarrier: null });
    await svc.updateTracking("ord1", { trackingNumber: "1234567890" });
    const data = order.update.mock.calls[0]![0].data;
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("shippedAt");
  });

  it("undefined alana dokunmaz — kısmi güncelleme (firmayı silmeden no değiştir)", async () => {
    const { svc, order } = makeService({ trackingNumber: "eski", trackingCarrier: "DHL eCommerce" });
    await svc.updateTracking("ord1", { trackingNumber: "yeni" });
    expect(order.update).toHaveBeenCalledWith({
      where: { id: "ord1" },
      data: { trackingNumber: "yeni" },
    });
  });

  it("boş string → null (yanlış girilen numarayı temizler)", async () => {
    const { svc, order } = makeService({ trackingNumber: "hatali", trackingCarrier: "DHL eCommerce" });
    await svc.updateTracking("ord1", { trackingNumber: "  " });
    expect(order.update.mock.calls[0]![0].data.trackingNumber).toBeNull();
  });

  it("baştaki/sondaki boşlukları kırpar (kopyala-yapıştır takip no)", async () => {
    const { svc, order } = makeService({ trackingNumber: null, trackingCarrier: null });
    await svc.updateTracking("ord1", { trackingNumber: "  1234567890  " });
    expect(order.update.mock.calls[0]![0].data.trackingNumber).toBe("1234567890");
  });

  it("hiçbir alan gelmezse update çağrılmaz (boşa yazma yok)", async () => {
    const { svc, order } = makeService({ trackingNumber: "var", trackingCarrier: "DHL eCommerce" });
    await svc.updateTracking("ord1", {});
    expect(order.update).not.toHaveBeenCalled();
  });

  it("olmayan sipariş → NotFoundException", async () => {
    const { svc } = makeService(null);
    await expect(svc.updateTracking("yok", { trackingNumber: "1" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("denetim kaydı önce/sonra değeriyle yazılır", async () => {
    const { svc, prisma } = makeService({ trackingNumber: "eski", trackingCarrier: "DHL eCommerce" });
    await svc.updateTracking("ord1", { trackingNumber: "yeni" }, { actorId: "adm1", ipAddress: "1.2.3.4" });
    const kayit = prisma.auditLog.create.mock.calls[0]![0].data;
    expect(kayit.action).toBe("tracking_update");
    expect(kayit.actorId).toBe("adm1");
    expect(kayit.diff.from.number).toBe("eski");
    expect(kayit.diff.to.number).toBe("yeni");
  });
});
