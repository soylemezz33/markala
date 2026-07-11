import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  findAll(opts: { approved?: boolean } = {}) {
    return this.prisma.review.findMany({
      where: opts.approved === undefined ? {} : { isApproved: opts.approved },
      include: { product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500, // sınırsız yükleme/bellek riskini önle (admin listesi)
    });
  }

  async setApproval(id: string, isApproved: boolean) {
    const review = await this.prisma.review.update({ where: { id }, data: { isApproved } });
    // Onay durumu değişince ürünün denormalize rating'ini (ortalama + adet) yeniden hesapla.
    await this.recomputeProductRating(review.productId);
    return review;
  }

  async remove(id: string) {
    const review = await this.prisma.review.delete({ where: { id } });
    // Silinen yorum onaylıysa ortalama/adet değişir → yeniden hesapla.
    await this.recomputeProductRating(review.productId);
    return review;
  }

  /**
   * Bir ürünün ratingAverage/ratingCount alanlarını YALNIZCA onaylanmış yorumlardan
   * yeniden hesaplar ve Product'a yazar (denormalize). Onaylı yorum yoksa count=0,
   * average=null → storefront hiç yıldız göstermez (sahte puan olmaz). Onay/silme
   * akışında çağrılır; storefront okuma yaptığında ek sorgu gerekmez.
   */
  private async recomputeProductRating(productId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const count = agg._count._all;
    const avg = agg._avg.rating;
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingCount: count,
        ratingAverage: count > 0 && avg != null ? new Prisma.Decimal(avg.toFixed(2)) : null,
      },
    });
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
      take: 200, // tek ürünün onaylı yorumları — sınırsız yükleme riskini önle
    });
  }

  /** Kullanıcı bu ürüne yorum yapabilir mi? = ürünü içeren (silinmemiş) bir siparişi var mı. */
  async canUserReview(userId: string, productSlug: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) return false;
    const purchased = await this.prisma.order.findFirst({
      where: { userId, deletedAt: null, items: { some: { productId: product.id } } },
      select: { id: true },
    });
    return Boolean(purchased);
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
      throw new ForbiddenException("Yalnızca satın aldığınız ürünlere yorum yapabilirsiniz.");
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
