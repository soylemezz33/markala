import { describe, it, expect, vi } from "vitest";
import { PaymentsService } from "./payments.service";

/**
 * ÖDEME EŞZAMANLILIK / IDEMPOTENCY testleri (audit batch-C).
 *
 * Kapsam:
 *  - Cari paydown callback (handlePaydownCallback, handleCallback → "caripay:" dalı):
 *    • Çift/yinelenen callback YALNIZCA BİR credit defter kaydı üretir (atomik claim, tx içinde).
 *    • Fazla-alacak engellenir: init↔callback arasında bakiye düştüyse tahsilat bakiyeyle kırpılır.
 *  - Sipariş callback (handleCallback): başarı işaretleme koşullu updateMany (idempotent) ile yapılır.
 *  - Reconcile: yalnız hâlâ "beklemede" siparişi koşullu updateMany ile kurtarır (yarış no-op).
 *
 * NOT: setInterval/setTimeout reconcile zamanlayıcısı onModuleInit'te kurulur; testlerde
 * onModuleInit çağrılmadığı için zamanlayıcı çalışmaz (yan etki yok).
 */

function makeConfig(map: Record<string, string> = {}) {
  return {
    get: vi.fn((k: string) => map[k] ?? (k === "WEB_ORIGIN" ? "http://web.test" : k === "JWT_SECRET" ? "s" : undefined)),
  };
}

function makeIyzico(retrieveResult: Record<string, unknown>) {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    retrieveCheckoutForm: vi.fn().mockResolvedValue(retrieveResult),
    initializeCheckoutForm: vi.fn(),
  };
}

describe("PaymentsService.handlePaydownCallback — cari tahsilat idempotency + fazla-alacak", () => {
  /** Paydown tx mock: updateMany claim + groupBy bakiye + ledger create. */
  function makePaydownTx(opts: { claimCount: number; debit: number; credit: number }) {
    return {
      corporatePayment: {
        updateMany: vi.fn().mockResolvedValue({ count: opts.claimCount }),
      },
      corporateLedgerEntry: {
        groupBy: vi.fn().mockResolvedValue([
          { kind: "debit", _sum: { amount: opts.debit } },
          { kind: "credit", _sum: { amount: opts.credit } },
        ]),
        create: vi.fn().mockResolvedValue({ id: "le1" }),
      },
    };
  }

  function makePrisma(payment: Record<string, unknown>, tx: ReturnType<typeof makePaydownTx>) {
    return {
      corporatePayment: {
        findUnique: vi.fn().mockResolvedValue(payment),
        update: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
      _tx: tx,
    };
  }

  const PAYMENT = { id: "pay1", userId: "u1", amount: 100, status: "pending" };
  const SUCCESS = (id = "pay1", amount = 100) => ({
    status: "success",
    conversationId: `caripay:${id}`,
    price: amount,
    basketId: `CARI-${id}`,
    paymentId: "iyz-123",
  });

  it("başarılı tahsilat: claim kazanır → tek credit kaydı oluşur (atomik, tx içinde)", async () => {
    // Mevcut borç 100, tahsilat 100 → tam ödeme, kırpma yok.
    const tx = makePaydownTx({ claimCount: 1, debit: 100, credit: 0 });
    const prisma = makePrisma({ ...PAYMENT }, tx);
    const svc = new PaymentsService(prisma as never, makeIyzico(SUCCESS()) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.handleCallback("tok");

    expect(res.redirectUrl).toContain("odeme=basarili");
    expect(tx.corporatePayment.updateMany).toHaveBeenCalledOnce();
    expect(tx.corporateLedgerEntry.create).toHaveBeenCalledOnce();
    expect(Number(tx.corporateLedgerEntry.create.mock.calls[0][0].data.amount)).toBeCloseTo(100, 2);
    // claim + credit aynı $transaction içinde (çift-callback / kısmi-yazma koruması).
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("YİNELENEN callback (claim count===0) → credit kaydı OLUŞMAZ (idempotent)", async () => {
    // İkinci/duplike callback: updateMany 0 satır (zaten 'paid') → no-op.
    const tx = makePaydownTx({ claimCount: 0, debit: 0, credit: 100 });
    const prisma = makePrisma({ ...PAYMENT, status: "paid" }, tx);
    const svc = new PaymentsService(prisma as never, makeIyzico(SUCCESS()) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.handleCallback("tok");

    expect(res.redirectUrl).toContain("odeme=basarili");
    expect(tx.corporatePayment.updateMany).toHaveBeenCalledOnce();
    // KRİTİK: çift callback → İKİNCİ credit YOK.
    expect(tx.corporateLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("fazla-alacak engellenir: init↔callback arasında borç düştüyse tahsilat bakiyeyle kırpılır", async () => {
    // Init'te borç 100 idi, tahsilat 100 başlatıldı. Callback'te bakiye yalnız 40 (admin 60 manuel tahsil etti).
    // → credit 100 değil 40 (bakiye 0'ın altına inmez).
    const tx = makePaydownTx({ claimCount: 1, debit: 100, credit: 60 }); // bakiye = 40
    const prisma = makePrisma({ ...PAYMENT, amount: 100 }, tx);
    const svc = new PaymentsService(prisma as never, makeIyzico(SUCCESS("pay1", 100)) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    await svc.handleCallback("tok");

    expect(tx.corporateLedgerEntry.create).toHaveBeenCalledOnce();
    const credited = Number(tx.corporateLedgerEntry.create.mock.calls[0][0].data.amount);
    expect(credited).toBeCloseTo(40, 2); // 100 değil — bakiyeyle kırpıldı
  });

  it("borç tamamen kapanmışsa (bakiye 0) credit kaydı atlanır (negatif bakiye önlenir)", async () => {
    const tx = makePaydownTx({ claimCount: 1, debit: 100, credit: 100 }); // bakiye = 0
    const prisma = makePrisma({ ...PAYMENT, amount: 100 }, tx);
    const svc = new PaymentsService(prisma as never, makeIyzico(SUCCESS("pay1", 100)) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    await svc.handleCallback("tok");

    // Kırpma 0 → credit yazılmaz (fazla-alacak/negatif bakiye yok).
    expect(tx.corporateLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("tutar uyuşmazlığı (price≠amount) → hata, claim/credit hiç çalışmaz", async () => {
    const tx = makePaydownTx({ claimCount: 1, debit: 100, credit: 0 });
    const prisma = makePrisma({ ...PAYMENT, amount: 100 }, tx);
    // price 999 ≠ beklenen 100 → doğrulama başarısız.
    const svc = new PaymentsService(prisma as never, makeIyzico(SUCCESS("pay1", 999)) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.handleCallback("tok");
    expect(res.redirectUrl).toContain("odeme=hata");
    expect(tx.corporatePayment.updateMany).not.toHaveBeenCalled();
    expect(tx.corporateLedgerEntry.create).not.toHaveBeenCalled();
  });
});

describe("PaymentsService.handleCallback — sipariş ödemesi idempotency (koşullu updateMany)", () => {
  function makeOrderPrisma(order: Record<string, unknown>) {
    return {
      order: {
        findUnique: vi.fn().mockResolvedValue(order),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
  }

  const ORDER = { id: "ord1", paymentStatus: "beklemede", orderNumber: "MK-1", total: 200 };
  const OK = {
    status: "success",
    conversationId: "ord1",
    price: 200,
    paidPrice: 200,
    basketId: "MK-1",
    paymentId: "iyz-9",
  };

  it("başarı: koşullu updateMany (paymentStatus≠basarili) ile işaretler → idempotent", async () => {
    const prisma = makeOrderPrisma({ ...ORDER });
    const svc = new PaymentsService(prisma as never, makeIyzico(OK) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.handleCallback("tok");

    expect(res.redirectUrl).toContain("/odeme/basarili/ord1");
    expect(prisma.order.updateMany).toHaveBeenCalledOnce();
    const where = prisma.order.updateMany.mock.calls[0][0].where;
    // Lost-update koruması: yalnız henüz "basarili" OLMAYAN sipariş güncellenir.
    expect(where).toMatchObject({ id: "ord1", paymentStatus: { not: "basarili" } });
    // Eski koşulsuz update KULLANILMAZ.
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("başarısız ödeme: koşullu updateMany (paymentStatus=beklemede) ile işaretler", async () => {
    const prisma = makeOrderPrisma({ ...ORDER });
    const failResult = { ...OK, status: "failure", paymentStatus: "FAILURE", errorCode: "10", errorMessage: "red" };
    const svc = new PaymentsService(prisma as never, makeIyzico(failResult) as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    await svc.handleCallback("tok");

    expect(prisma.order.updateMany).toHaveBeenCalledOnce();
    const call = prisma.order.updateMany.mock.calls[0][0];
    // Eşzamanlı başarı callback'ini ezmemek için where'de beklemede guard'ı var.
    expect(call.where).toMatchObject({ id: "ord1", paymentStatus: "beklemede" });
    expect(call.data).toMatchObject({ paymentStatus: "basarisiz" });
  });
});

describe("PaymentsService.reconcilePendingPayments — kurtarma yarışı (koşullu updateMany)", () => {
  it("yalnız hâlâ 'beklemede' siparişi kurtarır; callback önce işlediyse (count=0) no-op", async () => {
    const pendingOrder = { id: "ord1", orderNumber: "MK-1", total: 200, iyzicoCheckoutToken: "tok" };
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([pendingOrder]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // callback çoktan işledi
      },
    };
    const iyzico = makeIyzico({
      status: "success",
      basketId: "MK-1",
      price: 200,
      paymentId: "iyz-1",
    });
    const svc = new PaymentsService(prisma as never, iyzico as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.reconcilePendingPayments();

    // updateMany koşulu beklemede guard'lı.
    const where = prisma.order.updateMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ id: "ord1", paymentStatus: "beklemede" });
    // count=0 → kurtarılmış sayılmaz (çift-işleme yok).
    expect(res.recovered).toBe(0);
  });

  it("beklemede sipariş gerçekten kurtarılır (count=1)", async () => {
    const pendingOrder = { id: "ord1", orderNumber: "MK-1", total: 200, iyzicoCheckoutToken: "tok" };
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([pendingOrder]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const iyzico = makeIyzico({
      status: "success",
      basketId: "MK-1",
      price: 200,
      paymentId: "iyz-1",
    });
    const svc = new PaymentsService(prisma as never, iyzico as never, makeConfig() as never, { sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true) } as never, { sendPurchase: vi.fn().mockResolvedValue(undefined) } as never);

    const res = await svc.reconcilePendingPayments();
    expect(res.recovered).toBe(1);
  });
});
