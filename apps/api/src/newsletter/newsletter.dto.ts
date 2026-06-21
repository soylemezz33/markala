import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubscriberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  source?: string;
}
