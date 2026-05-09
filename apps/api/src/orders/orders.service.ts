import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MK-${ts}-${rand}`;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(input: {
    userId?: string;
    email: string;
    phone: string;
    items: Array<{
      productId: string;
      productSlug: string;
      productName: string;
      productImage: string;
      configurationSummary: string;
      configuration: any;
      unitPrice: number;
      quantity: number;
      needsDesignSupport?: boolean;
      uploadedFileName?: string;
      uploadedFileUrl?: string;
    }>;
    shippingAddressId: string;
    billingAddressId: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    vat: number;
    total: number;
  }) {
    return this.prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: input.userId,
        email: input.email,
        phone: input.phone,
        subtotal: input.subtotal,
        shippingFee: input.shippingFee,
        discount: input.discount,
        vat: input.vat,
        total: input.total,
        shippingAddressId: input.shippingAddressId,
        billingAddressId: input.billingAddressId,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            productSlug: i.productSlug,
            productName: i.productName,
            productImage: i.productImage,
            configurationSummary: i.configurationSummary,
            configuration: i.configuration,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            lineTotal: i.unitPrice * i.quantity,
            needsDesignSupport: i.needsDesignSupport ?? false,
            uploadedFileName: i.uploadedFileName,
            uploadedFileUrl: i.uploadedFileUrl,
          })),
        },
      },
      include: { items: true, shippingAddress: true, billingAddress: true },
    });
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  listAll(opts: { status?: string; take?: number; skip?: number } = {}) {
    return this.prisma.order.findMany({
      where: opts.status ? { status: opts.status as any } : {},
      include: { items: true, user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shippingAddress: true, billingAddress: true, user: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (userId && order.userId !== userId) throw new ForbiddenException("Bu siparişe erişim izniniz yok.");
    return order;
  }

  updateStatus(id: string, status: string, extras?: { trackingNumber?: string; trackingCarrier?: string }) {
    return this.prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        ...extras,
        ...(status === "kargoya-verildi" && { shippedAt: new Date() }),
        ...(status === "teslim-edildi" && { deliveredAt: new Date() }),
      },
    });
  }
}
