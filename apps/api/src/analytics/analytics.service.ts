import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EVENTS, type EventName } from "./event-taxonomy";
import type { TrackEventDto } from "./analytics.dto";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(dto: TrackEventDto, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        eventName: dto.eventName,
        sessionId: dto.sessionId,
        userId: userId ?? null,
        orderId: dto.orderId ?? null,
        productId: dto.productId ?? null,
        properties: (dto.properties as object) ?? {},
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }

  async getFunnelCounts(startDate: Date, endDate: Date): Promise<{ event: EventName; count: number }[]> {
    const funnelEvents: EventName[] = [
      EVENTS.PRODUCT_VIEWED,
      EVENTS.CART_ITEM_ADDED,
      EVENTS.CHECKOUT_STARTED,
      EVENTS.PAYMENT_INITIATED,
      EVENTS.ORDER_PLACED,
    ];

    const results = await this.prisma.analyticsEvent.groupBy({
      by: ["eventName"],
      where: {
        eventName: { in: funnelEvents },
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    return funnelEvents.map((event) => ({
      event,
      count: results.find((r) => r.eventName === event)?._count.id ?? 0,
    }));
  }

  async getTopProducts(
    startDate: Date,
    endDate: Date,
    limit = 10,
  ): Promise<{ productId: string; viewCount: number; addToCartCount: number }[]> {
    const [views, adds] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ["productId"],
        where: { eventName: EVENTS.PRODUCT_VIEWED, productId: { not: null }, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: limit,
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ["productId"],
        where: { eventName: EVENTS.CART_ITEM_ADDED, productId: { not: null }, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
    ]);

    return views
      .filter((v) => v.productId)
      .map((v) => ({
        productId: v.productId!,
        viewCount: v._count.id,
        addToCartCount: adds.find((a) => a.productId === v.productId)?._count.id ?? 0,
      }));
  }

  async getDailyEventVolume(eventName: EventName, startDate: Date, endDate: Date): Promise<{ date: string; count: number }[]> {
    const rows = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("created_at")::text AS date, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE event_name = ${eventName}
        AND "created_at" >= ${startDate}
        AND "created_at" <= ${endDate}
      GROUP BY DATE("created_at")
      ORDER BY DATE("created_at")
    `;
    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }
}
