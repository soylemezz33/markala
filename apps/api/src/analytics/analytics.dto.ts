import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * Storefront'tan gönderilen tek bir birinci-parti olay.
 *
 * DAYANIKLILIK NOTU: Bu DTO collect endpoint'inde KIRPMA amaçlı kullanılır; geçersiz
 * olaylar 4xx fırlatmaz, sessizce atlanır. Controller `validateSync` ile her olayı tek
 * tek doğrular ve geçersizleri eler (bkz. AnalyticsController.collect).
 */
export class CollectEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sessionId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  path?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  productSlug?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(86_400_000) // 24 saat üst sınır — anlamsız büyük dwell değerlerini ele
  dwellMs?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100_000_000)
  value?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  referrer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  device?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  utmSource?: string;
}

/**
 * POST /analytics/collect gövdesi. Yüksek-frekanslı, public; dizi maks 50 (fazlası kırpılır).
 * Üst düzey doğrulama gevşek: dizinin kendisi yoksa boş kabul edilir, asla hata fırlatmaz.
 */
export class CollectDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectEventDto)
  events: CollectEventDto[] = [];
}

/** GET /analytics/overview sorgu parametreleri. */
export class OverviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
