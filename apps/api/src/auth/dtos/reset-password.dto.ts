import { IsString, Matches, MaxLength, MinLength } from "class-validator";

/**
 * Şifre sıfırlama — yeni şifre register/changePassword ile aynı complexity (büyük+küçük+rakam, 8-128).
 * token: e-postadaki tek-kullanımlık base64url token (uzunluk sınırı DoS koruması).
 */
export class ResetPasswordDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Şifre: büyük, küçük harf ve rakam içermelidir",
  })
  newPassword!: string;
}
