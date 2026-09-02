import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { DriveService, driveFileUrl } from "../storage/drive.service";
import { DESIGN_KINDS, type DesignKind } from "./orders.dto";

/**
 * Sipariş SATIRINA tasarımcı dosyası ekleme/silme (2026-09-02, üretim ARGE Faz 2).
 *
 * NEDEN AYRI SERVİS: OrdersService'in kurucusunu 36 spec çağrısı `new OrdersService(...)` ile
 * elle kuruyor; oraya StorageService eklemek hepsine dokunmak demek. Bu servis yalnız
 * Prisma + Storage bilir; OrdersService.findById sadece okuma tarafını (include) taşır.
 *
 * SORUN NEYDİ: tasarımı Markala'nın yaptığı siparişlerde bitmiş dosya sisteme hiç girmiyordu
 * (OrderItem.uploadedFile* yalnız sipariş oluşurken müşterinin yüklediğinden yazılır).
 * Üretimde "hangi bayrak kimin" karışıklığının kök nedeni buydu.
 */

/** Panele dönen satır şekli — storageKey/driveFileId BİLEREK dışarıda (iç alanlar). */
export const DESIGN_ROW_SELECT = {
  id: true,
  kind: true,
  fileName: true,
  fileSize: true,
  fileUrl: true,
  mimeType: true,
  createdAt: true,
  // driveFileId dışarı ID olarak çıkmaz; designRowToPublic bunu driveUrl'e çevirir (2026-09-03).
  driveFileId: true,
  user: { select: { id: true, fullName: true } },
} as const;

type DesignRowRaw = {
  id: string;
  kind: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
  driveFileId?: string | null;
  user: { id: string; fullName: string | null } | null;
};

/** Prisma satırını panel şekline çevirir (user → uploadedBy). findById de bunu kullanır. */
export function designRowToPublic(r: DesignRowRaw) {
  return {
    id: r.id,
    kind: r.kind as DesignKind,
    fileName: r.fileName,
    fileSize: r.fileSize,
    fileUrl: r.fileUrl,
    mimeType: r.mimeType,
    createdAt: r.createdAt,
    uploadedBy: r.user ? { id: r.user.id, fullName: r.user.fullName } : null,
    /** Dosya Drive'a taşındıysa panel "Drive'da aç" basar; yerel dosya artık yoktur. */
    driveUrl: r.driveFileId ? driveFileUrl(r.driveFileId) : null,
  };
}

export const ONIZLEME_MAX_BYTES = 2 * 1024 * 1024;
const ONIZLEME_EXT = new Set(["jpg", "jpeg", "png"]);
const ONIZLEME_MIME = new Set(["image/jpeg", "image/png"]);

/**
 * Yükleme kuralı — SAF fonksiyon, doğrudan test edilir (siparisAnindaMailGonderilir deseni).
 * `null` = geçerli, string = kullanıcıya gösterilecek Türkçe hata.
 *
 * Kurallar (Hasan, 2026-09-02): iptal edilmiş siparişe yüklenemez; tür beyaz listede olmalı;
 * önizleme yalnız JPG/PNG ve ≤ 2 MB — çünkü panelde her kartta gösterilecek ve sunucuda
 * kalacak (ağır dosyalar ileride Drive'a taşınacak, önizleme burada kalır).
 * Boyut/uzantı whitelist'inin geri kalanı StorageService.putDesign'da (50 MB, vendor formatlar).
 */
export function tasarimYuklemeKontrol(input: {
  kind: string;
  originalName: string;
  mimetype: string;
  size: number;
  orderStatus: string;
}): string | null {
  if (input.orderStatus === "iptal_edildi") return "İptal edilmiş siparişe dosya yüklenemez.";
  if (!(DESIGN_KINDS as readonly string[]).includes(input.kind)) return "Geçersiz dosya türü.";
  if (input.kind === "onizleme") {
    const ext = (input.originalName.split(".").pop() ?? "").toLowerCase();
    if (!ONIZLEME_EXT.has(ext) || !ONIZLEME_MIME.has(input.mimetype)) {
      return "Önizleme yalnız JPG/PNG olabilir (RGB, ~1600 px).";
    }
    if (input.size > ONIZLEME_MAX_BYTES) return "Önizleme en fazla 2 MB olabilir.";
  }
  return null;
}

type Actor = { actorId?: string | null; ipAddress?: string | null };

/**
 * Drive'daki dosya adı: sipariş no + ürün + tür + özgün ad. Sipariş numarası başta — Drive'da
 * arama ve sıralama onunla; özgün ad sonda kalır ki tasarımcı kendi dosyasını tanısın.
 * Örn: MK-2026-1234__cin-vinil-branda__baski__final-v3.pdf
 */
export function driveDosyaAdi(orderNumber: string, urun: string, kind: string, ozgunAd: string): string {
  const slug = urun
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${orderNumber}__${slug || "urun"}__${kind}__${ozgunAd}`;
}

@Injectable()
export class OrderDesignService {
  private readonly logger = new Logger(OrderDesignService.name);
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private drive: DriveService,
  ) {}

  async add(
    orderId: string,
    itemId: string,
    kind: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    actor: Actor,
  ) {
    // Sahiplik: kalem bu siparişe ait mi? Tahmin edilen itemId ile başka siparişe yazılamaz.
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      select: {
        id: true,
        productName: true,
        productSlug: true,
        order: {
          select: {
            status: true,
            orderNumber: true,
            user: { select: { fullName: true } },
            shippingAddressSnapshot: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Sipariş satırı bulunamadı.");

    // Kural kontrolü putDesign'dan ÖNCE: reddedilecek dosya diske hiç yazılmasın.
    const hata = tasarimYuklemeKontrol({
      kind,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.buffer.length,
      orderStatus: item.order?.status ?? "",
    });
    if (hata) throw new BadRequestException(hata);

    const r = await this.storage.putDesign({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalName: file.originalname,
    });

    let row: DesignRowRaw;
    try {
      row = await this.prisma.designUpload.create({
        data: {
          orderId,
          orderItemId: itemId,
          userId: actor.actorId ?? null,
          kind,
          fileName: r.fileName,
          fileSize: r.fileSize,
          fileUrl: r.url,
          storageKey: r.key,
          mimeType: file.mimetype,
        },
        select: DESIGN_ROW_SELECT,
      });
    } catch (e) {
      // DB yazılamadıysa disk üzerinde yetim dosya bırakma.
      await this.storage.deleteDesign(r.key).catch(() => undefined);
      throw e;
    }

    // Drive aktarımı (2026-09-03): çalışma/baskı dosyası Drive'a gider, yerel kopya silinir;
    // ÖNİZLEME sunucuda kalır (panel kartları). Drive kapalı/hatalıysa dosya yerelde kalır —
    // yükleme asla Drive yüzünden düşmez, yalnız log'a yazılır.
    let driveFileId: string | null = null;
    if (kind !== "onizleme" && this.drive.enabled) {
      try {
        const musteri =
          item.order?.user?.fullName ??
          (item.order?.shippingAddressSnapshot as { fullName?: string } | null)?.fullName ??
          null;
        const folderId = await this.drive.ensureOrderFolder(item.order?.orderNumber ?? orderId, musteri);
        const up = await this.drive.uploadFile({
          folderId,
          name: driveDosyaAdi(item.order?.orderNumber ?? orderId, item.productSlug ?? item.productName, kind, r.fileName),
          mimeType: file.mimetype,
          buffer: file.buffer,
        });
        row = await this.prisma.designUpload.update({
          where: { id: row.id },
          data: { driveFileId: up.id, fileUrl: up.webViewLink, storageKey: null },
          select: DESIGN_ROW_SELECT,
        });
        driveFileId = up.id;
        await this.storage
          .deleteDesign(r.key)
          .catch((e) => this.logger.warn(`Drive'a taşınan dosyanın yerel kopyası silinemedi (${r.key}): ${e?.message}`));
      } catch (e) {
        this.logger.warn(`Drive aktarımı başarısız, dosya sunucuda kaldı (${r.key}): ${(e as Error)?.message}`);
      }
    }

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor.actorId ?? null,
          entityType: "OrderItem",
          entityId: itemId,
          action: "design_upload",
          diff: { orderId, uploadId: row.id, kind, fileName: r.fileName, fileSize: r.fileSize, driveFileId },
          ipAddress: actor.ipAddress ?? null,
        },
      })
      .catch((e) => this.logger.error(`[audit] design_upload yazılamadı: ${e?.message}`));

    return designRowToPublic(row);
  }

  async remove(orderId: string, uploadId: string, actor: Actor) {
    const row = await this.prisma.designUpload.findFirst({
      where: { id: uploadId, orderId, orderItemId: { not: null } },
      select: { id: true, orderItemId: true, kind: true, fileName: true, storageKey: true, driveFileId: true },
    });
    if (!row) throw new NotFoundException("Dosya kaydı bulunamadı.");

    await this.prisma.designUpload.delete({ where: { id: row.id } });

    // Drive'daki kopya da best-effort silinir (kayıt gitti; Drive'da kalırsa log'dan bulunur).
    if (row.driveFileId && this.drive.enabled) {
      await this.drive
        .deleteFile(row.driveFileId)
        .catch((e) => this.logger.warn(`Drive dosyası silinemedi (${row.driveFileId}): ${e?.message}`));
    }

    // Best-effort: dosya silinemese de kayıt silindi, istek düşmez — log yeter.
    if (row.storageKey) {
      await this.storage
        .deleteDesign(row.storageKey)
        .catch((e) => this.logger.warn(`tasarım dosyası diskten silinemedi (${row.storageKey}): ${e?.message}`));
    }

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor.actorId ?? null,
          entityType: "OrderItem",
          entityId: row.orderItemId ?? "",
          action: "design_delete",
          diff: { orderId, uploadId: row.id, kind: row.kind, fileName: row.fileName, storageKey: row.storageKey },
          ipAddress: actor.ipAddress ?? null,
        },
      })
      .catch((e) => this.logger.error(`[audit] design_delete yazılamadı: ${e?.message}`));

    return { ok: true as const, id: row.id };
  }
}
