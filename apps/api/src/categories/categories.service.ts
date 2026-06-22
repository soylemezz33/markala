import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async findBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: { products: { where: { isActive: true } } },
    });
    if (!cat) throw new NotFoundException(`Kategori bulunamadı: ${slug}`);
    return cat;
  }

  create(dto: CreateCategoryDto) {
    const data: Prisma.CategoryCreateInput = {
      slug: dto.slug,
      name: dto.name,
      shortDescription: dto.shortDescription,
      longDescription: dto.longDescription,
      imageUrl: dto.imageUrl,
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      startingPrice: new Prisma.Decimal(dto.startingPrice),
      productionTime: dto.productionTime,
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.category.create({ data });
  }

  update(id: string, dto: UpdateCategoryDto) {
    const data: Prisma.CategoryUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      ...(dto.productionTime !== undefined && { productionTime: dto.productionTime }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.content !== undefined && { content: dto.content === null ? Prisma.JsonNull : (dto.content as Prisma.InputJsonValue) }),
    };
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
