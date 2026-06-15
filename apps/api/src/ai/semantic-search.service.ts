import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SemanticSearchDto, SemanticSearchResultDto } from "./ai.dto";

/**
 * Katalog-tabanlı lexical relevance arama (deterministik baseline).
 *
 * Bu PoC artık SABİT değer DÖNMÜYOR — canlı ürün kataloğu (Prisma) üzerinde
 * Türkçe-duyarlı, alan-ağırlıklı kelime örtüşmesi skoru hesaplıyor:
 *  - Dış AI/embedding çağrısı YOK → maliyet 0, KVKK m.9 yurt dışı aktarım riski YOK
 *  - Diakritik-bağımsız eşleşme ("broşür" ↔ "brosur") + Türkçe locale küçük harf
 *  - Alan ağırlıkları: ad > (kategori = kısa açıklama) > açıklama
 *
 * Prod yükseltme (AI.md §2b): pgvector cosine similarity. Bu lexical baseline,
 * embedding kalitesini A/B karşılaştırmak için ücretsiz referans olarak kalır.
 */
@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  /** Tek sorguda taranacak maks aktif ürün (pgvector'a kadar güvenlik tavanı). */
  private readonly MAX_CATALOG = 1000;

  /** Alan ağırlıkları — skor normalizasyonunda token başına maks pay. */
  private readonly WEIGHTS = { name: 3, category: 2, short: 2, description: 1 } as const;

  /** Çok kısa/anlamsız Türkçe bağlaç ve ekler (eşleşmeden çıkarılır). */
  private readonly STOPWORDS = new Set([
    "ve", "ile", "icin", "bir", "bu", "mi", "mu", "da", "de", "en", "ya", "ne",
  ]);

  /**
   * Matbaa kısaltma/eşanlam genişletmesi (muhafazakar; genişletilebilir).
   * Anahtar ve değerler `normalize()` çıktısı formatında (diakritiksiz) tutulur.
   */
  private readonly SYNONYMS: Record<string, string[]> = {
    kart: ["kartvizit"],
    brosur: ["brosur", "katalog"],
    afis: ["afis", "poster"],
    sticker: ["etiket", "sticker"],
    bayrak: ["bayrak", "flama"],
  };

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SemanticSearchDto): Promise<SemanticSearchResultDto[]> {
    const topK = dto.topK ?? 10;
    const tokens = this.tokenize(dto.query);
    this.logger.log(`[lexical] tokens=${tokens.length} topK=${topK}`);

    // Anlamlı token yoksa DB'ye hiç gitme.
    if (tokens.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        category: { select: { name: true } },
      },
      take: this.MAX_CATALOG,
    });

    const maxPerToken =
      this.WEIGHTS.name + this.WEIGHTS.category + this.WEIGHTS.short + this.WEIGHTS.description;
    const denom = tokens.length * maxPerToken;

    return products
      .map((p): SemanticSearchResultDto => {
        const fields = {
          name: this.normalize(p.name),
          category: this.normalize(p.category?.name ?? ""),
          short: this.normalize(p.shortDescription ?? ""),
          description: this.normalize(p.description ?? ""),
        };

        let raw = 0;
        for (const t of tokens) {
          if (fields.name.includes(t)) raw += this.WEIGHTS.name;
          if (fields.category.includes(t)) raw += this.WEIGHTS.category;
          if (fields.short.includes(t)) raw += this.WEIGHTS.short;
          if (fields.description.includes(t)) raw += this.WEIGHTS.description;
        }

        // Normalize 0..1 — payda self-consistent (token başına maks pay × token sayısı).
        const score = Number((raw / denom).toFixed(4));
        return { productId: p.id, score, name: p.name, slug: p.slug };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "tr"))
      .slice(0, topK);
  }

  /** Türkçe locale küçük harf + diakritik foldlama ile metni normalize eder. */
  private normalize(text: string): string {
    return text
      .toLocaleLowerCase("tr")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Sorguyu token'lara böler: normalize → stopword/kısa eleme → eşanlam genişlet. */
  private tokenize(query: string): string[] {
    const base = this.normalize(query)
      .split(" ")
      .filter((t) => t.length >= 2 && !this.STOPWORDS.has(t));

    const expanded = new Set<string>();
    for (const t of base) {
      expanded.add(t);
      for (const syn of this.SYNONYMS[t] ?? []) expanded.add(syn);
    }
    return [...expanded];
  }
}
