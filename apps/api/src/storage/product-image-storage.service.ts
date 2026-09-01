import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";

/**
 * Ürün görseli için R2 + CDN katmanı (AJA-385).
 *
 * StorageService (tekil admin görsel / tasarım dosyası) ile AYRI tutulur: bu servis
 * çoklu-boyut + çoklu-format varyant nesnelerini, presigned PUT ve immutable cache
 * ile yönetir. Anahtar şeması ve CDN URL üretimi TEK OTORİTE burada.
 *
 * Anahtar şeması:
 *   base   = products/{slug}/{variantKey}/{hash8}     (DB'de ProductImage.url; uzantısız)
 *   variant = {base}-{size}.{fmt}                      (örn. -800.avif)
 *   orig    = {base}_orig.{fmt}                        (kaynak, strip'lenmiş)
 *
 * CDN: public okuma cdn.markala.com üzerinden; nesneler
 *   Cache-Control: public, max-age=31536000, immutable
 * ile yazılır (hash8 değişmeden içerik değişmez → süresiz cache güvenli).
 *
 * KVKK: yalnız PUBLIC ürün katalog görselleri. Müşteri baskı/tasarım dosyaları
 * BU BUCKET'A GİRMEZ (ayrı private kulvar — DesignUpload/putSecure).
 */

export const IMAGE_SIZES = [160, 400, 800, 1200, 2000] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

/** Kanonik AVIF; WebP fallback. Sıralama önem taşır (ilk = tercih edilen). */
export const IMAGE_FORMATS = ["avif", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const CONTENT_TYPE: Record<string, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function slugSegment(input: string): string {
  return (
    (input || "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "x"
  );
}

@Injectable()
export class ProductImageStorageService {
  private readonly logger = new Logger(ProductImageStorageService.name);
  constructor(private config: ConfigService) {}

  /** R2 credential tanımlıysa prod (r2), değilse dev (local disk driver). */
  get driver(): "local" | "r2" {
    return this.config.get<string>("R2_ACCESS_KEY_ID") ? "r2" : "local";
  }

  /** İçerik hash'inin ilk 8 karakteri — anahtar benzersizliği + idempotent import. */
  hash8(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex").slice(0, 8);
  }

  /**
   * Format-agnostik base key üretir (DB'de saklanan `url` alanı).
   *   products/{slug}/{variantKey}/{hash8}
   */
  buildBaseKey(slug: string, variantKey: string, hash8: string): string {
    return `products/${slugSegment(slug)}/${slugSegment(variantKey)}/${hash8}`;
  }

  variantObjectKey(baseKey: string, size: ImageSize, fmt: ImageFormat): string {
    return `${baseKey}-${size}.${fmt}`;
  }

  origObjectKey(baseKey: string, fmt: string): string {
    return `${baseKey}_orig.${fmt}`;
  }

  /** CDN public URL — Frontend/Storefront bu şekilde tüketir. */
  cdnUrl(baseKey: string, size: ImageSize, fmt: ImageFormat): string {
    return `${this.cdnBase()}/${this.variantObjectKey(baseKey, size, fmt)}`;
  }

  private cdnBase(): string {
    // Öncelik: CDN_PUBLIC_URL (cdn.markala.com). Yoksa R2_PUBLIC_URL. Dev'de API kökü.
    const base =
      this.config.get<string>("CDN_PUBLIC_URL") ??
      this.config.get<string>("R2_PUBLIC_URL") ??
      `http://localhost:${this.config.get<string>("PORT") ?? "4000"}/uploads`;
    return base.replace(/\/$/, "");
  }

  /** Nesne var mı? Importer idempotency (HeadObject). Local driver'da her zaman false. */
  async exists(objectKey: string): Promise<boolean> {
    if (this.driver !== "r2") return false;
    const { S3Client, HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = this.r2Client(S3Client);
    try {
      await client.send(new HeadObjectCommand({ Bucket: this.bucket(), Key: objectKey }));
      return true;
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === "NotFound" || name === "NoSuchKey") return false;
      // Başka hata (yetki/ağ) → var kabul ETME; çağıran tekrar yazsın (güvenli taraf).
      this.logger.warn(`HeadObject belirsiz (${objectKey}): ${(e as Error).message}`);
      return false;
    }
  }

  /** Ham kaynak nesnesini oku (worker; presigned PUT ile yüklenen ham görsel). */
  async getObject(objectKey: string): Promise<Buffer> {
    if (this.driver === "r2") {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const client = this.r2Client(S3Client);
      const res = await client.send(
        new GetObjectCommand({ Bucket: this.bucket(), Key: objectKey }),
      );
      const bytes = await res.Body!.transformToByteArray();
      return Buffer.from(bytes);
    }
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = this.config.get<string>("UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    return readFile(join(dir, objectKey));
  }

  /** Varyant/orijinal nesnesini immutable cache ile yaz. */
  async putObject(objectKey: string, buffer: Buffer, fmt: string): Promise<void> {
    const contentType = CONTENT_TYPE[fmt] ?? "application/octet-stream";
    if (this.driver === "r2") {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = this.r2Client(S3Client);
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket(),
          Key: objectKey,
          Body: buffer,
          ContentType: contentType,
          CacheControl: IMMUTABLE_CACHE_CONTROL,
        }),
      );
      this.logger.log(`R2 put ${objectKey} (${Math.round(buffer.length / 1024)}KB)`);
      return;
    }
    // Local dev driver: UPLOAD_DIR altına yaz (statik /uploads route'undan servis edilir).
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join, dirname } = await import("node:path");
    const dir = this.config.get<string>("UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    const full = join(dir, objectKey);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, buffer);
  }

  /**
   * Admin doğrudan tarayıcıdan R2'ye yükleyebilsin diye presigned PUT URL üretir
   * (kısa TTL). Sadece r2 driver'da geçerli. Yüklenen nesne HAM kaynaktır; işleme
   * pipeline'ı (sharp) sonra çalışır.
   */
  async presignedPut(
    objectKey: string,
    contentType: string,
    ttlSeconds = 300,
  ): Promise<{ url: string; key: string; expiresIn: number }> {
    if (this.driver !== "r2") {
      throw new Error("Presigned PUT yalnızca R2 driver'da kullanılabilir (R2_* env gerekli).");
    }
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const presigner = await import("@aws-sdk/s3-request-presigner");
    // NOT: client-s3 ve s3-request-presigner farklı @smithy/types minör sürümü çözebilir;
    // runtime aynı SDK ailesi olduğundan güvenli — TS köprüsü için gevşek imza kullanılır.
    const getSignedUrl = presigner.getSignedUrl as unknown as (
      client: unknown,
      command: unknown,
      options: { expiresIn: number },
    ) => Promise<string>;
    const client = this.r2Client(S3Client);
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: this.bucket(), Key: objectKey, ContentType: contentType }),
      { expiresIn: ttlSeconds },
    );
    return { url, key: objectKey, expiresIn: ttlSeconds };
  }

  private bucket(): string {
    return this.config.get<string>("R2_BUCKET") ?? "";
  }

  private r2Client(S3Client: typeof import("@aws-sdk/client-s3").S3Client) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>("R2_ACCESS_KEY_ID")!,
        secretAccessKey: this.config.get<string>("R2_SECRET_ACCESS_KEY")!,
      },
    });
  }
}
