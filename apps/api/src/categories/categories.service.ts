import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { areaStartingPrice, additiveStartingPrice, type AreaDisplayOption } from "../products/display-price";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  /**
   * Kategori başlangıç fiyatını AKTİF ÜRÜNLERDEN hesaplar (kategori başına en ucuz ürün).
   *
   * NEDEN: `categories.starting_price` elle tutulan bir sütundu ve katalog değiştikçe
   * bayatlıyordu. 2026-08-28'de 7 kategoride yanlış rakam çıktı; en kötüsü masa bayrağı
   * 450 ₺ yazıp gerçekte 150 ₺'den başlıyordu — müşteri kategori kartında üç kat pahalı
   * görüp tıklamadan geçiyordu. Kartvizit de 480 yazıp 350'den başlıyordu.
   *
   * Elle düzeltmek kalıcı çözüm değil: her ürün eklendiğinde yeniden kayıyor. Artık
   * ürünlerden hesaplanır, sütun yalnız YEDEK olarak kullanılır (hiç fiyatlı ürünü
   * olmayan kategoriler için).
   *
   * MALİYET: iki sorgu; tüm aktif ürünlerin options/prices'ı çekilir. Eskiden toplamsal
   * ürünler için groupBy min(price) yetiyordu; ama birden fazla fiyatlı grubu olan üründe
   * bu EK SEÇENEĞİN satırını yakalıyor (Makam Bayrağı "105 ₺'den" = saçak satırı, gerçek
   * başlangıç 2.116,80 ₺; 2026-09-05). Artık ürün kartıyla aynı helper: additiveStartingPrice.
   */
  private async hesaplananBaslangicFiyatlari(): Promise<Map<string, number>> {
    const urunler = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, categoryId: true, pricingMode: true },
    });
    if (!urunler.length) return new Map();

    const minPrice = new Map<string, number>();
    const areaVar = urunler.some((u) => u.pricingMode === "area");
    const pricing = areaVar ? await this.settings.getPricing() : null;
    const fiyatli = await this.prisma.product.findMany({
      where: { id: { in: urunler.map((u) => u.id) } },
      select: { id: true, pricingMode: true, options: true, prices: { select: { groupKey: true, optionKey: true, dimKey: true, price: true, cost: true } } },
    });
    for (const ap of fiyatli) {
      if (!ap.prices.length) continue; // fiyatsız ("Teklif Al") ürün kategori minimumuna girmez
      const rows = ap.prices.map((pr) => ({
        groupKey: pr.groupKey, optionKey: pr.optionKey, dimKey: pr.dimKey,
        price: Number(pr.price), cost: pr.cost == null ? null : Number(pr.cost),
      }));
      // m² ürünlerde ProductPrice.price = 0 (satış maliyetten türetilir) → motordan hesapla.
      const v = ap.pricingMode === "area"
        ? (pricing ? areaStartingPrice(ap.options as unknown as AreaDisplayOption[], ap.options, rows, pricing) : null)
        : additiveStartingPrice(ap.options, rows);
      if (v && v > 0) minPrice.set(ap.id, v);
    }

    const katMin = new Map<string, number>();
    for (const u of urunler) {
      const v = minPrice.get(u.id);
      if (!v || !u.categoryId) continue;
      const mevcut = katMin.get(u.categoryId);
      if (mevcut === undefined || v < mevcut) katMin.set(u.categoryId, v);
    }
    return katMin;
  }

  async findAll(includeInactive = false) {
    const [cats, hesap] = await Promise.all([
      this.prisma.category.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      this.hesaplananBaslangicFiyatlari(),
    ]);
    // Hesaplanan değer kazanır; hiç fiyatlı ürünü olmayan kategoride sütundaki yedeğe düşer.
    return cats.map((c) => ({ ...c, startingPrice: hesap.get(c.id) ?? c.startingPrice }));
  }

  async findBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: { products: { where: { isActive: true } } },
    });
    if (!cat) throw new NotFoundException(`Kategori bulunamadı: ${slug}`);
    return cat;
  }

  create(dto: CreateCategoryDto) {
    const data: Prisma.CategoryCreateInput = {
      slug: dto.slug,
      name: dto.name,
      shortDescription: dto.shortDescription,
      longDescription: dto.longDescription,
      imageUrl: dto.imageUrl,
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      startingPrice: new Prisma.Decimal(dto.startingPrice),
      productionTime: dto.productionTime,
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
    return this.prisma.category.create({ data });
  }

  update(id: string, dto: UpdateCategoryDto) {
    const data: Prisma.CategoryUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      ...(dto.productionTime !== undefined && { productionTime: dto.productionTime }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.content !== undefined && { content: dto.content === null ? Prisma.JsonNull : (dto.content as Prisma.InputJsonValue) }),
    };
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
