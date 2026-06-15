/**
 * Admin BFF auth — Web Crypto API tabanlı, Edge runtime uyumlu.
 *
 * Mimari (veri-katmanı spec §5): Admin artık kendi şifre kontrolünü YAPMAZ.
 * Login → NestJS API /auth/login'e proxy. API'den dönen { accessToken, refreshToken, user }
 * HMAC ile imzalanıp `markala_admin_session` httpOnly cookie'ye yazılır (BFF).
 * Tarayıcı JWT'yi GÖRMEZ; sunucu (route handler / RSC / middleware) taşır.
 * Access token süresi dolmak üzereyse middleware proaktif refresh yapar.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const SESSION_COOKIE = "markala_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün (refresh token ömrüyle uyumlu sliding)

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "admin";
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
  iat: number; // saniye
}

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET .env.local'de min 32 karakter olmalı.");
  }
  return enc.encode(s);
}

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    getSecret() as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(sig);
}

/** Session token üret — payload.signature */
export async function signSession(session: AdminSession): Promise<string> {
  const payload = b64urlEncode(enc.encode(JSON.stringify(session)));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** Token doğrula — geçersizse null döner */
export async function verifySession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  // Constant-time compare
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (diff !== 0) return null;

  try {
    const data = JSON.parse(dec.decode(b64urlDecode(payload))) as AdminSession;
    const now = Math.floor(Date.now() / 1000);
    if (now - data.iat > SESSION_MAX_AGE) return null;
    if (!data.accessToken || !data.refreshToken || !data.user) return null;
    return data;
  } catch {
    return null;
  }
}

/** JWT payload'ından exp (saniye) oku — imza DOĞRULANMAZ (sadece süre kontrolü için). */
export function decodeJwtExp(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(dec.decode(b64urlDecode(payload))) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
