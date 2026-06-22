/**
 * restore-options.ts
 *
 * Eski `parameters` JSON (ProductParameter[]) → `product_options` tablosu converter.
 *
 * İKİ FONKSİYON:
 *  1. convertParametersToOptions — saf, yan etkisiz. Sadece yapı, FİYAT YOK.
 *  2. restoreOptionsForProducts  — Prisma yazıcı (idempotent: sil + ekle).
 */

import type { PrismaClient } from "@prisma/client";

// ──────────────────────────────────────────────
// TİPLER
// ──────────────────────────────────────────────

export interface OptionRow {
  groupKey:       string;
  groupLabel:     string;
  groupRole:      "dimension" | "priced";
  groupSort:      number;
  optionKey:      string;
  optionLabel:    string;
  optionSublabel?: string;
  optionSort:     number;
}

// ──────────────────────────────────────────────
// YARDIMCI
// ──────────────────────────────────────────────

/** Parametre label veya id'sinin "ebat/boyut/adet/dimension" boyutsal kavramları içerip içermediği */
function isDimensionHint(value: string): boolean {
  return /(ebat|boyut|adet|dimension)/i.test(value);
}

// ──────────────────────────────────────────────
// ANA CONVERTER
// ──────────────────────────────────────────────

/**
 * Eski `parameters` JSON dizisini `product_options` satırlarına çevirir.
 * Saf fonksiyon — Prisma veya dış bağımlılık yok.
 */
export function convertParametersToOptions(params: unknown[]): OptionRow[] {
  const result: OptionRow[] = [];

  for (let groupSort = 0; groupSort < params.length; groupSort++) {
    const param = params[groupSort] as Record<string, unknown> | null | undefined;
    if (!param || typeof param !== "object") continue;

    const kind  = String(param.kind  ?? "");
    const id    = String(param.id    ?? "");
    const label = String(param.label ?? "");

    switch (kind) {
      case "matrix": {
        // Satırlar → "paket" grubu (priced)
        const rows = (param.rows as Array<Record<string, unknown>> | undefined) ?? [];
        for (let optionSort = 0; optionSort < rows.length; optionSort++) {
          const row = rows[optionSort];
          const optionKey     = String(row.id    ?? optionSort);
          const optionLabel   = String(row.label ?? optionKey);
          const optionSublabel = row.sublabel != null ? String(row.sublabel) : undefined;
          result.push({
            groupKey:   "paket",
            groupLabel: label || "Paket",
            groupRole:  "priced",
            groupSort,
            optionKey,
            optionLabel,
            ...(optionSublabel !== undefined && { optionSublabel }),
            optionSort,
          });
        }
        // Sütunlar → "adet" grubu (dimension)
        const cols = (param.cols as Array<Record<string, unknown>> | undefined) ?? [];
        for (let optionSort = 0; optionSort < cols.length; optionSort++) {
          const col = cols[optionSort];
          const optionKey   = String(col.id    ?? optionSort);
          const optionLabel = String(col.label ?? optionKey);
          result.push({
            groupKey:   "adet",
            groupLabel: "Adet",
            groupRole:  "dimension",
            groupSort,
            optionKey,
            optionLabel,
            optionSort,
          });
        }
        break;
      }

      case "radio":
      case "select": {
        const groupRole: "dimension" | "priced" =
          isDimensionHint(id) || isDimensionHint(label) ? "dimension" : "priced";
        const options = (param.options as Array<Record<string, unknown>> | undefined) ?? [];
        for (let optionSort = 0; optionSort < options.length; optionSort++) {
          const opt = options[optionSort];
          const optionKey     = String(opt.id    ?? optionSort);
          const optionLabel   = String(opt.label ?? optionKey);
          const optionSublabel = opt.sublabel != null ? String(opt.sublabel) : undefined;
          result.push({
            groupKey:   id || label,
            groupLabel: label,
            groupRole,
            groupSort,
            optionKey,
            optionLabel,
            ...(optionSublabel !== undefined && { optionSublabel }),
            optionSort,
          });
        }
        break;
      }

      case "checkbox-group": {
        const options = (param.options as Array<Record<string, unknown>> | undefined) ?? [];
        for (let optionSort = 0; optionSort < options.length; optionSort++) {
          const opt = options[optionSort];
          const optionKey     = String(opt.id    ?? optionSort);
          const optionLabel   = String(opt.label ?? optionKey);
          const optionSublabel = opt.sublabel != null ? String(opt.sublabel) : undefined;
          result.push({
            groupKey:   id || label,
            groupLabel: label,
            groupRole:  "priced",
            groupSort,
            optionKey,
            optionLabel,
            ...(optionSublabel !== undefined && { optionSublabel }),
            optionSort,
          });
        }
        break;
      }

      case "quantity": {
        const presets = (param.quantityPresets as number[] | undefined) ?? [];
        if (presets.length > 0) {
          for (let optionSort = 0; optionSort < presets.length; optionSort++) {
            const preset = presets[optionSort];
            result.push({
              groupKey:   "adet",
              groupLabel: label || "Adet",
              groupRole:  "dimension",
              groupSort,
              optionKey:   String(preset),
              optionLabel: `${preset} Adet`,
              optionSort,
            });
          }
        } else {
          result.push({
            groupKey:   "adet",
            groupLabel: label || "Adet",
            groupRole:  "dimension",
            groupSort,
            optionKey:   "custom",
            optionLabel: "Özel adet",
            optionSort:  0,
          });
        }
        break;
      }

      case "dimension": {
        result.push({
          groupKey:   "ebat",
          groupLabel: label || "Ebat",
          groupRole:  "dimension",
          groupSort,
          optionKey:   "custom",
          optionLabel: "Özel ebat",
          optionSort:  0,
        });
        break;
      }

      default:
        // Bilinmeyen kind → güvenli şekilde atla
        break;
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// PRİSMA YAZICI
// ──────────────────────────────────────────────

/**
 * İdempotent: her ürün için önce mevcut product_options'ları siler,
 * ardından convertParametersToOptions çıktısını productId ile insert eder.
 *
 * @returns `{ products: işlenen ürün sayısı, options: eklenen toplam satır sayısı }`
 */
export async function restoreOptionsForProducts(
  prisma: Pick<PrismaClient, "productOption">,
  items: { productId: string; parameters: unknown[] }[],
): Promise<{ products: number; options: number }> {
  let totalOptions = 0;

  for (const item of items) {
    const rows = convertParametersToOptions(item.parameters);

    await prisma.productOption.deleteMany({
      where: { productId: item.productId },
    });

    const { count } = await prisma.productOption.createMany({
      data: rows.map((row) => ({
        productId: item.productId,
        ...row,
      })),
    });

    totalOptions += count;
  }

  return { products: items.length, options: totalOptions };
}
