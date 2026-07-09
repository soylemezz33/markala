import { IsString, MaxLength, MinLength } from "class-validator";

/** E-posta doğrulama — e-postadaki tek-kullanımlık base64url token (uzunluk sınırı DoS koruması). */
export class VerifyEmailDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  token!: string;
}
