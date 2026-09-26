import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

/** Ajanın kendi panel hesabıyla girişi — iframe içinden, paylaşılan anahtara EK olarak. */
export class PanelOturumDto {
  @IsEmail({}, { message: "Geçerli bir e-posta girin." })
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(1, { message: "Şifre gerekli." })
  @MaxLength(200)
  password!: string;
}
