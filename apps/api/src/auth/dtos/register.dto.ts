import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * SECURITY:
 * - `password` MaxLength(128): argon2 hash CPU/RAM DoS koruması.
 *   Aksi halde istemci 10MB'lık parola yollar, sunucu argon2'de takılır.
 * - Complexity regex: en az 1 küçük + 1 büyük + 1 rakam.
 * - email `@Transform` ile lowercase+trim — duplicate kayıt enumeration sızıntısını engeller.
 * - `role`, `accountType`, `corporateStatus` BİLEREK YOK — mass assignment + privilege escalation koruması.
 */
export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Şifre: büyük, küçük harf ve rakam içermelidir",
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Telefon E.164 formatında olmalıdır (örn. +905551234567)",
  })
  phone?: string;

  // Cloudflare Turnstile token (bot koruması) — controller'da verify edilir.
  @IsString()
  @IsOptional()
  @MaxLength(4096)
  turnstileToken?: string;
}
