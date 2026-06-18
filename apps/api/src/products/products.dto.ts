import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
