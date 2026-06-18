import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateBrandDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @IsUrl({ require_tld: false }, { message: "websiteUrl geçerli bir URL olmalı" })
  @IsOptional()
  @MaxLength(500)
  websiteUrl?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @IsUrl({ require_tld: false }, { message: "websiteUrl geçerli bir URL olmalı" })
  @IsOptional()
  @MaxLength(500)
  websiteUrl?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
