import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Portfolyo öğesi oluşturma (admin). */
export class CreatePortfolioItemDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase alphanumeric with hyphens" })
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  client?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  productSlug?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/** Portfolyo öğesi güncelleme (admin) — tüm alanlar opsiyonel. */
export class UpdatePortfolioItemDto {
  @IsString()
  @IsOptional()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase alphanumeric with hyphens" })
  slug?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  client?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  productSlug?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
