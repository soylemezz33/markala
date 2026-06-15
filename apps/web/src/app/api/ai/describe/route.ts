import { NextRequest, NextResponse } from "next/server";
import { estimateCostUsd, getAiModel, isAiConfigured } from "@/lib/ai/claude";
import {
  generateProductCopy,
  templateProductCopy,
  type ProductCopyInput,
} from "@/lib/ai/product-copy";

// fetch + AbortController Node runtime'da en tutarlı; edge'e gerek yok.
export const runtime = "nodejs";

interface DescribePayload {
  name?: string;
  category?: string;
  keywords?: string[];
  audience?: string;
}

/**
 * AI destekli ürün açıklaması üretimi (PoC).
 *
 * POST /api/ai/describe
 * Body: { name, category?, keywords?, audience? }
 * Dönüş: { ok, source: "ai" | "fallback", copy }
 *
 * Anahtar yoksa veya AI hata verirse deterministik şablona düşer (200 döner) —
 * mevcut katalog/mailer "yapılandırılmamışsa mock" deseniyle uyumlu.
 * KVKK: yalnızca ürün metası işlenir, kişisel veri gönderilmez.
 */
export async function POST(req: NextRequest) {
  let body: DescribePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Ürün adı zorunlu." }, { status: 400 });
  }

  const input: ProductCopyInput = {
    name,
    category: body.category?.trim() || undefined,
    audience: body.audience?.trim() || undefined,
    keywords: Array.isArray(body.keywords)
      ? body.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 12)
      : undefined,
  };

  // Anahtar yoksa: maliyetsiz şablon.
  if (!isAiConfigured()) {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      copy: templateProductCopy(input),
    });
  }

  try {
    const { copy, source, usage, model } = await generateProductCopy(input);
    // Maliyet izleme: gerçek AI çağrısında token başına yaklaşık USD logla.
    if (usage && model) {
      const cost = estimateCostUsd(usage, model);
      console.log(
        `[ai/describe] ${model} | in:${usage.inputTokens} out:${usage.outputTokens} | ~$${cost.toFixed(4)}`,
      );
    }
    return NextResponse.json({ ok: true, source, copy });
  } catch (err) {
    // AI hatasında özelliği bloke etme — şablona düş, hatayı logla.
    console.error(
      `[ai/describe] üretim başarısız (${getAiModel()}), şablona düşülüyor:`,
      (err as Error).message,
    );
    return NextResponse.json({
      ok: true,
      source: "fallback",
      copy: templateProductCopy(input),
    });
  }
}
