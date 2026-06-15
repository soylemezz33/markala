import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateCouponDto {
  @IsString() @MinLength(2) @MaxLength(40)
  code!: string;

  @IsIn(["percentage", "fixed_amount", "free_shipping"])
  type!: "percentage" | "fixed_amount" | "free_shipping";

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  value!: number;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @IsOptional()
  minOrderAmount?: number;

  @IsInt() @Min(1) @IsOptional()
  maxUses?: number;

  @IsDateString() @IsOptional()
  validFrom?: string;

  @IsDateString() @IsOptional()
  validUntil?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @IsString() @IsOptional() @MinLength(2) @MaxLength(40)
  code?: string;

  @IsIn(["percentage", "fixed_amount", "free_shipping"]) @IsOptional()
  type?: "percentage" | "fixed_amount" | "free_shipping";

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @IsOptional()
  value?: number;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @IsOptional()
  minOrderAmount?: number;

  @IsInt() @Min(1) @IsOptional()
  maxUses?: number;

  @IsDateString() @IsOptional()
  validFrom?: string;

  @IsDateString() @IsOptional()
  validUntil?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
