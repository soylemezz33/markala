import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ReviewCorporateDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

/** Public (B2B form) — kurumsal başvuru oluşturma. Auth gerektirmez. */
export class CreateCorporateApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  taxOffice?: string;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  taxNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sector?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  annualVolume?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  contactName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactRole?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
