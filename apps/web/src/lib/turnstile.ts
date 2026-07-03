/**
 * Cloudflare Turnstile — sunucu-tarafı token doğrulama (Next route handler'larında).
 *
 * API'deki TurnstileService ile aynı mantık (challenges.cloudflare.com/siteverify), ama
 * action zorlamaz → tek helper birden çok public formda (iletişim/teklif/...) kullanılabilir.
 * - TURNSTILE_SECRET_KEY yoksa: dev'de fail-OPEN (true), prod'da fail-CLOSED (false).
 * - Ağ/timeout/parse hatası → fail-CLOSED (bot geçemesin).
 */
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ALLOWED_HOSTS = new Set(["markala.com.tr", "www.markala.com.tr", "localhost", "127.0.0.1"]);

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) return !isProd; // secret yoksa: dev geç, prod engelle
  if (!token) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(SITEVERIFY, { method: "POST", body, signal: controller.signal });
    if (!res.ok) return false; // FAIL-CLOSED
    const data = (await res.json()) as { success?: boolean; hostname?: string };
    return (
      data.success === true &&
      typeof data.hostname === "string" &&
      ALLOWED_HOSTS.has(data.hostname)
    );
  } catch {
    return false; // ağ/timeout/parse → FAIL-CLOSED
  } finally {
    clearTimeout(timer);
  }
}
