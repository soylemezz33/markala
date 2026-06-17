import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCampaignPackageDto, UpdateCampaignPackageDto } from "./campaign-packages.dto";

@Injectable()
export class CampaignPackagesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.campaignPackage.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  }

  /** Storefront için aktif paketler (public). */
  findActive() {
    return this.prisma.campaignPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  create(dto: CreateCampaignPackageDto) {
    const data: Prisma.CampaignPackageCreateInput = {
      slug: dto.slug,
      name: dto.name,
      category: dto.category,
      contents: dto.contents,
      listPrice: new Prisma.Decimal(dto.listPrice),
      packagePrice: new Prisma.Decimal(dto.packagePrice),
      ...(dto.stockLimit !== undefined && { stockLimit: dto.stockLimit }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      ...(dto.designSupport !== undefined && { designSupport: dto.designSupport }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.campaignPackage.create({ data });
  }

  update(id: string, dto: UpdateCampaignPackageDto) {
    const data: Prisma.CampaignPackageUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.contents !== undefined && { contents: dto.contents }),
      ...(dto.listPrice !== undefined && { listPrice: new Prisma.Decimal(dto.listPrice) }),
      ...(dto.packagePrice !== undefined && { packagePrice: new Prisma.Decimal(dto.packagePrice) }),
      ...(dto.stockLimit !== undefined && { stockLimit: dto.stockLimit }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      ...(dto.designSupport !== undefined && { designSupport: dto.designSupport }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.campaignPackage.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.campaignPackage.update({ where: { id }, data: { isActive: false } });
  }
}
