import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCouponDto, UpdateCouponDto } from "./coupons.dto";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  /**
   * Kupon ANINDA doğrulama (public, read-only) — kullanıcı checkout'ta kupon girince
   * gerçek geçerlilik + gerçek indirim tutarını döndürür (client tahmini yerine).
   * Sipariş OLUŞTURMAZ, usedCount ARTIRMAZ. Kurallar orders.service ile birebir aynı.
   * firstOrderOnly: email/userId ile önceki sipariş kontrolü (anonimde email ile).
   */
  async validate(
    code: string,
    subtotal: number,
    opts: { userId?: string; email?: string } = {},
  ) {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const c = await this.prisma.coupon.findUnique({ where: { code: (code ?? "").trim().toUpperCase() } });
    if (!c || !c.isActive) return { valid: false as const, reason: "Kupon bulunamadı veya geçerli değil." };
    const now = new Date();
    if (c.validFrom && now < c.validFrom) return { valid: false as const, reason: "Kupon henüz başlamadı." };
    if (c.validUntil && now > c.validUntil) return { valid: false as const, reason: "Kuponun süresi dolmuş." };
    if (c.maxUses != null && c.usedCount >= c.maxUses) return { valid: false as const, reason: "Kupon kullanım limitine ulaşıldı." };
    const minOrder = c.minOrderAmount != null ? Number(c.minOrderAmount) : 0;
    if (subtotal < minOrder) {
      return { valid: false as const, reason: `Bu kupon ${minOrder.toLocaleString("tr-TR")} ₺ ve üzeri siparişlerde geçerli.` };
    }
    if (c.firstOrderOnly) {
      const or: Array<{ userId?: string; email?: string }> = [];
      if (opts.userId) or.push({ userId: opts.userId });
      if (opts.email) or.push({ email: opts.email });
      const priorCount = or.length ? await this.prisma.order.count({ where: { OR: or } }) : 0;
      if (priorCount > 0) return { valid: false as const, reason: "Bu kupon yalnızca ilk siparişinizde geçerli." };
    }
    const value = Number(c.value);
    let discount = 0;
    if (c.type === "percentage") discount = round2((subtotal * value) / 100);
    else if (c.type === "fixed_amount") discount = round2(Math.min(value, subtotal));
    return {
      valid: true as const,
      code: c.code,
      type: c.type,
      value,
      discount,
      freeShipping: c.type === "free_shipping",
    };
  }

  create(dto: CreateCouponDto) {
    const data: Prisma.CouponCreateInput = {
      code: dto.code,
      type: dto.type,
      value: new Prisma.Decimal(dto.value),
      ...(dto.minOrderAmount !== undefined && { minOrderAmount: new Prisma.Decimal(dto.minOrderAmount) }),
      ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      ...(dto.validFrom !== undefined && { validFrom: new Date(dto.validFrom) }),
      ...(dto.validUntil !== undefined && { validUntil: new Date(dto.validUntil) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.coupon.create({ data });
  }

  update(id: string, dto: UpdateCouponDto) {
    const data: Prisma.CouponUpdateInput = {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.value !== undefined && { value: new Prisma.Decimal(dto.value) }),
      ...(dto.minOrderAmount !== undefined && { minOrderAmount: new Prisma.Decimal(dto.minOrderAmount) }),
      ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      ...(dto.validFrom !== undefined && { validFrom: new Date(dto.validFrom) }),
      ...(dto.validUntil !== undefined && { validUntil: new Date(dto.validUntil) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.coupon.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
