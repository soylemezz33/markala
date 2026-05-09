import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Cloudflare R2 (S3-compatible) tasarım dosyası depolama — STUB.
 *
 * FAZ 4'te @aws-sdk/client-s3 ile R2 endpoint'ine bağlanır.
 * Token: cloudflare.md memory'de Hasan'da var.
 *
 * Bucket önerisi: markala-uploads
 * Public read URL pattern: https://markala-uploads.r2.dev/{key}
 *   veya custom domain: https://files.markala.com.tr/{key}
 */
@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  constructor(private config: ConfigService) {}

  async getPresignedUploadUrl(input: {
    key: string;
    contentType: string;
    maxBytes?: number;
  }): Promise<{ uploadUrl: string; publicUrl: string; expiresAt: string }> {
    this.logger.warn(`[STUB] R2 presigned upload: ${input.key}`);
    return {
      uploadUrl: `https://stub.example.com/upload/${input.key}`,
      publicUrl: `https://stub.example.com/files/${input.key}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async deleteObject(key: string): Promise<void> {
    this.logger.warn(`[STUB] R2 delete: ${key}`);
  }
}
