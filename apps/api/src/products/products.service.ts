import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BulkPriceDto, CreateProductDto, UpdateProductDto } from "./products.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(opts: { categorySlug?: string; bestseller?: boolean; take?: number; skip?: number; q?: string } = {}) {
    // Arama: çok-kelimeli sorgu token'lara bölünür, HER token isimde geçmeli (AND).
    // Böylece "kart vizit" → "Klasik Kartvizit" eşleşir (boşluklu yazımda da bulunur).
    const tokens = (opts.q ?? "").trim().split(/\s+/).filter(Boolean);
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(opts.bestseller !== undefined && { bestseller: opts.bestseller }),
        ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
        ...(tokens.length
          ? { AND: tokens.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })) }
          : {}),
      },
      include: { category: true },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
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

  /**
   * Toplu fiyat güncelleme — TÜM fiyat sürücülerini birlikte ölçekler.
   * Yüzde: basePrice + startingPrice + parameters (matris hücreleri, birim fiyat, m² fiyatı,
   * seçenek ek ücretleri) çarpanla ölçeklenir → matrisli üründe de sitede yansır.
   * Sabit tutar: yalnız basePrice + startingPrice'a uygulanır (matris hücrelerine eklemek
   * çift sayım olurdu). Yuvarlama bütün-fiyat alanlarına uygulanır; birim oranları (₺/adet,
   * ₺/m²) bozulmamak için yuvarlanmaz.
   */
  async bulkPrice(input: BulkPriceDto) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (input.scope === "category" && input.categoryId) where.categoryId = input.categoryId;

    const products = await this.prisma.product.findMany({
      where,
      select: { id: true, basePrice: true, startingPrice: true, parameters: true },
    });

    const sign = input.direction === "decrease" ? -1 : 1;
    const isPercent = input.op === "percent";
    const factor = isPercent ? 1 + (sign * input.value) / 100 : 1;
    const delta = isPercent ? 0 : sign * input.value;
    const roundTo = input.round && input.round !== "none" ? Number(input.round) : 0;

    // Bütün fiyat (ürün/matris hücresi): ölçekle + (varsa) en yakına yuvarla, negatife düşme.
    const whole = (n: number): number => {
      const v = Math.max(0, isPercent ? n * factor : n + delta);
      return roundTo > 0 ? Math.round(v / roundTo) * roundTo : Math.round(v);
    };
    // Birim oranı (₺/adet, ₺/m², çevre ₺/m): yalnız yüzdede ölçeklenir, yuvarlanmaz (2 ondalık).
    const rate = (n: number): number =>
      Math.max(0, Math.round((isPercent ? n * factor : n) * 100) / 100);

    const scaleParam = (param: unknown): unknown => {
      if (!param || typeof param !== "object") return param;
      const p = { ...(param as Record<string, unknown>) };
      if (Array.isArray(p.options)) {
        p.options = p.options.map((o) => {
          const opt = { ...(o as Record<string, unknown>) };
          if (typeof opt.priceModifier === "number") opt.priceModifier = whole(opt.priceModifier);
          return opt;
        });
      }
      if (typeof p.unitPrice === "number") p.unitPrice = rate(p.unitPrice);
      if (typeof p.pricePerSqm === "number") p.pricePerSqm = rate(p.pricePerSqm);
      if (Array.isArray(p.cells)) {
        p.cells = p.cells.map((c) => {
          const cell = { ...(c as Record<string, unknown>) };
          if (typeof cell.price === "number") cell.price = whole(cell.price);
          return cell;
        });
      }
      if (Array.isArray(p.extras)) {
        p.extras = p.extras.map((e) => {
          const ex = { ...(e as Record<string, unknown>) };
          if (typeof ex.flatFee === "number") ex.flatFee = whole(ex.flatFee);
          if (typeof ex.perimeterPricePerM === "number") ex.perimeterPricePerM = rate(ex.perimeterPricePerM);
          return ex;
        });
      }
      return p;
    };

    const ops = products.map((prod) => {
      const data: Prisma.ProductUpdateInput = {
        basePrice: new Prisma.Decimal(whole(Number(prod.basePrice))),
      };
      if (prod.startingPrice != null) {
        data.startingPrice = new Prisma.Decimal(whole(Number(prod.startingPrice)));
      }
      // Parametreleri yalnız yüzdede ölçekle (sabit tutar matris hücrelerine uygulanmaz).
      if (isPercent && Array.isArray(prod.parameters) && prod.parameters.length > 0) {
        data.parameters = (prod.parameters as unknown[]).map(scaleParam) as Prisma.InputJsonValue;
      }
      return this.prisma.product.update({ where: { id: prod.id }, data });
    });

    await this.prisma.$transaction(ops);
    return { updated: products.length };
  }
}
