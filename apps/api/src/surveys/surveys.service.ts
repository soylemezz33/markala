import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Formbricks anket yanıtlarının kaydı.
 *
 * Tasarım notu: Review tablosuna YAZMIYOR. Review ürün yorumudur (tek puan,
 * zorunlu product_id); anket ise sipariş bazlıdır ve iki ayrı puan taşır.
 * İkisini aynı tabloya sıkıştırmak kargo puanını raporlanamaz hale getirirdi.
 */
@Injectable()
export class SurveysService {
  private readonly logger = new Logger(SurveysService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Formbricks `responseFinished` payload'ını kaydeder.
   * Aynı yanıt tekrar gelirse (Formbricks retry) response_id unique olduğu için
   * ikinci kayıt oluşmaz — sessizce yoksayılır.
   */
  async formbricksYanitKaydet(payload: any) {
    const r = payload?.data;
    if (!r?.id) {
      this.logger.warn("Formbricks webhook: data.id yok, yoksayildi");
      return { ok: false, sebep: "gecersiz_payload" };
    }

    const cevaplar = r.data ?? {};
    const gizli = r.meta?.hiddenFields ?? r.hiddenFields ?? {};

    const sayiyaCevir = (v: unknown): number | null => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    };

    const kayit = {
      surveyId: String(r.surveyId ?? ""),
      responseId: String(r.id),
      orderId: gizli.orderId ? String(gizli.orderId) : (cevaplar.orderId ? String(cevaplar.orderId) : null),
      customerId: gizli.customerId ? String(gizli.customerId) : null,
      urunPuan: sayiyaCevir(cevaplar.urun_kalitesi),
      kargoPuan: sayiyaCevir(cevaplar.kargo_paketleme),
      yorum: cevaplar.yorum ? String(cevaplar.yorum).slice(0, 5000) : null,
      raw: payload as any,
    };

    try {
      await this.prisma.surveyResponse.create({ data: kayit });
      this.logger.log(`Anket yaniti kaydedildi: order=${kayit.orderId ?? "-"} urun=${kayit.urunPuan} kargo=${kayit.kargoPuan}`);
      return { ok: true };
    } catch (e: any) {
      // P2002 = unique ihlali → aynı yanıt zaten kayıtlı, bu bir hata değil.
      if (e?.code === "P2002") {
        this.logger.log(`Anket yaniti zaten kayitli (${kayit.responseId}), atlandi`);
        return { ok: true, tekrar: true };
      }
      throw e;
    }
  }
}
