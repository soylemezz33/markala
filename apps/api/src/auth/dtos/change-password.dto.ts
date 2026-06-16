import { IsString, Matches, MaxLength, MinLength } from "class-validator";

/**
 * Şifre değiştirme — currentPassword backend'de argon2.verify ile DOĞRULANIR.
 * newPassword register ile aynı complexity (büyük + küçük + rakam, 8-128).
 */
export class ChangePasswordDto {
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Şifre: büyük, küçük harf ve rakam içermelidir",
  })
  newPassword!: string;
}
