import { describe, it, expect, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrderDesignService, tasarimYuklemeKontrol, ONIZLEME_MAX_BYTES, driveDosyaAdi } from "./order-design.service";

/**
 * Sipariş satırına tasarımcı dosyası (2026-09-02, üretim ARGE Faz 2).
 *
 * Bu testler ÜÇ garantiyi çakıyor:
 *  1) Kural kontrolü diske yazmadan ÖNCE çalışır — reddedilen dosya yetim kalmaz.
 *  2) Sahiplik: kalem başka siparişe aitse hiçbir şey yazılmaz (404).
 *  3) Panele dönen satırda storageKey/driveFileId YOKTUR (iç alanlar sızmaz).
 */

const dosya = (ad: string, mime: string, boyut = 1024) => ({
  buffer: Buffer.alloc(boyut),
  mimetype: mime,
  originalname: ad,
});

describe("tasarimYuklemeKontrol (saf kural)", () => {
  const ok = { kind: "calisma", originalName: "a.psd", mimetype: "application/octet-stream", size: 10, orderStatus: "uretimde" };

  it("iptal edilmiş siparişe yüklenemez", () => {
    expect(tasarimYuklemeKontrol({ ...ok, orderStatus: "iptal_edildi" })).toMatch(/İptal/);
  });
  it("bilinmeyen tür reddedilir", () => {
    expect(tasarimYuklemeKontrol({ ...ok, kind: "foo" })).toMatch(/Geçersiz/);
  });
  it("önizleme yalnız JPG/PNG — PDF, TIFF ve yanlış mimetype reddedilir", () => {
    expect(tasarimYuklemeKontrol({ ...ok, kind: "onizleme", originalName: "a.pdf", mimetype: "application/pdf" })).toMatch(/JPG\/PNG/);
    expect(tasarimYuklemeKontrol({ ...ok, kind: "onizleme", originalName: "a.tif", mimetype: "image/tiff" })).toMatch(/JPG\/PNG/);
    // uzantı jpg ama içerik tipi değil → yine ret (uzantı tek başına güvenilmez)
    expect(tasarimYuklemeKontrol({ ...ok, kind: "onizleme", originalName: "a.jpg", mimetype: "application/pdf" })).toMatch(/JPG\/PNG/);
  });
  it("önizleme 2 MB sınırı — tam sınır geçer, bir bayt fazlası düşer", () => {
    const base = { ...ok, kind: "onizleme", originalName: "a.jpg", mimetype: "image/jpeg" };
    expect(tasarimYuklemeKontrol({ ...base, size: ONIZLEME_MAX_BYTES })).toBeNull();
    expect(tasarimYuklemeKontrol({ ...base, size: ONIZLEME_MAX_BYTES + 1 })).toMatch(/2 MB/);
  });
  it("çalışma PSD ve baskı PDF geçer", () => {
    expect(tasarimYuklemeKontrol(ok)).toBeNull();
    expect(tasarimYuklemeKontrol({ ...ok, kind: "baski", originalName: "a.pdf", mimetype: "application/pdf" })).toBeNull();
  });
});

function makeService(opts: { item?: unknown; createFails?: boolean; existing?: unknown; drive?: boolean; driveFails?: boolean } = {}) {
  const row = {
    id: "up1", kind: "onizleme", fileName: "a.jpg", fileSize: 1024, fileUrl: "https://api/uploads/design/k.jpg",
    mimeType: "image/jpeg", createdAt: new Date("2026-09-02"), user: { id: "u1", fullName: "Tasarımcı" },
    storageKey: "SIZMAMALI", driveFileId: "SIZMAMALI",
  };
  const prisma = {
    orderItem: { findFirst: vi.fn().mockResolvedValue(opts.item === undefined ? { id: "it1", order: { status: "uretimde" } } : opts.item) },
    designUpload: {
      create: vi.fn().mockImplementation(() => (opts.createFails ? Promise.reject(new Error("db down")) : Promise.resolve(row))),
      findFirst: vi.fn().mockResolvedValue(opts.existing === undefined ? { id: "up1", orderItemId: "it1", kind: "baski", fileName: "a.pdf", storageKey: "k.pdf" } : opts.existing),
      delete: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...row, ...data })),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const storage = {
    putDesign: vi.fn().mockResolvedValue({ url: "https://api/uploads/design/k.jpg", key: "k.jpg", fileName: "a.jpg", fileSize: 1024 }),
    deleteDesign: vi.fn().mockResolvedValue(undefined),
  };
  const drive = {
    enabled: opts.drive ?? false,
    ensureOrderFolder: vi.fn().mockResolvedValue("FOLDER"),
    uploadFile: vi.fn().mockImplementation(() =>
      opts.driveFails ? Promise.reject(new Error("drive 403")) : Promise.resolve({ id: "DRV1", webViewLink: "https://drive.google.com/file/d/DRV1/view" }),
    ),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
  const svc = new OrderDesignService(prisma as never, storage as never, drive as never);
  return { svc, prisma, storage, drive };
}

const actor = { actorId: "u1", ipAddress: "127.0.0.1" };

describe("OrderDesignService.add", () => {
  it("kural reddederse diske YAZMAZ (yetim dosya yok)", async () => {
    const { svc, storage, prisma } = makeService();
    await expect(svc.add("o1", "it1", "onizleme", dosya("a.pdf", "application/pdf"), actor)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.putDesign).not.toHaveBeenCalled();
    expect(prisma.designUpload.create).not.toHaveBeenCalled();
  });

  it("kalem başka siparişe aitse 404, hiçbir şey yazılmaz", async () => {
    const { svc, storage, prisma } = makeService({ item: null });
    await expect(svc.add("o1", "yabanci", "calisma", dosya("a.psd", "application/octet-stream"), actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.putDesign).not.toHaveBeenCalled();
    expect(prisma.designUpload.create).not.toHaveBeenCalled();
  });

  it("iptal siparişe yükleme 400", async () => {
    const { svc } = makeService({ item: { id: "it1", order: { status: "iptal_edildi" } } });
    await expect(svc.add("o1", "it1", "calisma", dosya("a.psd", "application/octet-stream"), actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("geçerli önizleme: putDesign + create (satır/tür/anahtar/yükleyen) + audit; yanıtta iç alan yok", async () => {
    const { svc, storage, prisma } = makeService();
    const sonuc = await svc.add("o1", "it1", "onizleme", dosya("a.jpg", "image/jpeg"), actor);
    expect(storage.putDesign).toHaveBeenCalledTimes(1);
    const data = prisma.designUpload.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({ orderId: "o1", orderItemId: "it1", kind: "onizleme", storageKey: "k.jpg", userId: "u1" });
    expect(prisma.auditLog.create.mock.calls[0]![0].data).toMatchObject({ action: "design_upload", entityType: "OrderItem", entityId: "it1" });
    expect(sonuc).toMatchObject({ id: "up1", kind: "onizleme", uploadedBy: { id: "u1" } });
    expect(sonuc).not.toHaveProperty("storageKey");
    expect(sonuc).not.toHaveProperty("driveFileId");
  });

  it("DB yazımı düşerse diskteki dosya geri silinir ve hata fırlar", async () => {
    const { svc, storage } = makeService({ createFails: true });
    await expect(svc.add("o1", "it1", "calisma", dosya("a.psd", "application/octet-stream"), actor)).rejects.toThrow("db down");
    expect(storage.deleteDesign).toHaveBeenCalledWith("k.jpg");
  });
});

describe("OrderDesignService.remove", () => {
  it("kayıt yoksa 404, silme yok", async () => {
    const { svc, prisma, storage } = makeService({ existing: null });
    await expect(svc.remove("o1", "yok", actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.designUpload.delete).not.toHaveBeenCalled();
    expect(storage.deleteDesign).not.toHaveBeenCalled();
  });

  it("başarı: kayıt silinir, dosya silinir, audit yazılır", async () => {
    const { svc, prisma, storage } = makeService();
    const r = await svc.remove("o1", "up1", actor);
    expect(r).toEqual({ ok: true, id: "up1" });
    expect(prisma.designUpload.delete).toHaveBeenCalledWith({ where: { id: "up1" } });
    expect(storage.deleteDesign).toHaveBeenCalledWith("k.pdf");
    expect(prisma.auditLog.create.mock.calls[0]![0].data).toMatchObject({ action: "design_delete", entityId: "it1" });
  });

  it("disk silme hatası isteği DÜŞÜRMEZ (kayıt zaten gitti)", async () => {
    const { svc, storage } = makeService();
    storage.deleteDesign.mockRejectedValueOnce(new Error("EACCES"));
    await expect(svc.remove("o1", "up1", actor)).resolves.toEqual({ ok: true, id: "up1" });
  });
});

describe("OrderDesignService.add — Drive aktarımı (2026-09-03)", () => {
  it("Drive kapalıysa hiçbir Drive çağrısı yapılmaz, dosya sunucuda kalır", async () => {
    const { svc, drive, prisma } = makeService({ drive: false });
    await svc.add("o1", "it1", "baski", dosya("a.pdf", "application/pdf"), actor);
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
    expect(drive.uploadFile).not.toHaveBeenCalled();
    expect(prisma.designUpload.update).not.toHaveBeenCalled();
  });

  it("baskı/çalışma dosyası Drive'a gider: klasör → yükle → kayıt güncelle → yerel sil; yanıtta driveUrl", async () => {
    const { svc, drive, prisma, storage } = makeService({
      drive: true,
      item: {
        id: "it1", productName: "Çin Vinil Branda", productSlug: "cin-vinil-branda",
        order: { status: "uretimde", orderNumber: "MK-77", user: { fullName: "Ayşe Yılmaz" }, shippingAddressSnapshot: null },
      },
    });
    const r = await svc.add("o1", "it1", "baski", dosya("final.pdf", "application/pdf"), actor);
    expect(drive.ensureOrderFolder).toHaveBeenCalledWith("MK-77", "Ayşe Yılmaz");
    expect(drive.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: "FOLDER", name: "MK-77__cin-vinil-branda__baski__a.jpg" /* putDesign mock sanitize edilmiş adı döner */, mimeType: "application/pdf" }),
    );
    expect(prisma.designUpload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { driveFileId: "DRV1", fileUrl: "https://drive.google.com/file/d/DRV1/view", storageKey: null } }),
    );
    expect(storage.deleteDesign).toHaveBeenCalled();
    expect(r.driveUrl).toBe("https://drive.google.com/file/d/DRV1/view");
    expect(r).not.toHaveProperty("driveFileId");
    // Denetim kaydında Drive kimliği izlenebilir.
    expect(prisma.auditLog.create.mock.calls[0][0].data.diff).toMatchObject({ driveFileId: "DRV1" });
  });

  it("ÖNİZLEME Drive'a gitmez (panel kartları sunucudan okur)", async () => {
    const { svc, drive } = makeService({ drive: true });
    await svc.add("o1", "it1", "onizleme", dosya("a.jpg", "image/jpeg"), actor);
    expect(drive.uploadFile).not.toHaveBeenCalled();
  });

  it("Drive hata verirse yükleme DÜŞMEZ: kayıt ve yerel dosya kalır, driveUrl null", async () => {
    const { svc, prisma, storage } = makeService({ drive: true, driveFails: true });
    const r = await svc.add("o1", "it1", "calisma", dosya("is.ai", "application/octet-stream"), actor);
    expect(prisma.designUpload.update).not.toHaveBeenCalled();
    expect(storage.deleteDesign).not.toHaveBeenCalled();
    expect(r.id).toBe("up1");
  });

  it("silmede Drive kopyası da best-effort kaldırılır; Drive hatası isteği düşürmez", async () => {
    const { svc, drive } = makeService({ drive: true, existing: { id: "up1", orderItemId: "it1", kind: "baski", fileName: "a.pdf", storageKey: null, driveFileId: "DRV1" } });
    drive.deleteFile.mockRejectedValueOnce(new Error("drive down"));
    await expect(svc.remove("o1", "up1", actor)).resolves.toEqual({ ok: true, id: "up1" });
    expect(drive.deleteFile).toHaveBeenCalledWith("DRV1");
  });
});

describe("driveDosyaAdi", () => {
  it("sipariş no + ürün slug + tür + özgün ad; Türkçe karakterler sadeleşir", () => {
    expect(driveDosyaAdi("MK-1", "Çin Vinil Branda", "baski", "Final V3.pdf")).toBe("MK-1__cin-vinil-branda__baski__Final V3.pdf");
    expect(driveDosyaAdi("MK-2", "!!!", "calisma", "x.ai")).toBe("MK-2__urun__calisma__x.ai");
  });
});
