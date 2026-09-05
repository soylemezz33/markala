import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { DhlService, type DhlTrackingResult } from "../integrations/dhl/dhl.service";
import { OrdersService } from "./orders.service";

/**
 * KARGO TESLİM TARAMASI (2026-09-05, Hasan: "kargo ulaştı mı bilmediğimiz için teslim
 * edildi e-postası atamıyoruz").
 *
 * Her akşam 19:00'da (Türkiye saati) kargodaki siparişlerin takip numaraları DHL'e
 * sorulur; taşıyıcı "teslim edildi" diyorsa sipariş TESLİM EDİLDİ'ye çekilir. Durum
 * değişikliği OrdersService.updateStatus üzerinden yapılır — yani müşteriye giden
 * e-posta, denetim kaydı ve yorum daveti akışı ELLE TIKLAMAYLA BİREBİR AYNI yoldan geçer.
 * Ayrı bir "otomatik" yol açmak, zamanla elle akıştan sapan ikinci bir davranış üretirdi.
 *
 * ── NEDEN GÜVENLİ SAYILIYOR ────────────────────────────────────────────────────────
 * Karar taşıyıcının KENDİ kaydına dayanıyor; elle işaretleyen personel de aynı ekrana
 * bakıp aynı bilgiyle karar veriyor. Otomasyon yeni bir bilgi uydurmuyor, var olan
 * bilgiyi zamanında okuyor.
 *
 * ── KABUL EDİLEN RİSK ──────────────────────────────────────────────────────────────
 * Taşıyıcı "teslim edildi" deyip paket komşuya/kapıcıya bırakılmışsa müşteriye erken
 * "teslim edildi" e-postası gider. Bu riski azaltan üç şey var: (1) yalnız DHL'in
 * kesin `delivered` durumu kabul edilir, "out for delivery"/"transit" ASLA;
 * (2) her değişiklik denetim kaydına kaynağıyla yazılır, geri alınabilir;
 * (3) durum geri alındığında sistem ikinci bir e-posta göndermez (isGeriAdim).
 *
 * ── SINIRLAR ───────────────────────────────────────────────────────────────────────
 * - Yalnız `kargoya-verildi` + takip numarası olan + silinmemiş siparişler.
 * - Yalnız son TARAMA_GUN gün içinde kargoya verilenler: kaybolmuş/iptal olmuş eski
 *   numaralar her gün sonsuza kadar sorgulanmasın (DHL kotası).
 * - Tek turda en fazla TUR_TAVANI sorgu; sorgular arasında kısa bekleme (kotaya saygı).
 * - Bir siparişte hata diğerlerini durdurmaz; hata yalnız loglanır, ertesi gün yeniden denenir.
 */

/** Kaç gün öncesine kadar kargoya verilmiş siparişler taranır. */
export const TARAMA_GUN = 45;
/** Tek turda en fazla kaç takip sorgusu yapılır (DHL kota koruması). */
export const TUR_TAVANI = 200;
/** Sorgular arası bekleme — hız sınırına takılmamak için. */
const SORGU_ARASI_MS = 300;

/**
 * Saf karar: taşıyıcı yanıtı "teslim edildi" sayılır mı?
 *
 * SADECE kesin teslim kabul edilir. "transit", "out for delivery", "pre-transit",
 * "failure" ve bilinmeyen durumlar teslim DEĞİLDİR — yanlış e-posta göndermektense
 * bir gün geç göndermek yeğdir.
 */
export function teslimSayilirMi(sonuc: DhlTrackingResult | null): boolean {
  return sonuc?.status === "delivered";
}

@Injectable()
export class KargoTakipService {
  private readonly logger = new Logger(KargoTakipService.name);

  constructor(
    private prisma: PrismaService,
    private dhl: DhlService,
    private orders: OrdersService,
  ) {}

  /**
   * Her gün 19:00 (Europe/Istanbul). Saat dilimi AÇIKÇA veriliyor: konteynerde bugün
   * TZ doğru ayarlı ama bir imaj/ortam değişikliğinde sessizce UTC'ye düşerse tarama
   * 22:00'da koşardı — bu tür kaymalar fark edilmiyor.
   */
  @Cron("0 19 * * *", { name: "kargo-teslim-taramasi", timeZone: "Europe/Istanbul" })
  async gunlukTarama(): Promise<void> {
    try {
      const ozet = await this.tara();
      this.logger.log(
        `kargo teslim taraması: ${ozet.bakilan} sorgu · ${ozet.teslim} teslim edildi · ${ozet.hata} hata`,
      );
    } catch (e) {
      this.logger.error(`kargo teslim taraması düştü: ${(e as Error)?.message}`);
    }
  }

  /**
   * Taramayı çalıştırır. Elle de tetiklenebilir (panel/uç) — cron ile aynı kod yolu,
   * çünkü "yalnız otomatikte çalışan" bir davranış test edilemez hâle gelir.
   */
  async tara(): Promise<{ bakilan: number; teslim: number; hata: number; atlanan: number }> {
    if (!this.dhl.takipYapilabilir()) {
      this.logger.warn("kargo teslim taraması atlandı: DHL takip anahtarı tanımlı değil");
      return { bakilan: 0, teslim: 0, hata: 0, atlanan: 0 };
    }

    const enEski = new Date(Date.now() - TARAMA_GUN * 24 * 60 * 60 * 1000);
    const adaylar = await this.prisma.order.findMany({
      where: {
        status: "kargoya_verildi",
        deletedAt: null,
        trackingNumber: { not: null },
        shippedAt: { gte: enEski },
      },
      select: { id: true, orderNumber: true, trackingNumber: true },
      orderBy: { shippedAt: "asc" },
      take: TUR_TAVANI,
    });

    let teslim = 0;
    let hata = 0;
    for (const [i, o] of adaylar.entries()) {
      try {
        const sonuc = await this.dhl.trackShipment(o.trackingNumber!);
        if (!teslimSayilirMi(sonuc)) continue;

        // updateStatus: mail + denetim kaydı + yorum daveti akışı elle tıklamayla aynı.
        // actorId null → denetim kaydında "sistem" görünür; ipAddress yok.
        await this.orders.updateStatus(o.id, "teslim-edildi", undefined, {
          actorId: null,
          ipAddress: "kargo-taramasi",
          role: "super_admin",
        });
        teslim++;
        this.logger.log(
          `teslim edildi olarak işaretlendi: ${o.orderNumber} (DHL: ${sonuc?.statusDescription ?? "delivered"})`,
        );
      } catch (e) {
        hata++;
        this.logger.warn(`takip sorgusu başarısız (${o.orderNumber}): ${(e as Error)?.message}`);
      }
      // Son sorgudan sonra beklemeye gerek yok.
      if (i < adaylar.length - 1 && SORGU_ARASI_MS > 0) {
        await new Promise((r) => setTimeout(r, SORGU_ARASI_MS));
      }
    }

    return { bakilan: adaylar.length, teslim, hata, atlanan: 0 };
  }
}
