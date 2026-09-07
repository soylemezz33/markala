import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import {
  IKINCI_SIPARIS_KUPON, ikinciSiparisAsamasi, ikinciSiparisKodu, puanSuresiAsamasi, tekrarSiparisZamaniMi,
} from "./sadakat-kurallari";
import { cronAcikMi } from "./cron-anahtari";

/**
 * Sadakat programı zamanlanmış işleri (2026-09-06 ortak kararları):
 *  - İkinci sipariş teşviki (karar 1): teslim+24 s kişiye özel %10 kod, teslim+72 s hatırlatma.
 *  - Tekrar sipariş hatırlatması (karar 5): ürün döngüsüne göre tek mail, indirimsiz.
 *  - Puan süresi (karar 2): 30 gün / 7 gün kala hatırlatma, dolunca bakiye sıfırlama.
 *
 * Tüm mailler yalnız pazarlama izni olan alıcıya gider (KVKK). Her iş best-effort: hata loglanır,
 * sonraki turda yeniden denenir; idempotens sipariş/kullanıcı üzerindeki aşama alanlarıyla.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  constructor(private prisma: PrismaService, private mail: MailService, private loyalty: LoyaltyService) {}

  private izinVarMi(order: { marketingConsent: boolean; user: { marketingConsent: boolean } | null }): boolean {
    return Boolean(order.marketingConsent || order.user?.marketingConsent);
  }

  // ---------------------------------------------------------------------------
  // Karar 1 — ikinci sipariş teşviki (saatlik)
  // ---------------------------------------------------------------------------
  @Cron(CronExpression.EVERY_HOUR)
  async handleIkinciSiparisCron(): Promise<void> {
    try { await this.runIkinciSiparis(); } catch (e) { this.logger.error(`ikinci-siparis cron hatası: ${(e as Error).message}`); }
  }

  async runIkinciSiparis(now = new Date()): Promise<{ kod: number; hatirlatma: number; uygunDegil: number }> {
    const sonuc = { kod: 0, hatirlatma: 0, uygunDegil: 0 };
    const enEski = new Date(now.getTime() - IKINCI_SIPARIS_KUPON.azamiYasSaat * 3_600_000 - 86_400_000);
    const adaylar = await this.prisma.order.findMany({
      where: { status: "teslim_edildi", deliveredAt: { not: null, gte: enEski }, retentionMailStage: { lt: 2 }, deletedAt: null },
      select: {
        id: true, email: true, userId: true, deliveredAt: true, retentionMailStage: true, retentionCouponCode: true,
        marketingConsent: true, user: { select: { marketingConsent: true } },
      },
      orderBy: { deliveredAt: "asc" }, take: 200,
    });
    for (const o of adaylar) {
      if (!o.deliveredAt) continue;
      const tamamlanmis = await this.prisma.order.count({
        where: {
          OR: [...(o.userId ? [{ userId: o.userId }] : []), ...(o.email ? [{ email: o.email }] : [])],
          AND: [{ OR: [{ paymentStatus: "basarili" }, { paymentMethod: "cari", status: { not: "iptal_edildi" } }] }],
          deletedAt: null,
        },
      });
      let kuponKullanildi = false;
      if (o.retentionCouponCode) {
        const c = await this.prisma.coupon.findUnique({ where: { code: o.retentionCouponCode }, select: { usedCount: true } });
        kuponKullanildi = (c?.usedCount ?? 0) > 0;
      }
      const asama = ikinciSiparisAsamasi({
        id: o.id, deliveredAt: o.deliveredAt, retentionMailStage: o.retentionMailStage, retentionCouponCode: o.retentionCouponCode,
        kuponKullanildi, tamamlanmisSiparis: tamamlanmis, pazarlamaIzni: this.izinVarMi(o), email: o.email,
      }, now);
      if (asama === null) continue;
      if (asama === 9) {
        await this.prisma.order.updateMany({ where: { id: o.id, retentionMailStage: { lt: 9 } }, data: { retentionMailStage: 9 } });
        sonuc.uygunDegil++; continue;
      }
      if (asama === 1) {
        // Kişiye özel kupon: tek kullanım, 21 gün, min sepet, yalnız bu e-posta.
        const code = ikinciSiparisKodu();
        const validUntil = new Date(now.getTime() + IKINCI_SIPARIS_KUPON.gecerlilikGun * 86_400_000);
        await this.prisma.coupon.create({
          data: {
            code, type: "percentage", value: IKINCI_SIPARIS_KUPON.yuzde, minOrderAmount: IKINCI_SIPARIS_KUPON.minSepetTl,
            maxUses: 1, validFrom: now, validUntil, isActive: true, assignedEmail: o.email!.toLowerCase(),
          },
        });
        const sent = await this.mail.sendIkinciSiparisKuponEmail(o.id, code, validUntil, 1);
        if (!sent) { await this.prisma.coupon.update({ where: { code }, data: { isActive: false } }).catch(() => undefined); continue; }
        await this.prisma.order.updateMany({ where: { id: o.id, retentionMailStage: { lt: 1 } }, data: { retentionMailStage: 1, retentionCouponCode: code } });
        sonuc.kod++;
      } else {
        const c = await this.prisma.coupon.findUnique({ where: { code: o.retentionCouponCode! }, select: { validUntil: true } });
        const sent = await this.mail.sendIkinciSiparisKuponEmail(o.id, o.retentionCouponCode!, c?.validUntil ?? null, 2);
        if (!sent) continue;
        await this.prisma.order.updateMany({ where: { id: o.id, retentionMailStage: { lt: 2 } }, data: { retentionMailStage: 2 } });
        sonuc.hatirlatma++;
      }
    }
    if (sonuc.kod || sonuc.hatirlatma) this.logger.log(`ikinci-siparis: ${sonuc.kod} kod, ${sonuc.hatirlatma} hatırlatma (${adaylar.length} aday)`);
    return sonuc;
  }

  // ---------------------------------------------------------------------------
  // Karar 5 — tekrar sipariş hatırlatması (her sabah 09:30)
  // ---------------------------------------------------------------------------
  @Cron("30 9 * * *")
  async handleTekrarSiparisCron(): Promise<void> {
    try { await this.runTekrarSiparis(); } catch (e) { this.logger.error(`tekrar-siparis cron hatası: ${(e as Error).message}`); }
  }

  async runTekrarSiparis(now = new Date()): Promise<{ sent: number }> {
    let sent = 0;
    const enEski = new Date(now.getTime() - 400 * 86_400_000);
    const adaylar = await this.prisma.order.findMany({
      where: { status: "teslim_edildi", deliveredAt: { not: null, gte: enEski }, reorderMailSentAt: null, deletedAt: null },
      select: {
        id: true, email: true, userId: true, deliveredAt: true, marketingConsent: true,
        user: { select: { marketingConsent: true } },
        items: { select: { productSlug: true, productName: true, product: { select: { category: { select: { slug: true } } } } }, orderBy: { lineTotal: "desc" } },
      },
      orderBy: { deliveredAt: "asc" }, take: 300,
    });
    const gonderilenEposta = new Set<string>();
    for (const o of adaylar) {
      if (!o.deliveredAt || !o.email || !this.izinVarMi(o)) continue;
      const eposta = o.email.toLowerCase();
      if (gonderilenEposta.has(eposta)) continue; // aynı turda aynı kişiye tek mail
      // En değerli kalemden başlayarak döngüsü gelmiş ilk ürünü seç
      const kalem = o.items.find((it) => tekrarSiparisZamaniMi(it.product?.category?.slug ?? "", o.deliveredAt!, now));
      if (!kalem) continue;
      const ok = await this.mail.sendTekrarSiparisEmail(o.id, { productSlug: kalem.productSlug, productName: kalem.productName });
      if (!ok) continue;
      await this.prisma.order.update({ where: { id: o.id }, data: { reorderMailSentAt: now } });
      gonderilenEposta.add(eposta); sent++;
    }
    if (sent) this.logger.log(`tekrar-siparis: ${sent} hatırlatma gönderildi (${adaylar.length} aday)`);
    return { sent };
  }

  // ---------------------------------------------------------------------------
  // Karar 2 — puan süresi (her sabah 08:30)
  // ---------------------------------------------------------------------------
  /**
   * GEÇİCİ OLARAK KAPALI (2026-09-07, Hasan kararı).
   *
   * 7 Eylül 08:40'ta bağlantı havuzu tükendi, site 45 dakika 500 döndü. Kök neden
   * kanıtlanamadı; tek ipucu bu işin 08:30'da koşup on dakika sonra havuzun ölmesi.
   * 500 kullanıcıya kadar döngüde tek tek SMTP maili gönderdiği için şüpheli.
   *
   * AÇMAK İÇİN: sunucuda `PUAN_SURESI_CRON=true` yapıp api konteynerini yeniden başlatın.
   * Kod değişikliği ya da deploy GEREKMEZ. Açarken bağlantı havuzunu izleyin:
   * Panel > Sistem Sağlığı > "Havuz zaman aşımı".
   */
  @Cron("30 8 * * *")
  async handlePuanSuresiCron(): Promise<void> {
    if (!cronAcikMi(process.env.PUAN_SURESI_CRON)) {
      this.logger.warn(
        "puan-suresi cron ATLANDI: PUAN_SURESI_CRON kapalı (7 Eylül kesinti şüphesi, geçici).",
      );
      return;
    }
    try { await this.runPuanSuresi(); } catch (e) { this.logger.error(`puan-suresi cron hatası: ${(e as Error).message}`); }
  }

  async runPuanSuresi(now = new Date()): Promise<{ hatirlatma1: number; hatirlatma2: number; sifirlanan: number }> {
    const sonuc = { hatirlatma1: 0, hatirlatma2: 0, sifirlanan: 0 };
    if (!this.loyalty.isEnabled()) return sonuc;
    const esik = new Date(now.getTime() + 31 * 86_400_000);
    const kullanicilar = await this.prisma.user.findMany({
      where: { loyaltyPoints: { gt: 0 }, loyaltyExpiresAt: { not: null, lte: esik }, deletedAt: null },
      select: { id: true, email: true, fullName: true, loyaltyPoints: true, loyaltyExpiresAt: true, loyaltyExpiryMailStage: true, marketingConsent: true },
      take: 500,
    });
    for (const u of kullanicilar) {
      const asama = puanSuresiAsamasi(u.loyaltyExpiresAt, u.loyaltyExpiryMailStage, u.loyaltyPoints, now);
      if (asama === null) continue;
      if (asama === "sifirla") {
        await this.loyalty.expireForUser(u.id);
        sonuc.sifirlanan++; continue;
      }
      // Süre hatırlatması müşterinin kendi bakiyesi hakkında bilgidir; yine de izinsiz alıcıya gitmez.
      if (!u.marketingConsent) continue;
      const ok = await this.mail.sendPuanSuresiEmail(u.email, u.fullName, u.loyaltyPoints, u.loyaltyExpiresAt!, asama);
      if (!ok) continue;
      await this.prisma.user.updateMany({ where: { id: u.id, loyaltyExpiryMailStage: { lt: asama } }, data: { loyaltyExpiryMailStage: asama } });
      if (asama === 1) sonuc.hatirlatma1++; else sonuc.hatirlatma2++;
    }
    if (sonuc.hatirlatma1 || sonuc.hatirlatma2 || sonuc.sifirlanan)
      this.logger.log(`puan-suresi: ${sonuc.hatirlatma1}+${sonuc.hatirlatma2} hatırlatma, ${sonuc.sifirlanan} sıfırlama`);
    return sonuc;
  }
}
