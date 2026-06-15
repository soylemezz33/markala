import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  IsIn,
} from "class-validator";
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

export class GenerateDescriptionDto {
  @ApiProperty({ description: "Ürün adı", example: "Kartvizit (350gr Kuşe)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ description: "Kategori adı (bağlam için)", example: "Kartvizit" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryName?: string;

  @ApiPropertyOptional({ description: "Öne çıkarılacak anahtar kelimeler", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  keywords?: string[];

  @ApiPropertyOptional({ description: "Anlatım tonu", enum: ["kurumsal", "samimi"], default: "kurumsal" })
  @IsOptional()
  @IsIn(["kurumsal", "samimi"])
  tone?: "kurumsal" | "samimi";
}

export class GeneratedFaqDto {
  q: string;
  a: string;
}

export class GenerateDescriptionResultDto {
  // shortDescription, Product.shortDescription kısıtıyla uyumlu (≤280).
  shortDescription: string;
  description: string;
  faqs: GeneratedFaqDto[];
  // Çıktıyı üreten kaynak: "template" (deterministik, maliyetsiz) | "anthropic" (prod).
  provider: "template" | "anthropic";
  model: string | null;
}
