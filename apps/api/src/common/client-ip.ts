import type { Request } from "express";

/**
 * İsteğin gerçek client IP'sini çözer.
 *
 * Nginx/Cloudflare arkasında `X-Forwarded-For` proxy zinciri taşır; zincirdeki İLK
 * adres orijinal client'tır. Header yoksa TCP soket adresine düşülür. (auth.controller'daki
 * yerel `clientIp` ile aynı mantık — denetim/güvenlik kayıtlarında tutarlı IP için paylaşıldı.)
 */
export function clientIp(req: Request): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return xff.split(",")[0]?.trim();
  if (Array.isArray(xff)) return xff[0];
  return req.socket?.remoteAddress ?? undefined;
}
