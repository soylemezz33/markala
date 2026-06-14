import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateFaqDto {
  @IsString() @MinLength(5)
  question!: string;

  @IsString() @MinLength(2)
  answer!: string;

  @IsIn(["tasarim", "urun", "kargo", "odeme", "iade", "genel"])
  category!: string;

  @IsString() @IsOptional()
  productSlug?: string;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateFaqDto {
  @IsString() @MinLength(5) @IsOptional()
  question?: string;

  @IsString() @MinLength(2) @IsOptional()
  answer?: string;

  @IsIn(["tasarim", "urun", "kargo", "odeme", "iade", "genel"]) @IsOptional()
  category?: string;

  @IsString() @IsOptional()
  productSlug?: string;

  @IsInt() @Min(0) @IsOptional()
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
