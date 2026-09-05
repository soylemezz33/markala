import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  KargoTakipService,
  teslimSayilirMi,
  TARAMA_GUN,
  TUR_TAVANI,
} from "./kargo-takip.service";
import type { DhlTrackingResult } from "../integrations/dhl/dhl.service";

/**
 * Kargo teslim taraması (2026-09-05, Hasan: "kargo ulaştı mı bilmediğimiz için teslim
 * edildi e-postası atamıyoruz").
 *
 * Bu testlerin koruduğu asıl şey: sipariş YALNIZ taşıyıcının kesin "teslim edildi"
 * kaydında kapanır. Yanlış bir "teslim edildi", müşteriye erken e-posta ve 24 saat sonra
 * yorum daveti demek — bir gün geç göndermek buna yeğdir.
 */
const takip = (status: DhlTrackingResult["status"]): DhlTrackingResult => ({
  trackingNumber: "TR123",
  status,
  events: [],
});

function make(opts: { adaylar?: unknown[]; takipSonuc?: DhlTrackingResult | null; takipHata?: boolean; anahtar?: boolean } = {}) {
  const prisma = {
    order: { findMany: vi.fn().mockResolvedValue(opts.adaylar ?? []) },
  };
  const dhl = {
    takipYapilabilir: vi.fn().mockReturnValue(opts.anahtar ?? true),
    trackShipment: vi.fn().mockImplementation(() =>
      opts.takipHata ? Promise.reject(new Error("DHL 503")) : Promise.resolve(opts.takipSonuc ?? null),
    ),
  };
  const orders = { updateStatus: vi.fn().mockResolvedValue({}) };
  const svc = new KargoTakipService(prisma as never, dhl as never, orders as never);
  return { svc, prisma, dhl, orders };
}

const siparis = (i = 1) => ({ id: `o${i}`, orderNumber: `MK-${i}`, trackingNumber: `TR${i}` });

describe("teslimSayilirMi", () => {
  it("yalnız kesin 'delivered' teslim sayılır", () => {
    expect(teslimSayilirMi(takip("delivered"))).toBe(true);
  });

  it("yolda olan hiçbir durum teslim SAYILMAZ", () => {
    for (const s of ["in-transit", "pre-transit", "failure", "unknown"] as const) {
      expect(teslimSayilirMi(takip(s))).toBe(false);
    }
  });

  it("takip bulunamazsa (null) teslim sayılmaz", () => {
    expect(teslimSayilirMi(null)).toBe(false);
  });
});

describe("KargoTakipService.tara", () => {
  beforeEach(() => vi.clearAllMocks());

  it("teslim edilmiş siparişi updateStatus ÜZERİNDEN kapatır (mail/denetim aynı yoldan)", async () => {
    const { svc, orders } = make({ adaylar: [siparis()], takipSonuc: takip("delivered") });
    const ozet = await svc.tara();
    expect(ozet).toMatchObject({ bakilan: 1, teslim: 1, hata: 0 });
    expect(orders.updateStatus).toHaveBeenCalledWith(
      "o1",
      "teslim-edildi",
      undefined,
      expect.objectContaining({ ipAddress: "kargo-taramasi" }),
    );
  });

  it("yoldaki siparişe DOKUNMAZ", async () => {
    const { svc, orders } = make({ adaylar: [siparis()], takipSonuc: takip("in-transit") });
    const ozet = await svc.tara();
    expect(ozet.teslim).toBe(0);
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("bir siparişte hata diğerlerini DURDURMAZ", async () => {
    const { svc, dhl, orders } = make({ adaylar: [siparis(1), siparis(2)] });
    dhl.trackShipment
      .mockRejectedValueOnce(new Error("DHL 503"))
      .mockResolvedValueOnce(takip("delivered"));
    const ozet = await svc.tara();
    expect(ozet).toMatchObject({ bakilan: 2, teslim: 1, hata: 1 });
    expect(orders.updateStatus).toHaveBeenCalledTimes(1);
  });

  it("DHL anahtarı yoksa hiç sorgu yapmaz", async () => {
    const { svc, dhl, orders } = make({ anahtar: false, adaylar: [siparis()] });
    const ozet = await svc.tara();
    expect(ozet).toMatchObject({ bakilan: 0, teslim: 0 });
    expect(dhl.trackShipment).not.toHaveBeenCalled();
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("yalnız kargodaki, takip nolu, silinmemiş ve SON 45 GÜNDEKİ siparişleri sorgular", async () => {
    const { svc, prisma } = make();
    await svc.tara();
    const where = prisma.order.findMany.mock.calls[0]![0].where;
    expect(where).toMatchObject({
      status: "kargoya_verildi",
      deletedAt: null,
      trackingNumber: { not: null },
    });
    // Eski/kayıp numaralar sonsuza kadar sorgulanıp kotayı yemesin.
    const sinir = where.shippedAt.gte as Date;
    const gun = Math.round((Date.now() - sinir.getTime()) / 86_400_000);
    expect(gun).toBe(TARAMA_GUN);
    expect(prisma.order.findMany.mock.calls[0]![0].take).toBe(TUR_TAVANI);
  });

  it("cron düşerse istisna DIŞARI SIZMAZ (uygulama etkilenmez)", async () => {
    const { svc, prisma } = make();
    prisma.order.findMany.mockRejectedValue(new Error("DB yok"));
    await expect(svc.gunlukTarama()).resolves.toBeUndefined();
  });
});
