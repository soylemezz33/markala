import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
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

  create(data: {
    slug: string;
    name: string;
    shortDescription: string;
    longDescription: string;
    imageUrl: string;
    accentColor?: string;
    startingPrice: number;
    productionTime: string;
    sortOrder?: number;
  }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<Parameters<this["create"]>[0]> & { isActive?: boolean }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
