import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Public `GET /products` üst sınırı. Storefront kataloğu "tümünü getir"
 * mantığıyla çalışır (web/lib/catalog.ts → `?take=5000`, kategori sayfası
 * `?take=2000`). Admin listelerindeki 200 sınırı buraya UYGULANAMAZ: katalog
 * 1188+ ürün ve 200'e kırpmak "kategori sayıları 0" hatasını geri getirir
 * (bkz. web commit "ürün listesi 200 limiti → tümü"). Bu yüzden public tavan
 * storefront'un çektiği maksimumla (5000) hizalıdır; katalog bu sınırı aşarsa
 * storefront isteğiyle birlikte yükseltilmeli (veya cursor pagination'a geçilmeli).
 */
export const MAX_PUBLIC_PRODUCT_TAKE = 5000;

/**
 * Public `GET /products` query doğrulaması.
 *
 * NEDEN: controller `take ? parseInt(take) : undefined` kullanıyordu —
 * `?take=abc` → `parseInt` NaN → `NaN ?? 50` NaN kalır → Prisma `take: NaN` →
 * 500. Negatif/ondalık/aşırı büyük değerler de korunmasızdı. `@Type(() => Number)`
 * query string'i sayıya çevirir; geçersiz girdi artık temiz 400 döner.
 */
export class ProductListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  /** "true" | "false" → boolean | undefined (controller'ın eski lenient davranışı korunur). */
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : undefined))
  bestseller?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "take tam sayı olmalı" })
  @Min(1)
  @Max(MAX_PUBLIC_PRODUCT_TAKE)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "skip tam sayı olmalı" })
  @Min(0)
  skip?: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(SLUG_REGEX, { message: "slug yalnızca küçük harf, rakam ve tire içerebilir" })
  slug!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(280)
  shortDescription!: string;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  startingPrice?: number;

  @IsString()
  @MaxLength(80)
  productionTime!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  sizeLabel?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  images!: string[];

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsBoolean()
  @IsOptional()
  bestseller?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Konfigüratör parametreleri — esnek JSON. */
  @IsOptional()
  parameters?: unknown;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(SLUG_REGEX, { message: "slug yalnızca küçük harf, rakam ve tire içerebilir" })
  slug?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(280)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  startingPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  productionTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  sizeLabel?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  badges?: string[];

  @IsBoolean()
  @IsOptional()
  bestseller?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  parameters?: unknown;
}

/**
 * Toplu fiyat güncelleme. Operasyonu (yüzde/sabit, artır/düşür) SUNUCUYA gönderiyoruz;
 * sunucu hedef ürünleri yükleyip basePrice + startingPrice + KONFİGÜRATÖR PARAMETRELERİNİ
 * (matris hücre fiyatları, birim fiyat, m² fiyatı, seçenek ek ücretleri) birlikte ölçekler.
 * Eski hata: yalnız basePrice/startingPrice yazılıyordu → matrisli üründe sitede fiyat değişmiyordu.
 */
export class BulkPriceDto {
  @IsIn(["all", "category"])
  scope!: "all" | "category";

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsIn(["percent", "fixed"])
  op!: "percent" | "fixed";

  @IsIn(["increase", "decrease"])
  direction!: "increase" | "decrease";

  @IsNumber()
  @Min(0)
  value!: number;

  /** "none" | "5" | "10" | "50" | "100" — bütün-fiyat alanlarını en yakına yuvarlar. */
  @IsString()
  @IsOptional()
  round?: string;
}
