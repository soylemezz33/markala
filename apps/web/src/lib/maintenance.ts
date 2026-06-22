/**
 * Bakım modu — paylaşılan yardımcılar (middleware [edge] + route handler [node] ortak).
 *
 * Storefront auth client-side olduğundan sunucu, geleni admin olarak TANIMAZ. Admin storefront'a
 * giriş yapınca route handler kendi alan adına imzalı bir "preview" çerezi yazar; middleware bu
 * çerezi doğrulayıp bakım ekranını atlar. İmza HMAC-SHA256 (Web Crypto — edge'de de çalışır).
 */

/** httpOnly bypass çerezi. Değer: `${expMs}.${hmacHex}`. */
export const BYPASS_COOKIE = "mk_preview";

/** Bypass çerezi ömrü — admin bir kez giriş yapınca ~7 gün canlı görebilir. */
export const BYPASS_MAX_AGE_S = 7 * 24 * 60 * 60;

// Tek uygulama (apps/web) hem middleware'i hem route handler'ı barındırır → tek secret yeter.
// Prod'da MUTLAKA ayarla (32+ rastgele karakter). Ayarlanmazsa: feature çalışır ama çerez
// sahtelenebilir (yalnız "bakımı atla" sağlar, düşük şiddet) — deploy'da set edilmeli.
const SECRET =
  process.env.MAINTENANCE_BYPASS_SECRET || "markala-dev-bakim-secret-uretimde-degistir";

if (!process.env.MAINTENANCE_BYPASS_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "[bakım] MAINTENANCE_BYPASS_SECRET ayarlı değil — dev fallback kullanılıyor. Prod'da set edin.",
  );
}

/** Storefront sunucu tarafının (route handler/middleware) API'ye ulaşacağı taban URL. */
export function getApiBase(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  );
}

const encoder = new TextEncoder();

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Sabit-zamanlı string karşılaştırma (imza doğrulama timing attack'a kapalı olsun). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verilen son-geçerlilik (ms epoch) için imzalı çerez değeri üretir. */
export async function signBypass(expMs: number): Promise<string> {
  const exp = String(expMs);
  return `${exp}.${await hmacHex(exp)}`;
}

/** Çerez değerini doğrular: imza geçerli VE süresi dolmamış mı? */
export async function verifyBypass(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
  return timingSafeEqual(sig, await hmacHex(exp));
}
