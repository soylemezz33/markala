import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHeroSlideDto, UpdateHeroSlideDto } from "./hero-slides.dto";

@Injectable()
export class HeroSlidesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.heroSlide.findMany({
      ...(includeInactive ? {} : { where: { isActive: true } }),
      orderBy: { sortOrder: "asc" },
    });
  }

  create(dto: CreateHeroSlideDto) {
    return this.prisma.heroSlide.create({ data: dto as Prisma.HeroSlideCreateInput });
  }

  update(id: string, dto: UpdateHeroSlideDto) {
    return this.prisma.heroSlide.update({ where: { id }, data: dto as Prisma.HeroSlideUpdateInput });
  }

  remove(id: string) {
    return this.prisma.heroSlide.delete({ where: { id } });
  }
}
