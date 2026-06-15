import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CorporateStatus } from "@prisma/client";

@Injectable()
export class CorporateApplicationsService {
  constructor(private prisma: PrismaService) {}

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
