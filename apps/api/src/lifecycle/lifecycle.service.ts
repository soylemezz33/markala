import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

/** Kurtarma penceresi sınırları (saat). 72 saatten eski siparişe DOKUNULMAZ. */
const STAGE1_MIN_AGE_H = 2; // çok taze siparişi dürtme — müşteri hâlâ ödeme akışında olabilir
const STAGE1_MAX_AGE_H = 24;
const STAGE2_MAX_AGE_H = 72;

/**
 * Müşteri yaşam döngüsü (retention) zamanlanmış işleri.
 *
 * Bekleyen-ödeme kurtarma maili — İŞLEMSEL ileti (kupon/pazarlama YOK):
 * paymentStatus=beklemede kalan siparişlere iki dokunuş yapılır:
 *   - 2-24 saat  → stage 1 (ilk hatırlatma)
 *   - 24-72 saat → stage 2 (son hatırlatma)
 * İdempotens Order.recoveryMailStage ile: 0→1→2 tek yönlü ilerler, aynı aşama
 * iki kez gönderilmez. Cari (açık hesap) siparişlerde kartla ödeme yoktur,
 * ödenmiş/iptal siparişler zaten sorgu dışıdır.
 *
 * Zamanlama: @nestjs/schedule saatlik cron. Tek api instance'ı çalıştığından
 * (PaymentsService.reconcile ile aynı varsayım) ek kilit mekanizması gerekmez.
 */
@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(private prisma: PrismaService, private mail: MailService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handlePaymentRecoveryCron(): Promise<void> {
    try {
      await this.runPaymentRecovery();
    } catch (e) {
      // Cron hatası süreci düşürmemeli — logla, sonraki saat tekrar dener.
      this.logger.error(`payment-recovery cron hatası: ${(e as Error).message}`);
    }
  }

  /** Test edilebilirlik için cron sarmalayıcısından ayrı tutulur. */
  async runPaymentRecovery(): Promise<{ stage1: number; stage2: number }> {
    const now = Date.now();
    const h = 60 * 60 * 1000;
    const oldest = new Date(now - STAGE2_MAX_AGE_H * h); // 72 saatten eskiye dokunma
    const newest = new Date(now - STAGE1_MIN_AGE_H * h); // 2 saatten tazeye dokunma

    // Aday siparişler: ödeme bekliyor + online ödeme yolu (cari HARİÇ) + iptal edilmemiş +
    // soft-delete edilmemiş + pencere içinde + son aşamaya (2) ulaşmamış.
    // paymentStatus enum'unda "beklemede" = ödeme bekliyor karşılığıdır (basarili/basarisiz/iade_edildi diğerleri).
    const candidates = await this.prisma.order.findMany({
      where: {
        paymentStatus: "beklemede",
        paymentMethod: { not: "cari" },
        status: { not: "iptal_edildi" },
        deletedAt: null,
        recoveryMailStage: { lt: 2 },
        createdAt: { gte: oldest, lte: newest },
      },
      include: {
        items: { select: { productName: true, quantity: true, lineTotal: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      // Güvenlik supabı: tek turda sınırsız mail atma (SMTP karantina riski). Saatlik cron
      // olduğundan artan iş sonraki turda erir.
      take: 200,
    });

    let stage1 = 0;
    let stage2 = 0;

    for (const order of candidates) {
      const ageH = (now - order.createdAt.getTime()) / h;

      // Uygun aşamayı belirle. 24 saati geçmiş ama hiç mail almamış sipariş (örn. API
      // kapalıyken pencereyi kaçırdı) doğrudan stage 2 alır — müşteriye üst üste iki
      // hatırlatma gitmez, aşama atlanır.
      let target: 1 | 2 | null = null;
      if (ageH >= STAGE1_MAX_AGE_H && order.recoveryMailStage < 2) target = 2;
      else if (ageH >= STAGE1_MIN_AGE_H && order.recoveryMailStage < 1) target = 1;
      if (target === null) continue; // 2-24 saat bandında stage 1 zaten gönderilmiş → bekle

      // Önce mail, başarılıysa aşama işaretle: mail düşerse aşama ilerlemez, sonraki saat
      // yeniden denenir (sendPaymentRecoveryEmail hata fırlatmaz, false döner).
      const sent = await this.mail.sendPaymentRecoveryEmail(order, target);
      if (!sent) continue;

      // Aşamayı KOŞULLU güncelle (recoveryMailStage < target) — paralel/yarışan bir
      // güncelleme olursa geri sarma olmaz.
      await this.prisma.order.updateMany({
        where: { id: order.id, recoveryMailStage: { lt: target } },
        data: { recoveryMailStage: target },
      });
      if (target === 1) stage1++;
      else stage2++;
    }

    if (stage1 || stage2)
      this.logger.log(`payment-recovery: ${stage1} ilk + ${stage2} son hatırlatma gönderildi (${candidates.length} aday)`);
    return { stage1, stage2 };
  }
}
