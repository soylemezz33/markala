/**
 * Otomatik ürün açıklaması üretimi (PoC).
 *
 * İki yol:
 *   - generateProductCopy: Claude ile üretir (anahtar varsa).
 *   - templateProductCopy: deterministik şablon fallback (anahtar yoksa / hata).
 *
 * Bu sayede özellik anahtar olmadan da demoda çalışır, CI/test ağ istemez,
 * ve maliyet yalnızca gerçekten AI çağrıldığında oluşur (KVKK/maliyet uyumlu).
 */

import { generateText, type ClaudeUsage } from "./claude";

export interface ProductCopyInput {
  /** Ürün adı (zorunlu). */
  name: string;
  /** Kategori adı (ör. "Kartvizit"). */
  category?: string;
  /** SEO/odak anahtar kelimeler. */
  keywords?: string[];
  /** Hedef kitle ipucu (ör. "kurumsal", "esnaf"). */
  audience?: string;
}

export interface ProductCopy {
  /** Listeleme kartı için kısa açıklama (~140 karakter). */
  shortDescription: string;
  /** Ürün detay sayfası için uzun açıklama. */
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

export interface ProductCopyResult {
  copy: ProductCopy;
  /** "ai" = Claude üretti, "fallback" = şablon. */
  source: "ai" | "fallback";
  /** Maliyet izleme için token kullanımı (yalnızca AI yolunda). */
  usage?: ClaudeUsage;
  model?: string;
}

/** output_config.format için JSON Schema — geçerli, parse edilebilir çıktı garantisi. */
export const PRODUCT_COPY_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    shortDescription: { type: "string" },
    description: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: [
    "shortDescription",
    "description",
    "seoTitle",
    "seoDescription",
    "keywords",
  ],
};

const SYSTEM_PROMPT = [
  "Sen Markala adlı matbaa ve reklam ürünleri e-ticaret platformu için Türkçe metin yazarısın.",
  "Görev: verilen ürün için satışa dönük, doğal ve abartısız açıklama metinleri üret.",
  "Kurallar: yalnızca Türkçe yaz; uydurma teknik özellik/rakam ekleme; premium ama sade ton kullan;",
  "kısa açıklama ~140 karakter, SEO başlığı ~60 karakter, SEO açıklaması ~155 karakter olsun.",
].join(" ");

/** Claude'a gidecek kullanıcı prompt'u (saf, test edilebilir). PII içermez. */
export function buildProductCopyPrompt(input: ProductCopyInput): string {
  const lines = [`Ürün adı: ${input.name}`];
  if (input.category) lines.push(`Kategori: ${input.category}`);
  if (input.audience) lines.push(`Hedef kitle: ${input.audience}`);
  if (input.keywords?.length) lines.push(`Anahtar kelimeler: ${input.keywords.join(", ")}`);
  lines.push(
    "Bu ürün için kısa açıklama, uzun açıklama ve SEO meta verilerini üret.",
  );
  return lines.join("\n");
}

/** Anahtar/AI olmadan deterministik, makul açıklama üretir (fallback). */
export function templateProductCopy(input: ProductCopyInput): ProductCopy {
  const name = input.name.trim();
  const cat = input.category?.trim();
  const catSuffix = cat ? ` ${cat} kategorisinde` : "";

  const shortDescription =
    `${name} — Markala kalitesiyle${catSuffix} profesyonel baskı. Hızlı üretim, net sonuç.`.slice(
      0,
      150,
    );

  const description = [
    `${name}, markanızı ilk bakışta fark ettirir.`,
    `Markala'nın${catSuffix || ""} özenli baskı sürecinde renkler canlı, kenarlar nettir.`,
    "Kurumsal kimliğinize uygun seçeneklerle, ölçülü ve şık bir sonuç elde edersiniz.",
    "Siparişinizi birkaç adımda tamamlayın, üretim ekibimiz gerisini halletsin.",
  ].join(" ");

  const seoTitle = `${name}${cat ? " | " + cat : ""} | Markala`.slice(0, 60);
  const seoDescription =
    `${name} baskısı Markala'da. Profesyonel kalite, hızlı üretim, kurumsal çözümler.`.slice(
      0,
      155,
    );

  const keywords = Array.from(
    new Set(
      [name.toLowerCase(), cat?.toLowerCase(), "baskı", "matbaa", ...(input.keywords ?? [])]
        .filter((k): k is string => Boolean(k))
        .map((k) => k.trim()),
    ),
  );

  return { shortDescription, description, seoTitle, seoDescription, keywords };
}

function coerceCopy(parsed: Partial<ProductCopy>, fallback: ProductCopy): ProductCopy {
  return {
    shortDescription: parsed.shortDescription?.trim() || fallback.shortDescription,
    description: parsed.description?.trim() || fallback.description,
    seoTitle: parsed.seoTitle?.trim() || fallback.seoTitle,
    seoDescription: parsed.seoDescription?.trim() || fallback.seoDescription,
    keywords:
      Array.isArray(parsed.keywords) && parsed.keywords.length
        ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean)
        : fallback.keywords,
  };
}

/**
 * Claude ile ürün açıklaması üretir.
 * @throws AiNotConfiguredError | AiRequestError — çağıran fallback'e düşmeli.
 */
export async function generateProductCopy(
  input: ProductCopyInput,
): Promise<ProductCopyResult> {
  const result = await generateText({
    system: SYSTEM_PROMPT,
    prompt: buildProductCopyPrompt(input),
    jsonSchema: PRODUCT_COPY_SCHEMA,
    maxTokens: 1024,
  });

  let parsed: Partial<ProductCopy>;
  try {
    parsed = JSON.parse(result.text) as Partial<ProductCopy>;
  } catch {
    // Yapısal çıktı beklenmedik biçimde geldiyse şablona düş.
    return { copy: templateProductCopy(input), source: "fallback" };
  }

  return {
    copy: coerceCopy(parsed, templateProductCopy(input)),
    source: "ai",
    usage: result.usage,
    model: result.model,
  };
}
