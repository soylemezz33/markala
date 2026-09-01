import { Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";
import { encode as encodeBlurhash } from "blurhash";
import {
  IMAGE_FORMATS,
  IMAGE_SIZES,
  ImageFormat,
  ImageSize,
  ProductImageStorageService,
} from "../../storage/product-image-storage.service";

export interface ProcessImageInput {
  /** Ham kaynak görsel (JPG/PNG/WebP/AVIF). */
  buffer: Buffer;
  productSlug: string;
  variantKey: string;
}

export interface ProcessImageResult {
  /** DB'ye yazılacak format-agnostik base key. */
  baseKey: string;
  width: number;
  height: number;
  blurhash: string;
  /** Üretilen varyant nesne anahtarları (gözlem/log için). */
  generated: string[];
}

/**
 * sharp işleme pipeline'ı (AJA-385).
 *
 * Yükle → (bu servis) boyut seti + AVIF/WebP + blurhash üret → R2'ye yaz.
 * BullMQ worker'ı bu servisi çağırır; senkron HTTP yolunda ÇALIŞMAZ.
 *
 * Kurallar:
 * - EXIF STRIP: `.rotate()` ile EXIF oryantasyonu piksele işlenir, ardından metadata
 *   KOPYALANMAZ (sharp default: withMetadata çağrılmazsa metadata düşer) → GPS/kamera
 *   bilgisi sızmaz.
 * - Boyut seti 160/400/800/1200/2000; orijinalden BÜYÜK boyuta upscale YOK.
 * - Kanonik AVIF + WebP fallback; ayrıca `_orig` (strip'lenmiş, yeniden kodlanmamış boyutta).
 */
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  constructor(private storage: ProductImageStorageService) {}

  async process(input: ProcessImageInput): Promise<ProcessImageResult> {
    const hash8 = this.storage.hash8(input.buffer);
    const baseKey = this.storage.buildBaseKey(input.productSlug, input.variantKey, hash8);

    // `.rotate()` = EXIF oryantasyonu piksele bake et. Metadata bilinçli KOPYALANMAZ.
    const oriented = sharp(input.buffer, { failOn: "none" }).rotate();
    const meta = await oriented.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      throw new Error("Görsel boyutları okunamadı (bozuk/desteklenmeyen dosya).");
    }

    const generated: string[] = [];

    // Orijinali strip'lenmiş WebP olarak sakla (_orig) — kaynak yeniden gerekirse.
    const origBuf = await this.encode(input.buffer, null, "webp", 90);
    const origKey = this.storage.origObjectKey(baseKey, "webp");
    await this.storage.putObject(origKey, origBuf, "webp");
    generated.push(origKey);

    // Boyut × format matrisi. Orijinalden geniş boyutlar atlanır (upscale yok),
    // ancak en az bir boyut (en küçük) her zaman üretilir.
    const targetSizes = this.pickSizes(width);
    for (const size of targetSizes) {
      for (const fmt of IMAGE_FORMATS) {
        const buf = await this.encode(input.buffer, size, fmt);
        const key = this.storage.variantObjectKey(baseKey, size, fmt);
        await this.storage.putObject(key, buf, fmt);
        generated.push(key);
      }
    }

    const blurhash = await this.computeBlurhash(input.buffer);

    this.logger.log(`işlendi ${baseKey} — ${width}x${height}, ${generated.length} varyant`);
    return { baseKey, width, height, blurhash, generated };
  }

  /** Orijinal genişliğe göre üretilecek boyutlar (upscale yok; en küçük garanti). */
  private pickSizes(originalWidth: number): ImageSize[] {
    const fit = IMAGE_SIZES.filter((s) => s <= originalWidth);
    if (fit.length === 0) return [IMAGE_SIZES[0]];
    return [...fit];
  }

  private async encode(
    source: Buffer,
    size: ImageSize | null,
    fmt: ImageFormat,
    quality?: number,
  ): Promise<Buffer> {
    let pipe = sharp(source, { failOn: "none" }).rotate();
    if (size) {
      pipe = pipe.resize({ width: size, withoutEnlargement: true });
    }
    if (fmt === "avif") {
      pipe = pipe.avif({ quality: quality ?? 55, effort: 4 });
    } else {
      pipe = pipe.webp({ quality: quality ?? 80, effort: 4 });
    }
    // withMetadata çağrılmıyor → EXIF/GPS strip.
    return pipe.toBuffer();
  }

  /** 4x3 bileşenli BlurHash — küçük rasterden (LQIP placeholder). */
  private async computeBlurhash(source: Buffer): Promise<string> {
    const { data, info } = await sharp(source, { failOn: "none" })
      .rotate()
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  }
}
