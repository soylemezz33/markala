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
