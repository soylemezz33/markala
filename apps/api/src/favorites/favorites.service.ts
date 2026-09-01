import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SLUG_PATTERN } from "./favorites.dto";

/** Hesap başına favori üst sınırı — liste ekranı ve senkron çağrıları sınırsız büyümesin. */
const MAX_FAVORITES = 300;

/**
 * Favoriler — HESABA bağlı liste (2026-09-01, Hasan: "cihazlar arası senkron").
 *
 * Dışarıya SLUG konuşulur (storefront ürünleri slug ile çözer), içeride productId FK tutulur:
 * ürün silinince kayıt cascade ile düşer, admin ürünü yeniden adlandırsa bile favori kopmaz.
 * Her mutasyon güncel listeyi döndürür — istemci tek tur ile senkron kalır.
 */
@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  private assertSlug(slug: string): string {
    if (!slug || slug.length > 120 || !SLUG_PATTERN.test(slug)) {
      throw new BadRequestException("Geçersiz ürün slug'ı.");
    }
    return slug;
  }

  /** Kullanıcının favori slug'ları — en yeni en başta. Pasife alınan ürünler listelenmez. */
  async list(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId, product: { isActive: true } },
      orderBy: { createdAt: "desc" },
      select: { product: { select: { slug: true } } },
    });
    return rows.map((r) => r.product.slug);
  }

  async add(userId: string, slug: string): Promise<string[]> {
    this.assertSlug(slug);
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Ürün bulunamadı.");

    const count = await this.prisma.favorite.count({ where: { userId } });
    if (count >= MAX_FAVORITES) {
      throw new BadRequestException(
        `Favori listesi en fazla ${MAX_FAVORITES} ürün alabilir. Önce birkaçını çıkarın.`,
      );
    }

    // skipDuplicates: çift tık / iki sekme aynı anda eklerse unique kısıt hataya dönüşmesin.
    await this.prisma.favorite.createMany({
      data: [{ userId, productId: product.id }],
      skipDuplicates: true,
    });
    return this.list(userId);
  }

  /** Idempotent: slug artık katalogda yoksa da hata verilmez, kayıt zaten cascade ile düşmüştür. */
  async remove(userId: string, slug: string): Promise<string[]> {
    this.assertSlug(slug);
    await this.prisma.favorite.deleteMany({ where: { userId, product: { slug } } });
    return this.list(userId);
  }

  /**
   * Cihazda birikmiş listeyi hesaba taşır (giriş anında bir kez).
   * Var olanlar korunur; bilinmeyen/pasif slug'lar sessizce elenir — tek bir ölü slug
   * yüzünden tüm taşıma başarısız olmasın.
   */
  async merge(userId: string, slugs: string[]): Promise<string[]> {
    const unique = [...new Set(slugs.filter((s) => SLUG_PATTERN.test(s)))];
    if (unique.length === 0) return this.list(userId);

    const products = await this.prisma.product.findMany({
      where: { slug: { in: unique }, isActive: true },
      select: { id: true },
    });
    if (products.length > 0) {
      const mevcut = await this.prisma.favorite.count({ where: { userId } });
      const kalan = Math.max(0, MAX_FAVORITES - mevcut);
      await this.prisma.favorite.createMany({
        data: products.slice(0, kalan).map((p) => ({ userId, productId: p.id })),
        skipDuplicates: true,
      });
    }
    return this.list(userId);
  }
}
