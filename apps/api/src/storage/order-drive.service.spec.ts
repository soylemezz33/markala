import { describe, it, expect, vi } from "vitest";
import { OrderDriveService, klasorAcilmaliMi, yereldeKalsinMi, musteriDosyaAdi } from "./order-drive.service";

/**
 * OrderDriveService — ödeme kesinleşince Drive klasörü + müşteri dosyası taşıma (2026-09-03).
 * Koruduğu kurallar (Hasan): klasör YALNIZ paymentStatus="basarili" siparişe açılır; müşterinin
 * checkout dosyası Drive'a gider (yerel silinir, URL Drive olur), 2 MB altı JPG/PNG yerelde de kalır;
 * Drive kapalı/hatalı → hiçbir şey fırlamaz, ödeme akışı etkilenmez; çift tetik çift dosya üretmez.
 */

const KEY_PDF = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf";
const KEY_JPG = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg";
const kalem = (o: Partial<{ id: string; uploadedFileUrl: string | null; uploadedFileDriveId: string | null; uploadedFileName: string | null }>) => ({
  id: "it1", productName: "Çin Vinil Branda", productSlug: "cin-vinil-branda", uploadedFileName: "logo.pdf",
  uploadedFileUrl: `https://api/uploads/design/${KEY_PDF}`, uploadedFileDriveId: null, ...o,
});
const siparis = (items: unknown[] = [kalem({})], paymentStatus = "basarili") => ({
  orderNumber: "MK-9", paymentStatus, user: { fullName: "Ayşe Yılmaz" }, shippingAddressSnapshot: null, billingAddressSnapshot: null, items,
});

function make(opts: { enabled?: boolean; order?: unknown; driveFails?: boolean; uploadFails?: boolean; claimCount?: number; dosya?: { size: number } | null } = {}) {
  const prisma = {
    order: { findUnique: vi.fn().mockResolvedValue(opts.order === undefined ? siparis() : opts.order) },
    orderItem: { updateMany: vi.fn().mockResolvedValue({ count: opts.claimCount ?? 1 }) },
    designUpload: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  const drive = {
    enabled: opts.enabled ?? true,
    ensureOrderFolder: vi.fn().mockImplementation(() => (opts.driveFails ? Promise.reject(new Error("Drive 500")) : Promise.resolve("F1"))),
    uploadFile: vi.fn().mockImplementation(() => (opts.uploadFails ? Promise.reject(new Error("upload 500")) : Promise.resolve({ id: "D1", webViewLink: "https://drive.google.com/file/d/D1/view" }))),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
  const storage = {
    getDesign: vi.fn().mockImplementation(async () => {
      if (opts.dosya === null) throw new Error("yok");
      return { buffer: Buffer.alloc(opts.dosya?.size ?? 10), mimetype: "application/pdf" };
    }),
    deleteDesign: vi.fn().mockResolvedValue(undefined),
  };
  return { svc: new OrderDriveService(prisma as never, drive as never, storage as never), prisma, drive, storage };
}

describe("saf kurallar", () => {
  it("klasorAcilmaliMi: yalnız Drive açık VE ödeme basarili", () => {
    expect(klasorAcilmaliMi({ enabled: true, paymentStatus: "basarili" })).toBe(true);
    expect(klasorAcilmaliMi({ enabled: true, paymentStatus: "beklemede" })).toBe(false);
    expect(klasorAcilmaliMi({ enabled: false, paymentStatus: "basarili" })).toBe(false);
  });
  it("yereldeKalsinMi: jpg/png ≤ 2 MB kalır, pdf/büyük görsel gider", () => {
    expect(yereldeKalsinMi({ key: KEY_JPG, size: 1_000_000 })).toBe(true);
    expect(yereldeKalsinMi({ key: KEY_JPG, size: 3_000_000 })).toBe(false);
    expect(yereldeKalsinMi({ key: KEY_PDF, size: 100 })).toBe(false);
  });
  it("musteriDosyaAdi: sipariş no + ürün slug + musteri + özgün ad", () => {
    expect(musteriDosyaAdi("MK-1", "Çin Vinil Branda", "Logo Final.pdf")).toBe("MK-1__cin-vinil-branda__musteri__Logo Final.pdf");
  });
});

describe("OrderDriveService.klasorAc — klasör", () => {
  it("Drive kapalıysa DB'ye bile gitmez", async () => {
    const { svc, prisma, drive } = make({ enabled: false });
    expect(await svc.klasorAc("o1")).toBeNull();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
  });
  it("ödenmemiş (beklemede) siparişe klasör AÇMAZ, dosya taşımaz", async () => {
    const { svc, drive } = make({ order: siparis([kalem({})], "beklemede") });
    expect(await svc.klasorAc("o1")).toBeNull();
    expect(drive.ensureOrderFolder).not.toHaveBeenCalled();
    expect(drive.uploadFile).not.toHaveBeenCalled();
  });
  it("ödenmiş siparişte sipariş no + üye adıyla klasör açar", async () => {
    const { svc, drive } = make();
    expect(await svc.klasorAc("o1")).toBe("F1");
    expect(drive.ensureOrderFolder).toHaveBeenCalledWith("MK-9", "Ayşe Yılmaz");
  });
  it("misafir siparişte adı teslimat snapshot'ından alır", async () => {
    const { svc, drive } = make({ order: { ...siparis([]), user: null, shippingAddressSnapshot: { fullName: " Veli Can " } } });
    await svc.klasorAc("o2");
    expect(drive.ensureOrderFolder).toHaveBeenCalledWith("MK-9", "Veli Can");
  });
  it("sipariş yoksa null; Drive hata verirse fırlatmaz", async () => {
    expect(await make({ order: null }).svc.klasorAc("yok")).toBeNull();
    await expect(make({ driveFails: true }).svc.klasorAc("o1")).resolves.toBeNull();
  });
});

describe("OrderDriveService.klasorAc — müşteri dosyası", () => {
  it("PDF: Drive'a yüklenir, kayıt Drive bağlantısıyla güncellenir, yerel silinir", async () => {
    const { svc, drive, prisma, storage } = make();
    await svc.klasorAc("o1");
    expect(storage.getDesign).toHaveBeenCalledWith(KEY_PDF);
    expect(drive.uploadFile).toHaveBeenCalledWith(expect.objectContaining({ folderId: "F1", name: "MK-9__cin-vinil-branda__musteri__logo.pdf", mimeType: "application/pdf" }));
    expect(prisma.orderItem.updateMany).toHaveBeenCalledWith({
      where: { id: "it1", uploadedFileDriveId: null },
      data: { uploadedFileDriveId: "D1", uploadedFileUrl: "https://drive.google.com/file/d/D1/view" },
    });
    expect(storage.deleteDesign).toHaveBeenCalledWith(KEY_PDF);
  });
  it("küçük JPG: Drive'a KOPYALANIR, URL değişmez, yerel kalır (panel önizlemesi)", async () => {
    const { svc, prisma, storage } = make({ order: siparis([kalem({ uploadedFileUrl: `https://api/uploads/design/${KEY_JPG}`, uploadedFileName: "on.jpg" })]), dosya: { size: 500_000 } });
    await svc.klasorAc("o1");
    expect(prisma.orderItem.updateMany.mock.calls[0][0].data).toEqual({ uploadedFileDriveId: "D1" });
    expect(storage.deleteDesign).not.toHaveBeenCalled();
  });
  it("zaten taşınmış kalem ve dosyasız kalem atlanır", async () => {
    const { svc, drive } = make({ order: siparis([kalem({ uploadedFileDriveId: "ESKI" }), kalem({ id: "it2", uploadedFileUrl: null }), kalem({ id: "it3", uploadedFileUrl: "https://api/uploads/eski-format.pdf" })]) });
    await svc.klasorAc("o1");
    expect(drive.uploadFile).not.toHaveBeenCalled();
  });
  it("diskte olmayan dosya sessiz atlanır", async () => {
    const { svc, drive } = make({ dosya: null });
    await svc.klasorAc("o1");
    expect(drive.uploadFile).not.toHaveBeenCalled();
  });
  it("yarış: kayıt başkası tarafından işaretlenmişse (count=0) Drive kopyası geri silinir, yerel silinmez", async () => {
    const { svc, drive, storage } = make({ claimCount: 0 });
    await svc.klasorAc("o1");
    expect(drive.deleteFile).toHaveBeenCalledWith("D1");
    expect(storage.deleteDesign).not.toHaveBeenCalled();
  });
  it("bir kalemin yüklemesi patlarsa diğerleri devam eder, klasör id yine döner", async () => {
    const { svc, drive } = make({ order: siparis([kalem({}), kalem({ id: "it2" })]), uploadFails: true });
    expect(await svc.klasorAc("o1")).toBe("F1");
    expect(drive.uploadFile).toHaveBeenCalledTimes(2);
  });
});

describe("OrderDriveService.klasorAc — set başına müşteri dosyaları (kind=musteri)", () => {
  it("her satır Drive'a taşınır (tasarım sırası adda), eski alan aynı anahtarsa Drive'a eşlenir", async () => {
    const { svc, drive, prisma, storage } = make({
      order: siparis([kalem({ uploadedFileUrl: `https://api/uploads/design/${KEY_PDF}`, designUploads: [
        { id: "m1", fileName: "on.pdf", storageKey: KEY_PDF, mimeType: "application/pdf", designIndex: 0 },
        { id: "m2", fileName: "arka.pdf", storageKey: "cccccccc-cccc-cccc-cccc-cccccccccccc.pdf", mimeType: "application/pdf", designIndex: 1 },
      ] } as never)]),
    });
    await svc.klasorAc("o1");
    expect(drive.uploadFile).toHaveBeenCalledTimes(2); // eski alan için ÜÇÜNCÜ yükleme yok
    expect(drive.uploadFile.mock.calls[0][0].name).toBe("MK-9__cin-vinil-branda__musteri__tasarim1__on.pdf");
    expect(prisma.designUpload.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "m1", driveFileId: null } }));
    expect(prisma.orderItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "it1", uploadedFileDriveId: null }, data: expect.objectContaining({ uploadedFileDriveId: "D1" }) }));
    expect(storage.deleteDesign).toHaveBeenCalledTimes(2);
  });

  /**
   * 2026-09-04 CANLI HATASI (MK-MTMMFELC-4Q3C): 2,6 MB'lık bir png satır olarak Drive'a
   * taşınıp yerelden SİLİNDİ, ama eski uploadedFileUrl alanı güncellenmedi. Panelde
   * "İndir" ölü bağlantıya gitti, tarayıcı dosya yerine hata JSON'unu indirdi.
   *
   * Sebep: eski alan dalı kararı `yereldeKalsinMi({ key, size: 0 })` ile YENİDEN
   * hesaplıyordu; kural "jpg/png VE ≤ 2 MB" olduğu için sahte 0 boyut her png'de
   * "yerelde kaldı" diyordu. Doğrusu taşıma anındaki gerçek kararı kullanmak.
   */
  it("2 MB ÜSTÜ png: yerelden silinir VE eski uploadedFileUrl Drive'a çevrilir", async () => {
    const KEY_BIG = "dddddddd-dddd-dddd-dddd-dddddddddddd.png";
    const { svc, prisma, storage } = make({
      dosya: { size: 2_749_691 }, // canlıdaki dosyanın boyutu
      order: siparis([
        kalem({
          uploadedFileUrl: `https://api/uploads/design/${KEY_BIG}`,
          uploadedFileName: "musteri.png",
          designUploads: [{ id: "m1", fileName: "musteri.png", storageKey: KEY_BIG, mimeType: "image/png", designIndex: 0 }],
        } as never),
      ]),
    });
    await svc.klasorAc("o1");
    // Yerel kopya silindi → eski alan ARTIK Drive'ı göstermeli, yoksa panel kırık.
    expect(storage.deleteDesign).toHaveBeenCalledWith(KEY_BIG);
    expect(prisma.orderItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uploadedFileDriveId: "D1",
          uploadedFileUrl: "https://drive.google.com/file/d/D1/view",
        }),
      }),
    );
  });

  it("2 MB ALTI png: yerelde kalır, uploadedFileUrl yerel adreste bırakılır", async () => {
    const KEY_SMALL = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee.png";
    const { svc, prisma, storage } = make({
      dosya: { size: 500_000 },
      order: siparis([
        kalem({
          uploadedFileUrl: `https://api/uploads/design/${KEY_SMALL}`,
          designUploads: [{ id: "m1", fileName: "kucuk.png", storageKey: KEY_SMALL, mimeType: "image/png", designIndex: 0 }],
        } as never),
      ]),
    });
    await svc.klasorAc("o1");
    expect(storage.deleteDesign).not.toHaveBeenCalled();
    const veri = prisma.orderItem.updateMany.mock.calls[0][0].data;
    expect(veri.uploadedFileDriveId).toBe("D1");
    expect(veri.uploadedFileUrl).toBeUndefined(); // yerel adres korunur
  });
});
