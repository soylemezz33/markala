import { Type } from "class-transformer";
import {
  Allow,
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
} from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

/**
 * Konfigürasyon JSON'u derinlik/boyut koruması — DoS savunması.
 * Gerçek konfigüratör seçimleri düz (flat) bir kayıt + özet string'dir;
 * derin iç içe geçmiş yapıya ihtiyaç yoktur.
 */
function jsonDepth(value: unknown, depth = 0): number {
  if (depth > 8) return depth; // erken çıkış (sayım gereksiz)
  if (Array.isArray(value)) {
    return value.reduce((max: number, v: unknown) => Math.max(max, jsonDepth(v, depth + 1)), depth);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce(
      (max: number, v: unknown) => Math.max(max, jsonDepth(v, depth + 1)),
      depth,
    );
  }
  return depth;
}

function jsonKeyCount(value: unknown): number {
  if (value === null || typeof value !== "object") return 0;
  if (Array.isArray(value)) return value.reduce((s: number, v: unknown) => s + jsonKeyCount(v), 0);
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length + keys.reduce((s, k) => s + jsonKeyCount((value as Record<string, unknown>)[k]), 0);
}

/** Decorator: configuration alanı için derinlik ≤ 6, toplam anahtar sayısı ≤ 200. */
function IsShallowConfig(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isShallowConfig",
      target: object.constructor,
      propertyName,
      options: {
        message: "Konfigürasyon nesnesi çok derin veya çok fazla alan içeriyor.",
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) return true;
          if (jsonDepth(value) > 6) return false;
          if (jsonKeyCount(value) > 200) return false;
          return true;
        },
      },
    });
  };
}

/**
 * SECURITY NOTE
 * -------------
 * Sipariş kalemleri için DTO sadece "ne sipariş ediliyor" bilgisini taşır:
 * productId, configuration, quantity, opsiyonel tasarım yüklemeleri.
 * Fiyat alanları (unitPrice / lineTotal / subtotal / vat / total) BİLEREK DTO'da yer almıyor.
 * Sunucu fiyatları Product tablosundan tekrar hesaplar — bkz. OrdersService.create().
 * Defense in depth: client unitPrice/total gönderse bile whitelist:true ile düşürülür.
 */
export class CreateOrderItemDto {
  /**
   * Ürün kimliği. Kayıtlı katalog akışında doğrudan id gelir; storefront sepeti yalnızca
   * `productSlug` taşıdığından id opsiyoneldir — ikisinden EN AZ BİRİ zorunludur (servis doğrular).
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  productId?: string;

  /** Storefront sepetinin taşıdığı ürün slug'ı (id yoksa sunucu bununla ürünü bulur). */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  productSlug?: string;

  /**
   * Konfigüratör seçimleri snapshot'ı — esnek JSON, sunucu fiyatlandırırken kullanır.
   * @Allow(): tipsiz/dekoratörsüz alan ValidationPipe whitelist:true tarafından silinmesin
   * (aksi halde storefront'un summary/selections snapshot'ı kaybolur, admin özet boş kalırdı).
   * @IsShallowConfig: derinlik > 6 veya toplam anahtar > 200 → 400 (DoS savunması).
   */
  @Allow()
  @IsShallowConfig()
  configuration: unknown;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsBoolean()
  @IsOptional()
  needsDesignSupport?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  uploadedFileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  uploadedFileUrl?: string;
}

/**
 * Satır-içi (misafir/storefront) adres. Kayıtlı Address yoksa sipariş bununla oluşturulur;
 * snapshot olarak Order'a yazılır. Kayıtlı müşteri akışında bunun yerine `shippingAddressId` gelir.
 */
export class InlineAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  district!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fullAddress!: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  zipCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  label?: string;

  // Kurumsal fatura alanları — fatura adresinde gelir; servis snapshot'a alır, Paraşüt e-fatura
  // kurumsal/bireysel sınıflandırması bunu okur. (whitelist bunlar olmadan soyuyordu.)
  @IsString()
  @IsOptional()
  @IsIn(["individual", "corporate"])
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  taxNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  taxOffice?: string;
}

export class CreateOrderDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  /**
   * Kayıtlı adres FK'leri. Storefront/misafir akışında gelmez — bunun yerine satır-içi
   * `shippingAddress` / `billingAddress` gelir. Servis: her adres için id VEYA inline, en az biri zorunlu.
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  shippingAddressId?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  billingAddressId?: string;

  /** Satır-içi teslimat adresi (misafir/storefront) — FK yoksa kullanılır. */
  @IsOptional()
  @ValidateNested()
  @Type(() => InlineAddressDto)
  shippingAddress?: InlineAddressDto;

  /** Satır-içi fatura adresi — verilmezse teslimat adresi kullanılır. */
  @IsOptional()
  @ValidateNested()
  @Type(() => InlineAddressDto)
  billingAddress?: InlineAddressDto;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  couponCode?: string;

  /** Sadakat: bu siparişte harcanacak puan (sunucu bakiye + kurallara göre yeniden doğrular). */
  @IsInt()
  @IsOptional()
  @Min(0)
  redeemPoints?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  /** Ödeme yolu: "iyzico" (varsayılan/online) veya "cari" (açık hesap — onaylı kurumsal). */
  @IsString()
  @IsOptional()
  @IsIn(["iyzico", "cari", "havale"])
  paymentMethod?: string;

  // ─── Meta Conversions API sinyalleri (checkout çerezlerinden; KVKK onay-gate'li) ───
  /** Pazarlama çerez onayı. false ise sunucu Purchase'ı Meta'ya GÖNDERMEZ. */
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;

  /** _fbp çerezi (Meta tarayıcı kimliği — eşleşme kalitesini artırır). */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  fbp?: string;

  /** _fbc çerezi (Meta tıklama kimliği — reklamdan gelen ziyaretçi). */
  @IsString()
  @IsOptional()
  @MaxLength(400)
  fbc?: string;
}

/** Yönetici sipariş durumu güncellemesi — sadece izinli geçişler. */
export const ORDER_STATUS_VALUES = [
  "siparis-alindi",
  "tasarim-bekleniyor",
  "tasarim-onayindi",
  "uretimde",
  "kargoya-verildi",
  "teslim-edildi",
  "iptal-edildi",
] as const;
export type OrderStatusInput = (typeof ORDER_STATUS_VALUES)[number];

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(ORDER_STATUS_VALUES as unknown as string[])
  status!: OrderStatusInput;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  trackingCarrier?: string;
}

/** Public kargo takip sorgusu — sipariş no + e-posta eşleşmesi (auth YOK, rate-limitli). */
export class TrackOrderDto {
  @IsString()
  @MaxLength(40)
  orderNumber!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;
}

/** Yönetici sipariş listesi sorgu parametreleri — doğrulanmış sayfalama + opsiyonel durum filtresi. */
export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUS_VALUES as unknown as string[])
  status?: OrderStatusInput;
}
