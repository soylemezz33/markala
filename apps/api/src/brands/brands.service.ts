import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBrandDto, UpdateBrandDto } from "./brands.dto";

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  /** Admin listesi — pasifler dahil tümü, sıraya göre. */
  findAll() {
    return this.prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  /** Public — yalnız AKTİF markalar, sıraya göre. Pasif sızdırılmaz. */
  findActive() {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  create(dto: CreateBrandDto) {
    const data: Prisma.BrandCreateInput = {
      name: dto.name,
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.brand.create({ data });
  }

  update(id: string, dto: UpdateBrandDto) {
    const data: Prisma.BrandUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.brand.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.brand.delete({ where: { id } });
  }
}
