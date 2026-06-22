import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class CreateCategoryDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "slug yalnızca küçük harf, rakam ve tire içerebilir" })
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(280)
  shortDescription!: string;

  @IsString()
  @MinLength(2)
  longDescription!: string;

  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: "accentColor #RGB veya #RRGGBB formatında olmalı" })
  accentColor?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  startingPrice!: number;

  @IsString()
  @MaxLength(80)
  productionTime!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  content?: unknown;

  @IsString()
  @IsOptional()
  @Matches(SLUG_REGEX, { message: "slug yalnızca küçük harf, rakam ve tire içerebilir" })
  slug?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(280)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  longDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: "accentColor #RGB veya #RRGGBB formatında olmalı" })
  accentColor?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  startingPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  productionTime?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
