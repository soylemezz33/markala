import { IsString, IsNotEmpty, IsUrl, IsOptional, IsNumber, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SemanticSearchDto {
  @ApiProperty({ description: "Arama sorgusu (Türkçe / İngilizce)", example: "kartvizit baskı" })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ description: "Maksimum sonuç sayısı", default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number;
}

export class DesignQualityCheckDto {
  // KVKK: URL sadece R2/depolama'ya işaret etmeli; PII içerebilecek meta upstream'e gönderilmeden önce scrub gerekir.
  @ApiProperty({ description: "Kontrol edilecek tasarım dosyasının public URL'i (R2)" })
  @IsUrl()
  designUrl: string;

  @ApiPropertyOptional({ description: "Beklenen DPI (varsayılan: 300)" })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(1200)
  expectedDpi?: number;

  @ApiPropertyOptional({ description: "Kesim payı (mm)", example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bleedMm?: number;
}

export class ChatbotMessageDto {
  @ApiProperty({ description: "Kullanıcı mesajı" })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: "Oturum kimliği (session yoksa yeni oturum açılır)" })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class SemanticSearchResultDto {
  productId: string;
  score: number;
  name: string;
  slug: string;
}

export class DesignQualityResultDto {
  passed: boolean;
  dpi: number | null;
  bleedMm: number | null;
  warnings: string[];
  errors: string[];
}

export class ChatbotResponseDto {
  sessionId: string;
  reply: string;
  suggestedProductSlugs: string[];
}
