import { describe, it, expect, vi } from "vitest";
import { OrdersService } from "./orders.service";

/**
 * listAll + designUploads (2026-09-03, "Kargodaki ürünler" ekranı).
 *
 * Koruduğu garanti: tasarımcı dosya satırları panel rollerinde LİSTEYE de gelir (ekran kalem
 * başına önizleme gösterir), müşteri rolünde ise include HİÇ kurulmaz — çalışma dosyaları
 * müşteri hesabına sızmaz. findById ile aynı kural; iki uç birbirinden sapmasın diye test.
 */

const MAIL = {
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderAdminEmail: vi.fn(),
  sendOrderInProductionEmail: vi.fn(),
  sendOrderShippedEmail: vi.fn(),
  sendOrderDeliveredEmail: vi.fn(),
  sendOrderCancelledEmail: vi.fn(),
};

const HAM_SATIR = {
  id: "du1",
  kind: "onizleme",
  fileName: "on.png",
  fileSize: 123,
  fileUrl: "https://api/uploads/design/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png",
  mimeType: "image/png",
  createdAt: new Date("2026-09-03T00:00:00Z"),
  user: { id: "u1", fullName: "Tasarımcı" },
};

function makeService() {
  const order = {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "o1",
        orderNumber: "MK-1",
        status: "kargoya_verildi",
        total: "100.00",
        user: { email: "m@x", fullName: "Müşteri" },
        shippingAddress: null,
        billingAddress: null,
        shippingAddressSnapshot: null,
        billingAddressSnapshot: null,
        items: [{ id: "it1", productName: "Bayrak", quantity: 2, unitPrice: "50.00", designUploads: [HAM_SATIR] }],
      },
    ]),
  };
  const svc = new OrdersService(
    { order } as never,
    {} as never,
    {} as never,
    MAIL as never,
    { isEnabled: () => false } as never,
    {} as never,
  );
  return { svc, order };
}

describe("OrdersService.listAll — designUploads", () => {
  it("panel rolünde kalemlere designUploads include edilir ve panel şekline çevrilir", async () => {
    const { svc, order } = makeService();
    const [o] = await svc.listAll({ role: "kargo" });
    const include = order.findMany.mock.calls[0][0].include;
    expect(include.items).toMatchObject({ include: { designUploads: expect.any(Object) } });
    const kalem = (o as { items: Array<{ designUploads?: unknown[] }> }).items[0];
    expect(kalem.designUploads).toEqual([
      expect.objectContaining({ id: "du1", kind: "onizleme", uploadedBy: { id: "u1", fullName: "Tasarımcı" } }),
    ]);
    // İç alanlar dışarı çıkmaz; ham `user` alanı da yerini uploadedBy'a bırakır.
    expect(kalem.designUploads![0]).not.toHaveProperty("storageKey");
    expect(kalem.designUploads![0]).not.toHaveProperty("user");
  });

  it("müşteri rolünde include kurulmaz ve designUploads alanı yanıtta yoktur", async () => {
    const { svc, order } = makeService();
    // Mock her durumda ham satır döndürür; servis bunu müşteriye GEÇİRMEMELİ.
    const [o] = await svc.listAll({ role: "customer" });
    expect(order.findMany.mock.calls[0][0].include.items).toBe(true);
    expect((o as { items: Array<Record<string, unknown>> }).items[0]).not.toHaveProperty("designUploads");
  });

  it("rol verilmediğinde de (eski çağrı yolu) müşteri gibi davranır", async () => {
    const { svc, order } = makeService();
    await svc.listAll({});
    expect(order.findMany.mock.calls[0][0].include.items).toBe(true);
  });
});
