import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /** Dashboard özeti — sipariş/ciro/müşteri/bekleyen iş agregasyonları (silinmemiş kayıtlar). */
  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notDeleted = { deletedAt: null };

    const [
      totalOrders,
      todayOrders,
      ordersByStatusRaw,
      revenueAgg,
      todayRevenueAgg,
      customerCount,
      pendingCorporate,
      pendingReviews,
      recent,
    ] = await Promise.all([
      this.prisma.order.count({ where: notDeleted }),
      this.prisma.order.count({ where: { ...notDeleted, createdAt: { gte: startOfToday } } }),
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where: notDeleted }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { ...notDeleted, paymentStatus: "basarili" } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { ...notDeleted, paymentStatus: "basarili", createdAt: { gte: startOfToday } },
      }),
      this.prisma.user.count({ where: { role: "customer", deletedAt: null } }),
      this.prisma.corporateApplication.count({ where: { status: "pending" } }),
      this.prisma.review.count({ where: { isApproved: false } }),
      this.prisma.order.findMany({
        where: notDeleted,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          orderNumber: true,
          email: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { fullName: true, accountType: true } },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of ordersByStatusRaw) byStatus[r.status] = r._count._all;

    return {
      revenue: {
        total: Number(revenueAgg._sum.total ?? 0),
        today: Number(todayRevenueAgg._sum.total ?? 0),
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        inProduction: byStatus["uretimde"] ?? 0,
        byStatus,
      },
      customers: { total: customerCount },
      pending: {
        corporateApplications: pendingCorporate,
        reviews: pendingReviews,
      },
      recentOrders: recent.map((o) => ({
        orderNumber: o.orderNumber,
        customer: o.user?.fullName ?? o.email,
        isCorporate: o.user?.accountType === "corporate",
        total: Number(o.total),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
    };
  }
}
