import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * CSP ihlal toplayıcı (2026-08-31).
 *
 * Amaç: `Content-Security-Policy-Report-Only`'den enforce'a geçmeden önce sitede
 * GERÇEKTE hangi kaynakların yüklendiğini eksiksiz görmek. Önceden raporlar yalnız
 * konteyner loguna yazılıyordu ve her deploy'da siliniyordu.
 */
@Injectable()
export class CspService {
  private readonly logger = new Logger(CspService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Engellenen URI'yi tekilleştirmeye uygun hale getirir.
   *
   * Sorgu dizesi ATILIR: ad.doubleclick.net/ccm/s/collect?auid=... her istekte farklı
   * geliyor ve normalize edilmezse tablo her ziyaretçide yeni satır açardı. Politika
   * kararı için gereken bilgi zaten şema + host + yol.
   *
   * "blob", "data", "inline", "eval" gibi anahtar kelimeler URL değildir, olduğu gibi kalır.
   */
  static normalizeUri(ham: unknown): string {
    if (typeof ham !== "string" || !ham.trim()) return "(bos)";
    const t = ham.trim();
    if (!t.includes("://")) return t.slice(0, 200); // blob / data / inline / eval / self
    try {
      const u = new URL(t);
      return `${u.protocol}//${u.host}${u.pathname}`.slice(0, 400);
    } catch {
      return t.slice(0, 400);
    }
  }

  /**
   * Raporu kaydet. Aynı (directive, blockedUri) ikilisi varsa sayacı artırır.
   * ASLA fırlatmaz — rapor toplama, sayfayı etkileyecek bir hata üretmemeli.
   */
  async kaydet(input: {
    directive?: string;
    blockedUri?: string;
    documentUri?: string;
  }): Promise<void> {
    const directive = (input.directive || "").trim().slice(0, 120) || "(bilinmiyor)";
    const blockedUri = CspService.normalizeUri(input.blockedUri);
    const sampleDocumentUri = CspService.normalizeUri(input.documentUri);

    try {
      await this.prisma.cspViolation.upsert({
        where: { directive_blockedUri: { directive, blockedUri } },
        create: { directive, blockedUri, sampleDocumentUri },
        update: { count: { increment: 1 }, sampleDocumentUri },
      });
    } catch (e) {
      // Tabloya yazılamazsa sessizce logla — endpoint yine 204 dönecek.
      this.logger.warn(`[csp] kayit basarisiz: ${String(e).slice(0, 160)}`);
    }
  }

  /** Enforce kararı için özet: en çok görülen ihlaller önce. */
  liste(limit = 100) {
    return this.prisma.cspViolation.findMany({
      orderBy: [{ count: "desc" }, { lastSeenAt: "desc" }],
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}
