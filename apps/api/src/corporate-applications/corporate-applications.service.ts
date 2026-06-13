import { Injectable } from "@nestjs/common";
import { CorporateStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CorporateApplicationsService {
  constructor(private prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.corporateApplication.findMany({
      where: status ? { status: status as CorporateStatus } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  setStatus(id: string, status: "approved" | "rejected" | "pending", reviewNote?: string) {
    return this.prisma.corporateApplication.update({
      where: { id },
      data: { status: status as CorporateStatus, ...(reviewNote !== undefined && { notes: reviewNote }) },
    });
  }
}
