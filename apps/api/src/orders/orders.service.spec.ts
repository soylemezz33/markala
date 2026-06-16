import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { OrdersService, validStatusTransitions } from "./orders.service";

/**
 * Kapsamlı test alanları:
 * - Server-side fiyat hesabı (client fiyat alanları yok sayılır)
 * - Idempotency-key dedup (çift sipariş koruması)
 * - IDOR koruması: userId + yabancı adres → ForbiddenException
 * - Kupon: yüzde indirim, ücretsiz kargo, süresi dolmuş
 * - Durum makinesi: izinsiz geçiş → BadRequestException
 */

const BASE_PRODUCT = {
  id: "p1",
  slug: "kartvizit",
  name: "Kartvizit",
  basePrice: 290, // Number.() → 290; round2(290 * 1) = 290 subtotal
  images: ["img.jpg"],
  isActive: true,
};

function makeTx() {
  return {
    coupon: {
      // Transaction içinde kupon varlığı/aktifliği yeniden doğrulanır (optimistic locking).
      // null dönseydi ConflictException fırlatırdı ve kupon testleri yanlış sebepten fail olurdu.
      findUnique: vi.fn().mockResolvedValue({ id: "cp1", isActive: true, maxUses: null, usedCount: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    order: {
      create: vi.fn().mockResolvedValue({ id: "ord1", orderNumber: "MK-XXX-YYY", items: [] }),
    },
  };
}

type PrismaMock = ReturnType<typeof makePrisma>;

function makePrisma(overrides: Record<string, unknown> = {}) {
  const tx = makeTx();
  const prisma = {
    order: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: "ord1", status: "uretimde" }),
    },
    address: {
      // shipping + billing aynı mock; her ikisi de mevcut adres döndürür
      findFirst: vi.fn().mockResolvedValue({ id: "addr1" }),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([BASE_PRODUCT]),
    },
    coupon: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn().mockImplementation(
      (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    ),
    _tx: tx,
    ...overrides,
  };
  return prisma;
}

const BASE_INPUT = {
  email: "musteri@markala.test",
  phone: "05001234567",
  items: [{ productId: "p1", configuration: {}, quantity: 1 }],
  shippingAddressId: "addr1",
  billingAddressId: "addr1",
};

describe("OrdersService.create — validasyon", () => {
  it("boş items listesi → BadRequestException", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);
    await expect(svc.create({ ...BASE_INPUT, items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pasif / bulunamayan ürün → BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([]); // ürün yok
    const svc = new OrdersService(prisma as never);
    await expect(svc.create(BASE_INPUT)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("userId + yabancı adres → ForbiddenException (IDOR)", async () => {
    const prisma = makePrisma();
    // Birinci findFirst (shipping) null döner
    prisma.address.findFirst.mockResolvedValueOnce(null);
    const svc = new OrdersService(prisma as never);
    await expect(svc.create({ ...BASE_INPUT, userId: "user-x" })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("OrdersService.create — idempotency", () => {
  it("aynı key ikinci çağrıda mevcut siparişi döner (yeni oluşturmaz)", async () => {
    const existingOrder = { id: "ord-existing", orderNumber: "MK-OLD", items: [] };
    const prisma = makePrisma();
    prisma.order.findFirst.mockResolvedValueOnce(existingOrder);
    const svc = new OrdersService(prisma as never);

    const res = await svc.create({ ...BASE_INPUT, idempotencyKey: "my-unique-key-123" });

    expect(res).toBe(existingOrder);
    // transaction'a girilmemeli
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("OrdersService.create — sunucu tarafı fiyat hesabı", () => {
  it("fiyat Product.basePrice'tan hesaplanır; quantity 1 → subtotal 290", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);

    await svc.create(BASE_INPUT);

    const txMock = (prisma as any)._tx;
    const createCall = txMock.order.create.mock.calls[0][0].data;
    // subtotal = round2(290 × 1) = 290
    expect(Number(createCall.subtotal)).toBe(290);
    // discount = 0 (kupon yok)
    expect(Number(createCall.discount)).toBe(0);
    // shippingFee = 49.9 sabit
    expect(Number(createCall.shippingFee)).toBe(49.9);
    // total = 290 + 49.9 = 339.9
    expect(Number(createCall.total)).toBeCloseTo(339.9, 2);
  });

  it("konfigürasyondaki 'adet' alanı quantity olarak kullanılır", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);

    await svc.create({
      ...BASE_INPUT,
      items: [{ productId: "p1", configuration: { adet: 500 }, quantity: 1 }],
    });

    const txMock = (prisma as any)._tx;
    const createCall = txMock.order.create.mock.calls[0][0].data;
    // configQty = 500 → lineTotal = round2(290 × 500) = 145000
    const item = createCall.items.create[0];
    expect(item.quantity).toBe(500);
    expect(Number(item.lineTotal)).toBe(145000);
  });
});

describe("OrdersService.create — kupon", () => {
  const COUPON_BASE = {
    id: "cp1",
    code: "SAVE10",
    isActive: true,
    validFrom: null,
    validUntil: null,
    maxUses: null,
    usedCount: 0,
    minOrderAmount: null,
  };

  it("yüzde indirim doğru hesaplanır (%10 off 290 → discount 29)", async () => {
    const prisma = makePrisma();
    prisma.coupon.findUnique.mockResolvedValue({ ...COUPON_BASE, type: "percentage", value: "10" });
    const svc = new OrdersService(prisma as never);

    await svc.create({ ...BASE_INPUT, couponCode: "SAVE10" });

    const txMock = (prisma as any)._tx;
    const createCall = txMock.order.create.mock.calls[0][0].data;
    expect(Number(createCall.discount)).toBeCloseTo(29, 2);
    // total = (290 - 29) + 49.9 = 310.9
    expect(Number(createCall.total)).toBeCloseTo(310.9, 2);
  });

  it("free_shipping kupon kargo ücretini sıfırlar", async () => {
    const prisma = makePrisma();
    prisma.coupon.findUnique.mockResolvedValue({ ...COUPON_BASE, type: "free_shipping", value: "0" });
    const svc = new OrdersService(prisma as never);

    await svc.create({ ...BASE_INPUT, couponCode: "FREESHIP" });

    const txMock = (prisma as any)._tx;
    const createCall = txMock.order.create.mock.calls[0][0].data;
    expect(Number(createCall.shippingFee)).toBe(0);
    expect(Number(createCall.total)).toBeCloseTo(290, 2);
  });

  it("süresi dolmuş kupon → BadRequestException", async () => {
    const prisma = makePrisma();
    const yesterday = new Date(Date.now() - 86_400_000);
    prisma.coupon.findUnique.mockResolvedValue({
      ...COUPON_BASE,
      type: "percentage",
      value: "10",
      validUntil: yesterday,
    });
    const svc = new OrdersService(prisma as never);

    await expect(svc.create({ ...BASE_INPUT, couponCode: "EXPIRED" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pasif kupon → BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.coupon.findUnique.mockResolvedValue({ ...COUPON_BASE, type: "percentage", value: "5", isActive: false });
    const svc = new OrdersService(prisma as never);

    await expect(svc.create({ ...BASE_INPUT, couponCode: "INACTIVE" })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("OrdersService.create — misafir / storefront (inline adres + slug)", () => {
  const GUEST_ADDRESS = {
    fullName: "Ali Veli",
    phone: "05001112233",
    city: "Mersin",
    district: "Yenişehir",
    fullAddress: "Atatürk Cad. No:1 Daire:2",
    zipCode: "33100",
  };

  it("inline adres + productSlug → FK null, snapshot dolu, ürün slug'tan çözülür", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);

    await svc.create({
      email: "guest@markala.test",
      phone: "05001112233",
      items: [{ productSlug: "kartvizit", configuration: {}, quantity: 2 }],
      shippingAddress: GUEST_ADDRESS,
    });

    const data = (prisma as any)._tx.order.create.mock.calls[0][0].data;
    // Kayıtlı adres yok → FK null
    expect(data.shippingAddressId).toBeNull();
    expect(data.billingAddressId).toBeNull();
    // Adres snapshot olarak yazıldı (yalnız izinli alanlar)
    expect(data.shippingAddressSnapshot).toMatchObject({
      fullName: "Ali Veli",
      city: "Mersin",
      district: "Yenişehir",
      fullAddress: "Atatürk Cad. No:1 Daire:2",
      zipCode: "33100",
    });
    // Fatura adresi verilmedi → teslimat snapshot'ına düşer
    expect(data.billingAddressSnapshot).toMatchObject({ fullName: "Ali Veli" });
    // Ürün slug'tan çözüldü
    expect(data.items.create[0].productSlug).toBe("kartvizit");
    expect(data.items.create[0].quantity).toBe(2);
    // Fiyat sunucuda hesaplandı: 290 × 2 = 580
    expect(Number(data.subtotal)).toBe(580);
    // Adres FK doğrulaması (IDOR) misafirde çağrılmaz
    expect(prisma.address.findFirst).not.toHaveBeenCalled();
  });

  it("kalemde ne productId ne productSlug yoksa → BadRequestException", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);
    await expect(
      svc.create({
        email: "guest@markala.test",
        phone: "05001112233",
        items: [{ configuration: {}, quantity: 1 } as never],
        shippingAddress: GUEST_ADDRESS,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("adres hiç verilmezse (ne id ne inline) → BadRequestException", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);
    await expect(
      svc.create({
        email: "guest@markala.test",
        phone: "05001112233",
        items: [{ productId: "p1", configuration: {}, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("ayrı fatura adresi verilince snapshot olarak kendi alanına yazılır", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma as never);
    await svc.create({
      email: "guest@markala.test",
      phone: "05001112233",
      items: [{ productSlug: "kartvizit", configuration: {}, quantity: 1 }],
      shippingAddress: GUEST_ADDRESS,
      billingAddress: { ...GUEST_ADDRESS, fullName: "Veli Şirketi", label: "Fatura" },
    });
    const data = (prisma as any)._tx.order.create.mock.calls[0][0].data;
    expect(data.shippingAddressSnapshot).toMatchObject({ fullName: "Ali Veli" });
    expect(data.billingAddressSnapshot).toMatchObject({ fullName: "Veli Şirketi" });
  });
});

describe("OrdersService.findById", () => {
  it("misafir siparişinde snapshot shippingAddress olarak yüzeye çıkar", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({
      id: "ordg",
      userId: null,
      items: [],
      shippingAddress: null,
      billingAddress: null,
      shippingAddressSnapshot: { fullName: "Ali Veli", fullAddress: "Atatürk Cad.", city: "Mersin" },
      billingAddressSnapshot: { fullName: "Ali Veli" },
    });
    const svc = new OrdersService(prisma as never);

    const res = (await svc.findById("ordg")) as never as {
      shippingAddress: { fullName: string; city: string };
    };
    expect(res.shippingAddress).toMatchObject({ fullName: "Ali Veli", city: "Mersin" });
  });

  it("bulunamayan sipariş → NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue(null);
    const svc = new OrdersService(prisma as never);

    await expect(svc.findById("nonexistent")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("başka kullanıcının siparişi → ForbiddenException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({
      id: "ord1",
      userId: "user-owner",
      items: [],
      shippingAddress: {},
      billingAddress: {},
    });
    const svc = new OrdersService(prisma as never);

    await expect(svc.findById("ord1", "user-other")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("doğru kullanıcı kendi siparişine erişebilir", async () => {
    const order = { id: "ord1", userId: "user-owner", items: [], shippingAddress: {}, billingAddress: {} };
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue(order);
    const svc = new OrdersService(prisma as never);

    const res = await svc.findById("ord1", "user-owner");
    expect(res.id).toBe("ord1");
  });
});

describe("OrdersService.updateStatus — durum makinesi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçerli geçiş: siparis-alindi → uretimde", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "siparis_alindi" });
    const svc = new OrdersService(prisma as never);

    await svc.updateStatus("ord1", "uretimde");
    expect(prisma.order.update).toHaveBeenCalledOnce();
  });

  it("izinsiz geçiş: teslim-edildi → siparis-alindi → BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "teslim_edildi" });
    const svc = new OrdersService(prisma as never);

    await expect(svc.updateStatus("ord1", "siparis-alindi")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("kargoya-verildi → shippedAt atanır", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "uretimde" });
    const svc = new OrdersService(prisma as never);

    await svc.updateStatus("ord1", "kargoya-verildi");
    const updateCall = prisma.order.update.mock.calls[0][0];
    expect(updateCall.data.shippedAt).toBeInstanceOf(Date);
  });

  it("bulunamayan sipariş → NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue(null);
    const svc = new OrdersService(prisma as never);

    await expect(svc.updateStatus("ghost", "uretimde")).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("validStatusTransitions export", () => {
  it("teslim-edildi ve iptal-edildi terminal state — boş dizi", () => {
    expect(validStatusTransitions["teslim-edildi"]).toHaveLength(0);
    expect(validStatusTransitions["iptal-edildi"]).toHaveLength(0);
  });

  it("siparis-alindi'dan birden fazla hedef var", () => {
    expect(validStatusTransitions["siparis-alindi"].length).toBeGreaterThan(1);
  });
});
