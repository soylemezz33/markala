import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from "./portfolio.dto";

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  /** Admin listesi — pasifler dahil tümü, sıraya göre. */
  findAll() {
    return this.prisma.portfolioItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  /** Public — yalnız AKTİF portfolyo öğeleri, sıraya göre. Pasif sızdırılmaz. */
  findActive() {
    return this.prisma.portfolioItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  create(dto: CreatePortfolioItemDto) {
    const data: Prisma.PortfolioItemCreateInput = {
      slug: dto.slug,
      title: dto.title,
      imageUrl: dto.imageUrl,
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.client !== undefined && { client: dto.client }),
      ...(dto.productSlug !== undefined && { productSlug: dto.productSlug }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.portfolioItem.create({ data });
  }

  update(id: string, dto: UpdatePortfolioItemDto) {
    const data: Prisma.PortfolioItemUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.client !== undefined && { client: dto.client }),
      ...(dto.productSlug !== undefined && { productSlug: dto.productSlug }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.portfolioItem.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.portfolioItem.delete({ where: { id } });
  }
}
