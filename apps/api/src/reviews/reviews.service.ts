import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
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

  /** Anasayfa öne çıkanlar: ürün-bağımsız son ONAYLANMIŞ yorumlar (en yeni önce). Yoksa boş. */
  async findFeaturedApproved(limit = 6) {
    const take = Math.min(Math.max(Math.trunc(limit) || 6, 1), 24);
    return this.prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take,
      include: { product: { select: { slug: true, name: true } } },
    });
  }

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

    // Doğrulanmış satın alma şartı: kullanıcı YALNIZCA sipariş ettiği ürüne yorum yapabilir.
    // (örn. kupa sipariş eden sadece kupaya yorum yazabilir, başka ürüne yazamaz.)
    const purchased = await this.prisma.order.findFirst({
      where: {
        userId: args.userId,
        deletedAt: null,
        items: { some: { productId: product.id } },
      },
      select: { id: true },
    });
    if (!purchased) {
      throw new ForbiddenException(
        "Yalnızca satın aldığınız ürünlere yorum yapabilirsiniz.",
      );
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
