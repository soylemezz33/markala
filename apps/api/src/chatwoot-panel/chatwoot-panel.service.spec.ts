import { describe, it, expect, vi } from "vitest";
import { ChatwootPanelService, phoneKey } from "./chatwoot-panel.service";

/**
 * Bu testlerin koruduğu şey: panel ajanın ekranında YANLIŞ müşteriyi göstermesin ve
 * gösterimlik alanlar (kargo linki, müşteri notu, cari bakiye) sessizce bozulmasın.
 * Uç salt okunur olduğu için risk "veri bozma" değil, "yanlış bilgiyle müşteriye konuşma".
 */

const USER = {
  id: "u1",
  full_name: "Ahmet Yılmaz",
  email: "ahmet@example.com",
  phone: "+90 505 741 70 28",
  account_type: "individual",
  corporate_status: "none",
  company_name: null,
  corporate_discount: null,
  corporate_credit_limit: null,
  corporate_payment_term_days: null,
  loyalty_points: 120,
  created_at: new Date("2026-03-01T10:00:00Z"),
};

const ORDER = {
  id: "o1",
  orderNumber: "MK-2026-0001",
  createdAt: new Date("2026-09-20T08:00:00Z"),
  status: "kargoya_verildi",
  paymentStatus: "basarili",
  paymentMethod: "iyzico",
  paymentErrorMessage: null,
  total: 3480,
  userId: "u1",
  notes: "Kapıda arayın [[idem:abc123]]",
  trackingCarrier: "Yurtiçi Kargo",
  trackingNumber: "1234567890",
  shippedAt: new Date("2026-09-22T08:00:00Z"),
  deliveredAt: null,
  invoiceNumber: "MRK2026000000123",
  invoiceIssuedAt: new Date("2026-09-22T09:00:00Z"),
  shippingAddressSnapshot: { city: "Mersin", district: "Yenişehir" },
  shippingAddress: null,
  items: [
    {
      productName: "Klasik Kartvizit",
      quantity: 1000,
      configurationSummary: "EKO · 5 paket",
      needsDesignSupport: false,
      uploadedFileName: "tasarim.pdf",
      uploadedFileUrl: "https://api.markala.com.tr/uploads/x.pdf",
    },
  ],
  designUploads: [
    {
      kind: "onizleme",
      fileName: "prova.jpg",
      fileUrl: "https://api.markala.com.tr/uploads/prova.jpg",
      createdAt: new Date("2026-09-21T08:00:00Z"),
    },
  ],
  internalNotes: [
    {
      authorName: "Merve",
      body: "Müşteri acele ediyor",
      createdAt: new Date("2026-09-21T09:00:00Z"),
    },
  ],
};

/** $queryRaw sırası: (1) users, (2) sipariş id'leri, (3) toplam sayı. */
function prismaMock(
  opts: {
    users?: unknown[];
    ids?: { id: string }[];
    total?: number;
    orders?: unknown[];
    ledger?: unknown[];
    invoice?: unknown;
  } = {},
) {
  const ids = opts.ids ?? [];
  const queryRaw = vi
    .fn()
    .mockResolvedValueOnce(opts.users ?? [])
    .mockResolvedValueOnce(ids)
    .mockResolvedValueOnce([{ n: opts.total ?? ids.length }]);
  return {
    $queryRaw: queryRaw,
    order: { findMany: vi.fn().mockResolvedValue(opts.orders ?? []) },
    corporateLedgerEntry: { groupBy: vi.fn().mockResolvedValue(opts.ledger ?? []) },
    corporateMonthlyInvoice: { findFirst: vi.fn().mockResolvedValue(opts.invoice ?? null) },
  } as never;
}

/** Servis 3 bağımlılık alıyor; okuma testleri auth/jwt'ye hiç dokunmaz. */
function servis(prisma: unknown, ek?: { auth?: unknown; jwt?: unknown }) {
  return new ChatwootPanelService(
    prisma as never,
    (ek?.auth ?? { login: vi.fn() }) as never,
    (ek?.jwt ?? { sign: vi.fn(() => "imzali.jwt.token") }) as never,
  );
}

describe("phoneKey", () => {
  it("biçimden bağımsız son 10 haneye indirir", () => {
    expect(phoneKey("+90 505 741 70 28")).toBe("5057417028");
    expect(phoneKey("0505-741-70-28")).toBe("5057417028");
    expect(phoneKey("905057417028")).toBe("5057417028");
  });

  it("anlamsız/kısa girdide null döner (tüm müşterileri eşleştirmesin)", () => {
    expect(phoneKey("")).toBeNull();
    expect(phoneKey(null)).toBeNull();
    expect(phoneKey("merhaba")).toBeNull();
    expect(phoneKey("12345")).toBeNull(); // 7 haneden kısa
  });
});

describe("ChatwootPanelService.lookup", () => {
  it("telefon çözülemezse DB'ye hiç gitmez", async () => {
    const prisma = prismaMock();
    const out = await servis(prisma).lookup("yok");
    expect(out.found).toBe(false);
    expect(out.phoneKey).toBeNull();
    expect(
      (prisma as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw,
    ).not.toHaveBeenCalled();
  });

  it("kayıt/sipariş yoksa found=false döner", async () => {
    const out = await servis(prismaMock()).lookup("905057417028");
    expect(out.found).toBe(false);
    expect(out.orders.items).toEqual([]);
  });

  it("müşteri + siparişi eşler; kargo linki, müşteri notu ve prova dosyasını üretir", async () => {
    const prisma = prismaMock({
      users: [USER],
      ids: [{ id: "o1" }],
      total: 7,
      orders: [ORDER],
    });
    const out = await servis(prisma).lookup("+90 (505) 741 70 28");

    expect(out.found).toBe(true);
    expect(out.phoneKey).toBe("5057417028");
    expect(out.customers[0]).toMatchObject({ name: "Ahmet Yılmaz", loyaltyPoints: 120 });
    // Toplam, gösterilen 5 kalemden bağımsız okunur — ajan "7 siparişten son 1'i" görür.
    expect(out.orders.total).toBe(7);

    const o = out.orders.items[0];
    expect(o.orderNumber).toBe("MK-2026-0001");
    expect(o.isGuest).toBe(false);
    // [[idem:...]] etiketi ajana gösterilmez; kolonun kendisine dokunulmaz.
    expect(o.customerNote).toBe("Kapıda arayın");
    expect(o.ship.trackingUrl).toContain("yurticikargo.com");
    expect(o.ship.trackingUrl).toContain("1234567890");
    // FK yok → snapshot'tan şehir/ilçe okunur (misafir/storefront siparişleri).
    expect(o.ship.city).toBe("Mersin");
    expect(o.proofs[0]).toMatchObject({ kind: "onizleme", fileName: "prova.jpg" });
    expect(o.invoice.number).toBe("MRK2026000000123");
    expect(o.internalNotes[0].authorName).toBe("Merve");
  });

  it("bilinmeyen kargo firmasında link üretmez (yanlış siteye yönlendirmez)", async () => {
    const prisma = prismaMock({
      users: [USER],
      ids: [{ id: "o1" }],
      orders: [{ ...ORDER, trackingCarrier: "Kendi aracımız", trackingNumber: "55" }],
    });
    const out = await servis(prisma).lookup("905057417028");
    expect(out.orders.items[0].ship.trackingNumber).toBe("55");
    expect(out.orders.items[0].ship.trackingUrl).toBeNull();
  });

  it("başarısız ödemede hata mesajını taşır, başarılıda taşımaz", async () => {
    const hata = { ...ORDER, paymentStatus: "basarisiz", paymentErrorMessage: "Yetersiz bakiye" };
    const out1 = await servis(
      prismaMock({ users: [USER], ids: [{ id: "o1" }], orders: [hata] }),
    ).lookup("905057417028");
    expect(out1.orders.items[0].paymentError).toBe("Yetersiz bakiye");

    const out2 = await servis(
      prismaMock({
        users: [USER],
        ids: [{ id: "o1" }],
        orders: [{ ...ORDER, paymentErrorMessage: "eski hata" }],
      }),
    ).lookup("905057417028");
    expect(out2.orders.items[0].paymentError).toBeNull();
  });

  it("hesabı olmayan telefonda misafir siparişlerini gösterir", async () => {
    const prisma = prismaMock({
      users: [],
      ids: [{ id: "o1" }],
      orders: [{ ...ORDER, userId: null }],
    });
    const out = await servis(prisma).lookup("905057417028");
    expect(out.found).toBe(true);
    expect(out.customers).toEqual([]);
    expect(out.orders.items[0].isGuest).toBe(true);
  });

  it("onaylı kurumsal müşteride cari bakiyeyi borç−alacak olarak hesaplar", async () => {
    const prisma = prismaMock({
      users: [
        {
          ...USER,
          account_type: "corporate",
          corporate_status: "approved",
          company_name: "Örnek A.Ş.",
          corporate_credit_limit: 50000,
          corporate_payment_term_days: 30,
          corporate_discount: 10,
        },
      ],
      ids: [],
      ledger: [
        { kind: "debit", _sum: { amount: 12500.5 } },
        { kind: "credit", _sum: { amount: 2500.25 } },
      ],
      invoice: { period: "2026-08", totalAmount: 9800, orderCount: 4, status: "pending" },
    });
    const out = await servis(prisma).lookup("905057417028");
    expect(out.corporate).toMatchObject({
      companyName: "Örnek A.Ş.",
      balance: 10000.25,
      creditLimit: 50000,
      paymentTermDays: 30,
      discount: 10,
    });
    expect(out.corporate?.lastInvoice).toMatchObject({ period: "2026-08", orderCount: 4 });
  });

  it("kurumsal onaylı değilse cari bölümü çıkmaz", async () => {
    const prisma = prismaMock({
      users: [{ ...USER, account_type: "corporate", corporate_status: "pending" }],
      ids: [],
    });
    const out = await servis(prisma).lookup("905057417028");
    expect(out.corporate).toBeNull();
  });
});

describe("ChatwootPanelService.oturumAc", () => {
  const PANELCI = { id: "u9", email: "tasarimci@markala.com.tr", role: "tasarimci" };

  it("panel kullanıcısına token verir ve izinlerini döner", async () => {
    const auth = { login: vi.fn().mockResolvedValue({ user: PANELCI }) };
    const jwt = { sign: vi.fn(() => "tok123") };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ fullName: "Oğuzhan Ateş" }) },
    };
    const out = await servis(prisma, { auth, jwt }).oturumAc(
      "tasarimci@markala.com.tr",
      "sifre",
      {},
    );

    expect(out.token).toBe("tok123");
    expect(out.kullanici).toMatchObject({ ad: "Oğuzhan Ateş", rol: "tasarimci" });
    // Panel arayüzü düğmeleri buna göre çiziyor; gerçek sınır uçlardaki RolesGuard.
    expect(out.kullanici.izinler).toContain("orders.read");
    // Token payload'ı standart access token ile aynı olmalı, yoksa JwtStrategy reddeder.
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: "u9", email: PANELCI.email, role: "tasarimci" }),
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
  });

  it("MÜŞTERİ hesabına panel token'ı vermez", async () => {
    const auth = {
      login: vi.fn().mockResolvedValue({ user: { id: "c1", email: "m@x.com", role: "customer" } }),
    };
    const jwt = { sign: vi.fn() };
    await expect(
      servis({ user: { findUnique: vi.fn() } }, { auth, jwt }).oturumAc("m@x.com", "sifre", {}),
    ).rejects.toThrow(/panel kullanıcısı değil/i);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("şifre yanlışsa AuthService'in hatası olduğu gibi yükselir (kendi kapımızı açmayız)", async () => {
    const auth = { login: vi.fn().mockRejectedValue(new Error("Geçersiz e-posta veya şifre.")) };
    const jwt = { sign: vi.fn() };
    await expect(
      servis({ user: { findUnique: vi.fn() } }, { auth, jwt }).oturumAc("a@b.c", "yanlis", {}),
    ).rejects.toThrow("Geçersiz e-posta veya şifre.");
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
