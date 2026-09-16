import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { MANUEL_KANALLAR, MANUEL_ODEME_YONTEMLERI } from "./manuel-siparis-kural";

/** Manuel sipariş kalemi: katalog ürünü (productId) ya da serbest metin; fiyat KDV dahil elle. */
export class ManuelKalemDto {
  @IsOptional() @IsString() @MaxLength(40)
  productId?: string;

  @IsString() @MaxLength(200)
  productName!: string;

  @IsOptional() @IsString() @MaxLength(500)
  configurationSummary?: string;

  @IsInt() @Min(1) @Max(100000)
  quantity!: number;

  /** KDV dahil birim fiyat (₺). */
  @IsNumber() @Min(0) @Max(10_000_000)
  unitPrice!: number;

  /** Tedarikçi maliyeti (opsiyonel; kâr raporları için). */
  @IsOptional() @IsNumber() @Min(0)
  costTotal?: number;

  @IsOptional() @IsBoolean()
  needsDesignSupport?: boolean;
}

export class ManuelAdresDto {
  @IsString() @MaxLength(120) fullName!: string;
  @IsString() @MaxLength(30) phone!: string;
  @IsString() @MaxLength(60) city!: string;
  @IsString() @MaxLength(60) district!: string;
  @IsString() @MaxLength(400) fullAddress!: string;
  @IsOptional() @IsString() @MaxLength(10) zipCode?: string;
  @IsOptional() @IsIn(["individual", "corporate"]) type?: string;
  @IsOptional() @IsString() @MaxLength(160) companyName?: string;
  @IsOptional() @IsString() @MaxLength(11) taxNumber?: string;
  @IsOptional() @IsString() @MaxLength(80) taxOffice?: string;
}

/**
 * MANUEL SİPARİŞ (panel, 2026-09-16). Yüz yüze / telefon / WhatsApp ile alınan işi sisteme
 * kaydeder: ciroya girer, aynı akışta takip edilir (durumlar, Chatwoot, kargoda fatura).
 */
export class ManuelSiparisDto {
  /** Kayıtlı müşteri seçildiyse. */
  @IsOptional() @IsString() @MaxLength(40)
  userId?: string;

  @IsString() @MaxLength(120)
  fullName!: string;

  @IsString() @MaxLength(30)
  phone!: string;

  @IsOptional() @IsEmail() @MaxLength(160)
  email?: string;

  @IsIn(["elden", "kargo"])
  teslimat!: "elden" | "kargo";

  @IsOptional() @ValidateNested() @Type(() => ManuelAdresDto)
  adres?: ManuelAdresDto;

  /** Fatura adresi/kurumsal bilgiler; yoksa teslimat adresi bireysel fatura sayılır. */
  @IsOptional() @ValidateNested() @Type(() => ManuelAdresDto)
  faturaAdresi?: ManuelAdresDto;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => ManuelKalemDto)
  kalemler!: ManuelKalemDto[];

  @IsOptional() @IsNumber() @Min(0) @Max(100000)
  kargoUcreti?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(10_000_000)
  indirim?: number;

  @IsIn(MANUEL_ODEME_YONTEMLERI as readonly string[])
  odemeYontemi!: "havale" | "nakit" | "pos";

  @IsBoolean()
  odemeAlindi!: boolean;

  @IsIn(MANUEL_KANALLAR as readonly string[])
  kanal!: "yuz-yuze" | "telefon" | "whatsapp" | "diger";

  @IsOptional() @IsString() @MaxLength(2000)
  not?: string;

  /** Müşteriye sipariş onay e-postası gönderilsin mi (e-posta varsa). */
  @IsOptional() @IsBoolean()
  musteriyeEposta?: boolean;
}
