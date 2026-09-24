import { describe, it, expect, vi } from "vitest";
import { OrdersService } from "./orders.service";

/**
 * listAll({ list: true }) — hafif liste yanıtı (2026-09-24).
 *
 * Panel sipariş listesi 100 siparişi çekiyordu ve yanıt 493 KB'ydi; bunun büyük kısmı
 * o ekranın HİÇ kullanmadığı sipariş kalemleriydi. Bu testler iki garantiyi koruyor:
 * (1) list:true kalemleri ne sorguluyor ne de yanıta koyuyor,
 * (2) varsayılan davranış değişmedi — /kargoda gibi kalem kullanan ekranlar etkilenmez.
 */

const MAIL = {
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderAdminEmail: vi.fn(),
  sendOrderInProductionEmail: vi.fn(),
  sendOrderShippedEmail: vi.fn(),
  sendOrderDeliveredEmail: vi.fn(),
  sendOrderCancelledEmail: vi.fn(),
};

const SIPARIS = {
  id: "o1",
  orderNumber: "MK-TEST-0001",
  status: "siparis_alindi",
  total: 100,
  user: { email: "a@b.c", fullName: "Test Müşteri" },
  shippingAddress: null,
  billingAddress: null,
  shippingAddressSnapshot: null,
  billingAddressSnapshot: null,
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

describe("OrdersService.listAll — hafif liste", () => {
  it("list:true → sorguda items include EDİLMEZ", async () => {
    const { svc, findMany } = makeService([SIPARIS]);
    await svc.listAll({ role: "admin", list: true });
    const include = findMany.mock.calls[0][0].include;
    expect(include.items).toBeUndefined();
    // kimlik alanları hâlâ gerekli (müşteri adı bunlardan türüyor)
    expect(include.user).toBeDefined();
  });

  it("list:true → yanıtta items alanı HİÇ olmaz (boş dizi de değil)", async () => {
    const { svc } = makeService([SIPARIS]);
    const [satir] = await svc.listAll({ role: "admin", list: true });
    expect("items" in (satir as object)).toBe(false);
    expect((satir as { customerName?: string }).customerName).toBe("Test Müşteri");
  });

  it("varsayılan (list yok) → items include edilir ve yanıta girer", async () => {
    const { svc, findMany } = makeService([{ ...SIPARIS, items: [{ productName: "X", quantity: 1 }] }]);
    const [satir] = await svc.listAll({ role: "admin" });
    expect(findMany.mock.calls[0][0].include.items).toBeDefined();
    expect((satir as { items?: unknown[] }).items).toHaveLength(1);
  });

  it("list:false → varsayılanla aynı davranır", async () => {
    const { svc, findMany } = makeService([{ ...SIPARIS, items: [] }]);
    await svc.listAll({ role: "admin", list: false });
    expect(findMany.mock.calls[0][0].include.items).toBeDefined();
  });
});
