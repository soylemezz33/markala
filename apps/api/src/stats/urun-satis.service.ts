import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { gerceklesenSiparis } from "./gerceklesen-siparis";
import { urunSatisToplamlari, type UrunSatisOzeti } from "./urun-satis";

/**
 * GET /admin/stats/urun-satis — ürün başına kaç adet / kaç siparişte satıldı.
 * Sipariş kümesi Ciro & Kâr ve dashboard ile AYNI tanımdan (gerceklesenSiparis) gelir;
 * aksi hâlde üç ekran birbirini tutmaz (2026-09-02'de yaşandı).
 */
@Injectable()
export class UrunSatisService {
  constructor(private prisma: PrismaService) {}

  async summary(days?: number, opts: { includeFinance?: boolean } = {}): Promise<UrunSatisOzeti> {
    const since =
      days && Number.isFinite(days) && days > 0
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : undefined;
    const items = await this.prisma.orderItem.findMany({
      where: { order: gerceklesenSiparis(since) },
      select: {
        productId: true,
        productSlug: true,
        productName: true,
        configurationSummary: true,
        quantity: true,
        lineTotal: true,
        order: { select: { id: true, createdAt: true } },
      },
    });
    const ozet = urunSatisToplamlari(items, since ? days! : null);
    if (opts.includeFinance === false) {
      // Parasal alanlar role göre serviste kesilir (stats.service ile aynı ilke):
      // tasarımcı/kargo adetleri görür, ciroyu görmez.
      return {
        ...ozet,
        ciro: 0,
        urunler: ozet.urunler.map((u) => ({
          ...u,
          ciro: 0,
          varyantlar: u.varyantlar.map((v) => ({ ...v, ciro: 0 })),
        })),
      };
    }
    return ozet;
  }
}
