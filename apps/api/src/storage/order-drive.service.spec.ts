import { describe, it, expect, vi } from "vitest";
import { OrderDriveService, klasorAcilmaliMi } from "./order-drive.service";

/**
 * OrderDriveService — ödeme kesinleşince Drive klasörü (2026-09-03).
 * Koruduğu kural (Hasan): klasör YALNIZ paymentStatus="basarili" siparişe açılır; Drive kapalıysa,
 * sipariş ödenmemişse veya Drive hata verirse hiçbir şey fırlamaz (ödeme akışı etkilenmez).
 */

function make(opts: { enabled?: boolean; order?: unknown; driveFails?: boolean } = {}) {
  const prisma = { order: { findUnique: vi.fn().mockResolvedValue(opts.order === undefined ? { orderNumber: "MK-9", paymentStatus: "basarili", user: { fullName: "Ayşe Yılmaz" }, shippingAddressSnapshot: null, billingAddressSnapshot: null } : opts.order) } };
  const drive = {
    enabled: opts.enabled ?? true,
    ensureOrderFolder: vi.fn().mockImplementation(() => (opts.driveFails ? Promise.reject(new Error("Drive 500")) : Promise.resolve("F1"))),
  };
  return { svc: new OrderDriveService(prisma as never, drive as never), prisma, drive };
}

describe("klasorAcilmaliMi", () => {
  it("yalnız Drive açık VE ödeme basarili ise", () => {
    expect(klasorAcilmaliMi({ enabled: true, paymentStatus: "basarili" })).toBe(true);
    expect(klasorAcilmaliMi({ enabled: true, paymentStatus: "beklemede" })).toBe(false);
    expect(klasorAcilmaliMi({ enabled: false, paymentStatus: "basarili" })).toBe(false);
    expect(klasorAcilmaliMi({ enabled: true, paymentStatus: null })).toBe(false);
  });
});

describe("OrderDriveService.klasorAc", () => {
  it("Drive kapalıysa DB'ye bile gitmez", async () => {
    const { svc, prisma, drive } = make({ enabled: false });
    expect(await svc.klasorAc("o1")).toBeNull();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
  });

  it("ödenmemiş (beklemede) siparişe klasör AÇMAZ", async () => {
    const { svc, drive } = make({ order: { orderNumber: "MK-1", paymentStatus: "beklemede", user: null, shippingAddressSnapshot: null, billingAddressSnapshot: null } });
    expect(await svc.klasorAc("o1")).toBeNull();
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
  });

  it("ödenmiş siparişte sipariş no + üye adıyla klasör açar", async () => {
    const { svc, drive } = make();
    expect(await svc.klasorAc("o1")).toBe("F1");
    expect(drive.ensureOrderFolder).toHaveBeenCalledWith("MK-9", "Ayşe Yılmaz");
  });

  it("misafir siparişte adı teslimat snapshot'ından alır", async () => {
    const { svc, drive } = make({ order: { orderNumber: "MK-2", paymentStatus: "basarili", user: null, shippingAddressSnapshot: { fullName: " Veli Can " }, billingAddressSnapshot: null } });
    await svc.klasorAc("o2");
    expect(drive.ensureOrderFolder).toHaveBeenCalledWith("MK-2", "Veli Can");
  });

  it("sipariş yoksa null, Drive'a gitmez", async () => {
    const { svc, drive } = make({ order: null });
    expect(await svc.klasorAc("yok")).toBeNull();
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
  });

  it("Drive hata verirse fırlatmaz, null döner (ödeme akışı etkilenmez)", async () => {
    const { svc } = make({ driveFails: true });
    await expect(svc.klasorAc("o1")).resolves.toBeNull();
  });
});
