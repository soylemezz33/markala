import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFaqDto, UpdateFaqDto } from "./faqs.dto";

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.faq.findMany({
      where: category ? { category } : {},
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  }

  /** Halka açık liste (storefront /yardim/sss) — yalnız aktif kayıtlar. */
  findAllPublic() {
    return this.prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        productSlug: true,
        sortOrder: true,
      },
    });
  }

  create(dto: CreateFaqDto) {
    return this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        ...(dto.productSlug !== undefined && { productSlug: dto.productSlug }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  update(id: string, dto: UpdateFaqDto) {
    return this.prisma.faq.update({
      where: { id },
      data: {
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.answer !== undefined && { answer: dto.answer }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.productSlug !== undefined && { productSlug: dto.productSlug }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.faq.delete({ where: { id } });
  }
}
