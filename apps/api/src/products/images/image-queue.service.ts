import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductImageStorageService } from "../../storage/product-image-storage.service";
import { ImageProcessorService } from "./image-processor.service";

export const IMAGE_QUEUE_NAME = "product-image-processing";

export interface ImageJobData {
  /** İşlenecek ProductImage kaydının id'si. */
  imageId: string;
  productSlug: string;
  variantKey: string;
  /** Ham kaynak nesne anahtarı (presigned PUT ile R2'ye yüklenmiş). */
  sourceKey: string;
}

interface RedisConn {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
}

/**
 * Görsel işleme kuyruğu (AJA-385).
 *
 * REDIS tanımlıysa → BullMQ Queue + Worker (ASENKRON; HTTP isteği hemen döner).
 * REDIS yoksa (dev) → inline işleme fallback + uyarı. Prod'da Redis mevcut olduğundan
 * "senkron yapma" kuralı korunur.
 *
 * BullMQ/ioredis LAZY import edilir — Redis yoksa modül yüklenmez (dev başlangıcı hızlı).
 */
@Injectable()
export class ImageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImageQueueService.name);
  private queue: import("bullmq").Queue<ImageJobData> | null = null;
  private worker: import("bullmq").Worker<ImageJobData> | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: ProductImageStorageService,
    private processor: ImageProcessorService,
  ) {}

  private get redisUrl(): string | undefined {
    return this.config.get<string>("REDIS_URL");
  }

  async onModuleInit(): Promise<void> {
    if (!this.redisUrl) {
      this.logger.warn(
        "REDIS_URL yok — görsel işleme INLINE (senkron) fallback ile çalışacak. Prod'da REDIS_URL tanımlayın.",
      );
      return;
    }
    const { Queue, Worker } = await import("bullmq");
    const connection = this.parseRedis(this.redisUrl);
    this.queue = new Queue<ImageJobData>(IMAGE_QUEUE_NAME, { connection });
    this.worker = new Worker<ImageJobData>(IMAGE_QUEUE_NAME, async (job) => this.runJob(job.data), {
      connection,
      concurrency: 2,
    });
    this.worker.on("failed", (job, err) => {
      this.logger.error(`job ${job?.id} başarısız: ${err.message}`);
    });
    this.logger.log("BullMQ görsel işleme kuyruğu + worker aktif");
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  /**
   * İşleme talebini kuyruğa al. Redis varsa job ekler (hemen döner); yoksa inline işler.
   * Retry: 3 deneme, exponential backoff (ağ/R2 geçici hataları için).
   */
  async enqueue(data: ImageJobData): Promise<{ mode: "queued" | "inline"; jobId?: string }> {
    if (this.queue) {
      const job = await this.queue.add("process", data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
      return { mode: "queued", jobId: job.id };
    }
    await this.runJob(data);
    return { mode: "inline" };
  }

  /** Asıl iş: kaynağı indir → işle → DB güncelle. Worker ve inline fallback ortak. */
  private async runJob(data: ImageJobData): Promise<void> {
    const source = await this.storage.getObject(data.sourceKey);
    const result = await this.processor.process({
      buffer: source,
      productSlug: data.productSlug,
      variantKey: data.variantKey,
    });
    await this.prisma.productImage.update({
      where: { id: data.imageId },
      data: {
        url: result.baseKey,
        width: result.width,
        height: result.height,
        blurhash: result.blurhash,
      },
    });
    this.logger.log(`ProductImage ${data.imageId} işlendi → ${result.baseKey}`);
  }

  private parseRedis(url: string): RedisConn {
    const u = new URL(url);
    const conn: RedisConn = {
      host: u.hostname,
      port: Number(u.port || 6379),
    };
    if (u.username) conn.username = u.username;
    if (u.password) conn.password = decodeURIComponent(u.password);
    const db = u.pathname.replace(/^\//, "");
    if (db) conn.db = Number(db);
    if (u.protocol === "rediss:") conn.tls = {};
    return conn;
  }
}
