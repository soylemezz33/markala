import { IsString, MinLength, MaxLength } from "class-validator";

/** Google Identity Services (GIS) ID token'ı — frontend'deki "Google ile devam et" butonundan gelir. */
export class GoogleLoginDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  credential!: string;
}
