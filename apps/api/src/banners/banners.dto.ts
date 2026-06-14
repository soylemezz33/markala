import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateBannerDto {
  @IsString() @MinLength(2)
  title!: string;

  @IsIn(["hero", "category", "cart", "footer"])
  location!: "hero" | "category" | "cart" | "footer";

  @IsString() @MaxLength(500)
  imageUrl!: string;

  @IsString() @IsOptional()
  mobileImageUrl?: string;

  @IsString() @MaxLength(80) @IsOptional()
  ctaLabel?: string;

  @IsString() @MaxLength(500) @IsOptional()
  ctaHref?: string;

  @IsDateString() @IsOptional()
  startDate?: string;

  @IsDateString() @IsOptional()
  endDate?: string;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @IsString() @MinLength(2) @IsOptional()
  title?: string;

  @IsIn(["hero", "category", "cart", "footer"]) @IsOptional()
  location?: "hero" | "category" | "cart" | "footer";

  @IsString() @MaxLength(500) @IsOptional()
  imageUrl?: string;

  @IsString() @IsOptional()
  mobileImageUrl?: string;

  @IsString() @MaxLength(80) @IsOptional()
  ctaLabel?: string;

  @IsString() @MaxLength(500) @IsOptional()
  ctaHref?: string;

  @IsDateString() @IsOptional()
  startDate?: string;

  @IsDateString() @IsOptional()
  endDate?: string;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
