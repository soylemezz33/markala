import { Injectable, NotFoundException } from "@nestjs/common";
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
}
