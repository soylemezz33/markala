import { IsBoolean, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

/**
 * SECURITY (mass assignment koruması):
 * Bu DTO'da YALNIZCA kullanıcının kendi profil bilgileri yer alır.
 * `role`, `accountType`, `corporateStatus`, `corporateDiscount`, `corporateCreditLimit`,
 * `passwordHash`, `emailVerifiedAt`, `twoFactorEnabled`, `twoFactorSecret` gibi alanlar
 * BİLEREK DIŞARIDA TUTULMUŞTUR. ValidationPipe `whitelist: true` ile bu alanlar gelse bile
 * düşürülür — privilege escalation imkânsız.
 */
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  taxOffice?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  taxNumber?: string;
}

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  fullAddress!: string;

  @IsString()
  @IsOptional()
  @Length(4, 12)
  zipCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(40)
  label?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MinLength(7)
  @MaxLength(32)
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(60)
  city?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(80)
  district?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(500)
  fullAddress?: string;

  @IsString()
  @IsOptional()
  @Length(4, 12)
  zipCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
