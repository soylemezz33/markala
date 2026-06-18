import { Injectable, NotFoundException } from "@nestjs/common";
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

  // === Public (storefront) ===

  /** Bir ürünün SADECE ONAYLANMIŞ yorumları, en yeni önce. Bekleyenler ASLA dönmez. */
  async findApprovedByProductSlug(productSlug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) return [];
    return this.prisma.review.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { slug: true, name: true } } },
    });
  }

  /**
   * Giriş yapmış müşteri yorum bırakır. Yorum PENDING (isApproved=false) doğar; admin moderasyonu şart.
   * authorName = kullanıcının fullName (DB'den, güvenilir kaynak).
   */
  async createPublic(args: {
    userId: string;
    productSlug: string;
    rating: number;
    title?: string;
    body: string;
  }) {
    const product = await this.prisma.product.findUnique({
      where: { slug: args.productSlug },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Ürün bulunamadı: ${args.productSlug}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: args.userId },
      select: { fullName: true },
    });
    if (!user) {
      throw new NotFoundException("Kullanıcı bulunamadı.");
    }

    // Review modelinde başlık alanı yok → varsa başlığı yorumun başına ekle.
    const comment = args.title?.trim()
      ? `${args.title.trim()}\n\n${args.body.trim()}`
      : args.body.trim();

    return this.prisma.review.create({
      data: {
        product: { connect: { id: product.id } },
        userName: user.fullName,
        rating: args.rating,
        comment,
        isApproved: false, // moderasyon gerekir
      },
      include: { product: { select: { slug: true, name: true } } },
    });
  }
}
