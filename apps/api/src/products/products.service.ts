import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./products.dto";
import { SettingsService } from "../settings/settings.service";
import { computeAreaPrice } from "../orders/pricing";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  async findAll(opts: { categorySlug?: string; bestseller?: boolean; take?: number; skip?: number; q?: string; list?: boolean; includeInactive?: boolean } = {}) {
    // Arama: çok-kelimeli sorgu token'lara bölünür, HER token isimde geçmeli (AND).
    // Böylece "kart vizit" → "Klasik Kartvizit" eşleşir (boşluklu yazımda da bulunur).
    const tokens = (opts.q ?? "").trim().split(/\s+/).filter(Boolean);
    // includeInactive YALNIZ admin (guarded admin-list) için: storefront daima aktif-filtreli.
    const where = {
      ...(opts.includeInactive ? {} : { isActive: true }),
      ...(opts.bestseller !== undefined && { bestseller: opts.bestseller }),
      ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
      ...(tokens.length
        ? { AND: tokens.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })) }
        : {}),
    };
    const common = {
      where,
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
      orderBy: { createdAt: "desc" as const },
    };
    // PERF — LİSTE MODU: storefront katalog/anasayfa/kategori binlerce ürünü tek seferde
    // çeker; ağır alanları (content JSON: features/faqs/specs/seo ~5KB + uzun description)
    // listede HİÇ kullanılmaz → __NEXT_DATA__ payload'ını ~yarıya indirmek için HARİÇ tutulur.
    // `parameters` KALIR: kart/filtre fiyatı (getDisplayPrice) configurator parametrelerinden
    // hesaplanır; çıkarılırsa konfigüratörlü ürünlerde fiyat 0/"Teklif Al"a düşer (regresyon).
    // Detay endpoint'i (/products/:slug → findBySlug) tam veriyi döndürmeye devam eder.
    let products: { id: string; [key: string]: unknown }[];
    if (opts.list) {
      products = await this.prisma.product.findMany({
        ...common,
        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          basePrice: true,
          startingPrice: true,
          productionTime: true,
          sizeLabel: true,
          images: true,
          badges: true,
          bestseller: true,
          parameters: true,
          pricingMode: true,
          category: { select: { slug: true, name: true } },
        },
      }) as { id: string; [key: string]: unknown }[];
    } else {
      products = await this.prisma.product.findMany({
        ...common,
        include: { category: true },
      }) as { id: string; [key: string]: unknown }[];
    }
    const ids = products.map((p) => p.id);
    const mins = ids.length
      ? await this.prisma.productPrice.groupBy({ by: ["productId"], where: { productId: { in: ids } }, _min: { price: true } })
      : [];
    const minMap = new Map(mins.map((m: { productId: string; _min: { price: unknown } }) => [m.productId, m._min.price == null ? null : Number(m._min.price)]));

    // area ürünleri: ProductPrice.price=0 → minMap işe yaramaz. displayPrice = en ucuz ana
    // malzeme × 1 m² (KDV dahil), motordan. Sadece area ürünleri için ek hafif sorgu.
    const areaIds = products.filter((p) => p.pricingMode === "area").map((p) => p.id);
    const areaDisplay = new Map<string, number | null>();
    if (areaIds.length) {
      const pricing = await this.settings.getPricing();
      const areaProducts = await this.prisma.product.findMany({
        where: { id: { in: areaIds } },
        select: { id: true, options: true, prices: true },
      });
      for (const ap of areaProducts) {
        const opts = ap.options as unknown as { groupKey: string; groupRole: string; optionKey: string; rules?: { effect?: string } | null }[];
        const rows = ap.prices.map((pr) => ({ groupKey: pr.groupKey, optionKey: pr.optionKey, dimKey: pr.dimKey, price: Number(pr.price), cost: pr.cost == null ? null : Number(pr.cost) }));
        let min: number | null = null;
        for (const opt of opts) {
          if (opt.groupRole !== "priced") continue;
          const eff = opt.rules?.effect ?? "perM2";
          if (eff !== "perM2" && eff !== "perPiece") continue; // yalnız ana malzeme/takım
          const r = computeAreaPrice(ap.options as never, rows, { [opt.groupKey]: opt.optionKey, en: "100", boy: "100", adet: "1" }, pricing).dahil;
          if (r > 0 && (min === null || r < min)) min = r;
        }
        areaDisplay.set(ap.id, min);
      }
    }

    return products.map((p) => ({
      ...p,
      displayPrice: p.pricingMode === "area" ? (areaDisplay.get(p.id) ?? null) : (minMap.get(p.id) ?? null),
    }));
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        options: { orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }] },
        prices: true,
      },
    });
    if (!product) throw new NotFoundException(`Ürün bulunamadı: ${slug}`);
    return product;
  }

  create(dto: CreateProductDto) {
    const data: Prisma.ProductCreateInput = {
      slug: dto.slug,
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      basePrice: new Prisma.Decimal(dto.basePrice),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      productionTime: dto.productionTime,
      ...(dto.sizeLabel !== undefined && { sizeLabel: dto.sizeLabel }),
      images: dto.images,
      ...(dto.badges !== undefined && { badges: dto.badges }),
      ...(dto.bestseller !== undefined && { bestseller: dto.bestseller }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parameters !== undefined && { parameters: dto.parameters as Prisma.InputJsonValue }),
      category: { connect: { id: dto.categoryId } },
    };
    return this.prisma.product.create({ data });
  }

  async update(id: string, dto: UpdateProductDto) {
    const data: Prisma.ProductUpdateInput = {
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.basePrice !== undefined && { basePrice: new Prisma.Decimal(dto.basePrice) }),
      ...(dto.startingPrice !== undefined && { startingPrice: new Prisma.Decimal(dto.startingPrice) }),
      ...(dto.productionTime !== undefined && { productionTime: dto.productionTime }),
      ...(dto.sizeLabel !== undefined && { sizeLabel: dto.sizeLabel }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.badges !== undefined && { badges: dto.badges }),
      ...(dto.bestseller !== undefined && { bestseller: dto.bestseller }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parameters !== undefined && { parameters: dto.parameters as Prisma.InputJsonValue }),
      ...(dto.categoryId !== undefined && { category: { connect: { id: dto.categoryId } } }),
    };

    // FİYAT TUTARLILIĞI: startingPrice değişiyor ve basePrice elle verilmemişse, ürün
    // KONFİGÜRATÖRSÜZ (parameters boş) ise basePrice'ı da eşitle. Böylece basit üründe
    // "gösterilen fiyat (startingPrice)" = "siparişte tahsil edilen (basePrice)" olur.
    // Konfigüratörlü ürünlerde basePrice'a DOKUNULMAZ (fiyat matrix/quantity'den gelir).
    if (dto.startingPrice !== undefined && dto.basePrice === undefined) {
      const current = await this.prisma.product.findUnique({ where: { id }, select: { parameters: true } });
      const params = current?.parameters;
      const hasConfigurator = Array.isArray(params) && params.length > 0;
      if (!hasConfigurator) {
        data.basePrice = new Prisma.Decimal(dto.startingPrice);
      }
    }

    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

}
