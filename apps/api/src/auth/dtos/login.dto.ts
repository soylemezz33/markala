import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";

/**
 * SECURITY:
 * - email lowercase+trim ile case-insensitive lookup.
 * - password MaxLength(128) — argon2 verify DoS koruması (verify side bcrypt kadar pahalı değil
 *   ama yine de 10MB payload'a izin vermenin sebebi yok).
 * - Generic hata mesajı service tarafında ("Geçersiz e-posta veya şifre") — user enumeration engellenir.
 */
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}
