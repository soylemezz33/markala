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
      sendgrid: this.has("SENDGRID_API_KEY"),
      netgsm: this.has("NETGSM_USERNAME", "NETGSM_PASSWORD"),
      dhl: this.has("DHL_API_KEY"),
      r2: this.has("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"),
    };
  }

  async summary() {
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
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "basarili", deletedAt: null },
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

    return {
      orderCount,
      revenue: Number(revenueAgg._sum.total ?? 0),
      customerCount,
      pendingCorporate,
      unpaidCount,
      unreadMessages,
      newQuotes,
      pendingReviews,
      ordersByStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      integrations: this.integrationStatus(),
    };
  }
}
