import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) sunucu-içinden multipart proxy — büyük tasarım dosyasını CORS/origin derdi
// olmadan iletir. Guard yok (public endpoint), token gerekmez.
export const runtime = "nodejs";

/**
 * Müşteri tasarım dosyasını backend storage'a yükler (checkout öncesi konfigüratörden).
 *
 * Tarayıcı → bu route → POST /api/uploads/design (NestJS). Backend dosyayı yazar (local/R2),
 * indirilebilir URL + sanitize edilmiş ad döner. Bu route backend JSON'unu aynen geçirir.
 *
 * Hata/timeout'a dayanıklı: her zaman { ok, ... } zarfı + uygun status döner; client
 * tarafı bunu yutar, state'i temizler. ~55MB dosya geçirilebilir (route handler buffer'lar).
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

export async function POST(req: NextRequest) {
  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = inForm.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }

  const outForm = new FormData();
  outForm.append("file", file, file.name);

  try {
    const res = await fetch(`${API_BASE}/api/uploads/design`, {
      method: "POST",
      body: outForm,
    });

    if (!res.ok) {
      let detail: unknown = undefined;
      try {
        detail = await res.json();
      } catch {}
      const m = (detail as { message?: unknown })?.message;
      const errMsg = Array.isArray(m) ? m.join(", ") : typeof m === "string" ? m : "upload_failed";
      console.error(`[tasarim-yukle] backend ${res.status}:`, detail);
      return NextResponse.json({ ok: false, status: res.status, error: errMsg }, { status: 502 });
    }

    const data = (await res.json()) as {
      url?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    };
    return NextResponse.json({
      ok: true,
      url: data.url,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    });
  } catch (err) {
    console.error("[tasarim-yukle] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
