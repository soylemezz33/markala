import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductImageStorageService } from "../../storage/product-image-storage.service";
import { ImageQueueService } from "./image-queue.service";
import { randomUUID } from "node:crypto";

/** Presigned PUT için izin verilen ham görsel MIME tipleri. */
const RAW_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function slugSeg(input: string): string {
  return (
    (input || "default")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "default"
  );
}

@Injectable()
export class ProductImagesService {
  constructor(
    private prisma: PrismaService,
    private storage: ProductImageStorageService,
    private queue: ImageQueueService,
  ) {}

  private async requireProduct(productId: string): Promise<{ id: string; slug: string }> {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!p) throw new NotFoundException("Ürün bulunamadı.");
    return p;
  }

  /**
   * Admin doğrudan R2'ye yüklesin diye kısa-TTL presigned PUT üretir. Yüklenen HAM
   * kaynak `products/{slug}/_incoming/{uuid}.{ext}` altına düşer; işleme sonrası
   * kanonik hash8 anahtarına türetilir.
   */
  async presign(productId: string, contentType: string, variantKey: string) {
    const product = await this.requireProduct(productId);
    const ext = RAW_MIME[contentType];
    if (!ext) {
      throw new BadRequestException("Yalnızca JPG, PNG, WebP veya AVIF yüklenebilir.");
    }
    const sourceKey = `products/${slugSeg(product.slug)}/_incoming/${slugSeg(variantKey)}-${randomUUID()}.${ext}`;
    const presigned = await this.storage.presignedPut(sourceKey, contentType, 300);
    return { ...presigned, variantKey: slugSeg(variantKey) };
  }

  /**
   * Yükleme tamamlandıktan sonra ProductImage kaydı oluştur + işleme job'u kuyruğa al.
   * `url` başlangıçta sourceKey ile doldurulur; işleme bitince kanonik base key yazılır.
   */
  async create(
    productId: string,
    input: {
      sourceKey: string;
      variantKey?: string;
      alt?: string;
      sort?: number;
      isPrimary?: boolean;
    },
  ) {
    const product = await this.requireProduct(productId);
    const variantKey = slugSeg(input.variantKey ?? "default");
    const sort = input.sort ?? (await this.nextSort(productId, variantKey));

    const image = await this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        // Tek primary garantisi: yeni primary yazmadan öncekini düşür (partial unique
        // index yoksa da tutarlı; index varsa da çakışmayı önler).
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.productImage.create({
        data: {
          productId,
          url: input.sourceKey,
          alt: input.alt ?? null,
          sort,
          variantKey,
          isPrimary: input.isPrimary ?? false,
        },
      });
    });

    const enqueued = await this.queue.enqueue({
      imageId: image.id,
      productSlug: product.slug,
      variantKey,
      sourceKey: input.sourceKey,
    });
    return { image, processing: enqueued };
  }

  async list(productId: string) {
    await this.requireProduct(productId);
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ variantKey: "asc" }, { sort: "asc" }],
    });
  }

  async setPrimary(productId: string, imageId: string) {
    await this.requireProduct(productId);
    return this.prisma.$transaction(async (tx) => {
      const img = await tx.productImage.findFirst({ where: { id: imageId, productId } });
      if (!img) throw new NotFoundException("Görsel bulunamadı.");
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
    });
  }

  async remove(productId: string, imageId: string) {
    await this.requireProduct(productId);
    const img = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!img) throw new NotFoundException("Görsel bulunamadı.");
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  private async nextSort(productId: string, variantKey: string): Promise<number> {
    const last = await this.prisma.productImage.findFirst({
      where: { productId, variantKey },
      orderBy: { sort: "desc" },
      select: { sort: true },
    });
    return (last?.sort ?? -1) + 1;
  }
}
