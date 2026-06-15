import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { DesignQualityCheckDto, DesignQualityResultDto } from "./ai.dto";

/**
 * PoC stub — matbaa tasarım dosyası kalite kontrolü.
 *
 * Kontrol listesi:
 *  1. DPI ≥ 300 (ofset baskı standardı)
 *  2. Kesim payı (bleed) ≥ 3 mm
 *  3. Renk modu: CMYK (RGB çıktı iş iptaline neden olabilir)
 *
 * Prod impl: Sharp (Node) ile EXIF okuma + PDF metadata parse
 * veya Cloudflare Images API dönüşüm meta'sı.
 */
@Injectable()
export class DesignQualityService {
  private readonly logger = new Logger(DesignQualityService.name);

  private readonly MIN_DPI = 300;
  private readonly MIN_BLEED_MM = 3;

  async check(dto: DesignQualityCheckDto): Promise<DesignQualityResultDto> {
    this.logger.log(`[PoC] Design quality check: ${dto.designUrl}`);

    if (!dto.designUrl.startsWith("https://")) {
      throw new BadRequestException("Yalnızca HTTPS URL kabul edilir.");
    }

    const expectedDpi = dto.expectedDpi ?? this.MIN_DPI;
    const expectedBleed = dto.bleedMm ?? this.MIN_BLEED_MM;

    // TODO: URL'den dosyayı indir → Sharp / pdf-parse ile analiz et
    const simulatedDpi = 300;
    const simulatedBleed = 3;

    const warnings: string[] = [];
    const errors: string[] = [];

    if (simulatedDpi < expectedDpi) {
      errors.push(`DPI çok düşük: ${simulatedDpi} (gerekli: ≥${expectedDpi})`);
    }
    if (simulatedBleed < expectedBleed) {
      warnings.push(`Kesim payı yetersiz: ${simulatedBleed}mm (önerilen: ≥${expectedBleed}mm)`);
    }

    return {
      passed: errors.length === 0,
      dpi: simulatedDpi,
      bleedMm: simulatedBleed,
      warnings,
      errors,
    };
  }
}
