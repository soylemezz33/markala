import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./quote-requests.dto";

@Injectable()
export class QuoteRequestsService {
  private readonly logger = new Logger(QuoteRequestsService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  /** Teklif talebini kalıcı kaydet (SMTP'den bağımsız — lead kaybolmaz). */
  async create(dto: CreateQuoteRequestDto) {
    const ticketId = dto.ticketId?.trim() || `TQ-${Date.now().toString(36).toUpperCase()}`;
    const products = (dto.products ?? [])
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .slice(0, 30);
    const req = await this.prisma.quoteRequest.create({
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
    // n8n'e yeni talep bildirimi (Trello kart otomasyonu). Fire-and-forget, akışı bloke etmez.
    void this.notifyN8nNewLead(req.id).catch(() => undefined);
    return req;
  }

  /**
   * n8n'e yeni teklif talebi webhook'u. N8N_LEAD_WEBHOOK_URL tanımlı değilse
   * no-op. Hatalar yutulur — kayıt akışını asla bozmaz.
   */
  private async notifyN8nNewLead(id: string): Promise<void> {
    const url = this.config.get<string>("N8N_LEAD_WEBHOOK_URL");
    if (!url) return;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quote", id }),
      });
      if (!res.ok) this.logger.warn(`n8n webhook HTTP ${res.status} quote=${id}`);
    } catch (err) {
      this.logger.warn(`n8n webhook gönderilemedi quote=${id}: ${(err as Error).message}`);
    }
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
