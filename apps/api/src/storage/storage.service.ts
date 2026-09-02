import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
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
 * Ek savunma: bilinen metin/görsel uzantıları için mimetype de kontrol edilir (CDR/AI/EPS/PSD için
 * tarayıcı/multer rastgele mimetype verebilir → yalnız uzantıya güvenilir, whitelist geçerli).
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
  // SVG BİLEREK YOK — XML+script içerebilir; public upload + admin görüntüleme = stored XSS riski.
  // ZIP/RAR de KALDIRILDI — public servis edilen keyfi arşiv = kötüye kullanım/barındırma riski.
  "tif",
  "tiff",
]);

/**
 * Tasarım dosyası için uzantıya göre KABUL EDİLEBİLİR mimetype'lar.
 * CDR/AI/EPS/PSD: vendor-spesifik; tarayıcı/multer bunları genellikle
 * "application/octet-stream" veya sahte Content-Type ile gönderir → tüm mimetype'lar kabul edilir.
 * Sadece standart görsel/belge formatları kısıtlanır.
 */
const DESIGN_MIME_WHITELIST: Record<string, Set<string>> = {
  pdf: new Set(["application/pdf"]),
  jpg: new Set(["image/jpeg"]),
  jpeg: new Set(["image/jpeg"]),
  png: new Set(["image/png"]),
  tif: new Set(["image/tiff"]),
  tiff: new Set(["image/tiff"]),
  // ai/eps/cdr/psd: vendor mimetype'lar standart değil → octet-stream de kabul edilir (herhangi mimetype)
};
const DESIGN_MAX_BYTES = 50 * 1024 * 1024;

/**
 * Kurumsal belgeler (vergi levhası / imza sirküleri) — HASSAS, public DEĞİL.
 * Tasarım dosyası gibi uzantı whitelist'i (MIME güvenilmez), 15MB sınır.
 * Driver'dan BAĞIMSIZ olarak yalnızca /app/uploads/secure altında saklanır
 * (main.ts'te /uploads/secure 404'lanır) ve auth-korumalı endpoint üzerinden serve edilir.
 */
const CORP_DOC_ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "tif", "tiff"]);
const CORP_DOC_MAX_BYTES = 15 * 1024 * 1024;
/** Tasarım dosyalarının saklandığı alt dizin — main.ts /uploads/secure'ü statikten 404'ler. */
const DESIGN_SUBDIR = "secure/tasarim";
/**
 * Tasarım dosyası anahtar deseni: uuid.uzantı. getDesign/deleteDesign ve panel BFF'leri
 * aynı deseni kullanır — path traversal ve alt dizin geçişi bu regex'le imkânsız.
 * (2026-09-02: getDesign içindeki satır-içi regex buraya taşındı, silme de paylaşıyor.)
 */
export const DESIGN_KEY_RE = /^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i;

/** İndirme yanıtının Content-Type'ı. Vendor formatlar octet-stream'e düşer (tarayıcı indirir). */
const DESIGN_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
};

const CORP_DOC_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
};

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

export interface SecureUploadInput {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
}

export interface SecureUploadResult {
  /** örn. "secure/uuid.pdf" — DB'de saklanır; public URL DEĞİL. */
  key: string;
  /** sanitize edilmiş orijinal ad — admin gösterimi/indirme adı için. */
  fileName: string;
  fileSize: number;
}

export interface SecureFile {
  buffer: Buffer;
  mimetype: string;
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
      throw new BadRequestException("Yalnızca JPG, PNG veya WEBP görsel yükleyebilirsiniz.");
    }
    if (file.buffer.length > MAX_BYTES) {
      throw new BadRequestException("Görsel boyutu en fazla 5MB olabilir.");
    }

    // WEBP'E ÇEVİR + SIKIŞTIR (2026-08-21, Hasan): panelden JPG/PNG yüklenirse sunucuda
    // WebP'ye dönüştürülür. Neden sunucuda: yükleyen kişinin (tasarımcı) dönüştürmeyi
    // hatırlamasına güvenilmez; kaynak dosya bir kez büyük girerse depoda ve yedeklerde
    // kalıcı olarak büyük kalır.
    // q=82: fotoğrafta gözle ayırt edilemeyen bant (slider görsellerinde ölçüldü, PSNR 40-43 dB).
    // WEBP zaten ise DOKUNULMAZ — yeniden kodlamak nesil kaybı yaratır, kazancı da azdır.
    let out = file;
    let finalExt = ext;
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      try {
        const webp = await sharp(file.buffer).webp({ quality: 82, effort: 4 }).toBuffer();
        // Nadir de olsa WebP daha büyük çıkabilir (çok küçük/az renkli PNG). O zaman aslını koru.
        if (webp.length < file.buffer.length) {
          out = { buffer: webp, mimetype: "image/webp" };
          finalExt = "webp";
          this.logger.log(
            `görsel webp'e çevrildi: ${Math.round(file.buffer.length / 1024)}KB → ${Math.round(webp.length / 1024)}KB`,
          );
        }
      } catch (e) {
        // Dönüştürme başarısızsa YÜKLEMEYİ ENGELLEME — orijinal dosya kaydedilir.
        this.logger.warn(`webp dönüşümü başarısız, orijinal kaydediliyor: ${(e as Error).message}`);
      }
    }

    const key = `${randomUUID()}.${finalExt}`;
    return this.driver === "r2" ? this.putR2(key, out) : this.putLocal(key, out);
  }

  /**
   * Müşteri tasarım dosyası yükleme. Tip doğrulaması UZANTI ile (CDR/AI/PSD mimetype güvenilmez);
   * maks 50MB. putLocal/putR2 yazma altyapısı yeniden kullanılır.
   */
  async putDesign(input: DesignUploadInput): Promise<DesignUploadResult> {
    const ext = (input.originalName.split(".").pop() ?? "").toLowerCase();
    if (!ext || !DESIGN_ALLOWED_EXT.has(ext)) {
      throw new BadRequestException(
        "Yalnızca PDF, AI, EPS, CDR, PSD, JPG, PNG veya TIFF dosyası yükleyebilirsiniz.",
      );
    }
    // Mimetype doğrulama: PDF/JPG/PNG/TIFF için izin verilen mimetype listesi kontrol edilir.
    // CDR/AI/EPS/PSD gibi vendor formatlar için whitelist yoksa herhangi mimetype kabul edilir
    // (tarayıcı/multer bunları genellikle "application/octet-stream" olarak gönderir).
    const allowedMimes = DESIGN_MIME_WHITELIST[ext];
    if (allowedMimes && !allowedMimes.has(input.mimetype)) {
      throw new BadRequestException(
        `Dosya tipi uyuşmazlığı: .${ext} uzantısı için beklenen MIME tipi geçersiz.`,
      );
    }
    if (input.buffer.length > DESIGN_MAX_BYTES) {
      throw new BadRequestException("Tasarım dosyası en fazla 50MB olabilir.");
    }

    // 2026-09-01 GÜVENLİK: müşteri tasarım dosyaları ARTIK PUBLIC DEĞİL.
    // Eskiden uploads/<uuid>.<ext> altına yazılıp statik serve ediliyordu (365 gün
    // immutable cache) — URL'yi bilen HERKES müşterinin baskı dosyasını indirebiliyordu.
    // Artık kurumsal belge deseniyle aynı: secure/ altında saklanır (main.ts /uploads/secure'ü
    // 404'ler) ve yalnız auth+ORDERS_READ korumalı GET /uploads/design/:key ile servis edilir.
    // R2 sürücüsünde de LOCAL kalır — public bucket'a yazmak sızıntının ta kendisiydi.
    const key = `${randomUUID()}.${ext}`;
    await mkdir(join(this.uploadDir, DESIGN_SUBDIR), { recursive: true });
    await writeFile(join(this.uploadDir, DESIGN_SUBDIR, key), input.buffer);
    const base = (
      this.config.get<string>("API_PUBLIC_URL") ??
      `http://localhost:${this.config.get<string>("PORT") ?? "4000"}`
    ).replace(/\/$/, "");
    return {
      url: `${base}/uploads/design/${key}`,
      key,
      fileName: sanitizeFileName(input.originalName),
      fileSize: input.buffer.length,
    };
  }

  /**
   * Hassas kurumsal belge yükleme. Driver'dan BAĞIMSIZ — her zaman local kalıcı
   * volume (/app/uploads/secure). Böylece R2 public-bucket sızıntı riski oluşmaz.
   * Döndürülen key public URL DEĞİL; serve yalnızca auth-korumalı endpoint üzerinden
   * (getSecure). Tip uzantı ile doğrulanır (MIME güvenilmez), maks 15MB.
   */
  async putSecure(input: SecureUploadInput): Promise<SecureUploadResult> {
    const ext = (input.originalName.split(".").pop() ?? "").toLowerCase();
    if (!ext || !CORP_DOC_ALLOWED_EXT.has(ext)) {
      throw new BadRequestException(
        "Yalnızca PDF, JPG, PNG, WEBP veya TIFF belge yükleyebilirsiniz.",
      );
    }
    if (input.buffer.length > CORP_DOC_MAX_BYTES) {
      throw new BadRequestException("Belge boyutu en fazla 15MB olabilir.");
    }
    const key = `secure/${randomUUID()}.${ext}`;
    await mkdir(join(this.uploadDir, "secure"), { recursive: true });
    await writeFile(join(this.uploadDir, key), input.buffer);
    return {
      key,
      fileName: sanitizeFileName(input.originalName),
      fileSize: input.buffer.length,
    };
  }

  /**
   * Hassas belgeyi diskten oku — YALNIZCA auth-korumalı controller çağırır.
   * Key formatı katı doğrulanır (path traversal'a kapalı). Yoksa 404.
   */
  async getSecure(key: string): Promise<SecureFile> {
    if (!/^secure\/[\w.-]+$/.test(key)) {
      throw new NotFoundException("Belge bulunamadı.");
    }
    const ext = (key.split(".").pop() ?? "").toLowerCase();
    try {
      const buffer = await readFile(join(this.uploadDir, key));
      return { buffer, mimetype: CORP_DOC_MIME[ext] ?? "application/octet-stream" };
    } catch {
      throw new NotFoundException("Belge bulunamadı.");
    }
  }

  /**
   * Korumalı tasarım dosyasını okur. Yalnız auth+ORDERS_READ olan uç çağırır.
   * key SIKI doğrulanır: path traversal (../) ve alt dizin geçişi imkansız.
   */
  async getDesign(key: string): Promise<SecureFile> {
    if (!DESIGN_KEY_RE.test(key)) {
      throw new NotFoundException("Dosya bulunamadı.");
    }
    const ext = (key.split(".").pop() ?? "").toLowerCase();
    const mimetype = DESIGN_MIME[ext] ?? "application/octet-stream";
    try {
      return { buffer: await readFile(join(this.uploadDir, DESIGN_SUBDIR, key)), mimetype };
    } catch {
      // GERİYE DÖNÜK: 2026-09-01 öncesi yüklenen dosyalar hâlâ public uploads/ kökünde.
      // Taşıma betiği çalışana kadar panel onları indirebilsin diye buradan da okunur.
      // Bu dal auth+ORDERS_READ arkasında ve key uuid.uzantı deseniyle sınırlı; kök dizinde
      // yalnız zaten public olan ürün görselleri var. Taşıma bitince kaldırılabilir.
      try {
        return { buffer: await readFile(join(this.uploadDir, key)), mimetype };
      } catch {
        throw new NotFoundException("Dosya bulunamadı.");
      }
    }
  }

  /**
   * Korumalı tasarım dosyasını diskten siler (2026-09-02, panelden silme).
   * Yalnız secure/tasarim altına bakar — getDesign'daki eski public-kök yedeğine DOKUNMAZ
   * (orada yalnız zaten public ürün görselleri var, yanlışlıkla silinmesin).
   * ENOENT yutulur: DB kaydı silinmiş ama dosya zaten yoksa istek düşmemeli. Diğer hatalar
   * (izin vb.) fırlatılır; çağıran best-effort davranıp loglar.
   */
  async deleteDesign(key: string): Promise<void> {
    if (!DESIGN_KEY_RE.test(key)) throw new NotFoundException("Dosya bulunamadı.");
    try {
      await unlink(join(this.uploadDir, DESIGN_SUBDIR, key));
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return;
      throw e;
    }
  }

  private get uploadDir(): string {
    return this.config.get<string>("UPLOAD_DIR") ?? join(process.cwd(), "uploads");
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
    const base = (this.config.get<string>("R2_PUBLIC_URL") ?? "").replace(/\/$/, "");
    this.logger.log(`R2 upload: ${key}`);
    return { url: `${base}/${key}`, key };
  }
}
