import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) sunucu-içinden çağrı — gerçek client IP/CORS derdi yok, token gerekmez (guest).
export const runtime = "nodejs";

/**
 * Storefront siparişini KALICI olarak backend DB'ye yazar (admin panelde görünmesi için).
 *
 * Neden ayrı route: checkout (WhatsApp/telefon ile) sipariş veriyordu ama sipariş yalnızca
 * tarayıcı Zustand store'unda kalıyor, DB'ye düşmüyordu → admin panel boş. Bu route checkout'tan
 * gelen sepeti backend'in misafir sipariş sözleşmesine (POST /api/orders/guest) eşler:
 *   - kalemler: storefront yalnız `productSlug` taşır → backend slug'tan ürünü bulur, fiyatı
 *     Product.basePrice'tan SUNUCUDA yeniden hesaplar (client fiyatına güvenmez).
 *   - adres: kayıtlı Address yok → satır-içi (inline) snapshot olarak gönderilir.
 *
 * Best-effort değil — admin görünürlüğü buna bağlı; ama hata olsa bile checkout akışını (WhatsApp)
 * bloke etmemek için 502 + { ok:false } döner, client tarafı bunu yutup WhatsApp'a devam eder.
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

/**
 * Tasarım dosyası URL'i client'tan geliyor → ASLA güvenme (admin bunu href olarak render eder).
 * Yalnız kendi storage'ımıza (https://*.markala.com.tr/... veya dev localhost) izin ver;
 * javascript:/data:/yabancı host → stored XSS olur, reddet (undefined).
 */
function safeUploadUrl(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  try {
    const u = new URL(v);
    const httpOk = u.protocol === "https:" || u.protocol === "http:";
    const hostOk =
      u.hostname === "markala.com.tr" ||
      u.hostname.endsWith(".markala.com.tr") ||
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1";
    if (httpOk && hostOk) return u.href;
  } catch {
    // geçersiz URL (örn. "javascript:...") → reddet
  }
  return undefined;
}

interface IncomingItem {
  productSlug?: string;
  configuration?: {
    needsDesign?: boolean;
    uploadedFileName?: string;
    uploadedFileUrl?: string;
  } & Record<string, unknown>;
  quantity?: number;
}

interface IncomingPayload {
  email?: string;
  phone?: string;
  customerName?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  zipCode?: string;
  channel?: string; // whatsapp | phone
  accountType?: string; // individual | corporate
  taxOffice?: string;
  taxNumber?: string;
  couponCode?: string;
  notes?: string;
  items?: IncomingItem[];
}

export async function POST(req: NextRequest) {
  let body: IncomingPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter((i) => i.productSlug)
    .map((i) => ({
      productSlug: i.productSlug,
      configuration: i.configuration ?? {},
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
      needsDesignSupport: Boolean(i.configuration?.needsDesign),
      uploadedFileName: i.configuration?.uploadedFileName,
      uploadedFileUrl: safeUploadUrl(i.configuration?.uploadedFileUrl),
    }));

  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "empty_items" }, { status: 400 });
  }

  // Kanal + kurumsal vergi bilgisini admin görsün diye nota düş (Order'da ayrı kolon yok).
  const noteParts = [
    body.channel ? `Kanal: ${body.channel === "phone" ? "Telefon" : "WhatsApp"}` : null,
    body.accountType === "corporate" && (body.taxOffice || body.taxNumber)
      ? `Vergi: ${body.taxOffice ?? "-"} / ${body.taxNumber ?? "-"}`
      : null,
    body.notes,
  ].filter(Boolean);

  // Adres alanlarını backend DTO limitlerine kırp — opsiyonel/uzun bir girdi (örn. >16 hane
  // posta kodu) TÜM siparişi 400 ile düşürmesin. Boş/whitespace → undefined.
  const clamp = (v: unknown, n: number): string | undefined => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s.slice(0, n) : undefined;
  };

  const guestOrder = {
    email: body.email,
    phone: clamp(body.phone, 32),
    items,
    shippingAddress: {
      fullName: clamp(body.customerName, 120) || clamp(body.email, 120) || "Misafir",
      phone: clamp(body.phone, 32),
      city: clamp(body.city, 80),
      district: clamp(body.district, 80),
      fullAddress: clamp(body.fullAddress, 500),
      zipCode: clamp(body.zipCode, 16),
      label: "Teslimat",
    },
    // Kupon kodu → backend gerçek indirimi sunucuda hesaplar/doğrular (geçersizse 400 döner).
    couponCode: clamp(body.couponCode, 40)?.toUpperCase(),
    notes: noteParts.length ? noteParts.join(" · ") : undefined,
  };

  // Giriş yapmış kullanıcı → authed /orders (sipariş userId ile HESABA bağlanır, "siparişlerim"de görünür).
  // Token yoksa veya authed çağrı 401/403 dönerse misafir /orders/guest'e düşeriz (sipariş asla kaybolmaz).
  const authHeader = req.headers.get("authorization") ?? undefined;

  async function postOrder(authed: boolean) {
    return fetch(`${API_BASE}/api/orders${authed ? "" : "/guest"}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authed && authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(guestOrder),
    });
  }

  try {
    let res = await postOrder(Boolean(authHeader));
    // Token süresi geçmiş/geçersizse misafir olarak tekrar dene (sipariş oluşsun).
    if (!res.ok && authHeader && (res.status === 401 || res.status === 403)) {
      console.warn("[siparis-kaydet] authed sipariş 401/403 → guest fallback");
      res = await postOrder(false);
    }

    if (!res.ok) {
      let detail: unknown = undefined;
      try {
        detail = await res.json();
      } catch {}
      console.error(`[siparis-kaydet] backend ${res.status}:`, detail);
      const m = (detail as { message?: unknown })?.message;
      const errMsg = Array.isArray(m) ? m.join(", ") : typeof m === "string" ? m : undefined;
      return NextResponse.json({ ok: false, status: res.status, error: errMsg }, { status: 502 });
    }

    const order = (await res.json()) as { id?: string; orderNumber?: string; paymentNonce?: string };
    // paymentNonce: ödeme başlatmada (IDOR koruması) zorunlu — backend'den geçir.
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentNonce: order.paymentNonce,
    });
  } catch (err) {
    // Backend erişilemez — checkout (WhatsApp) yine de devam etsin; admin kaydı sonra eklenir.
    console.error("[siparis-kaydet] backend erişilemedi:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "backend_unreachable" }, { status: 502 });
  }
}
