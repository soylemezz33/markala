import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ClaimDesignsDto, CreateDesignDto, UpdateDesignDto } from "./designs.dto";

const MAX_DOC_BYTES = 4_000_000; // Fabric JSON üst sınırı (~4MB)

@Injectable()
export class DesignsService {
  constructor(private prisma: PrismaService) {}

  private assertDocSize(document: unknown) {
    if (JSON.stringify(document ?? {}).length > MAX_DOC_BYTES) {
      throw new PayloadTooLargeException("Tasarım çok büyük (4MB sınırı).");
    }
  }

  private owns(d: { userId: string | null; sessionId: string | null }, userId?: string, sessionId?: string) {
    if (userId && d.userId === userId) return true;
    if (sessionId && d.sessionId === sessionId) return true;
    return false;
  }

  async create(dto: CreateDesignDto, userId?: string) {
    this.assertDocSize(dto.document);
    if (!userId && !dto.sessionId) {
      throw new BadRequestException("Misafir tasarımı için sessionId gerekli.");
    }
    return this.prisma.design.create({
      data: {
        name: dto.name?.trim() || "Tasarım",
        userId: userId ?? null,
        // Üye ise sessionId tutma (tasarım hesaba bağlı); misafir ise session ile izlenir.
        sessionId: userId ? null : dto.sessionId ?? null,
        document: dto.document as Prisma.InputJsonValue,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        bleedMm: dto.bleedMm ?? 3,
        previewUrl: dto.previewUrl ?? null,
        templateId: dto.templateId ?? null,
        productId: dto.productId ?? null,
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });
  }

  async getOwned(id: string, userId?: string, sessionId?: string) {
    const d = await this.prisma.design.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("Tasarım bulunamadı.");
    if (!this.owns(d, userId, sessionId)) throw new ForbiddenException("Bu tasarıma erişiminiz yok.");
    return d;
  }

  async update(id: string, dto: UpdateDesignDto, userId?: string, sessionId?: string) {
    await this.getOwned(id, userId, sessionId ?? dto.sessionId);
    if (dto.document !== undefined) this.assertDocSize(dto.document);
    return this.prisma.design.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() || "Tasarım" } : {}),
        ...(dto.document !== undefined ? { document: dto.document as Prisma.InputJsonValue } : {}),
        ...(dto.previewUrl !== undefined ? { previewUrl: dto.previewUrl } : {}),
      },
      select: { id: true, updatedAt: true },
    });
  }

  async listMine(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) return [];
    const or: Prisma.DesignWhereInput[] = [];
    if (userId) or.push({ userId });
    if (sessionId) or.push({ sessionId });
    return this.prisma.design.findMany({
      where: { deletedAt: null, OR: or },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        previewUrl: true,
        widthMm: true,
        heightMm: true,
        updatedAt: true,
      },
      take: 100,
    });
  }

  /** Misafir tasarımlarını (sessionId) login sonrası hesaba bağla. */
  async claim(dto: ClaimDesignsDto, userId: string) {
    const res = await this.prisma.design.updateMany({
      where: { sessionId: dto.sessionId, userId: null, deletedAt: null },
      data: { userId, sessionId: null },
    });
    return { claimed: res.count };
  }

  async listTemplates(category?: string) {
    return this.prisma.designTemplate.findMany({
      where: { isActive: true, ...(category ? { categorySlug: category } : {}) },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        categorySlug: true,
        productSlug: true,
        thumbnailUrl: true,
        widthMm: true,
        heightMm: true,
        bleedMm: true,
        document: true,
      },
    });
  }
}
