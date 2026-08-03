import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
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

  // === Token tabanlı yorum daveti ===

  /**
   * Yorum daveti linkini doğrular — token geçerli mi ve hangi sipariş kalemleri var?
   * Bağlantı kullanılmışsa (token=null) veya sipariş yoksa 404 fırlatır.
   */
  async verifyReviewToken(orderId: string, token: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        reviewToken: true,
        items: {
          where: { productId: { not: null } },
          select: { productSlug: true, productName: true },
        },
      },
    });
    if (!order || !order.reviewToken || order.reviewToken !== token) {
      throw new NotFoundException("Geçersiz veya daha önce kullanılmış yorum bağlantısı.");
    }
    return {
      orderId: order.id,
      items: order.items,
    };
  }

  /**
   * Token'lı yorum oluşturma — email linkinden gelen müşteri, giriş gerektirmez.
   * Token tek kullanımlık: yorum oluşturulunca Order.reviewToken = null yapılır.
   * Yorum onaysız (isApproved=false) doğar; admin moderasyonu şart.
   */
  async createFromToken(args: {
    orderId: string;
    token: string;
    productSlug: string;
    rating: number;
    title?: string;
    body: string;
  }) {
    // 1. Sipariş + token doğrula
    const order = await this.prisma.order.findUnique({
      where: { id: args.orderId },
      select: {
        id: true,
        reviewToken: true,
        email: true,
        items: {
          where: { productSlug: args.productSlug, productId: { not: null } },
          select: { id: true, productId: true },
        },
      },
    });
    if (!order || !order.reviewToken || order.reviewToken !== args.token) {
      throw new BadRequestException("Geçersiz veya daha önce kullanılmış yorum bağlantısı.");
    }

    // 2. productSlug bu siparişte var mı?
    const item = order.items[0];
    if (!item || !item.productId) {
      throw new BadRequestException("Seçilen ürün bu siparişe ait değil.");
    }

    // 3. Aynı sipariş kalemi için yorum zaten var mı? (orderItemId @unique)
    const existing = await this.prisma.review.findUnique({
      where: { orderItemId: item.id },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException("Bu ürün için zaten yorum yapılmış.");
    }

    // 4. Yorumcu adı: bağlı kullanıcıdan veya email'in @ öncesinden türet (anonim görünüm)
    const userRecord = order.email
      ? await this.prisma.user.findFirst({
          where: { email: order.email },
          select: { fullName: true },
        })
      : null;
    const userName = userRecord?.fullName?.trim() || (order.email ? order.email.split("@")[0] : "Müşteri");

    const comment = args.title?.trim()
      ? `${args.title.trim()}\n\n${args.body.trim()}`
      : args.body.trim();

    // 5. Yorum oluştur — onaysız (moderasyon gerekir)
    const review = await this.prisma.review.create({
      data: {
        product: { connect: { id: item.productId } },
        orderItemId: item.id,
        userName,
        rating: args.rating,
        comment,
        isApproved: false,
      },
      include: { product: { select: { slug: true, name: true } } },
    });

    // 6. Token'ı geçersiz kıl (tek kullanımlık)
    await this.prisma.order.update({
      where: { id: args.orderId },
      data: { reviewToken: null },
    });

    return review;
  }
}
