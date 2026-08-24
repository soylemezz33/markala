import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsInt, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class CartLeadItemDto {
  @IsString()
  @MaxLength(160)
  productSlug!: string;

  @IsString()
  @MaxLength(200)
  productName!: string;

  @IsInt()
  @Min(1)
  @Max(100000)
  quantity!: number;
}

export class CreateCartLeadDto {
  @IsString()
  @MaxLength(80)
  sessionId!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  consent!: boolean;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLeadItemDto)
  cart!: CartLeadItemDto[];
}
