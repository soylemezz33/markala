import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Sadakat (puan) programı.
 *
 * Değer birimleri:
 * - Kazanım: harcanan her 1 TL için EARN_POINTS_PER_TL puan.
 * - Harcama: REDEEM_POINTS_PER_TL puan = 1 TL indirim (100 puan = 1 TL → ~%1 geri kazanım).
 *
 * Güvenlik:
 * - Tüm program LOYALTY_ENABLED bayrağına bağlıdır (varsayılan KAPALI) → açılana kadar
 *   kazanım/harcama HİÇ çalışmaz, storefront puan göstermez, checkout'a dokunmaz.
 * - Kazanım idempotenttir: LoyaltyLedger @@unique([orderId, kind]) → aynı sipariş için ikinci
 *   earn denemesi (callback + reconcile çift-tetik) unique ihlaliyle sessizce atlanır.
 * - Denormalize bakiye (User.loyaltyPoints) ledger yazımıyla AYNI transaction'da güncellenir.
 */
@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  static readonly EARN_POINTS_PER_TL = 1;
  static readonly REDEEM_POINTS_PER_TL = 100;
  /** Bir siparişte puanla karşılanabilecek azami oran (ara toplamın yüzdesi). */
  static readonly MAX_REDEEM_RATIO = 0.5;

  constructor(private prisma: PrismaService) {}

  /** Program açık mı (env bayrağı). Kapalıysa hiçbir kazanım/harcama/gösterim yapılmaz. */
  isEnabled(): boolean {
    return process.env.LOYALTY_ENABLED === "true";
  }

  /** Kullanıcının güncel puan bakiyesi (denormalize). Program kapalıysa 0. */
  async getBalance(userId: string): Promise<number> {
    if (!this.isEnabled()) return 0;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });
    return user?.loyaltyPoints ?? 0;
  }

  /** Puan geçmişi (en yeni önce). Program kapalıysa boş. */
  async getHistory(userId: string, take = 50) {
    if (!this.isEnabled()) return [];
    return this.prisma.loyaltyLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 200),
    });
  }

  /**
   * Bir sipariş tutarından kazanılacak puan (TL başına EARN_POINTS_PER_TL). KDV dahil toplam üzerinden.
   */
  pointsForOrderTotal(orderTotalTl: number): number {
    if (!Number.isFinite(orderTotalTl) || orderTotalTl <= 0) return 0;
    return Math.floor(orderTotalTl) * LoyaltyService.EARN_POINTS_PER_TL;
  }

  /**
   * Sipariş "başarılı" olunca puan kazandır. Siparişi kendi yükler (userId + total); yalnız
   * kayıtlı müşteri (userId dolu) kazanır — misafir siparişi atlanır. IDEMPOTENT (orderId+earn
   * unique). Best-effort: hata YUTULUR → kazanım hiçbir zaman ödeme/sipariş akışını bozmaz.
   * Ödeme başarı yolundan (callback + reconcile) fire-and-forget çağrılır.
   */
  async earnForOrder(orderId: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, total: true, paymentStatus: true },
      });
      if (!order || !order.userId || order.paymentStatus !== "basarili") return;
      const points = this.pointsForOrderTotal(Number(order.total));
      if (points <= 0) return;
      const userId = order.userId;
      await this.prisma.$transaction(async (tx) => {
        // Idempotency: bu sipariş için earn zaten varsa unique ihlali → yakalanır, atlanır.
        const user = await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: points } },
          select: { loyaltyPoints: true },
        });
        await tx.loyaltyLedger.create({
          data: {
            userId,
            orderId,
            kind: "earn",
            points,
            balanceAfter: user.loyaltyPoints,
            description: `Sipariş kazanımı (+${points} puan)`,
          },
        });
      });
    } catch (err) {
      // P2002 (unique) = zaten kazandırılmış → normal, sessiz geç. Diğer hatalar loglanır.
      const code = (err as { code?: string }).code;
      if (code !== "P2002") {
        this.logger.error(`earnForOrder başarısız (order=${orderId}): ${(err as Error).message}`);
      }
    }
  }

  /**
   * Bir siparişte kullanılabilecek AZAMİ puanı hesaplar: bakiye, ara toplamın MAX_REDEEM_RATIO'su
   * ve tam TL'ye yuvarlama ile sınırlı. Storefront checkout bu sınırı gösterir; sunucu create'te
   * yeniden doğrular (client'a güvenilmez).
   */
  maxRedeemablePoints(balance: number, subtotalTl: number): number {
    if (!this.isEnabled() || balance <= 0 || subtotalTl <= 0) return 0;
    const capTl = Math.floor(subtotalTl * LoyaltyService.MAX_REDEEM_RATIO);
    const capPoints = capTl * LoyaltyService.REDEEM_POINTS_PER_TL;
    // Bakiyeyi tam TL'ye denk gelecek şekilde aşağı yuvarla (kısmi TL indirim yok).
    const balanceWholeTl =
      Math.floor(balance / LoyaltyService.REDEEM_POINTS_PER_TL) *
      LoyaltyService.REDEEM_POINTS_PER_TL;
    return Math.max(0, Math.min(balanceWholeTl, capPoints));
  }

  /** Puandan TL indirim değeri. */
  redeemTlValue(points: number): number {
    return points / LoyaltyService.REDEEM_POINTS_PER_TL;
  }

  /**
   * Sipariş oluşturma transaction'ı İÇİNDE çağrılır: puanı düşer + spend ledger yazar.
   * Bakiye yetersizse hata fırlatır (create rollback olur). Idempotency: (orderId, spend) unique.
   */
  async spendForOrderTx(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    points: number,
  ): Promise<void> {
    if (points <= 0) return;
    // Atomik düşüş: yalnız bakiye yeterliyse azalt (yarış korumalı).
    const updated = await tx.user.updateMany({
      where: { id: userId, loyaltyPoints: { gte: points } },
      data: { loyaltyPoints: { decrement: points } },
    });
    if (updated.count === 0) {
      throw new Error("Yetersiz puan bakiyesi.");
    }
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });
    await tx.loyaltyLedger.create({
      data: {
        userId,
        orderId,
        kind: "spend",
        points,
        balanceAfter: user?.loyaltyPoints ?? 0,
        description: `Sipariş harcaması (-${points} puan)`,
      },
    });
  }

  /**
   * Sipariş İPTAL edilince (terminal, ödenmeyecek) puan etkilerini geri al: harcanan puanı
   * müşteriye iade et, kazanılmış puanı (ödenmiş-sonra-iptal) geri çek. Tek `adjust` defter
   * kaydı (net değişim), IDEMPOTENT: (orderId, adjust) unique → ikinci iptal denemesi P2002 ile
   * atlanır. Best-effort + flag-gated → iptal akışını ASLA bozmaz. orders.updateStatus'tan çağrılır.
   */
  async refundForOrder(orderId: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const entries = await this.prisma.loyaltyLedger.findMany({
        where: { orderId, kind: { in: ["spend", "earn"] } },
        select: { userId: true, kind: true, points: true },
      });
      if (entries.length === 0) return; // ne harcama ne kazanım → iade edilecek bir şey yok
      const userId = entries[0].userId;
      const spent = entries.filter((e) => e.kind === "spend").reduce((s, e) => s + e.points, 0);
      const earned = entries.filter((e) => e.kind === "earn").reduce((s, e) => s + e.points, 0);
      const net = spent - earned; // harcananı iade et (+), kazanılanı geri al (-)
      if (net === 0) return;
      await this.prisma.$transaction(async (tx) => {
        // Idempotency: (orderId, adjust) unique → ikinci iade P2002 → tüm tx rollback (bakiye korunur).
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { loyaltyPoints: true },
        });
        const current = user?.loyaltyPoints ?? 0;
        const newBalance = Math.max(0, current + net); // negatif bakiyeyi önle
        const applied = newBalance - current; // clamp sonrası gerçek değişim
        await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: newBalance } });
        await tx.loyaltyLedger.create({
          data: {
            userId,
            orderId,
            kind: "adjust",
            points: applied,
            balanceAfter: newBalance,
            description:
              net >= 0
                ? `Sipariş iptali — puan iadesi (+${applied})`
                : `Sipariş iptali — kazanım geri alındı (${applied})`,
          },
        });
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "P2002") {
        this.logger.error(`refundForOrder başarısız (order=${orderId}): ${(err as Error).message}`);
      }
    }
  }
}
