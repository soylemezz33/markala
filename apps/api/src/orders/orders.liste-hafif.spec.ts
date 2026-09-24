import { describe, it, expect, vi } from "vitest";
import { OrdersService } from "./orders.service";

/**
 * listAll({ list: true }) — panel sipariş listesi için dar projeksiyon (2026-09-24).
 *
 * Ölçüm: 100 siparişlik tam yanıt 493 KB'di, listenin kullandığı alanlar ~15 KB.
 * Kalanı kalemler, adres snapshot'ları, clientUserAgent/clientIp, gclid/fbp,
 * iyzicoCheckoutToken ve reviewToken gibi ekranda hiç görünmeyen verilerdi.
 *
 * Testler üç garantiyi koruyor:
 *  1. Hafif yanıt SADECE listenin kullandığı alanları taşır (jeton/IP/UA sızmaz),
 *  2. Müşteri adı misafir siparişte de doğru türer (tek kaynağı snapshot),
 *  3. Varsayılan davranış değişmedi — /kargoda gibi kalem kullanan ekranlar etkilenmez.
 */

const MAIL = {
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderAdminEmail: vi.fn(),
  sendOrderInProductionEmail: vi.fn(),
  sendOrderShippedEmail: vi.fn(),
  sendOrderDeliveredEmail: vi.fn(),
  sendOrderCancelledEmail: vi.fn(),
};

function makeService(donen: Record<string, unknown>[]) {
  const findMany = vi.fn().mockResolvedValue(donen);
  const prisma = { order: { findMany }, auditLog: { create: vi.fn() } };
  const svc = new OrdersService(
    prisma as never,
    {} as never,
    {} as never,
    MAIL as never,
    { isEnabled: () => false } as never,
    {} as never,
  );
  return { svc, findMany };
}

/** Hafif yolun Prisma'dan döndüğü şekil (select ile sınırlı). */
const HAFIF_SATIR = {
  id: "o1",
  orderNumber: "MK-TEST-0001",
  email: "a@b.c",
  createdAt: new Date("2026-09-24T10:00:00Z"),
  total: 100,
  status: "siparis_alindi",
  paymentStatus: "basarili",
  paymentMethod: "iyzico",
  paymentErrorMessage: null,
  user: { fullName: "Üye Müşteri" },
  shippingAddress: null,
  billingAddress: null,
  shippingAddressSnapshot: null,
  billingAddressSnapshot: null,
};

describe("OrdersService.listAll — hafif liste", () => {
  it("list:true → yalnız listenin kullandığı alanlar seçilir; jeton/IP/UA istenmez", async () => {
    const { svc, findMany } = makeService([HAFIF_SATIR]);
    await svc.listAll({ role: "admin", list: true });
    const select = findMany.mock.calls[0][0].select;
    expect(select).toBeDefined();
    expect(findMany.mock.calls[0][0].include).toBeUndefined();
    for (const alan of ["items", "clientIp", "clientUserAgent", "gclid", "fbp", "iyzicoCheckoutToken", "reviewToken", "notes"]) {
      expect(select[alan], alan).toBeUndefined();
    }
    for (const alan of ["orderNumber", "total", "status", "paymentStatus", "createdAt"]) {
      expect(select[alan], alan).toBe(true);
    }
  });

  it("list:true → yanıtta items ve snapshot alanları bulunmaz", async () => {
    const { svc } = makeService([HAFIF_SATIR]);
    const [satir] = await svc.listAll({ role: "admin", list: true });
    for (const alan of ["items", "shippingAddressSnapshot", "billingAddressSnapshot", "user"]) {
      expect(alan in (satir as object), alan).toBe(false);
    }
    expect((satir as { orderNumber: string }).orderNumber).toBe("MK-TEST-0001");
  });

  it("müşteri adı: üye adı → adres → snapshot sırasıyla türer", async () => {
    const { svc } = makeService([
      HAFIF_SATIR,
      // misafir/manuel sipariş: ad yalnız snapshot'ta
      { ...HAFIF_SATIR, id: "o2", user: null, shippingAddressSnapshot: { fullName: "Misafir Müşteri" } },
      { ...HAFIF_SATIR, id: "o3", user: null, shippingAddress: { fullName: "Adres Adı" } },
      { ...HAFIF_SATIR, id: "o4", user: null },
    ]);
    const satirlar = (await svc.listAll({ role: "admin", list: true })) as Array<{ customerName: string | null }>;
    expect(satirlar.map((s) => s.customerName)).toEqual(["Üye Müşteri", "Misafir Müşteri", "Adres Adı", null]);
  });

  it("varsayılan (list yok) → kalemler include edilir ve yanıta girer", async () => {
    const { svc, findMany } = makeService([
      { ...HAFIF_SATIR, items: [{ productName: "X", quantity: 1 }], user: { email: "a@b.c", fullName: "Üye Müşteri" } },
    ]);
    const [satir] = await svc.listAll({ role: "admin" });
    expect(findMany.mock.calls[0][0].include.items).toBeDefined();
    expect((satir as { items?: unknown[] }).items).toHaveLength(1);
  });

  it("list:false → varsayılanla aynı davranır", async () => {
    const { svc, findMany } = makeService([{ ...HAFIF_SATIR, items: [], user: { email: "a@b.c", fullName: "X" } }]);
    await svc.listAll({ role: "admin", list: false });
    expect(findMany.mock.calls[0][0].include.items).toBeDefined();
  });
});
