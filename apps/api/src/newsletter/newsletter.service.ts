import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubscriberDto } from "./newsletter.dto";

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  /** İdempotent abone: aynı e-posta tekrar gelirse hata değil — status=active'e çeker (e-posta benzersiz). */
  subscribe(dto: CreateSubscriberDto) {
    const email = dto.email.trim().toLowerCase();
    return this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source: dto.source || "web", status: "active" },
      update: { status: "active", ...(dto.source ? { source: dto.source } : {}) },
    });
  }

  /** Admin: abone listesi (en yeni önce). */
  findAll(opts: { status?: string } = {}) {
    return this.prisma.newsletterSubscriber.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
  }
}
