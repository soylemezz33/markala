import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DriveService } from "./drive.service";

/**
 * Ödemesi kesinleşen sipariş için Drive klasörünü ÖNCEDEN açar (2026-09-03, Hasan).
 *
 * KURAL: "sadece ücreti ödenen siparişler için açalım; havalede panelden ödeme geldiği
 * doğrulanınca". Yani tetik = paymentStatus'un "basarili" olduğu an:
 *   - kart: iyzico callback başarı (ve kaçan callback'i kurtaran reconcile),
 *   - havale/EFT: panel "Ödemeyi onayla" (OrdersService.odemeOnayla).
 * Sipariş OLUŞTUĞUNDA açılmaz: ödenmemiş/terk edilmiş siparişler Drive'ı çöple doldurmasın.
 *
 * Klasör adı/konumu DriveService.ensureOrderFolder ile aynı ("MK-… — Müşteri", kök altında),
 * arama sipariş numarasıyla → tasarımcı sonradan dosya yüklediğinde aynı klasör bulunur,
 * ikinci klasör açılmaz. Çağrılar fire-and-forget: ödeme akışını asla bekletmez/düşürmez;
 * Drive kapalı veya hatalıysa yalnız log.
 */

/** Saf karar: klasör açılmalı mı? (testte doğrudan) */
export function klasorAcilmaliMi(input: { enabled: boolean; paymentStatus: string | null | undefined }): boolean {
  return input.enabled && input.paymentStatus === "basarili";
}

@Injectable()
export class OrderDriveService {
  private readonly logger = new Logger(OrderDriveService.name);
  constructor(private prisma: PrismaService, private drive: DriveService) {}

  /**
   * Ödemesi "basarili" olan sipariş için klasörü açar/bulur; klasör id döner. Ödenmemişse,
   * Drive kapalıysa veya sipariş yoksa null. HİÇBİR ZAMAN fırlatmaz — çağıran `void` ile
   * arka plana atar.
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
        },
      });
      if (!o) return null;
      if (!klasorAcilmaliMi({ enabled: this.drive.enabled, paymentStatus: o.paymentStatus })) return null;
      const ad = (a: unknown) => (a as { fullName?: string } | null)?.fullName?.trim() || null;
      const musteri = o.user?.fullName?.trim() || ad(o.shippingAddressSnapshot) || ad(o.billingAddressSnapshot) || null;
      const id = await this.drive.ensureOrderFolder(o.orderNumber, musteri);
      this.logger.log(`Drive sipariş klasörü hazır: ${o.orderNumber} (${id})`);
      return id;
    } catch (e) {
      this.logger.warn(`Drive sipariş klasörü açılamadı (order=${orderId}): ${(e as Error)?.message}`);
      return null;
    }
  }
}
