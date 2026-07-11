import { NextRequest, NextResponse } from "next/server";

// Backend'e (NestJS) sunucu-içinden çağrı — gerçek client IP/CORS derdi yok.
// Sipariş GİRİŞ ZORUNLU: Authorization header (access token) gelmezse 401 döner, misafire düşmez.
export const runtime = "nodejs";

/**
 * Storefront siparişini KALICI olarak backend DB'ye yazar (admin panelde görünmesi için).
 *
 * Neden ayrı route: checkout'tan gelen sepeti backend'in sipariş sözleşmesine (authed POST
 * /api/orders) eşler:
 *   - kalemler: storefront yalnız `productSlug` taşır → backend slug'tan ürünü bulur, fiyatı
 *     Product.basePrice'tan SUNUCUDA yeniden hesaplar (client fiyatına güvenmez).
 *   - adres: kayıtlı Address yok → satır-içi (inline) snapshot olarak gönderilir.
 *
 * Sipariş GİRİŞ ZORUNLU: Authorization header yoksa veya token geçersizse 401 döner (misafire
 * düşmez). Client 401'de kullanıcıyı /giris'e yönlendirir; sepet korunur.
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
  channel?: string; // whatsapp | phone | kart
  accountType?: string; // individual | corporate
  taxOffice?: string;
  taxNumber?: string;
  couponCode?: string;
  /** Sadakat: harcanacak puan — backend bakiye + kurallara göre yeniden doğrular. */
  redeemPoints?: number;
  /** Ödeme yolu — backend doğrular (cari = yalnız onaylı kurumsal). */
  paymentMethod?: string; // iyzico | cari | havale
  notes?: string;
  items?: IncomingItem[];
}

/** Backend yalnız bu ödeme yollarını tanır; bilinmeyen değer iletme (backend null'a düşürür). */
const ALLOWED_PAYMENT_METHODS = new Set(["iyzico", "cari", "havale"]);

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
  const channelLabels: Record<string, string> = { phone: "Telefon", kart: "Web (Kart)", cari: "Web (Açık Hesap)" };
  const noteParts = [
    body.channel ? `Kanal: ${channelLabels[body.channel] ?? "WhatsApp"}` : null,
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

  // Meta Conversions API sinyalleri — TARAYICI ÇEREZLERİNDEN (same-origin istekte gelir).
  // KVKK: pazarlama onayı yoksa marketingConsent=false → backend Purchase'ı Meta'ya göndermez.
  // _fbp/_fbc pixel'in first-party çerezleri (eşleşme kalitesini artırır). Sunucu-içi okuma;
  // tarayıcı çağıranını değiştirmeye gerek yok.
  let marketingConsent = false;
  const consentRaw = req.cookies.get("markala_cookie_consent")?.value;
  if (consentRaw) {
    try {
      marketingConsent = Boolean(JSON.parse(decodeURIComponent(consentRaw)).marketing);
    } catch {
      // bozuk çerez → onay yok say
    }
  }
  const fbp = clamp(req.cookies.get("_fbp")?.value, 200);
  const fbc = clamp(req.cookies.get("_fbc")?.value, 400);

  const orderPayload = {
    email: body.email,
    phone: clamp(body.phone, 32),
    marketingConsent,
    fbp,
    fbc,
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
    // Kurumsal sipariş → fatura adresini kurumsal işaretle + vergi bilgisini snapshot'a koy
    // (Paraşüt e-fatura kurumsal/bireysel ayrımı bunu okur; notlar yetersizdi).
    ...(body.accountType === "corporate"
      ? {
          billingAddress: {
            fullName: clamp(body.customerName, 120) || clamp(body.email, 120) || "Misafir",
            phone: clamp(body.phone, 32) || "-",
            city: clamp(body.city, 80) || "-",
            district: clamp(body.district, 80) || "-",
            fullAddress: clamp(body.fullAddress, 500) || "-",
            zipCode: clamp(body.zipCode, 16),
            label: "Fatura",
            type: "corporate",
            companyName: clamp(body.customerName, 160),
            taxNumber: clamp(body.taxNumber, 20),
            taxOffice: clamp(body.taxOffice, 80),
          },
        }
      : {}),
    // Kupon kodu → backend gerçek indirimi sunucuda hesaplar/doğrular (geçersizse 400 döner).
    couponCode: clamp(body.couponCode, 40)?.toUpperCase(),
    // Sadakat puanı → backend bakiye + kurallara göre yeniden doğrular (client'a güvenilmez).
    redeemPoints:
      typeof body.redeemPoints === "number" && body.redeemPoints > 0
        ? Math.floor(body.redeemPoints)
        : undefined,
    // Ödeme yolu → backend doğrular: "cari" yalnız onaylı kurumsal müşteri + kredi limiti dahilinde.
    // Bilinmeyen değer GÖNDERME (backend null/iyzico'ya düşürür); cari kötüye kullanımı sunucuda durur.
    paymentMethod: body.paymentMethod && ALLOWED_PAYMENT_METHODS.has(body.paymentMethod)
      ? body.paymentMethod
      : undefined,
    notes: noteParts.length ? noteParts.join(" · ") : undefined,
  };

  // Sipariş vermek GİRİŞ ZORUNLU — misafir sipariş (/orders/guest) kaldırıldı.
  // Gerekçe: ilk-sipariş kuponunun (HOSGELDIN) misafir istismarı + her siparişin hesaba bağlanması.
  const authHeader = req.headers.get("authorization") ?? undefined;

  // Token yoksa hiç deneme — misafire DÜŞME, "giriş gerekli" döndür (client /giris'e yönlendirir).
  if (!authHeader) {
    return NextResponse.json(
      { ok: false, status: 401, error: "Sipariş vermek için giriş yapmalısınız." },
      { status: 401 },
    );
  }

  async function postOrder() {
    return fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader as string },
      body: JSON.stringify(orderPayload),
    });
  }

  try {
    const res = await postOrder();
    // Token süresi dolmuş/geçersizse misafire DÜŞMEYİZ — yeniden giriş iste (kupon/cari kaybı + istismar olmasın).
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { ok: false, status: res.status, error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." },
        { status: 401 },
      );
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
