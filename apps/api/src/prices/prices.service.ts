import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export function adjustPrice(
  price: number,
  op: "percent" | "fixed",
  direction: "increase" | "decrease",
  value: number,
  round: "none" | "1" | "5" | "10" = "none",
): number {
  const sign = direction === "decrease" ? -1 : 1;
  let v = op === "percent" ? price * (1 + (sign * value) / 100) : price + sign * value;
  v = Math.max(0, v);
  const step = round && round !== "none" ? Number(round) : 0;
  return step > 0 ? Math.round(v / step) * step : Math.round(v * 100) / 100;
}

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
        locked: r.locked ?? false,
        ...(r.rules != null && { rules: r.rules as import("@prisma/client").Prisma.InputJsonValue }),
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

  async bulkAdjust(dto: import("./prices.dto").BulkAdjustDto) {
    const productWhere: Prisma.ProductWhereInput =
      dto.scope === "category" && dto.categoryId ? { categoryId: dto.categoryId } : {};
    const products = await this.prisma.product.findMany({ where: productWhere, select: { id: true } });
    const ids = products.map((p) => p.id);
    if (ids.length === 0) return { updated: 0 };
    const rows = await this.prisma.productPrice.findMany({ where: { productId: { in: ids } } });
    const ops = rows.map((r) =>
      this.prisma.productPrice.update({
        where: { id: r.id },
        data: { price: new Prisma.Decimal(adjustPrice(Number(r.price), dto.op, dto.direction, dto.value, dto.round ?? "none")) },
      }),
    );
    await this.prisma.$transaction(ops);
    return { updated: rows.length };
  }

  async categorySet(categoryId: string, price: number) {
    const products = await this.prisma.product.findMany({ where: { categoryId }, select: { id: true } });
    const ids = products.map((p) => p.id);
    if (ids.length === 0) return { set: 0, skipped: 0 };
    const withOpts = await this.prisma.productOption.findMany({
      where: { productId: { in: ids } }, select: { productId: true }, distinct: ["productId"],
    });
    const hasOpts = new Set(withOpts.map((o) => o.productId));
    const simple = ids.filter((id) => !hasOpts.has(id));
    const ops = simple.flatMap((id) => [
      this.prisma.productPrice.deleteMany({ where: { productId: id } }),
      this.prisma.productPrice.createMany({ data: [{ productId: id, price: new Prisma.Decimal(price) }] }),
    ]);
    if (ops.length) await this.prisma.$transaction(ops);
    return { set: simple.length, skipped: ids.length - simple.length };
  }
}
