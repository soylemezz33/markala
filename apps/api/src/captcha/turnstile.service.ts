import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ALLOWED_HOSTS = new Set(["markala.com.tr", "www.markala.com.tr", "localhost", "127.0.0.1"]);

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private config: ConfigService) {}

  async verify(token: string, expectedAction: "register" | "login", ip?: string): Promise<boolean> {
    const secret = this.config.get<string>("TURNSTILE_SECRET_KEY");
    const isProd = (this.config.get<string>("NODE_ENV") ?? "development") === "production";

    if (!secret) {
      if (!isProd) return true; // dev fail-open
      this.logger.error("TURNSTILE_SECRET_KEY yok — prod'da captcha fail-closed");
      return false;
    }
    if (!token) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const body = new URLSearchParams({ secret, response: token });
      if (ip) body.set("remoteip", ip);
      const res = await fetch(SITEVERIFY, { method: "POST", body, signal: controller.signal });
      if (!res.ok) return false; // FAIL-CLOSED
      const data = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
      return (
        data.success === true &&
        data.action === expectedAction &&
        typeof data.hostname === "string" &&
        ALLOWED_HOSTS.has(data.hostname)
      );
    } catch (err) {
      this.logger.warn(`turnstile.verify failed (fail-closed): ${(err as Error).message}`);
      return false; // ağ/timeout/parse → FAIL-CLOSED
    } finally {
      clearTimeout(timer);
    }
  }
}
