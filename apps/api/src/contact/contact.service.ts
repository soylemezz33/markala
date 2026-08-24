import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContactDto } from "./contact.dto";

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  /** İletişim mesajını kalıcı kaydet (SMTP'den bağımsız — lead kaybolmaz). */
  async create(dto: CreateContactDto) {
    const ticketId = dto.ticketId?.trim() || `TK-${Date.now().toString(36).toUpperCase()}`;
    const msg = await this.prisma.contactMessage.create({
      data: {
        ticketId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        source: dto.source || "iletisim",
      },
    });
    // n8n'e yeni talep bildirimi (Trello kart otomasyonu). Fire-and-forget, akışı bloke etmez.
    void this.notifyN8nNewLead(msg.id).catch(() => undefined);
    return msg;
  }

  /**
   * n8n'e yeni iletişim talebi webhook'u. N8N_LEAD_WEBHOOK_URL tanımlı değilse
   * no-op. Hatalar yutulur — kayıt akışını asla bozmaz.
   */
  private async notifyN8nNewLead(id: string): Promise<void> {
    const url = this.config.get<string>("N8N_LEAD_WEBHOOK_URL");
    if (!url) return;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", id }),
      });
      if (!res.ok) this.logger.warn(`n8n webhook HTTP ${res.status} contact=${id}`);
    } catch (err) {
      this.logger.warn(`n8n webhook gönderilemedi contact=${id}: ${(err as Error).message}`);
    }
  }

  /** Admin: mesaj listesi (en yeni önce). Opsiyonel durum filtresi. */
  findAll(opts: { status?: string } = {}) {
    return this.prisma.contactMessage.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  /** Admin: mesaj durumu (new | read | archived). */
  setStatus(id: string, status: string) {
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }
}
