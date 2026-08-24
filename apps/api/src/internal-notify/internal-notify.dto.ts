import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class CartReminderItemDto {
  @IsString()
  @MaxLength(200)
  productName!: string;

  @IsInt()
  @Min(1)
  @Max(100000)
  quantity!: number;
}

export class SendCartReminderDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsIn(["guest", "member"])
  kind!: "guest" | "member";

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartReminderItemDto)
  items!: CartReminderItemDto[];
}
