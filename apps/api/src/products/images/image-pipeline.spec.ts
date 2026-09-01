import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  ProductImageStorageService,
  IMAGE_SIZES,
} from "../../storage/product-image-storage.service";
import { ImageProcessorService } from "./image-processor.service";

function makeConfig(values: Record<string, string | undefined>) {
  return { get: (k: string) => values[k] } as never;
}

describe("ProductImageStorageService — anahtar şeması", () => {
  const storage = new ProductImageStorageService(makeConfig({}));

  it("base key format-agnostik (uzantısız) ve slug'ları temizler", () => {
    const base = storage.buildBaseKey("Kartvizit Lüks!", "Ön Yüz", "a1b2c3d4");
    expect(base).toBe("products/kartvizit-l-ks/n-y-z/a1b2c3d4");
  });

  it("varyant ve orijinal anahtarları doğru üretir", () => {
    const base = "products/kartvizit/on/a1b2c3d4";
    expect(storage.variantObjectKey(base, 800, "avif")).toBe(
      "products/kartvizit/on/a1b2c3d4-800.avif",
    );
    expect(storage.origObjectKey(base, "webp")).toBe("products/kartvizit/on/a1b2c3d4_orig.webp");
  });

  it("CDN_PUBLIC_URL önceliklidir ve URL sonu / temizlenir", () => {
    const s = new ProductImageStorageService(
      makeConfig({ CDN_PUBLIC_URL: "https://cdn.markala.com/" }),
    );
    expect(s.cdnUrl("products/x/default/deadbeef", 400, "webp")).toBe(
      "https://cdn.markala.com/products/x/default/deadbeef-400.webp",
    );
  });

  it("hash8 içerik-deterministik (idempotent import temeli)", () => {
    const buf = Buffer.from("markala");
    expect(storage.hash8(buf)).toBe(storage.hash8(Buffer.from("markala")));
    expect(storage.hash8(buf)).toHaveLength(8);
  });

  it("local driver'da exists() her zaman false", async () => {
    expect(await storage.exists("products/x/default/deadbeef-160.avif")).toBe(false);
  });
});

describe("ImageProcessorService — sharp pipeline (local driver)", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "markala-imgproc-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function makeSourcePng(width: number, height: number): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 240, g: 184, b: 0 }, // amber
      },
    })
      .png()
      .toBuffer();
  }

  it("boyut seti + AVIF/WebP + blurhash üretir, orijinali strip'ler", async () => {
    const storage = new ProductImageStorageService(makeConfig({ UPLOAD_DIR: dir }));
    const processor = new ImageProcessorService(storage);
    const source = await makeSourcePng(1500, 1000);

    const result = await processor.process({
      buffer: source,
      productSlug: "kartvizit",
      variantKey: "on",
    });

    expect(result.width).toBe(1500);
    expect(result.height).toBe(1000);
    expect(result.blurhash).toMatch(/^[\w#$%*+,\-.:;=?@\[\]^{|}~]+$/);
    expect(result.baseKey.startsWith("products/kartvizit/on/")).toBe(true);

    // 1500px genişlikte 2000 boyutu atlanır (upscale yok) → 160/400/800/1200.
    const expectedSizes = IMAGE_SIZES.filter((s) => s <= 1500);
    expect(expectedSizes).toEqual([160, 400, 800, 1200]);

    // orig + 4 boyut × 2 format = 1 + 8 = 9 nesne.
    expect(result.generated).toHaveLength(9);

    // Dosyalar gerçekten yazıldı mı?
    for (const size of expectedSizes) {
      for (const fmt of ["avif", "webp"] as const) {
        const key = storage.variantObjectKey(result.baseKey, size, fmt);
        await expect(access(join(dir, key))).resolves.toBeUndefined();
      }
    }
    // Üretilen 800 AVIF gerçekten AVIF mi?
    const avif800 = await readFile(
      join(dir, storage.variantObjectKey(result.baseKey, 800, "avif")),
    );
    const meta = await sharp(avif800).metadata();
    expect(meta.format).toBe("heif"); // AVIF, HEIF konteynerinde
    expect(meta.width).toBe(800);
  });

  it("orijinalden küçük görselde en az en küçük boyut üretilir", async () => {
    const storage = new ProductImageStorageService(makeConfig({ UPLOAD_DIR: dir }));
    const processor = new ImageProcessorService(storage);
    const source = await makeSourcePng(120, 90); // 160'tan küçük

    const result = await processor.process({
      buffer: source,
      productSlug: "sticker",
      variantKey: "default",
    });
    // orig + 160 × 2 format = 3.
    expect(result.generated).toHaveLength(3);
  });
});
