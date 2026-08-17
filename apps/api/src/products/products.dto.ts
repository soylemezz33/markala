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

  @IsString()
  @IsOptional()
  @IsIn(["additive", "area"])
  pricingMode?: string;

  @IsOptional()
  parameters?: unknown;

  /**
   * Zengin ürün içeriği — esnek JSON: specifications / features / useCases / faqs /
   * seo / sku / brand / relatedSlugs. Prisma şemasında sütun (Product.content) ve
   * storefront bunu okuyup ürün sekmelerinde + FAQPage JSON-LD'sinde kullanıyordu,
   * ama YAZMA yolu hiç yoktu — İSG kataloğunun içeriksiz kalmasının sebebi buydu
   * (2026-08 SEO denetimi). CategoriesDto'daki `content` deseniyle aynı.
   */
  @IsOptional()
  content?: unknown;
}

