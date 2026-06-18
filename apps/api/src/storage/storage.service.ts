import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Görsel depolama — sürücü deseni.
 *
 * - `local`  : R2 env yokken (dev). Dosyayı UPLOAD_DIR'e yazar, mutlak public URL döner.
 *              Dosyalar API'de `/uploads/*` statik route'undan sunulur (bkz. main.ts).
 * - `r2`     : R2_* env tanımlıyken (prod). @aws-sdk/client-s3 ile Cloudflare R2'ye PutObject.
 *
 * Sözleşme ve doğrulama her iki sürücüde aynı; sadece yazma hedefi değişir.
 */
const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Müşteri tasarım dosyası — admin görsel yüklemeden FARKLI kurallar:
 * matbaa kaynak dosyaları (CDR/AI/PSD) MIME tipi güvenilmez → UZANTI whitelist'i ile doğrulanır.
 */
const DESIGN_ALLOWED_EXT = new Set([
  "pdf",
  "ai",
  "eps",
  "cdr",
  "psd",
  "jpg",
  "jpeg",
  "png",
  "svg",
  "tif",
  "tiff",
  "zip",
  "rar",
]);
const DESIGN_MAX_BYTES = 50 * 1024 * 1024;

export interface UploadInput {
  buffer: Buffer;
  mimetype: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface DesignUploadInput {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
}

export interface DesignUploadResult {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
}

/** Dosya adını güvenli hale getir — sadece harf/rakam/._- bırak, son 120 karaktere kırp. */
function sanitizeFileName(originalName: string): string {
  return (originalName ?? "").replace(/[^\w.\-]+/g, "_").slice(-120);
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  constructor(private config: ConfigService) {}

  /** R2 credential tanımlıysa prod (r2), değilse dev (local). Prod env adları: R2_*. */
  get driver(): "local" | "r2" {
    return this.config.get<string>("R2_ACCESS_KEY_ID") ? "r2" : "local";
  }

  async put(file: UploadInput): Promise<UploadResult> {
    const ext = ALLOWED_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        "Yalnızca JPG, PNG veya WEBP görsel yükleyebilirsiniz.",
      );
    }
    if (file.buffer.length > MAX_BYTES) {
      throw new BadRequestException("Görsel boyutu en fazla 5MB olabilir.");
    }

    const key = `${randomUUID()}.${ext}`;
    return this.driver === "r2"
      ? this.putR2(key, file)
      : this.putLocal(key, file);
  }

  /**
   * Müşteri tasarım dosyası yükleme. Tip doğrulaması UZANTI ile (CDR/AI/PSD mimetype güvenilmez);
   * maks 50MB. putLocal/putR2 yazma altyapısı yeniden kullanılır.
   */
  async putDesign(input: DesignUploadInput): Promise<DesignUploadResult> {
    const ext = (input.originalName.split(".").pop() ?? "").toLowerCase();
    if (!ext || !DESIGN_ALLOWED_EXT.has(ext)) {
      throw new BadRequestException(
        "Yalnızca PDF, AI, EPS, CDR, PSD, JPG, PNG, SVG, TIFF, ZIP veya RAR dosyası yükleyebilirsiniz.",
      );
    }
    if (input.buffer.length > DESIGN_MAX_BYTES) {
      throw new BadRequestException("Tasarım dosyası en fazla 50MB olabilir.");
    }

    const key = `${randomUUID()}.${ext}`;
    const file: UploadInput = { buffer: input.buffer, mimetype: input.mimetype };
    const { url } = await (this.driver === "r2"
      ? this.putR2(key, file)
      : this.putLocal(key, file));
    return {
      url,
      key,
      fileName: sanitizeFileName(input.originalName),
      fileSize: input.buffer.length,
    };
  }

  private get uploadDir(): string {
    return (
      this.config.get<string>("UPLOAD_DIR") ?? join(process.cwd(), "uploads")
    );
  }

  private async putLocal(key: string, file: UploadInput): Promise<UploadResult> {
    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(this.uploadDir, key), file.buffer);
    // Mutlak URL: prod'da API_PUBLIC_URL (domain), dev'de API'nin kendi portu.
    const base = (
      this.config.get<string>("API_PUBLIC_URL") ??
      `http://localhost:${this.config.get<string>("PORT") ?? "4000"}`
    ).replace(/\/$/, "");
    return { url: `${base}/uploads/${key}`, key };
  }

  private async putR2(key: string, file: UploadInput): Promise<UploadResult> {
    // Lazy import: SDK yalnızca r2 sürücüsünde yüklenir (dev başlangıcını yavaşlatmaz).
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>("R2_ACCESS_KEY_ID")!,
        secretAccessKey: this.config.get<string>("R2_SECRET_ACCESS_KEY")!,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: this.config.get<string>("R2_BUCKET"),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    // Public okuma URL tabanı (prod env: R2_PUBLIC_URL, örn. https://uploads.markala.com.tr).
    const base = (this.config.get<string>("R2_PUBLIC_URL") ?? "").replace(
      /\/$/,
      "",
    );
    this.logger.log(`R2 upload: ${key}`);
    return { url: `${base}/${key}`, key };
  }
}
