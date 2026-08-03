import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class SetApprovalDto {
  @IsBoolean()
  isApproved!: boolean;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Token doğrulama query parametreleri — GET /reviews/public/verify-token */
export class VerifyReviewTokenQueryDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;
}

/** Token'lı yorum oluşturma — POST /reviews/public/from-token (giriş gerektirmez). */
export class CreateTokenReviewDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @Matches(SLUG_REGEX, { message: "productSlug yalnızca küçük harf, rakam ve tire içerebilir" })
  productSlug!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}

/** Public yorum oluşturma — giriş yapmış müşteri. Yeni yorum onaysız (pending) doğar. */
export class CreatePublicReviewDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "productSlug yalnızca küçük harf, rakam ve tire içerebilir" })
  productSlug!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}
