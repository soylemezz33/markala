import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

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
    };
  }
}
