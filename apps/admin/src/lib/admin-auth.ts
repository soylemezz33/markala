/**
 * Admin auth — Web Crypto API tabanlı, Edge runtime uyumlu.
 * .env'den okur (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET).
 * Postgres bağlandığında DB-backed mode'a tek satır geçilir (verifyCredentials).
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const SESSION_COOKIE = "markala_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export interface AdminSession {
  email: string;
  name: string;
  role: "super_admin" | "admin";
  iat: number; // saniye
}

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET .env'de min 32 karakter olmalı.");
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
    getSecret(),
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
    return data;
  } catch {
    return null;
  }
}

/** PBKDF2 ile şifre hash — kayıt sırasında veya .env doldururken kullanılır */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const saltBytes = salt
    ? b64urlDecode(salt)
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return `${b64urlEncode(saltBytes)}$${b64urlEncode(bits)}`;
}

/** Şifre doğrula — env'deki "salt$hash" formatına karşı kontrol eder */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHash] = stored.split("$");
  if (!salt || !expectedHash) return false;
  const computed = await hashPassword(password, salt);
  const [, computedHash] = computed.split("$");
  if (!computedHash || computedHash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * .env'deki credentials ile karşılaştır.
 * Postgres bağlandığında bunu prisma.user.findUnique({where:{email}}) ile değiştir.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  if (!adminEmail || !adminHash) {
    throw new Error(
      "ADMIN_EMAIL ve ADMIN_PASSWORD_HASH .env'de tanımlı değil. Şifre üretmek için /giris sayfasındaki yönergeyi izle.",
    );
  }

  if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) return null;
  const ok = await verifyPassword(password, adminHash);
  if (!ok) return null;

  return {
    email: adminEmail,
    name: adminName,
    role: "super_admin",
    iat: Math.floor(Date.now() / 1000),
  };
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
