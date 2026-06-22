// Prices modülü DTO'ları — konfigüratör yapısı, fiyat satırları, toplu/kategori araçları.
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OptionInputDto {
  @IsString() @MaxLength(60) groupKey!: string;
  @IsString() @MaxLength(120) groupLabel!: string;
  @IsIn(["dimension", "priced"]) groupRole!: "dimension" | "priced";
  @IsInt() @Min(0) groupSort!: number;
  @IsString() @MaxLength(80) optionKey!: string;
  @IsString() @MaxLength(200) optionLabel!: string;
  @IsString() @IsOptional() @MaxLength(400) optionSublabel?: string;
  @IsInt() @Min(0) optionSort!: number;
  @IsBoolean() @IsOptional() locked?: boolean;
  @IsOptional() rules?: unknown;
}
export class SetOptionsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInputDto)
  options!: OptionInputDto[];
}

export class PriceInputDto {
  @IsString() @IsOptional() @MaxLength(60) groupKey?: string;
  @IsString() @IsOptional() @MaxLength(80) optionKey?: string;
  @IsString() @IsOptional() @MaxLength(80) dimKey?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsOptional() @Min(0) cost?: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
}
export class SetPricesDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceInputDto)
  prices!: PriceInputDto[];
}

export class BulkAdjustDto {
  @IsIn(["all", "category"]) scope!: "all" | "category";
  @IsString() @IsOptional() categoryId?: string;
  @IsIn(["percent", "fixed"]) op!: "percent" | "fixed";
  @IsIn(["increase", "decrease"]) direction!: "increase" | "decrease";
  @IsNumber() @Min(0) value!: number;
  @IsIn(["none", "1", "5", "10"]) @IsOptional() round?: "none" | "1" | "5" | "10";
}

export class CategorySetDto {
  @IsString() categoryId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
}
