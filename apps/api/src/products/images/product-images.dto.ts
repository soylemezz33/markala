import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

const VARIANT_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const RAW_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export class PresignImageDto {
  @IsString()
  @IsIn(RAW_MIME, { message: "contentType: JPG, PNG, WebP veya AVIF olmalı" })
  contentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(VARIANT_REGEX, { message: "variantKey geçersiz (küçük harf/rakam/._-)" })
  variantKey?: string;
}

export class CreateImageDto {
  /** presign yanıtından dönen ham kaynak nesne anahtarı. */
  @IsString()
  @MaxLength(300)
  sourceKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(VARIANT_REGEX, { message: "variantKey geçersiz (küçük harf/rakam/._-)" })
  variantKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
