import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from "class-validator";

export class CreateCampaignPackageDto {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsString() @MinLength(2)
  name!: string;

  @IsIn(["esnaf", "kurumsal", "etkinlik", "acilis", "promosyon"])
  category!: "esnaf" | "kurumsal" | "etkinlik" | "acilis" | "promosyon";

  @IsString()
  contents!: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  listPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  packagePrice!: number;

  @IsInt() @Min(0) @IsOptional()
  stockLimit?: number;

  @IsDateString() @IsOptional()
  endDate?: string;

  @IsBoolean() @IsOptional()
  designSupport?: boolean;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateCampaignPackageDto {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @IsOptional()
  slug?: string;

  @IsString() @MinLength(2) @IsOptional()
  name?: string;

  @IsIn(["esnaf", "kurumsal", "etkinlik", "acilis", "promosyon"]) @IsOptional()
  category?: "esnaf" | "kurumsal" | "etkinlik" | "acilis" | "promosyon";

  @IsString() @IsOptional()
  contents?: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @IsOptional()
  listPrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @IsOptional()
  packagePrice?: number;

  @IsInt() @Min(0) @IsOptional()
  stockLimit?: number;

  @IsDateString() @IsOptional()
  endDate?: string;

  @IsBoolean() @IsOptional()
  designSupport?: boolean;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
