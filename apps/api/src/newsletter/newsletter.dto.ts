import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubscriberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  source?: string;
}

/** PUBLIC çıkış (GET /newsletter/unsubscribe) query'si — token HMAC-SHA256 hex (64 karakter). */
export class UnsubscribeQueryDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  token!: string;
}
