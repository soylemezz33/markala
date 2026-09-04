import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DriveService } from "./drive.service";
import { StorageService, DESIGN_KEY_RE } from "./storage.service";

/**
 * Ödemesi kesinleşen sipariş için Drive klasörünü ÖNCEDEN açar ve müşterinin checkout'ta
 * yüklediği dosyaları oraya taşır (2026-09-03, Hasan).
 *
 * KURAL: "sadece ücreti ödenen siparişler için açalım; havalede panelden ödeme geldiği
 * doğrulanınca" + "müşterinin dosyası da gitsin". Tetik = paymentStatus'un "basarili" olduğu an:
 *   - kart: iyzico callback başarı (ve kaçan callback'i kurtaran reconcile),
 *   - havale/EFT: panel "Ödemeyi onayla" (OrdersService.odemeOnayla).
 * Sipariş OLUŞTUĞUNDA açılmaz: ödenmemiş/terk edilmiş siparişler Drive'ı çöple doldurmasın.
 *
 * MÜŞTERİ DOSYASI: OrderItem.uploadedFileUrl (secure/tasarim/<uuid.ext>) Drive'a yüklenir,
 * uploadedFileDriveId yazılır (dolu = taşındı; idempotency anahtarı). Yerel kopya SİLİNİR ve
 * uploadedFileUrl Drive bağlantısı olur — vitrin bu URL'i sipariş sonrası hiç göstermez
 * (yalnız checkout'ta kullanır), panel ise "Drive'da aç" basar. TEK İSTİSNA: 2 MB altı JPG/PNG
 * yerelde de KALIR ve URL değişmez — panel kartlarında ("Kargodaki ürünler") müşteri görselinin
 * önizleme olarak işe yaradığı tek durum bu; Drive'a yine kopyalanır.
 *
 * Klasör adı/konumu DriveService.ensureOrderFolder ile aynı ("MK-… — Müşteri", kök altında) →
 * tasarımcı sonradan dosya yüklediğinde aynı klasör bulunur. Çağrılar fire-and-forget: ödeme
 * akışını asla bekletmez/düşürmez; Drive kapalı veya hatalıysa yalnız log.
 */

/** Saf karar: klasör açılmalı mı? (testte doğrudan) */
export function klasorAcilmaliMi(input: { enabled: boolean; paymentStatus: string | null | undefined }): boolean {
  return input.enabled && input.paymentStatus === "basarili";
}

export const ONIZLEME_YERELDE_KALIR_BYTES = 2 * 1024 * 1024;

/** Saf karar: müşteri dosyası Drive'a gittikten sonra yerel kopya kalsın mı? (jpg/png ≤ 2 MB) */
export function yereldeKalsinMi(input: { key: string; size: number }): boolean {
  return /\.(jpe?g|png)$/i.test(input.key) && input.size <= ONIZLEME_YERELDE_KALIR_BYTES;
}

/** Müşteri dosyasının Drive adı: SİPARİŞNO__urun__musteri__ozgun-ad (tasarımcı dosyalarıyla aynı düzen). */
export function musteriDosyaAdi(orderNumber: string, urun: string, ozgunAd: string): string {
  const slug = urun
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${orderNumber}__${slug || "urun"}__musteri__${ozgunAd}`;
}

/** uploadedFileUrl'den depolama anahtarı (uuid.ext); Drive bağlantısı veya eski biçimse undefined. */
function anahtar(url: string | null | undefined): string | undefined {
  const key = String(url ?? "").split("?")[0]?.split("/").pop();
  return key && DESIGN_KEY_RE.test(key) ? key : undefined;
}

type MusteriSatir = { id: string; fileName: string; storageKey: string | null; mimeType: string; designIndex: number | null };
type Kalem = {
  id: string;
  productName: string;
  productSlug: string | null;
  uploadedFileName: string | null;
  uploadedFileUrl: string | null;
  uploadedFileDriveId: string | null;
  designUploads?: MusteriSatir[];
};

@Injectable()
export class OrderDriveService {
  private readonly logger = new Logger(OrderDriveService.name);
  constructor(
    private prisma: PrismaService,
    private drive: DriveService,
    private storage: StorageService,
  ) {}

  /**
   * Ödemesi "basarili" olan sipariş için klasörü açar/bulur, müşteri dosyalarını taşır; klasör id
   * döner. Ödenmemişse, Drive kapalıysa veya sipariş yoksa null. HİÇBİR ZAMAN fırlatmaz —
   * çağıran `void` ile arka plana atar.
   */
  async klasorAc(orderId: string): Promise<string | null> {
    try {
      if (!this.drive.enabled) return null;
      const o = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          paymentStatus: true,
          user: { select: { fullName: true } },
          shippingAddressSnapshot: true,
          billingAddressSnapshot: true,
          items: {
            select: {
              id: true, productName: true, productSlug: true, uploadedFileName: true, uploadedFileUrl: true, uploadedFileDriveId: true,
              // Müşterinin set başına dosyaları (2026-09-03) — henüz Drive'a gitmemiş olanlar.
              designUploads: { where: { kind: "musteri", driveFileId: null }, select: { id: true, fileName: true, storageKey: true, mimeType: true, designIndex: true } },
            },
          },
        },
      });
      if (!o) return null;
      if (!klasorAcilmaliMi({ enabled: this.drive.enabled, paymentStatus: o.paymentStatus })) return null;
      const ad = (a: unknown) => (a as { fullName?: string } | null)?.fullName?.trim() || null;
      const musteri = o.user?.fullName?.trim() || ad(o.shippingAddressSnapshot) || ad(o.billingAddressSnapshot) || null;
      const folderId = await this.drive.ensureOrderFolder(o.orderNumber, musteri);
      this.logger.log(`Drive sipariş klasörü hazır: ${o.orderNumber} (${folderId})`);
      await this.musteriDosyalariniTasi(o.orderNumber, folderId, o.items as Kalem[]);
      return folderId;
    } catch (e) {
      this.logger.warn(`Drive sipariş klasörü açılamadı (order=${orderId}): ${(e as Error)?.message}`);
      return null;
    }
  }

  /** Her kalem bağımsız: biri hata verse diğerleri devam eder; hata yalnız log. */
  private async musteriDosyalariniTasi(orderNumber: string, folderId: string, items: Kalem[]): Promise<void> {
    for (const it of items) {
      // 1) Set başına dosyalar (DesignUpload kind=musteri, 2026-09-03): her satır bağımsız taşınır.
      //    Aynı anahtar eski uploadedFileUrl'de de duruyorsa (ilk dosya) o alanlar da eşlenir —
      //    dosya iki kez yüklenmez, eski alan kırık kalmaz.
      // kalsin: yerel kopya korundu mu? Eski uploadedFileUrl alanı bu KARARA göre
      // güncellenir — yeniden hesaplanmaz (bkz. aşağıdaki esKopya notu).
      const tasinan = new Map<string, { id: string; webViewLink: string; kalsin: boolean }>();
      for (const r of it.designUploads ?? []) {
        if (!r.storageKey) continue;
        try {
          const dosya = await this.storage.getDesign(r.storageKey).catch(() => null);
          if (!dosya) continue;
          const kalsin = yereldeKalsinMi({ key: r.storageKey, size: dosya.buffer.length });
          const sira = r.designIndex != null ? `tasarim${r.designIndex + 1}__` : "";
          const up = await this.drive.uploadFile({
            folderId,
            name: musteriDosyaAdi(orderNumber, it.productSlug ?? it.productName, `${sira}${r.fileName}`),
            mimeType: dosya.mimetype,
            buffer: dosya.buffer,
          });
          const claimed = await this.prisma.designUpload.updateMany({
            where: { id: r.id, driveFileId: null },
            data: { driveFileId: up.id, fileUrl: up.webViewLink, ...(kalsin ? {} : { storageKey: null }) },
          });
          if (claimed.count === 0) { await this.drive.deleteFile(up.id).catch(() => undefined); continue; }
          tasinan.set(r.storageKey, { id: up.id, webViewLink: up.webViewLink, kalsin });
          if (!kalsin) await this.storage.deleteDesign(r.storageKey).catch(() => undefined);
          this.logger.log(`müşteri tasarım dosyası Drive'a ${kalsin ? "kopyalandı" : "taşındı"}: ${orderNumber} ${r.storageKey} → ${up.id}`);
        } catch (e) {
          this.logger.warn(`müşteri tasarım dosyası taşınamadı (${orderNumber} ${r.storageKey}): ${(e as Error)?.message}`);
        }
      }

      // 2) Eski tek-dosya alanı.
      if (it.uploadedFileDriveId) continue; // zaten taşınmış
      const key = anahtar(it.uploadedFileUrl);
      if (!key) continue; // dosya yok ya da eski public biçim (uuid deseni tutmuyor) → dokunma
      const esKopya = tasinan.get(key);
      if (esKopya) {
        /**
         * Aynı dosya satır olarak az önce taşındı → eski alanı ona bağla, yeniden yükleme.
         *
         * KARAR YENİDEN HESAPLANMAZ (2026-09-04 hatası): burada eskiden
         * `yereldeKalsinMi({ key, size: 0 })` çağrılıyordu. Kural "jpg/png VE ≤ 2 MB ise
         * yerelde kalsın"; sahte `size: 0` her png/jpg için TRUE üretiyordu. Yani 2 MB'tan
         * BÜYÜK bir png yukarıdaki dalda yerelden SİLİNİYOR, burada ise "yerelde kaldı"
         * sanılıp uploadedFileUrl güncellenmiyordu → panelde "İndir" ölü bağlantıya
         * gidiyor, tarayıcı hata JSON'unu indiriyordu (MK-MTMMFELC-4Q3C, 2,6 MB png).
         * Doğrusu: taşıma anında verilen gerçek kararı kullanmak.
         */
        await this.prisma.orderItem.updateMany({
          where: { id: it.id, uploadedFileDriveId: null },
          data: { uploadedFileDriveId: esKopya.id, ...(esKopya.kalsin ? {} : { uploadedFileUrl: esKopya.webViewLink }) },
        }).catch(() => undefined);
        continue;
      }
      try {
        const dosya = await this.storage.getDesign(key).catch(() => null);
        if (!dosya) continue; // diskte yok (eski/silinmiş) → Drive'a bir şey gitmez
        const kalsin = yereldeKalsinMi({ key, size: dosya.buffer.length });
        const up = await this.drive.uploadFile({
          folderId,
          name: musteriDosyaAdi(orderNumber, it.productSlug ?? it.productName, it.uploadedFileName || key),
          mimeType: dosya.mimetype,
          buffer: dosya.buffer,
        });
        // Yarış koruması: aynı anda iki tetik (çift tık / callback+reconcile) aynı kalemi taşımasın.
        // Koşullu updateMany: ilk yazan kazanır, ikincisi Drive'daki kopyasını geri siler.
        const claimed = await this.prisma.orderItem.updateMany({
          where: { id: it.id, uploadedFileDriveId: null },
          data: { uploadedFileDriveId: up.id, ...(kalsin ? {} : { uploadedFileUrl: up.webViewLink }) },
        });
        if (claimed.count === 0) {
          await this.drive.deleteFile(up.id).catch(() => undefined);
          continue;
        }
        if (!kalsin) {
          await this.storage
            .deleteDesign(key)
            .catch((e) => this.logger.warn(`müşteri dosyasının yerel kopyası silinemedi (${key}): ${e?.message}`));
        }
        this.logger.log(`müşteri dosyası Drive'a ${kalsin ? "kopyalandı (önizleme yerelde kaldı)" : "taşındı"}: ${orderNumber} ${key} → ${up.id}`);
      } catch (e) {
        this.logger.warn(`müşteri dosyası Drive'a taşınamadı (${orderNumber} ${key}): ${(e as Error)?.message}`);
      }
    }
  }
}
