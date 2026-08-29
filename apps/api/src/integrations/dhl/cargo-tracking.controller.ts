import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DhlService } from "./dhl.service";

/**
 * Public kargo takip sorgusu (2026-08-29, Hasan talebi).
 *
 * Müşteri DHL'den aldığı takip numarasını /kargo-takip sayfamıza yazar; biz DHL
 * Unified Tracking API'sinden (resmî, ücretsiz katman) sorgular, durumu kendi
 * sayfamızda gösteririz. Numara BİZDE SAKLANMAZ — geçici önbellek hariç.
 *
 * Koruma katmanları (kötüye kullanım: ucumuz üzerinden DHL'e numara taraması):
 *  1. Format kontrolü: yalnız 8-25 haneli harf/rakam (DHL eCommerce TR yurt içi
 *     numaraları 12 hane; uluslararasında GM/LX önekleri olabilir).
 *  2. Per-IP rate limit (main.ts — 10/dk).
 *  3. DhlService önbelleği: aynı numara 10 dk (bulunamayan 2 dk) DHL'e gitmez.
 *
 * Auth YOK — bilinçli: takip numarası zaten yarı-gizli bir anahtar; DHL'in kendi
 * sorgu sayfası da numarayı bilen herkese açık. Kişisel veri (teslim alan adı vb.)
 * DhlService.mapUnifiedShipment'ta bilinçli olarak elenir.
 */
@ApiTags("cargo-tracking")
@Controller("cargo-tracking")
export class CargoTrackingController {
  constructor(private dhl: DhlService) {}

  @Get(":no")
  async track(@Param("no") no: string) {
    const temiz = (no ?? "").trim();
    if (!/^[A-Za-z0-9]{8,25}$/.test(temiz)) {
      throw new BadRequestException("Geçersiz takip numarası formatı.");
    }

    let sonuc;
    try {
      sonuc = await this.dhl.trackShipment(temiz);
    } catch {
      // Anahtar eksik / DHL erişilemiyor / kota — müşteri DHL sayfasına yönlendirilir.
      throw new ServiceUnavailableException(
        "Takip servisi şu an yanıt vermiyor. Lütfen DHL eCommerce takip sayfasından sorgulayın.",
      );
    }

    if (!sonuc) {
      throw new NotFoundException(
        "Bu numarayla gönderi bulunamadı. Numara yeni oluşturulduysa DHL sisteminde görünmesi 24-48 saat sürebilir.",
      );
    }
    return sonuc;
  }
}
