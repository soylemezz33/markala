import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContactDto } from "./contact.dto";

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  /** İletişim mesajını kalıcı kaydet (SMTP'den bağımsız — lead kaybolmaz). */
  create(dto: CreateContactDto) {
    const ticketId = dto.ticketId?.trim() || `TK-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.contactMessage.create({
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
