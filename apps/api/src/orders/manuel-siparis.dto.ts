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
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { MANUEL_KANALLAR, MANUEL_ODEME_YONTEMLERI } from "./manuel-siparis-kural";

/**
 * Manuel sipariş kalemi. Katalog ürünüyse `selections` (sitedeki konfigüratörle aynı anahtarlar:
 * grup → seçenek; alan ürünlerinde en/boy cm) verilir ve fiyat SUNUCU motoruyla hesaplanır;
 * `fiyatElle` işaretliyse ya da ürün katalog dışıysa `unitPrice` (KDV dahil) elle geçerlidir.
 */
export class ManuelKalemDto {
  @IsOptional() @IsString() @MaxLength(40)
  productId?: string;

  @IsString() @MaxLength(200)
  productName!: string;

  @IsOptional() @IsString() @MaxLength(500)
  configurationSummary?: string;

  /** Konfigüratör seçimleri (grup → seçenek anahtarı; area: en, boy). */
  @IsOptional() @IsObject()
  selections?: Record<string, string>;

  /** true → sunucu fiyatı hesaplamaz, unitPrice elle alınır. */
  @IsOptional() @IsBoolean()
  fiyatElle?: boolean;

  @IsInt() @Min(1) @Max(100000)
  quantity!: number;

  /** KDV dahil birim fiyat (₺) — elle fiyatta zorunlu, otomatikte yok sayılır. */
  @IsOptional() @IsNumber() @Min(0) @Max(10_000_000)
  unitPrice?: number;

  /** Tedarikçi maliyeti (opsiyonel; katalog ürününde motor hesaplar). */
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

  @IsOptional() @IsBoolean()
  musteriyeEposta?: boolean;

  /**
   * FATURA KESİLMESİN (2026-09-23, Hasan: "manuellerin birçoğunu önden fatura kesiyorum,
   * tekrar kesinlikle fatura kesmemeli"). true → sipariş kargoya verilince Paraşüt taslağı
   * HİÇ oluşturulmaz; taslak olmadığı için resmileştirme cronu da bu siparişi hiç görmez.
   */
  @IsOptional() @IsBoolean()
  faturaKesilmesin?: boolean;
}

/** POST /orders/manuel/fiyatla — tek kalem için sunucu fiyatı (form canlı özet). */
export class ManuelFiyatDto {
  @IsString() @MaxLength(40)
  productId!: string;

  @IsOptional() @IsObject()
  selections?: Record<string, string>;

  @IsInt() @Min(1) @Max(100000)
  quantity!: number;
}
