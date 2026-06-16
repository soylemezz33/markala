import { Type } from "class-transformer";
import {
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
  @IsString()
  @IsNotEmpty()
  productId!: string;

  /** Konfigüratör seçimleri snapshot'ı — esnek JSON, sunucu fiyatlandırırken kullanır. */
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

  @IsString()
  @IsNotEmpty()
  shippingAddressId!: string;

  @IsString()
  @IsNotEmpty()
  billingAddressId!: string;

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
