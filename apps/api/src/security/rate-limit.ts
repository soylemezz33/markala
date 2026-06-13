import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

export class FixedWindowCounter {
  private store = new Map<string, Bucket>();
  constructor(private opts: { windowMs: number; max: number }) {}

  hit(key: string, now: number): { allowed: boolean; retryAfterSec: number } {
    let b = this.store.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + this.opts.windowMs };
      this.store.set(key, b);
    }
    b.count += 1;
    if (b.count > this.opts.max) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  sweep(now: number) {
    for (const [k, b] of this.store) if (b.resetAt <= now) this.store.delete(k);
  }
}

/** Express middleware: belirli path+method için per-IP fixed-window limit. */
export function rateLimit(opts: { windowMs: number; max: number; path: string; method?: string }) {
  const counter = new FixedWindowCounter(opts);
  setInterval(() => counter.sweep(Date.now()), opts.windowMs).unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    if (opts.method && req.method !== opts.method) return next();
    if (!req.path.endsWith(opts.path)) return next();
    const ip = req.ip ?? "unknown"; // trust proxy=1 → req.ip = gerçek client (CF-Connecting-IP / Nginx real_ip)
    const { allowed, retryAfterSec } = counter.hit(`${opts.path}:${ip}`, Date.now());
    if (!allowed) {
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        statusCode: 429,
        code: "RATE_LIMITED",
        message: "Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.",
        retryAfter: retryAfterSec,
      });
    }
    next();
  };
}
