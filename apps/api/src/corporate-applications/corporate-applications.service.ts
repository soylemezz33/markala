import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CorporateStatus } from "@prisma/client";
import type { CreateCorporateApplicationDto } from "./corporate-applications.dto";

@Injectable()
export class CorporateApplicationsService {
  constructor(private prisma: PrismaService) {}

  /** Public B2B başvurusu — panele "pending" olarak düşer. */
  create(dto: CreateCorporateApplicationDto, userId?: string) {
    return this.prisma.corporateApplication.create({
      data: {
        userId: userId ?? null,
        companyName: dto.companyName,
        taxOffice: dto.taxOffice?.trim() || "-",
        taxNumber: dto.taxNumber,
        sector: dto.sector ?? null,
        annualVolume: dto.annualVolume ?? null,
        contactName: dto.contactName,
        contactRole: dto.contactRole ?? null,
        email: dto.email,
        phone: dto.phone,
        address: dto.address?.trim() || "-",
        notes: dto.notes ?? null,
        status: "pending",
      },
    });
  }

  findAll(status?: string) {
    return this.prisma.corporateApplication.findMany({
      where: status ? { status: status as CorporateStatus } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.corporateApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Başvuru bulunamadı.");
    return app;
  }

  /** Başvuruyu onayla/reddet; onayda bağlı kullanıcıyı kurumsal yap. */
  async review(
    id: string,
    reviewerId: string,
    status: "approved" | "rejected",
    reviewNote?: string,
  ) {
    const app = await this.prisma.corporateApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Başvuru bulunamadı.");

    const updated = await this.prisma.corporateApplication.update({
      where: { id },
      data: { status, reviewNote, reviewedById: reviewerId, reviewedAt: new Date() },
    });

    if (app.userId) {
      if (status === "approved") {
        await this.prisma.user.update({
          where: { id: app.userId },
          data: {
            accountType: "corporate",
            corporateStatus: "approved",
            corporateApprovedAt: new Date(),
            companyName: app.companyName,
            taxOffice: app.taxOffice,
            taxNumber: app.taxNumber,
          },
        });
      } else {
        await this.prisma.user
          .update({ where: { id: app.userId }, data: { corporateStatus: "rejected" } })
          .catch(() => undefined);
      }
    }

    return updated;
  }
}
