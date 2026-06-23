import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./quote-requests.dto";

@Injectable()
export class QuoteRequestsService {
  constructor(private prisma: PrismaService) {}

  /** Teklif talebini kalıcı kaydet (SMTP'den bağımsız — lead kaybolmaz). */
  create(dto: CreateQuoteRequestDto) {
    const ticketId = dto.ticketId?.trim() || `TQ-${Date.now().toString(36).toUpperCase()}`;
    const products = (dto.products ?? [])
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .slice(0, 30);
    return this.prisma.quoteRequest.create({
      data: {
        ticketId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        companyName: dto.companyName?.trim() || null,
        sector: dto.sector?.trim() || null,
        products,
        budget: dto.budget?.trim() || null,
        quantity: dto.quantity?.trim() || null,
        message: dto.message?.trim() || null,
        source: dto.source?.trim() || "teklif-al",
      },
    });
  }

  /** Admin: talep listesi (en yeni önce). Opsiyonel durum filtresi. */
  findAll(opts: { status?: string } = {}) {
    return this.prisma.quoteRequest.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  /** Admin: talep durumu (new | contacted | quoted | closed). */
  setStatus(id: string, status: string) {
    return this.prisma.quoteRequest.update({ where: { id }, data: { status } });
  }
}
