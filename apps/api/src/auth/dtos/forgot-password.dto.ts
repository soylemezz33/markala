import { Transform } from "class-transformer";
import { IsEmail, MaxLength } from "class-validator";

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
