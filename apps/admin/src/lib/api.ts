import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "./admin-auth";

/**
 * Server-side API erişimi (RSC / route handler / server action).
 * markala_admin_session cookie'sinden accessToken'ı okur, NestJS API'yi Bearer ile çağırır.
 *
 * NOT: RSC render'ında cookie YAZILAMAZ — access token refresh'i middleware'de proaktif yapılır.
 * Burada sadece OKURUZ. Mutasyon route handler/server action'dan geçerse 401'de reaktif
 * refresh eklenebilir (şimdilik middleware proaktif yenilemesi yeterli).
 */
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiFetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiFetchError";
  }
}

async function accessToken(): Promise<string | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(raw);
  return session?.accessToken ?? null;
}

export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    } catch {
      /* metin değil */
    }
    throw new ApiFetchError(res.status, `API ${res.status} ${path}: ${msg}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
