/**
 * Admin session — Web Crypto HMAC ile imzalı cookie payload'ı.
 * Payload artık API JWT'sini taşır (accessToken + refreshToken).
 * Edge runtime uyumlu (Buffer yok, atob/btoa + TextEncoder).
 */

export interface AdminSession {
  accessToken: string;   // API JWT (15dk)
  refreshToken: string;  // API mk_refresh ham değeri (30 gün)
  email: string;
  name: string;
  role: "admin" | "super_admin";
  iat: number; // saniye
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(str: string): string {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64);
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(sig);
}

export async function signSession(session: AdminSession, secret: string): Promise<string> {
  const payload = b64urlEncode(enc.encode(JSON.stringify(session)));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<AdminSession | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload, secret);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    return JSON.parse(b64urlDecodeToString(payload)) as AdminSession;
  } catch {
    return null;
  }
}

/** JWT payload'ındaki exp (saniye) — imza doğrulanmaz, sadece okunur. */
export function getJwtExp(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const data = JSON.parse(b64urlDecodeToString(payload)) as { exp?: number };
    return data.exp ?? null;
  } catch {
    return null;
  }
}

/** Access token 60 sn içinde dolacaksa (veya exp okunamıyorsa) refresh gerekir. */
export function needsRefresh(jwt: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const exp = getJwtExp(jwt);
  if (exp === null) return true;
  return exp - nowSeconds < 60;
}

export const SESSION_COOKIE = "markala_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün
