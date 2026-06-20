import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/** İletişim formu mesajı (public). Doğrulama web route'unkiyle aynı eşikler. */
export class CreateContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  source?: string;

  /** Web route'un ürettiği takip no (TK-...). Verilmezse servis üretir. */
  @IsString()
  @IsOptional()
  @MaxLength(40)
  ticketId?: string;
}
