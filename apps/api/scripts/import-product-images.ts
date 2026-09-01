/**
 * Toplu ürün görseli içe aktarıcı (AJA-385).
 *
 * MIGRATION DEĞİL — ayrı, TEKRAR-KOŞULABİLİR script. Bir manifest.csv + görsel klasörü
 * alır; her görseli sharp ile işleyip R2/CDN'e yazar ve ProductImage kaydını upsert eder.
 *
 * Kullanım:
 *   tsx scripts/import-product-images.ts <manifest.csv> <assets-dir> [rapor.csv]
 *
 * manifest.csv başlıkları (sıra bağımsız):
 *   product_slug,variant_key,filename,alt,sort,is_primary
 *
 * İDEMPOTENT: anahtar içerik-hash (hash8) içerdiğinden aynı dosya aynı anahtara gider.
 * Kanonik varyant R2'de HeadObject ile VARSA yeniden işlenmez/yüklenmez (skip); DB kaydı
 * yine de upsert edilir. Çıktı: ok/skipped/failed satırlı CSV rapor.
 *
 * NOT: R2_* env yoksa storage `local` driver'a düşer (dev). Prod içe aktarımı için
 * DATABASE_URL + R2_* + (opsiyonel) CDN_PUBLIC_URL tanımlı olmalı.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import { ProductImageStorageService } from "../src/storage/product-image-storage.service";
import { ImageProcessorService } from "../src/products/images/image-processor.service";
import { IMAGE_FORMATS, IMAGE_SIZES } from "../src/storage/product-image-storage.service";

const CHUNK = 50;

interface Row {
  product_slug: string;
  variant_key: string;
  filename: string;
  alt?: string;
  sort?: number;
  is_primary?: boolean;
}

interface ReportRow {
  product_slug: string;
  variant_key: string;
  filename: string;
  status: "ok" | "skipped" | "failed";
  reason: string;
}

/** Basit CSV ayrıştırıcı (tırnak + kaçış destekli). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (field !== "" || record.length > 0) {
        record.push(field);
        rows.push(record);
        record = [];
        field = "";
      }
    } else {
      field += c;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    rows.push(record);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function toRow(raw: Record<string, string>): Row {
  return {
    product_slug: raw.product_slug,
    variant_key: raw.variant_key || "default",
    filename: raw.filename,
    alt: raw.alt || undefined,
    sort: raw.sort ? Number(raw.sort) : undefined,
    is_primary: /^(1|true|yes|evet)$/i.test(raw.is_primary ?? ""),
  };
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

async function main() {
  const [manifestPath, assetsDir, reportPathArg] = process.argv.slice(2);
  if (!manifestPath || !assetsDir) {
    console.error(
      "Kullanım: tsx scripts/import-product-images.ts <manifest.csv> <assets-dir> [rapor.csv]",
    );
    process.exit(1);
  }
  const reportPath = reportPathArg ?? "import-report.csv";

  const config = new ConfigService();
  const storage = new ProductImageStorageService(config);
  const processor = new ImageProcessorService(storage);
  const prisma = new PrismaClient();

  const manifestText = await readFile(manifestPath, "utf8");
  const rows = parseCsv(manifestText)
    .map(toRow)
    .filter((r) => r.product_slug && r.filename);
  console.log(`Manifest: ${rows.length} satır. Storage driver: ${storage.driver}`);

  // slug -> productId önbelleği (tekrar sorgu yok).
  const products = await prisma.product.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(products.map((p) => [p.slug, p.id]));

  const report: ReportRow[] = [];
  let pending: Prisma.PrismaPromise<unknown>[] = [];
  const flush = async () => {
    if (pending.length === 0) return;
    await prisma.$transaction(pending);
    pending = [];
  };

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const base: Omit<ReportRow, "status" | "reason"> = {
      product_slug: row.product_slug,
      variant_key: row.variant_key,
      filename: row.filename,
    };
    try {
      const productId = slugToId.get(row.product_slug);
      if (!productId) {
        failed++;
        report.push({ ...base, status: "failed", reason: "ürün slug bulunamadı" });
        continue;
      }

      const filePath = isAbsolute(row.filename) ? row.filename : join(assetsDir, row.filename);
      const buffer = await readFile(filePath);
      const hash8 = storage.hash8(buffer);
      const baseKey = storage.buildBaseKey(row.product_slug, row.variant_key, hash8);

      // İdempotency: kanonik en küçük varyant R2'de varsa yeniden işleme.
      const probeKey = storage.variantObjectKey(baseKey, IMAGE_SIZES[0], IMAGE_FORMATS[0]);
      const exists = await storage.exists(probeKey);

      let width: number | undefined;
      let height: number | undefined;
      let blurhash: string | undefined;

      if (exists) {
        skipped++;
        report.push({ ...base, status: "skipped", reason: "R2'de mevcut (hash eşleşti)" });
      } else {
        const result = await processor.process({
          buffer,
          productSlug: row.product_slug,
          variantKey: row.variant_key,
        });
        width = result.width;
        height = result.height;
        blurhash = result.blurhash;
        ok++;
        report.push({ ...base, status: "ok", reason: `${result.generated.length} varyant` });
      }

      // DB upsert — (productId, variantKey, sort) benzersiz. sort verilmezse 0.
      const sort = row.sort ?? 0;
      const updateData: Prisma.ProductImageUpdateInput = {
        url: baseKey,
        alt: row.alt ?? null,
        isPrimary: row.is_primary ?? false,
      };
      if (width !== undefined) updateData.width = width;
      if (height !== undefined) updateData.height = height;
      if (blurhash !== undefined) updateData.blurhash = blurhash;

      pending.push(
        prisma.productImage.upsert({
          where: {
            productId_variantKey_sort: {
              productId,
              variantKey: row.variant_key,
              sort,
            },
          },
          create: {
            productId,
            url: baseKey,
            alt: row.alt ?? null,
            sort,
            variantKey: row.variant_key,
            isPrimary: row.is_primary ?? false,
            width: width ?? null,
            height: height ?? null,
            blurhash: blurhash ?? null,
          },
          update: updateData,
        }),
      );
      if (pending.length >= CHUNK) await flush();
    } catch (e) {
      failed++;
      report.push({ ...base, status: "failed", reason: (e as Error).message });
    }
  }
  await flush();
  await prisma.$disconnect();

  const header = "product_slug,variant_key,filename,status,reason\n";
  const body = report
    .map((r) =>
      [r.product_slug, r.variant_key, r.filename, r.status, r.reason]
        .map((v) => csvEscape(String(v)))
        .join(","),
    )
    .join("\n");
  await writeFile(reportPath, header + body + "\n", "utf8");

  console.log(`Bitti — ok:${ok} skipped:${skipped} failed:${failed}. Rapor: ${reportPath}`);
  if (failed > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
