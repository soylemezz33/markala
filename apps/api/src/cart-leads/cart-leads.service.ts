import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCartLeadDto } from "./cart-leads.dto";

@Injectable()
export class CartLeadsService {
  private readonly logger = new Logger(CartLeadsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Sepet e-postasını kalıcı kaydet + onaylıysa ConsentLog'a düş (KVKK/ETK açık rıza izi).
   * consent=false ise sadece kayıt tutulur, hiçbir zaman hatırlatma maili gönderilmez.
   */
  async create(dto: CreateCartLeadDto, ip?: string, userAgent?: string) {
    const lead = await this.prisma.cartLead.create({
      data: {
        sessionId: dto.sessionId,
        email: dto.email,
        cartSnapshot: dto.cart as unknown as Prisma.InputJsonValue,
        consent: dto.consent,
      },
    });

    if (dto.consent) {
      await this.prisma.consentLog
        .create({
          data: {
            email: dto.email,
            consentType: "marketing",
            granted: true,
            ipAddress: ip ?? null,
            userAgent: userAgent ?? null,
            version: "sepet-hatirlatma-2026-08",
          },
        })
        .catch((err) => this.logger.warn(`consentLog yazılamadı email=${dto.email}: ${(err as Error).message}`));
    }

    return { id: lead.id };
  }
}
