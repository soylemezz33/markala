import {
  IsBoolean,
  IsInt,
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
