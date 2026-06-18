import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLegalPageDto, UpdateLegalPageDto } from "./legal.dto";

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.legalPage.findMany({ orderBy: { title: "asc" } });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.legalPage.findUnique({ where: { slug } });
    if (!page) {
      throw new NotFoundException(`Yasal sayfa bulunamadı: ${slug}`);
    }
    return page;
  }

  create(dto: CreateLegalPageDto) {
    return this.prisma.legalPage.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        ...(dto.version !== undefined && { version: dto.version }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  update(id: string, dto: UpdateLegalPageDto) {
    return this.prisma.legalPage.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.version !== undefined && { version: dto.version }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.legalPage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // === Public (guard'sız) — yalnız AKTİF sayfalar ===

  /** Aktif yasal sayfa listesi (slug+title; sitemap için). Pasif sayfa sızdırılmaz. */
  findActive() {
    return this.prisma.legalPage.findMany({
      where: { isActive: true },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  }

  /** Tek aktif yasal sayfa; yoksa veya pasifse 404. */
  async findActiveBySlug(slug: string) {
    const page = await this.prisma.legalPage.findFirst({
      where: { slug, isActive: true },
    });
    if (!page) {
      throw new NotFoundException(`Yasal sayfa bulunamadı: ${slug}`);
    }
    return page;
  }
}
