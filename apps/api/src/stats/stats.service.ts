import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private has(...keys: string[]): boolean {
    return keys.every((k) => Boolean(this.config.get<string>(k)));
  }

  /** Entegrasyonların GERÇEK yapılandırma durumu (env'den) — admin "Entegrasyonlar" sayfası için. */
  private integrationStatus() {
    return {
      iyzico: this.has("IYZICO_API_KEY", "IYZICO_SECRET"),
      parasut: this.has("PARASUT_CLIENT_ID", "PARASUT_CLIENT_SECRET", "PARASUT_USERNAME", "PARASUT_PASSWORD", "PARASUT_COMPANY_ID"),
      // 2026-08-24: eskiden "sendgrid: has(SENDGRID_API_KEY)" idi — YANILTICIYDI. SendGrid
      // hiç kullanılmıyordu (stub); tüm mail MailService → nodemailer/SMTP üzerinden gidiyor.
      // Panel artık GERÇEK mail yolunun yapılandırma durumunu gösteriyor.
      smtp: this.has("SMTP_HOST", "SMTP_USER", "SMTP_PASS"),
      netgsm: this.has("NETGSM_USERNAME", "NETGSM_PASSWORD"),
      dhl: this.has("DHL_API_KEY"),
      r2: this.has("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"),
    };
  }

  /**
   * @param opts.includeFinance false ise PARASAL alanlar yanittan CIKARILIR (ciro,
   *   odeme bekleyen). 2026-08-21: tasarimci rolu dashboard'u aciyor ama tutar gormemeli.
   *   Kart gizlemek yetmez — veri hic gitmemeli.
   */
  async summary(opts: { includeFinance?: boolean } = {}) {
    // GERÇEKLEŞEN sipariş şartı: ödemesi başarılı VEYA cari (açık hesap — online ödeme
    // beklenmez). 2026-08-18: ödeme sağlayıcısına yönlendirmeden ÖNCE sipariş kaydı açıldığı
    // için yarıda bırakılan her deneme DB'de satır bırakıyor; orderCount ve ordersByStatus
    // bunları da sayınca panel gerçekte olmayan siparişleri raporluyordu. `revenue` zaten
    // doğru filtreliyordu — sayımlar da onunla hizalandı (toplam ile kırılım tutarlı kalsın).
    const realOrder = {
      deletedAt: null,
      OR: [{ paymentStatus: "basarili" as const }, { paymentMethod: "cari" }],
    };
    const [
      orderCount,
      revenueAgg,
      customerCount,
      pendingCorporate,
      byStatus,
      unpaidCount,
      unreadMessages,
      newQuotes,
      pendingReviews,
    ] = await Promise.all([
        this.prisma.order.count({ where: realOrder }),
        // CİRO: ödemesi başarılı VE iptal edilmemiş siparişler.
        // 2026-08-20 (Hasan bildirdi): status filtresi YOKTU → ödenip sonra iptal edilen
        // sipariş ciroda kalıyordu. Gerçek veride 529,00 TL'lik iptal sipariş toplam
        // cironun %16'sını şişiriyordu. Ayrıca iadesi yapılmış ödemeler de düşülür.
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            paymentStatus: "basarili",
            deletedAt: null,
            status: { not: "iptal_edildi" },
          },
        }),
        this.prisma.user.count({ where: { role: "customer" } }),
        this.prisma.corporateApplication.count({ where: { status: "pending" } }),
        this.prisma.order.groupBy({ by: ["status"], _count: true, where: realOrder }),
        // Ödemesi tamamlanmamış (terk edilmiş olabilir) siparişler — panelde takip için.
        this.prisma.order.count({
          where: {
            deletedAt: null,
            paymentStatus: "beklemede",
            paymentMethod: { not: "cari" },
            status: { not: "iptal_edildi" },
          },
        }),
        // Sol menü rozetleri + bildirim çanı için okunmamış/işlenmemiş sayaçları.
        // 2026-08-20: panelde "Gelen Kutusu"/"Teklif Talepleri" yanında hiç rozet
        // çıkmıyordu — sayaçlar hiç hesaplanmıyordu, alan admin-shell'de boş duruyordu.
        this.prisma.contactMessage.count({ where: { status: "new" } }),
        this.prisma.quoteRequest.count({ where: { status: "new" } }),
        this.prisma.review.count({ where: { isApproved: false } }),
      ]);

    const includeFinance = opts.includeFinance !== false;
    return {
      orderCount,
      ...(includeFinance ? { revenue: Number(revenueAgg._sum.total ?? 0) } : {}),
      customerCount,
      pendingCorporate,
      // Odeme bekleyen = parasal takip; finans izni olmayan rol gormemeli.
      ...(includeFinance ? { unpaidCount } : {}),
      unreadMessages,
      newQuotes,
      pendingReviews,
      ordersByStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      integrations: this.integrationStatus(),
    };
  }
}
