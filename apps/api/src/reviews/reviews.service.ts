import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  findAll(opts: { approved?: boolean } = {}) {
    return this.prisma.review.findMany({
      where: opts.approved === undefined ? {} : { isApproved: opts.approved },
      include: { product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  setApproval(id: string, isApproved: boolean) {
    return this.prisma.review.update({ where: { id }, data: { isApproved } });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
