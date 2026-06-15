import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateHeroSlideDto {
  @IsString() @MinLength(2) @MaxLength(160)
  title!: string;

  @IsString() @IsOptional() @MaxLength(280)
  subtitle?: string;

  @IsString() @MaxLength(500)
  imageUrl!: string;

  @IsString() @IsOptional() @MaxLength(500)
  mobileImageUrl?: string;

  @IsString() @IsOptional() @MaxLength(80)
  ctaLabel?: string;

  @IsString() @IsOptional() @MaxLength(500)
  ctaHref?: string;

  @IsInt() @IsOptional() @Min(0)
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateHeroSlideDto {
  @IsString() @IsOptional() @MinLength(2) @MaxLength(160)
  title?: string;
  @IsString() @IsOptional() @MaxLength(280)
  subtitle?: string;
  @IsString() @IsOptional() @MaxLength(500)
  imageUrl?: string;
  @IsString() @IsOptional() @MaxLength(500)
  mobileImageUrl?: string;
  @IsString() @IsOptional() @MaxLength(80)
  ctaLabel?: string;
  @IsString() @IsOptional() @MaxLength(500)
  ctaHref?: string;
  @IsInt() @IsOptional() @Min(0)
  sortOrder?: number;
  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
