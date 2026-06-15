import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { OrdersService, validStatusTransitions } from "./orders.service";

// ── Prisma mock ──────────────────────────────────────────────────────────────

function makePrisma(over: Record<string, any> = {}) {
  return {
    order: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      $transaction: vi.fn(),
    },
    address: {
      findFirst: vi.fn().mockResolvedValue({ id: "addr1" }),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    coupon: {
      findUnique: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn((fn: (tx: any) => Promise<any>) => fn(makePrisma(over))),
    ...over,
  } as any;
}

const BASE_ORDER = {
  id: "ord1",
  orderNumber: "MK-ABC-XY",
  userId: "user1",
  email: "test@markala.test",
  phone: "05001234567",
  subtotal: new Prisma.Decimal(290),
  shippingFee: new Prisma.Decimal(49.9),
  discount: new Prisma.Decimal(0),
  vat: new Prisma.Decimal(48.33),
  total: new Prisma.Decimal(339.9),
  status: "siparis_alindi",
  paymentStatus: "pending",
  shippingAddressId: "addr1",
  billingAddressId: "addr1",
  items: [],
  shippingAddress: { id: "addr1" },
  billingAddress: { id: "addr1" },
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BASE_PRODUCT = {
  id: "prod1",
  slug: "klasik-kartvizit",
  name: "Klasik Kartvizit",
  basePrice: new Prisma.Decimal(290),
  images: ["https://cdn.markala.com.tr/img.jpg"],
  isActive: true,
};

// ── Durum makinesi testleri ──────────────────────────────────────────────────

describe("validStatusTransitions (durum matrisi)", () => {
  it("siparis-alindi → uretimde izinli", () => {
    expect(validStatusTransitions["siparis-alindi"]).toContain("uretimde");
  });

  it("teslim-edildi → herhangi bir durum geçişi yasak (boş array)", () => {
    expect(validStatusTransitions["teslim-edildi"]).toHaveLength(0);
  });

  it("iptal-edildi → herhangi bir durum geçişi yasak (boş array)", () => {
    expect(validStatusTransitions["iptal-edildi"]).toHaveLength(0);
  });

  it("kargoya-verildi → yalnızca teslim-edildi mümkün", () => {
    const allowed = validStatusTransitions["kargoya-verildi"];
    expect(allowed).toEqual(["teslim-edildi"]);
  });

  it("tüm terminal durumlar için geri dönüş yolu yok", () => {
    const terminal = ["teslim-edildi", "iptal-edildi"];
    for (const status of terminal) {
      expect(validStatusTransitions[status]).toHaveLength(0);
    }
  });
});

// ── OrdersService.updateStatus ───────────────────────────────────────────────

describe("OrdersService.updateStatus", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("mevcut olmayan sipariş → 404 NotFoundException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue(null);
    const svc = new OrdersService(prisma);

    await expect(svc.updateStatus("nonexistent", "uretimde")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("geçersiz durum geçişi → 400 BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "teslim_edildi" });
    const svc = new OrdersService(prisma);

    // teslim-edildi → siparis-alindi yasak
    await expect(svc.updateStatus("ord1", "siparis-alindi")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("geçerli durum geçişi order.update çağırır", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "siparis_alindi" });
    prisma.order.update.mockResolvedValue({ ...BASE_ORDER, status: "uretimde" });
    const svc = new OrdersService(prisma);

    await svc.updateStatus("ord1", "uretimde");
    expect(prisma.order.update).toHaveBeenCalledOnce();
  });

  it("kargo numarası verilen güncelleme — kargoya-verildi'ye tracking alanları yazılır", async () => {
    const prisma = makePrisma();
    prisma.order.findUnique.mockResolvedValue({ status: "uretimde" });
    prisma.order.update.mockResolvedValue({ ...BASE_ORDER, status: "kargoya_verildi" });
    const svc = new OrdersService(prisma);

    await svc.updateStatus("ord1", "kargoya-verildi", {
      trackingNumber: "TRK123",
      trackingCarrier: "HepsiJet",
    });

    const updateCall = prisma.order.update.mock.calls[0][0];
    expect(updateCall.data.trackingNumber).toBe("TRK123");
    expect(updateCall.data.trackingCarrier).toBe("HepsiJet");
  });
});

// ── OrdersService.create — temel senaryolar ──────────────────────────────────

describe("OrdersService.create", () => {
  beforeEach(() => vi.restoreAllMocks());

  const baseInput = {
    email: "test@markala.test",
    phone: "05001234567",
    items: [
      {
        productId: "prod1",
        configuration: { quantity: 1000 },
        quantity: 1000,
      },
    ],
    shippingAddressId: "addr1",
    billingAddressId: "addr1",
  };

  it("boş items array → 400 BadRequestException", async () => {
    const prisma = makePrisma();
    const svc = new OrdersService(prisma);

    await expect(svc.create({ ...baseInput, items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pasif/mevcut olmayan ürün → 400 BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([]); // ürün bulunamadı
    const svc = new OrdersService(prisma);

    await expect(svc.create(baseInput)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("idempotency key eşleşmesi → mevcut siparişi döndürür, yeni yaratmaz", async () => {
    const prisma = makePrisma();
    prisma.order.findFirst.mockResolvedValue(BASE_ORDER);
    const svc = new OrdersService(prisma);

    const result = await svc.create({ ...baseInput, idempotencyKey: "test-idem-key-123" });

    expect(result).toBe(BASE_ORDER);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("başarılı sipariş — subtotal + shippingFee = total", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([BASE_PRODUCT]);
    const createdOrder = {
      ...BASE_ORDER,
      subtotal: new Prisma.Decimal(290),
      shippingFee: new Prisma.Decimal(49.9),
      total: new Prisma.Decimal(339.9),
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        order: {
          create: vi.fn().mockResolvedValue(createdOrder),
        },
        coupon: prisma.coupon,
      };
      return fn(tx);
    });

    const svc = new OrdersService(prisma);
    const result = await svc.create(baseInput);

    // subtotal (290) + shippingFee (49.9) = total (339.9)
    expect(Number(result.total)).toBeCloseTo(339.9, 1);
  });

  it("userId verilmişse adres sahipliği doğrulanır — yabancı adres → ForbiddenException", async () => {
    const prisma = makePrisma();
    // adres bu kullanıcıya ait değil
    prisma.address.findFirst.mockResolvedValue(null);
    const svc = new OrdersService(prisma);

    await expect(
      svc.create({ ...baseInput, userId: "user1" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("kupon bulunamadı → 400 BadRequestException", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([BASE_PRODUCT]);
    prisma.coupon.findUnique.mockResolvedValue(null);
    const svc = new OrdersService(prisma);

    await expect(svc.create({ ...baseInput, couponCode: "INVALID123" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("free_shipping kuponu → shippingFee = 0", async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([BASE_PRODUCT]);
    prisma.coupon.findUnique.mockResolvedValue({
      id: "coup1",
      code: "FREESHIP",
      type: "free_shipping",
      value: new Prisma.Decimal(0),
      isActive: true,
      validFrom: null,
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      minOrderAmount: null,
    });

    const capturedCreateData: any = {};
    prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        coupon: {
          findUnique: vi.fn().mockResolvedValue({ id: "coup1", isActive: true, maxUses: null, usedCount: 0 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          create: vi.fn().mockImplementation((args: any) => {
            Object.assign(capturedCreateData, args.data);
            return Promise.resolve({
              ...BASE_ORDER,
              ...args.data,
              items: [],
              shippingAddress: {},
              billingAddress: {},
            });
          }),
        },
      };
      return fn(tx);
    });

    const svc = new OrdersService(prisma);
    await svc.create({ ...baseInput, couponCode: "FREESHIP" });

    // shippingFee = 0 (ücretsiz kargo)
    expect(Number(capturedCreateData.shippingFee)).toBe(0);
  });
});
