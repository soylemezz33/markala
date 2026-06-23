import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/** Teklif talebi (public /teklif-al). Doğrulama web route'unkiyle aynı eşikler. */
export class CreateQuoteRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  sector?: string;

  /** Seçilen ürün etiketleri (+ "Diğer" serbest metni dahil). */
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  products?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(80)
  budget?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  quantity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  message?: string;

  /** Web route'un ürettiği takip no (TQ-...). Verilmezse servis üretir. */
  @IsString()
  @IsOptional()
  @MaxLength(40)
  ticketId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  source?: string;
}
