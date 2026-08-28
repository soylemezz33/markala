import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./products.dto";
import { SettingsService } from "../settings/settings.service";
import { computeAreaPrice } from "../orders/pricing";

// Türkçe harf katlama (arama için). Müşteri klavyede şapkalı harf yazmıyor:
// "brosur" yazıp "Broşür"ü bulamamak 2026-08-20'de ölçüldü — "brosur"→0 sonuç,
// "broşür"→4 sonuç. Postgres `ILIKE`/Prisma `mode:"insensitive"` yalnız BÜYÜK-küçük
// harfi çözer, aksanı çözmez. `unaccent` eklentisi yerine built-in `translate()`
// kullanılıyor: eklenti kurulumu/migration gerektirmez, katalog 860 satır olduğu için
// seq-scan maliyeti ihmal edilebilir.
const TR_FROM = "ıİşŞğĞüÜöÖçÇÂâÎîÛû";
const TR_TO = "iIsSgGuUoOcCAaIiUu";

function foldTr(s: string): string {
  let out = "";
  for (const ch of s) {
    const i = TR_FROM.indexOf(ch);
    out += i >= 0 ? TR_TO[i] : ch;
  }
  return out.toLowerCase();
}

interface AreaDisplayOption {
  groupKey: string;
  groupRole: string;
  groupSort: number;
  optionKey: string;
  rules?: { effect?: string } | null;
}

/**
 * m² ürünlerinde "…₺'den başlar" fiyatı: EN UCUZ ANA MALZEME × 1 m² (KDV dahil).
 *
 * ⚠️ YALNIZ BİRİNCİL GRUP taranır (en küçük groupSort). Önceden tüm `priced` gruplar
 * taranıyordu; 2026-08-28'de ürünlere "Ek İşlem" grubu (CNC kesim, laminasyon…)
 * eklenince bunlar da aday sayıldı ve ana malzemeden UCUZ oldukları için başlangıç
 * fiyatı çöktü: Pleksi 3.175 ₺ yerine 177 ₺ (CNC kesimin m² fiyatı), Folyo 212 ₺
 * yerine 142 ₺ (laminasyon) gösteriyordu. Ek işlem tek başına satılan bir şey değil,
 * ana malzemenin üstüne eklenir — dolayısıyla başlangıç fiyatı adayı olamaz.
 */
function areaStartingPrice(
  opts: AreaDisplayOption[],
  rawOptions: unknown,
  rows: { groupKey: string | null; optionKey: string | null; dimKey: string | null; price: number; cost: number | null }[],
  pricing: { kur: number; marj: number; kdv: number; minM2: number },
): number | null {
  const priced = opts.filter((o) => o.groupRole === "priced");
  if (!priced.length) return null;
  const anaSort = Math.min(...priced.map((o) => o.groupSort ?? 0));
  let min: number | null = null;
  for (const opt of priced) {
    if ((opt.groupSort ?? 0) !== anaSort) continue; // ek işlem grupları elenir
    const eff = opt.rules?.effect ?? "perM2";
    if (eff !== "perM2" && eff !== "perPiece") continue;
    const r = computeAreaPrice(rawOptions as never, rows, { [opt.groupKey]: opt.optionKey, en: "100", boy: "100", adet: "1" }, pricing).dahil;
    if (r > 0 && (min === null || r < min)) min = r;
  }
  return min;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  /**
   * Arama eşleşen ürün ID'lerini ALAKA SIRASIYLA döndürür.
   *
   * Neden ayrı sorgu: eski hâlde sıralama `createdAt desc` idi. Katalogun %96'sı (860
   * üründen 827'si) toplu ve EN SON yüklenen İSG levhaları olduğu için her arama onlarla
   * doluyordu — "folyo" yazınca 12 sonucun 12'si "Lümen Folyolu ..." çıkıyor, gerçek
   * "Cam Vitrin Folyo" ürünü hiç görünmüyordu.
   *
   * Sıralama ölçütleri (önem sırasıyla):
   *   1. Tam eşleşme → adın başında → kelime başında → herhangi bir yerde
   *   2. Ad uzunluğu (kısa ad = daha genel//spesifik ürün; "Cam Vitrin Folyo" uzun
   *      levha adlarını geçer)
   *   3. Yenilik (eşitlik bozucu)
   */
  private async searchProductIds(
    tokens: string[],
    opts: { categorySlug?: string; bestseller?: boolean; take?: number; skip?: number; includeInactive?: boolean },
  ): Promise<string[]> {
    const norm = Prisma.sql`lower(translate(p.name, ${TR_FROM}, ${TR_TO}))`;
    const first = tokens[0];
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT p.id
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${Prisma.join(
        tokens.map((t) => Prisma.sql`${norm} LIKE ${"%" + t + "%"}`),
        " AND ",
      )}
        ${opts.includeInactive ? Prisma.empty : Prisma.sql`AND p.is_active = true`}
        ${opts.bestseller === undefined ? Prisma.empty : Prisma.sql`AND p.bestseller = ${opts.bestseller}`}
        ${opts.categorySlug ? Prisma.sql`AND c.slug = ${opts.categorySlug}` : Prisma.empty}
      ORDER BY
        CASE
          WHEN ${norm} = ${first} THEN 0
          WHEN ${norm} LIKE ${first + "%"} THEN 1
          WHEN ${norm} LIKE ${"% " + first + "%"} THEN 2
          ELSE 3
        END,
        length(p.name) ASC,
        p.created_at DESC
      LIMIT ${opts.take ?? 50} OFFSET ${opts.skip ?? 0}
    `);
    return rows.map((r) => r.id);
  }

  async findAll(opts: { categorySlug?: string; bestseller?: boolean; take?: number; skip?: number; q?: string; list?: boolean; includeInactive?: boolean } = {}) {
    // Arama: çok-kelimeli sorgu token'lara bölünür, HER token isimde geçmeli (AND).
    // Böylece "kart vizit" → "Klasik Kartvizit" eşleşir (boşluklu yazımda da bulunur).
    // Token'lar Türkçe katlanır ki "brosur" da "Broşür"ü bulsun.
    const tokens = (opts.q ?? "").trim().split(/\s+/).filter(Boolean).map(foldTr);

    // Arama varsa: filtre + sıralama ham SQL'de yapılır, buraya sıralı ID listesi döner.
    // Sayfalama da orada uygulandığı için aşağıda take/skip TEKRAR uygulanmaz.
    const searchIds = tokens.length ? await this.searchProductIds(tokens, opts) : null;
    if (searchIds && searchIds.length === 0) return [];

    // includeInactive YALNIZ admin (guarded admin-list) için: storefront daima aktif-filtreli.
    const where = {
      ...(opts.includeInactive ? {} : { isActive: true }),
      ...(opts.bestseller !== undefined && { bestseller: opts.bestseller }),
      ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
      ...(searchIds ? { id: { in: searchIds } } : {}),
    };
    const common = {
      where,
      ...(searchIds ? {} : { take: opts.take ?? 50, skip: opts.skip ?? 0 }),
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
          updatedAt: true,
          ratingAverage: true,
          ratingCount: true,
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
        const opts = ap.options as unknown as AreaDisplayOption[];
        const rows = ap.prices.map((pr) => ({ groupKey: pr.groupKey, optionKey: pr.optionKey, dimKey: pr.dimKey, price: Number(pr.price), cost: pr.cost == null ? null : Number(pr.cost) }));
        areaDisplay.set(ap.id, areaStartingPrice(opts, ap.options, rows, pricing));
      }
    }

    const result = products.map((p) => ({
      ...p,
      displayPrice: p.pricingMode === "area" ? (areaDisplay.get(p.id) ?? null) : (minMap.get(p.id) ?? null),
    }));

    // `id: { in: [...] }` sırayı KORUMAZ — alaka sıralaması ham SQL'de hesaplandığı için
    // burada geri uygulanmalı, yoksa tüm ranking boşa gider.
    if (!searchIds) return result;
    const rank = new Map(searchIds.map((id, i) => [id, i]));
    return result.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
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

    // displayPrice — liste endpoint'iyle AYNI tanım (kart/JSON-LD ile tutarlı): non-area =
    // MIN(ProductPrice.price > 0); area = en ucuz priced malzeme × 1 m² (KDV dahil). Fiyatsız
    // ("Teklif Al") üründe null. Detay yanıtında eksikti → JSON-LD Offer price:0'a düşüyordu.
    const priceRows = product.prices ?? [];
    let displayPrice: number | null = null;
    if (product.pricingMode === "area") {
      if (priceRows.length) {
        const pricing = await this.settings.getPricing();
        const rows = priceRows.map((pr) => ({ groupKey: pr.groupKey, optionKey: pr.optionKey, dimKey: pr.dimKey, price: Number(pr.price), cost: pr.cost == null ? null : Number(pr.cost) }));
        const opts = product.options as unknown as AreaDisplayOption[];
        displayPrice = areaStartingPrice(opts, product.options, rows, pricing);
      }
    } else if (priceRows.length) {
      const positive = priceRows.map((pr) => Number(pr.price)).filter((v) => v > 0);
      displayPrice = positive.length ? Math.min(...positive) : null;
    }
    return { ...product, displayPrice };
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
      ...(dto.pricingMode !== undefined && { pricingMode: dto.pricingMode }),
      ...(dto.parameters !== undefined && { parameters: dto.parameters as Prisma.InputJsonValue }),
      ...(dto.content !== undefined && {
        content: dto.content === null ? Prisma.JsonNull : (dto.content as Prisma.InputJsonValue),
      }),
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
