import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

/**
 * NOT (B6): document = Fabric.js canvas JSON. orders.dto'daki sığ-config (derinlik≤6/200-key)
 * kuralı UYGULANMAZ — Fabric JSON onu aşar. @IsObject ile opak kabul edilir, boyut serviste denetlenir.
 */
export class CreateDesignDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsObject()
  document!: Record<string, unknown>;

  @IsInt() @Min(1) @Max(5000)
  widthMm!: number;

  @IsInt() @Min(1) @Max(5000)
  heightMm!: number;

  @IsOptional() @IsInt() @Min(0) @Max(50)
  bleedMm?: number;

  /** Editörde üretilen küçük PNG önizleme (data URL) — boyut serviste sınırlı. */
  @IsOptional() @IsString() @MaxLength(3_500_000)
  previewUrl?: string;

  /** Misafir anonim oturum kimliği (üye değilse zorunlu). */
  @IsOptional() @IsString() @MaxLength(100)
  sessionId?: string;

  @IsOptional() @IsString() @MaxLength(40)
  templateId?: string;

  @IsOptional() @IsString() @MaxLength(40)
  productId?: string;
}

export class UpdateDesignDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsObject() document?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(3_500_000) previewUrl?: string;
  @IsOptional() @IsString() @MaxLength(100) sessionId?: string;
}

export class ClaimDesignsDto {
  @IsString() @MaxLength(100) sessionId!: string;
}
