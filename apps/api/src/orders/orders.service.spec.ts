import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { OrdersService, validStatusTransitions } from "./orders.service";

// ─── Prisma mock factory ────────────────────────────────────────────────────

function makeProduct(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "prod-1",
    slug: "klasik-kartvizit",
    name: "Klasik Kartvizit",
    basePrice: { toNumber: () => 290, valueOf: () => 290 } as any,
    images: ["/kartvizit.jpg"],
    isActive: true,
    ...over,
  };
}

function makePrisma(over: Partial<Record<string, unknown>> = {}) {
  return {
    order: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "order-1", orderNumber: "MK-TEST-0001" }),
      update: vi.fn().mockResolvedValue({ id: "order-1", status: "uretimde" }),
    },
    address: {
      findFirst: vi.fn().mockResolvedValue({ id: "addr-1", userId: "user-1" }),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([makeProduct()]),
      findUnique: vi.fn().mockResolvedValue(makeProduct()),
    },
    coupon: {
      findUnique: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn().mockImplementation((fn) =>
      fn({
        coupon: { findUnique: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        order: { create: vi.fn().mockResolvedValue({ id: "order-1", items: [], shippingAddress: {}, billingAddress: {} }) },
      }),
    ),
    ...over,
  } as any;
}

const baseInput = {
  userId: "user-1",
  email: "test@markala.test",
  phone: "05551234567",
  items: [{ productId: "prod-1", configuration: { adet: 1000 }, quantity: 1 }],
  shippingAddressId: "addr-1",
  billingAddressId: "addr-1",
};

// ─── validStatusTransitions (pure, no Prisma) ───────────────────────────────

describe("validStatusTransitions", () => {
  it("siparis-alindi → uretimde izinli", () => {
    expect(validStatusTransitions["siparis-alindi"]).toContain("uretimde");
  });

  it("siparis-alindi → teslim-edildi YASAK", () => {
    expect(validStatusTransitions["siparis-alindi"]).not.toContain("teslim-edildi");
  });

  it("teslim-edildi → herhangi bir durum YASAK (terminal)", () => {
    expect(validStatusTransitions["teslim-edildi"]).toHaveLength(0);
  });

  it("iptal-edildi → herhangi bir durum YASAK (terminal)", () => {
    expect(validStatusTransitions["iptal-edildi"]).toHaveLength(0);
  });

  it("kargoya-verildi → sadece teslim-edildi", () => {
    expect(validStatusTransitions["kargoya-verildi"]).toEqual(["teslim-edildi"]);
  });

  it("tüm kaynak durumların hedefleri de tanımlı durumlardır", () => {
    const allStates = new Set(Object.keys(validStatusTransitions));
    for (const [, targets] of Object.entries(validStatusTransitions)) {
      for (const t of targets) {
        expect(allStates.has(t), `"${t}" hedef durumu matriste tanımlı değil`).toBe(true);
      }
    }
  });
});

// ─── OrdersService.create ────────────────────────────────────────────────────

describe("OrdersService.create", () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma);
    vi.restoreAllMocks();
  });

  it("boş items → BadRequestException", async () => {
    await expect(service.create({ ...baseInput, items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("aktif olmayan ürün → BadRequestException", async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await expect(service.create(baseInput)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("userId varsa adres IDOR koruması — yabancı adres → ForbiddenException", async () => {
    prisma.address.findFirst.mockResolvedValue(null);
    await expect(service.create(baseInput)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("idempotency key eşleşirse mevcut sipariş geri döner (yeni yaratılmaz)", async () => {
    const existingOrder = { id: "existing-order", items: [], shippingAddress: {}, billingAddress: {} };
    prisma.order.findFirst.mockResolvedValue(existingOrder);
    const result = await service.create({ ...baseInput, idempotencyKey: "key-abc" });
    expect(result).toBe(existingOrder);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("başarılı sipariş: transaction çağrılır", async () => {
    await service.create(baseInput);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("konfigürasyondaki adet quantity olarak kullanılır (baseQty override)", async () => {
    const tx = { order: { create: vi.fn().mockResolvedValue({ id: "o1", items: [] }) }, coupon: { findUnique: vi.fn(), updateMany: vi.fn() } };
    prisma.$transaction.mockImplementation((fn: Function) => fn(tx));
    await service.create({ ...baseInput, items: [{ productId: "prod-1", configuration: { adet: 5000 }, quantity: 1 }] });
    const createCall = tx.order.create.mock.calls[0][0];
    const item = createCall.data.items.create[0];
    expect(item.quantity).toBe(5000);
  });

  it("userId yoksa adres kontrolü yapılmaz (misafir sipariş)", async () => {
    prisma.address.findFirst.mockResolvedValue(null);
    const guestInput = { ...baseInput, userId: undefined };
    await expect(service.create(guestInput)).resolves.toBeDefined();
  });
});

// ─── OrdersService.updateStatus ──────────────────────────────────────────────

describe("OrdersService.updateStatus", () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma);
  });

  it("mevcut olmayan sipariş → NotFoundException", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus("no-order", "uretimde")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("geçersiz geçiş → BadRequestException", async () => {
    prisma.order.findUnique.mockResolvedValue({ status: "teslim-edildi" });
    await expect(service.updateStatus("o1", "siparis-alindi")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("geçerli geçiş → update çağrılır", async () => {
    prisma.order.findUnique.mockResolvedValue({ status: "siparis-alindi" });
    await service.updateStatus("o1", "uretimde");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "o1" }, data: expect.objectContaining({ status: "uretimde" }) }),
    );
  });

  it("kargoya-verildi durumuna geçince shippedAt set edilir", async () => {
    prisma.order.findUnique.mockResolvedValue({ status: "uretimde" });
    await service.updateStatus("o1", "kargoya-verildi");
    const updateData = prisma.order.update.mock.calls[0][0].data;
    expect(updateData).toHaveProperty("shippedAt");
  });

  it("teslim-edildi durumuna geçince deliveredAt set edilir", async () => {
    prisma.order.findUnique.mockResolvedValue({ status: "kargoya-verildi" });
    await service.updateStatus("o1", "teslim-edildi");
    const updateData = prisma.order.update.mock.calls[0][0].data;
    expect(updateData).toHaveProperty("deliveredAt");
  });

  it("aynı durum → geçiş matrisi bypass edilir, update çağrılır", async () => {
    prisma.order.findUnique.mockResolvedValue({ status: "uretimde" });
    await service.updateStatus("o1", "uretimde");
    expect(prisma.order.update).toHaveBeenCalled();
  });
});

// ─── OrdersService.findById ───────────────────────────────────────────────────

describe("OrdersService.findById", () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma);
  });

  it("mevcut olmayan sipariş → NotFoundException", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.findById("no-id")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("başka kullanıcının siparişi → ForbiddenException", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user-2", items: [] });
    await expect(service.findById("o1", "user-1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("kendi siparişi → döner", async () => {
    const order = { id: "o1", userId: "user-1", items: [] };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(service.findById("o1", "user-1")).resolves.toBe(order);
  });

  it("userId verilmezse (admin view) herhangi bir sipariş döner", async () => {
    const order = { id: "o1", userId: "user-99", items: [] };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(service.findById("o1")).resolves.toBe(order);
  });
});
