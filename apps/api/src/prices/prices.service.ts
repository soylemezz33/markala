import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PricesService {
  constructor(private prisma: PrismaService) {}

  private async assertProduct(productId: string) {
    const p = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!p) throw new NotFoundException(`Ürün bulunamadı: ${productId}`);
  }

  async getForProduct(productId: string) {
    await this.assertProduct(productId);
    const [options, prices] = await Promise.all([
      this.prisma.productOption.findMany({
        where: { productId },
        orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }],
      }),
      this.prisma.productPrice.findMany({ where: { productId } }),
    ]);
    return { options, prices };
  }

  async setOptions(productId: string, rows: import("./prices.dto").OptionInputDto[]) {
    await this.assertProduct(productId);
    await this.prisma.productOption.deleteMany({ where: { productId } });
    if (rows.length === 0) return { count: 0 };
    const { count } = await this.prisma.productOption.createMany({
      data: rows.map((r) => ({
        productId,
        groupKey: r.groupKey, groupLabel: r.groupLabel, groupRole: r.groupRole, groupSort: r.groupSort,
        optionKey: r.optionKey, optionLabel: r.optionLabel,
        ...(r.optionSublabel != null && { optionSublabel: r.optionSublabel }),
        optionSort: r.optionSort,
      })),
    });
    return { count };
  }

  async setPrices(productId: string, rows: import("./prices.dto").PriceInputDto[]) {
    await this.assertProduct(productId);
    await this.prisma.productPrice.deleteMany({ where: { productId } });
    if (rows.length === 0) return { count: 0 };
    const { count } = await this.prisma.productPrice.createMany({
      data: rows.map((r) => ({
        productId,
        ...(r.groupKey != null && { groupKey: r.groupKey }),
        ...(r.optionKey != null && { optionKey: r.optionKey }),
        ...(r.dimKey != null && { dimKey: r.dimKey }),
        ...(r.cost != null && { cost: new Prisma.Decimal(r.cost) }),
        price: new Prisma.Decimal(r.price),
      })),
    });
    return { count };
  }
}
