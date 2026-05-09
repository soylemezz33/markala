import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(opts: { categorySlug?: string; bestseller?: boolean; take?: number; skip?: number } = {}) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(opts.bestseller !== undefined && { bestseller: opts.bestseller }),
        ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
      },
      include: { category: true },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Ürün bulunamadı: ${slug}`);
    return product;
  }

  create(data: any) {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
