import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBannerDto, UpdateBannerDto } from "./banners.dto";

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    });
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        location: dto.location,
        imageUrl: dto.imageUrl,
        ...(dto.mobileImageUrl !== undefined && { mobileImageUrl: dto.mobileImageUrl }),
        ...(dto.ctaLabel !== undefined && { ctaLabel: dto.ctaLabel }),
        ...(dto.ctaHref !== undefined && { ctaHref: dto.ctaHref }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  update(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.mobileImageUrl !== undefined && { mobileImageUrl: dto.mobileImageUrl }),
        ...(dto.ctaLabel !== undefined && { ctaLabel: dto.ctaLabel }),
        ...(dto.ctaHref !== undefined && { ctaHref: dto.ctaHref }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
