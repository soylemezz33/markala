import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) Bearer token ile çağrı yapacağız — Node.js runtime.
export const runtime = "nodejs";

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

/**
 * KVKK 11/d + GDPR Madde 20 — Veri taşınabilirliği (Data Portability).
 * Giriş yapmış kullanıcının KENDİ gerçek verisini JSON olarak indirir.
 *
 * Auth: client Authorization: Bearer <accessToken> gönderir (veri-yonetimi sayfası).
 * Token yoksa/geçersizse 401 — eskiden auth YOKTU ve herkese sabit "Demo Kullanıcı" mock'u dönüyordu.
 */
async function api<T>(path: string, auth: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      { error: "Bu işlem için giriş yapmanız gerekir." },
      { status: 401 },
    );
  }

  // Kullanıcı kimliği — token geçersizse 401 (mock veri DÖNMEZ).
  const user = await api<Record<string, unknown>>("/auth/me", auth);
  if (!user) {
    return NextResponse.json(
      { error: "Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın." },
      { status: 401 },
    );
  }

  // Gerçek veri — paralel çek (hata olanlar boş döner, export yine üretilir).
  const [orders, addresses, notificationPrefs] = await Promise.all([
    api<unknown[]>("/orders/mine", auth),
    api<unknown[]>("/users/me/addresses", auth),
    api<Record<string, unknown>>("/users/me/notification-prefs", auth),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportFormat: "Markala-DataExport-v1",
    legalBasis:
      "KVKK 11/d (eksik/yanlış işlenmişse düzeltilme) + GDPR Madde 20 (veri taşınabilirliği)",
    user,
    addresses: addresses ?? [],
    orders: orders ?? [],
    notificationPreferences: notificationPrefs ?? {},
    notes:
      "Bu dosya 6698 sayılı KVKK m.11/d ve GDPR Madde 20 kapsamında, talep anındaki gerçek hesap " +
      "verinizle oluşturulmuştur. Favori listesi tarayıcınızda yerel olarak tutulduğundan bu dosyaya " +
      "dahil değildir. Sipariş ve fatura kayıtları VUK 213 gereği anonimleştirilmiş olarak 10 yıl saklanır.",
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `markala-verilerim-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-Markala-Export": "kvkk-data-portability-v1",
    },
  });
}
