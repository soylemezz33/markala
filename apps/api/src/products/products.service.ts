import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./products.dto";

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

  create(dto: CreateProductDto) {
    const data: Prisma.ProductCreateInput = {
      slug: dto.slug,
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      basePrice: new Prisma.Decimal(dto.basePrice),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      productionTime: dto.productionTime,
      ...(dto.sizeLabel !== undefined && { sizeLabel: dto.sizeLabel }),
      images: dto.images,
      ...(dto.badges !== undefined && { badges: dto.badges }),
      ...(dto.bestseller !== undefined && { bestseller: dto.bestseller }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parameters !== undefined && { parameters: dto.parameters as Prisma.InputJsonValue }),
      category: { connect: { id: dto.categoryId } },
    };
    return this.prisma.product.create({ data });
  }

  async update(id: string, dto: UpdateProductDto) {
    const data: Prisma.ProductUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.basePrice !== undefined && { basePrice: new Prisma.Decimal(dto.basePrice) }),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      ...(dto.productionTime !== undefined && { productionTime: dto.productionTime }),
      ...(dto.sizeLabel !== undefined && { sizeLabel: dto.sizeLabel }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.badges !== undefined && { badges: dto.badges }),
      ...(dto.bestseller !== undefined && { bestseller: dto.bestseller }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parameters !== undefined && { parameters: dto.parameters as Prisma.InputJsonValue }),
      ...(dto.categoryId !== undefined && { category: { connect: { id: dto.categoryId } } }),
    };

    // FİYAT TUTARLILIĞI: startingPrice değişiyor ve basePrice elle verilmemişse, ürün
    // KONFİGÜRATÖRSÜZ (parameters boş) ise basePrice'ı da eşitle. Böylece basit üründe
    // "gösterilen fiyat (startingPrice)" = "siparişte tahsil edilen (basePrice)" olur.
    // Konfigüratörlü ürünlerde basePrice'a DOKUNULMAZ (fiyat matrix/quantity'den gelir).
    if (dto.startingPrice !== undefined && dto.basePrice === undefined) {
      const current = await this.prisma.product.findUnique({ where: { id }, select: { parameters: true } });
      const params = current?.parameters;
      const hasConfigurator = Array.isArray(params) && params.length > 0;
      if (!hasConfigurator) {
        data.basePrice = new Prisma.Decimal(dto.startingPrice);
      }
    }

    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
