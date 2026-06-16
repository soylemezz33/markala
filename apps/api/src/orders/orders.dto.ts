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
} from "class-validator";
import { PaginationQueryDto } from "../common/pagination.dto";

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
   */
  @Allow()
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

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
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

/** Yönetici sipariş listesi sorgu parametreleri — doğrulanmış sayfalama + opsiyonel durum filtresi. */
export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUS_VALUES as unknown as string[])
  status?: OrderStatusInput;
}
