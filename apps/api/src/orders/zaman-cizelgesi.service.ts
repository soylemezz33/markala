import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { zamanCizelgesiKur, type ZamanOlayi } from "./zaman-cizelgesi-kural";

/**
 * Sipariş zaman çizelgesi (2026-09-16, Hasan: "her hareketi gün ve saatiyle sipariş detayında
 * görmek istiyorum"). Order kolonları + audit_logs (sipariş ve kalemleri) + order_notes +
 * notification_logs (metadata.orderNumber) birleştirilir. Parasal alan içermez → ORDERS_READ yeter.
 */
@Injectable()
export class ZamanCizelgesiService {
  constructor(private prisma: PrismaService) {}

  async olustur(orderId: string): Promise<ZamanOlayi[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderNumber: true, createdAt: true, paymentMethod: true, paymentStatus: true, notes: true,
        shippedAt: true, deliveredAt: true, trackingNumber: true, trackingCarrier: true,
        invoiceIssuedAt: true, invoiceMailedAt: true, invoiceNumber: true, invoiceType: true,
        items: { select: { id: true } },
      },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    const itemIds = order.items.map((i) => i.id);

    const [auditler, notlar, bildirimler] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { entityType: "Order", entityId: order.id },
            ...(itemIds.length ? [{ entityType: "OrderItem", entityId: { in: itemIds } }] : []),
          ],
        },
        select: { createdAt: true, action: true, diff: true, actorId: true, entityType: true },
        orderBy: { createdAt: "asc" },
        take: 300,
      }),
      this.prisma.orderNote.findMany({
        where: { orderId: order.id },
        select: { createdAt: true, body: true, authorName: true, authorRole: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.notificationLog.findMany({
        where: { metadata: { path: ["orderNumber"], equals: order.orderNumber } },
        select: { createdAt: true, channel: true, template: true, recipient: true, status: true },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    ]);

    const actorIds = [...new Set(auditler.map((a) => a.actorId).filter((x): x is string => Boolean(x)))];
    const kisiler = actorIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true, email: true } })
      : [];
    const ad = new Map(kisiler.map((k) => [k.id, (k.fullName ?? "").trim() || k.email]));

    return zamanCizelgesiKur({
      order,
      auditler: auditler.map((a) => ({ createdAt: a.createdAt, action: a.action, diff: a.diff, entityType: a.entityType, actorAd: a.actorId ? ad.get(a.actorId) ?? "Personel" : null })),
      notlar,
      bildirimler: bildirimler.map((b) => ({ ...b, channel: String(b.channel) })),
    });
  }
}
