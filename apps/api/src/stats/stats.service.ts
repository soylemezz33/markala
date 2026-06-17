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
    const [orderCount, revenueAgg, customerCount, pendingCorporate, byStatus] = await Promise.all([
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "basarili", deletedAt: null } }),
      this.prisma.user.count({ where: { role: "customer" } }),
      this.prisma.corporateApplication.count({ where: { status: "pending" } }),
      this.prisma.order.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
    ]);

    return {
      orderCount,
      revenue: Number(revenueAgg._sum.total ?? 0),
      customerCount,
      pendingCorporate,
      ordersByStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      integrations: this.integrationStatus(),
    };
  }
}
