# Kayıt Güvenliği (Mail Doğrulama + Turnstile + Gerçek Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Markala kayıt akışını gerçek backend'e bağlamak; Cloudflare Turnstile (kayıt+giriş), mail doğrulaması (doğrulanmadan giriş yok), çalışan rate-limit ve KVKK uyumu eklemek.

**Architecture:** NestJS API'ye `mail` (nodemailer SMTP) + `captcha` (Turnstile) modülleri eklenir; `AuthService` register→doğrulama-maili (token vermez), login→doğrulanmamışta 403, yeni `verify-email`/`resend-verification` endpoint'leri. Rate-limit ölü `@Throttle` yerine tek `main.ts` in-memory limiter'a toplanır (per-IP) + servis katmanında per-email cooldown. Frontend `auth-store` mock'u kaldırılıp api-client'e bağlanır, açılışta `/auth/refresh` ile bootstrap. Kenar: Nginx auth-zone + Cloudflare.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres), nodemailer, Cloudflare Turnstile, Next.js (App Router) + zustand, vitest (backend unit), MailHog (dev SMTP).

**Spec:** `docs/superpowers/specs/2026-06-13-kayit-guvenligi-mail-dogrulama-captcha-design.md`

**Test stratejisi:** Backend saf-mantık servisleri vitest ile TDD (bağımlılıklar elle mock'lanır — `new Service(mockDep)`); Prisma çağrıları mock obje ile. Frontend ve infra spec §10 gereği **build + manuel e2e** ile doğrulanır (component unit test altyapısı bu işin dışında).

**Sır notu:** SMTP şifresi (Hasan verdi) yalnız `apps/api/.env.production`'a (gitignore) yazılır — bu plana veya commit'e ASLA literal yazılmaz.

---

## Faz 0 — Araçlar & bağımlılıklar

### Task 1: Bağımlılıklar + vitest kurulumu

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Bağımlılıkları ekle**

Run (repo kökünde):
```bash
pnpm --filter @markala/api add nodemailer
pnpm --filter @markala/api add -D @types/nodemailer vitest
```
Expected: `package.json` dependencies'e `nodemailer`, devDependencies'e `@types/nodemailer` + `vitest` eklenir.

- [ ] **Step 2: vitest config oluştur**

```ts
// apps/api/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
```

- [ ] **Step 3: test script ekle**

`apps/api/package.json` `scripts` içine ekle:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Boş çalıştırma doğrula**

Run: `pnpm --filter @markala/api test`
Expected: "No test files found" (henüz test yok) — hata değil, vitest çalışıyor.

- [ ] **Step 5: Commit**

```bash
git add apps/api/package.json apps/api/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(api): nodemailer + vitest kurulumu"
```

---

## Faz 1 — Veri modeli

### Task 2: EmailVerificationToken modeli + migration + backfill

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_email_verification_tokens/migration.sql` (üretilir + düzenlenir)

- [ ] **Step 1: Modeli ekle**

`schema.prisma`'da `User` modelinin ilişkiler bloğuna ekle (diğer ilişkilerin yanına):
```prisma
  emailVerificationTokens EmailVerificationToken[]
```
Dosya sonuna `RefreshToken` modelinden sonra yeni model ekle:
```prisma
model EmailVerificationToken {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  tokenHash  String    @unique @map("token_hash")
  expiresAt  DateTime  @map("expires_at")
  consumedAt DateTime? @map("consumed_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("email_verification_tokens")
}
```

- [ ] **Step 2: Migration'ı uygulamadan üret**

Run: `pnpm --filter @markala/api exec prisma migrate dev --create-only --name email_verification_tokens`
Expected: `prisma/migrations/<ts>_email_verification_tokens/migration.sql` oluşur (CREATE TABLE), henüz uygulanmadı.

- [ ] **Step 3: Backfill UPDATE ekle**

Üretilen `migration.sql` dosyasının **sonuna** ekle:
```sql
-- Backfill: mock auth döneminde kaydolan mevcut kullanıcıları doğrulanmış say.
-- Aksi halde login'e eklenen emailVerifiedAt kontrolü tüm eski hesapları kilitler.
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;
```

- [ ] **Step 4: Uygula + client üret**

Run: `pnpm --filter @markala/api exec prisma migrate dev`
Then: `pnpm --filter @markala/api exec prisma generate`
Expected: migration uygulanır, `email_verification_tokens` tablosu oluşur, Prisma client güncellenir.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): EmailVerificationToken modeli + mevcut kullanıcı backfill"
```

---

## Faz 2 — Captcha (Turnstile)

### Task 3: TurnstileService (TDD)

**Files:**
- Create: `apps/api/src/captcha/turnstile.service.ts`
- Test: `apps/api/src/captcha/turnstile.service.spec.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// apps/api/src/captcha/turnstile.service.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TurnstileService } from "./turnstile.service";

function cfg(values: Record<string, string | undefined>) {
  return { get: (k: string) => values[k] } as any;
}

describe("TurnstileService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prod'da geçerli token + doğru action + whitelist host → true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: "register", hostname: "markala.com.tr" }),
    }));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register", "1.2.3.4")).toBe(true);
  });

  it("action uyuşmazlığı → false (replay koruması)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: "login", hostname: "markala.com.tr" }),
    }));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register", "1.2.3.4")).toBe(false);
  });

  it("ağ hatası → false (FAIL-CLOSED)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const svc = new TurnstileService(cfg({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: "s" }));
    expect(await svc.verify("tok", "register")).toBe(false);
  });

  it("dev'de secret yok → true (dev fail-open)", async () => {
    const svc = new TurnstileService(cfg({ NODE_ENV: "development", TURNSTILE_SECRET_KEY: undefined }));
    expect(await svc.verify("anything", "login")).toBe(true);
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- turnstile`
Expected: FAIL — "Cannot find module './turnstile.service'".

- [ ] **Step 3: Servisi yaz**

```ts
// apps/api/src/captcha/turnstile.service.ts
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
```

- [ ] **Step 4: Test geçsin**

Run: `pnpm --filter @markala/api test -- turnstile`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/captcha/
git commit -m "feat(api): TurnstileService — fail-closed + action/hostname doğrulama"
```

### Task 4: CaptchaModule

**Files:**
- Create: `apps/api/src/captcha/captcha.module.ts`

- [ ] **Step 1: Modülü yaz**

```ts
// apps/api/src/captcha/captcha.module.ts
import { Module } from "@nestjs/common";
import { TurnstileService } from "./turnstile.service";

@Module({
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class CaptchaModule {}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/captcha/captcha.module.ts
git commit -m "feat(api): CaptchaModule"
```

---

## Faz 3 — Mail (nodemailer)

### Task 5: MailService + MailModule (TDD)

**Files:**
- Create: `apps/api/src/mail/mail.service.ts`
- Create: `apps/api/src/mail/mail.module.ts`
- Test: `apps/api/src/mail/mail.service.spec.ts`

**Önce doğrula:** `apps/api/src/prisma/prisma.module.ts` `PrismaService`'i export ediyor mu? Etmiyorsa MailModule'de `imports: [PrismaModule]` yeterli; global ise import gerekmez. Plan PrismaModule import eder.

- [ ] **Step 1: Failing test yaz**

```ts
// apps/api/src/mail/mail.service.spec.ts
import { describe, it, expect, vi } from "vitest";
import { MailService } from "./mail.service";

function cfg(v: Record<string, any>) { return { get: (k: string) => v[k] } as any; }

describe("MailService", () => {
  it("başarılı gönderim → true + NotificationLog sent", async () => {
    const prisma = { notificationLog: { create: vi.fn().mockResolvedValue({}) } } as any;
    const svc = new MailService(cfg({ SMTP_HOST: "localhost", SMTP_PORT: "1025", SMTP_SECURE: "false", MAIL_FROM: "Markala <markala@324ajans.com>" }), prisma);
    // transporter'ı mock'la
    (svc as any).transporter = { sendMail: vi.fn().mockResolvedValue({ messageId: "m1" }) };
    const ok = await svc.sendVerificationEmail("u@x.com", "https://markala.com.tr/eposta-dogrula?token=t");
    expect(ok).toBe(true);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "sent", recipient: "u@x.com", template: "email-verification" }) }),
    );
  });

  it("SMTP hatası → throw ETMEZ, false döner + NotificationLog failed", async () => {
    const prisma = { notificationLog: { create: vi.fn().mockResolvedValue({}) } } as any;
    const svc = new MailService(cfg({ SMTP_HOST: "localhost", SMTP_PORT: "1025", MAIL_FROM: "x" }), prisma);
    (svc as any).transporter = { sendMail: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) };
    const ok = await svc.sendVerificationEmail("u@x.com", "https://x/t");
    expect(ok).toBe(false);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }),
    );
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- mail`
Expected: FAIL — modül yok.

- [ ] **Step 3: Servisi yaz**

```ts
// apps/api/src/mail/mail.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private transporter: Transporter;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const secure = (this.config.get<string>("SMTP_SECURE") ?? "false") === "true";
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    this.from = this.config.get<string>("MAIL_FROM") ?? "Markala <markala@324ajans.com>";
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("SMTP_HOST") ?? "localhost",
      port: Number(this.config.get<string>("SMTP_PORT") ?? 1025),
      secure,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
  }

  /** İşlemsel doğrulama maili. HATA FIRLATMAZ — register'ı bloke etmez. */
  async sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
    const subject = "Markala — E-posta adresinizi doğrulayın";
    const text = `Markala hesabınızı etkinleştirmek için bağlantıya tıklayın:\n${verifyUrl}\n\nBağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.\n\nMarkala — 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1a1a1a">Markala'ya hoş geldin 👋</h2>
      <p>Hesabını etkinleştirmek için aşağıdaki butona tıkla:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">E-postamı doğrula</a></p>
      <p style="color:#666;font-size:13px">Bağlantı 24 saat geçerlidir. Buton çalışmazsa: <br><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Bu işlemsel bir iletidir. Markala — 324 Ajans BT tarafından gönderilmiştir.</p>
    </div>`;

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId });
      return true;
    } catch (err) {
      this.logger.warn(`mail.verification failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message });
      return false;
    }
  }

  private async logNotification(recipient: string, status: "sent" | "failed", metadata: Record<string, unknown>) {
    await this.prisma.notificationLog
      .create({
        data: {
          channel: "email",
          template: "email-verification",
          recipient,
          subject: "E-posta doğrulama",
          body: "",
          status,
          metadata: metadata as any,
        },
      })
      .catch((e) => this.logger.error(`notificationLog yazılamadı: ${(e as Error).message}`));
  }
}
```

- [ ] **Step 4: MailModule yaz**

```ts
// apps/api/src/mail/mail.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailService } from "./mail.service";

@Module({
  imports: [PrismaModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

- [ ] **Step 5: Test geçsin + Commit**

Run: `pnpm --filter @markala/api test -- mail`
Expected: PASS (2 test).
```bash
git add apps/api/src/mail/
git commit -m "feat(api): MailService (nodemailer SMTP, best-effort, NotificationLog)"
```

---

## Faz 4 — Rate limiter (çalışır hale getir)

### Task 6: In-memory limiter refaktör + trust proxy + endpoint'ler (TDD)

**Files:**
- Create: `apps/api/src/security/rate-limit.ts` (saf mantık — test edilebilir)
- Test: `apps/api/src/security/rate-limit.spec.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Failing test yaz (saf sayaç mantığı)**

```ts
// apps/api/src/security/rate-limit.spec.ts
import { describe, it, expect } from "vitest";
import { FixedWindowCounter } from "./rate-limit";

describe("FixedWindowCounter", () => {
  it("limit aşılınca blocklar ve pencere dolunca sıfırlar", () => {
    let now = 1000;
    const c = new FixedWindowCounter({ windowMs: 100, max: 2 });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
    expect(c.hit("ip1", now)).toMatchObject({ allowed: false });
    now += 101;
    expect(c.hit("ip1", now)).toMatchObject({ allowed: true });
  });

  it("farklı anahtarlar bağımsız", () => {
    const c = new FixedWindowCounter({ windowMs: 100, max: 1 });
    expect(c.hit("a", 0).allowed).toBe(true);
    expect(c.hit("b", 0).allowed).toBe(true);
    expect(c.hit("a", 0).allowed).toBe(false);
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- rate-limit`
Expected: FAIL — modül yok.

- [ ] **Step 3: Saf sayaç + middleware fabrikası yaz**

```ts
// apps/api/src/security/rate-limit.ts
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
    // trust proxy=1 ayarlı → req.ip doğru client IP (CF-Connecting-IP, Nginx real_ip)
    const ip = req.ip ?? "unknown";
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
```

- [ ] **Step 4: main.ts'i refaktör et**

`main.ts`'te eski `makeRateLimiter` fonksiyonunu ve `type Bucket`'i **sil**; `rateLimit`'i import et. `bootstrap()` içinde `NestExpressApplication` tipiyle oluştur, `trust proxy` ayarla ve tüm auth limitlerini ekle:
```ts
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { rateLimit } from "./security/rate-limit";
// ...
const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
app.set("trust proxy", 1); // Nginx tek-hop; req.ip = CF-Connecting-IP (gerçek client)

app.use(helmet());
app.use(json({ limit: "100kb" }));

// Auth rate limitleri (tek mekanizma — Throttler kaldırıldı):
app.use(rateLimit({ windowMs: 60 * 60_000, max: 3, path: "/auth/register", method: "POST" }));
app.use(rateLimit({ windowMs: 60_000, max: 5, path: "/auth/login", method: "POST" }));
app.use(rateLimit({ windowMs: 60 * 60_000, max: 3, path: "/auth/resend-verification", method: "POST" }));
app.use(rateLimit({ windowMs: 60_000, max: 10, path: "/auth/verify-email", method: "POST" }));
app.use(rateLimit({ windowMs: 60_000, max: 30, path: "/auth/refresh", method: "POST" }));
```

- [ ] **Step 5: Test geçsin + build + Commit**

Run: `pnpm --filter @markala/api test -- rate-limit` → PASS
Run: `pnpm --filter @markala/api type-check` → hata yok
```bash
git add apps/api/src/security/ apps/api/src/main.ts
git commit -m "feat(api): çalışan tek rate-limit (per-IP) + trust proxy + 429 standart format"
```

### Task 7: ThrottlerModule + @Throttle kaldır

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 1: app.module.ts'ten Throttler'ı kaldır**

`import { ThrottlerModule } from "@nestjs/throttler";` satırını ve `imports` içindeki `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),` satırını sil.

- [ ] **Step 2: controller'dan @Throttle kaldır**

`auth.controller.ts`'te `import { Throttle } from "@nestjs/throttler";` ve tüm `@Throttle({...})` dekoratörlerini sil (register/login/refresh üzerindeki). Limitler artık main.ts'te.

- [ ] **Step 3: type-check + Commit**

Run: `pnpm --filter @markala/api type-check` → hata yok
```bash
git add apps/api/src/app.module.ts apps/api/src/auth/auth.controller.ts
git commit -m "refactor(api): ölü ThrottlerModule/@Throttle kaldırıldı (limitler main.ts'te)"
```

---

## Faz 5 — Auth domain

### Task 8: LEGAL_VERSION sabiti

**Files:**
- Modify: `packages/mock-data/src/legal.ts` (üstüne sabit ekle + export)

- [ ] **Step 1: Sabiti ekle**

`legal.ts` dosyasının başına ekle:
```ts
/** Yasal metinlerin (KVKK, kullanım koşulları) makine-okur sürümü. ConsentLog.version kaynağı. */
export const LEGAL_VERSION = "2026-06-13";
```
`packages/mock-data/src/index.ts` legal'ı zaten re-export ediyorsa ek iş yok; etmiyorsa `export * from "./legal";` ekle.

- [ ] **Step 2: Build + Commit**

Run: `pnpm --filter @markala/mock-data build` (varsa) veya `pnpm --filter @markala/mock-data type-check`
```bash
git add packages/mock-data/src/legal.ts packages/mock-data/src/index.ts
git commit -m "feat(legal): LEGAL_VERSION sabiti (consent sürümleme)"
```

### Task 9: DTO güncellemeleri

**Files:**
- Modify: `apps/api/src/auth/dtos/register.dto.ts`
- Modify: `apps/api/src/auth/dtos/login.dto.ts`

- [ ] **Step 1: RegisterDto'ya alanlar ekle**

`register.dto.ts` import satırına `Equals`, `IsBoolean`, `IsNotEmpty` ekle ve sınıfa ekle:
```ts
  @IsString()
  @IsNotEmpty()
  captchaToken!: string;

  /** "KVKK Aydınlatma Metni'ni okudum" teyidi — açık rıza DEĞİL; zorunlu. */
  @IsBoolean()
  @Equals(true, { message: "KVKK aydınlatma metnini onaylamalısınız" })
  kvkkAccepted!: boolean;

  /** Pazarlama açık rızası (opt-in) — tek gerçek açık rıza alanı. */
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  /** Onaylanan yasal metin sürümü (frontend LEGAL_VERSION'dan gönderir). */
  @IsString()
  @IsNotEmpty()
  consentVersion!: string;
```

- [ ] **Step 2: LoginDto'ya captchaToken ekle**

`login.dto.ts`'e:
```ts
  @IsString()
  @IsNotEmpty()
  captchaToken!: string;
```
(import'a `IsNotEmpty` eklenir.)

- [ ] **Step 3: type-check + Commit**

Run: `pnpm --filter @markala/api type-check`
```bash
git add apps/api/src/auth/dtos/
git commit -m "feat(api): RegisterDto captcha+kvkk+consent, LoginDto captcha"
```

### Task 10: AuthService.register yeniden yazımı (TDD)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Test: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// apps/api/src/auth/auth.service.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";

function makeDeps() {
  const prisma: any = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    emailVerificationToken: { create: vi.fn().mockResolvedValue({}), updateMany: vi.fn().mockResolvedValue({}), findFirst: vi.fn() },
    consentLog: { create: vi.fn().mockResolvedValue({}) },
    refreshToken: { create: vi.fn().mockResolvedValue({}) },
  };
  const jwt = { sign: vi.fn().mockReturnValue("access") };
  const config = { get: vi.fn().mockReturnValue("15m") };
  const mail = { sendVerificationEmail: vi.fn().mockResolvedValue(true) };
  const turnstile = { verify: vi.fn().mockResolvedValue(true) };
  return { prisma, jwt, config, mail, turnstile };
}

describe("AuthService.register", () => {
  it("yeni kullanıcı → user oluşturur, token VERMEZ, mail gönderir, consent yazar", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue(null);
    d.prisma.user.create.mockResolvedValue({ id: "u1", email: "a@b.com", role: "customer" });
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.register(
      { email: "a@b.com", password: "Abcd1234", fullName: "Ad", captchaToken: "t", kvkkAccepted: true, marketingConsent: true, consentVersion: "2026-06-13" },
      { ip: "1.1.1.1" },
    );
    expect(res).toEqual({ status: "verification_sent", email: "a@b.com" });
    expect(d.prisma.user.create).toHaveBeenCalled();
    expect(d.prisma.consentLog.create).toHaveBeenCalledTimes(2); // kvkk + marketing
    expect(d.mail.sendVerificationEmail).toHaveBeenCalled();
  });

  it("captcha geçersiz → BadRequest, DB'ye dokunmaz", async () => {
    const d = makeDeps();
    d.turnstile.verify.mockResolvedValue(false);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await expect(
      svc.register({ email: "a@b.com", password: "Abcd1234", fullName: "Ad", captchaToken: "x", kvkkAccepted: true, consentVersion: "v" }, { ip: "1" }),
    ).rejects.toThrow();
    expect(d.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("var olan doğrulanmamış kullanıcı → yeni user OLUŞTURMAZ, resend yapar, aynı cevabı döner", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", emailVerifiedAt: null, deletedAt: null });
    d.prisma.emailVerificationToken.findFirst.mockResolvedValue(null);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.register({ email: "a@b.com", password: "Abcd1234", fullName: "Ad", captchaToken: "t", kvkkAccepted: true, consentVersion: "v" }, { ip: "1" });
    expect(res).toEqual({ status: "verification_sent", email: "a@b.com" });
    expect(d.prisma.user.create).not.toHaveBeenCalled();
    expect(d.mail.sendVerificationEmail).toHaveBeenCalled();
  });

  it("mail gönderimi başarısız olsa bile register başarılı döner", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue(null);
    d.prisma.user.create.mockResolvedValue({ id: "u1", email: "a@b.com", role: "customer" });
    d.mail.sendVerificationEmail.mockResolvedValue(false);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.register({ email: "a@b.com", password: "Abcd1234", fullName: "Ad", captchaToken: "t", kvkkAccepted: true, consentVersion: "v" }, { ip: "1" });
    expect(res.status).toBe("verification_sent");
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- auth.service`
Expected: FAIL — constructor imzası/register davranışı uyuşmuyor.

- [ ] **Step 3: AuthService'i güncelle (register + token helper'ları)**

`auth.service.ts` constructor'a `MailService` + `TurnstileService` ekle ve `register`'ı değiştir. Üstteki importlara ekle:
```ts
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { TurnstileService } from "../captcha/turnstile.service";
```
Constructor:
```ts
  private readonly verifyTtlMs = 24 * 60 * 60 * 1000; // 24 saat
  private readonly resendCooldownMs = 90_000;          // 90 sn
  private readonly maxMailPerDay = 5;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private turnstile: TurnstileService,
  ) {}
```
`register` (eski gövdeyi tümüyle değiştir):
```ts
  async register(
    input: { email: string; password: string; fullName: string; phone?: string; captchaToken: string; kvkkAccepted: boolean; marketingConsent?: boolean; consentVersion: string },
    context: { userAgent?: string; ipAddress?: string; ip?: string },
  ) {
    const ip = context.ipAddress ?? context.ip;
    // (3) captcha — argon2/DB'den ÖNCE
    if (!(await this.turnstile.verify(input.captchaToken, "register", ip))) {
      throw new BadRequestException("Doğrulama başarısız. Lütfen tekrar deneyin.");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      if (existing.emailVerifiedAt) {
        // doğrulanmış → enumeration koruması (generic)
        this.logger.warn(`register.duplicate_verified email=${input.email} ip=${ip ?? "?"}`);
        return { status: "verification_sent" as const, email: input.email };
      }
      if (!existing.deletedAt) {
        // doğrulanmamış mevcut → sessiz resend (kullanıcı kilitlenmez)
        await this.sendVerification(existing.id, input.email);
      }
      return { status: "verification_sent" as const, email: input.email };
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        marketingConsent: Boolean(input.marketingConsent),
        marketingConsentAt: input.marketingConsent ? new Date() : null,
        marketingConsentSource: input.marketingConsent ? "register" : null,
      },
    });

    // KVKK: okudum teyidi + pazarlama açık rızası ayrı kayıt
    await this.prisma.consentLog.create({
      data: { userId: user.id, email: input.email, consentType: "kvkk", granted: true, ipAddress: ip, userAgent: context.userAgent, version: input.consentVersion },
    });
    await this.prisma.consentLog.create({
      data: { userId: user.id, email: input.email, consentType: "marketing", granted: Boolean(input.marketingConsent), ipAddress: ip, userAgent: context.userAgent, version: input.consentVersion },
    });

    await this.sendVerification(user.id, input.email);
    return { status: "verification_sent" as const, email: input.email };
  }

  /** Token üret (hash sakla) + mail gönder (best-effort). Cooldown/daily-cap kontrollü. */
  private async sendVerification(userId: string, email: string): Promise<void> {
    const last = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const now = Date.now();
    if (last && now - new Date(last.createdAt).getTime() < this.resendCooldownMs) return; // sessiz cooldown

    const since = new Date(now - 24 * 60 * 60 * 1000);
    const todayCount = await this.prisma.emailVerificationToken.count({ where: { userId, createdAt: { gte: since } } });
    if (todayCount >= this.maxMailPerDay) return; // günlük tavan (mail-bombing koruması)

    // eski aktif tokenları geçersiz kıl
    await this.prisma.emailVerificationToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: new Date() } });

    const raw = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt: new Date(now + this.verifyTtlMs) },
    });
    const base = this.config.get<string>("WEB_ORIGIN")?.split(",")[0] ?? "http://localhost:3000";
    await this.mail.sendVerificationEmail(email, `${base}/eposta-dogrula?token=${raw}`);
  }
```
(Not: `emailVerificationToken.count`/`findFirst`/`updateMany`/`create` Prisma client'ta mevcut. Test mock'una `count` ekle — Step 1 testine `count: vi.fn().mockResolvedValue(0)` ekleyerek güncelle.)

- [ ] **Step 4: Test mock'una count ekle + geçsin**

`auth.service.spec.ts` `makeDeps` içinde `emailVerificationToken`'a `count: vi.fn().mockResolvedValue(0)` ekle.
Run: `pnpm --filter @markala/api test -- auth.service` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): register — captcha-first, doğrulama maili, consent log, token vermez"
```

### Task 11: AuthService.login — doğrulama kontrolü + e-posta brute-force throttle (TDD)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Failing test ekle**

```ts
describe("AuthService.login", () => {
  it("doğrulanmamış hesap + doğru şifre → ForbiddenException EMAIL_NOT_VERIFIED", async () => {
    const d = makeDeps();
    const argon2 = await import("argon2");
    const hash = await argon2.hash("Abcd1234");
    d.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", role: "customer", passwordHash: hash, emailVerifiedAt: null });
    d.prisma.user.update = vi.fn();
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await expect(svc.login("a@b.com", "Abcd1234", "t", { ip: "1" })).rejects.toMatchObject({ response: expect.objectContaining({ code: "EMAIL_NOT_VERIFIED" }) });
  });

  it("captcha geçersiz → BadRequest, argon2 koşmaz", async () => {
    const d = makeDeps();
    d.turnstile.verify.mockResolvedValue(false);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await expect(svc.login("a@b.com", "x", "bad", { ip: "1" })).rejects.toThrow();
    expect(d.prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- auth.service`
Expected: FAIL — login imzası `captchaToken` almıyor / verified kontrolü yok.

- [ ] **Step 3: login'i güncelle**

`login` imzasını ve gövdesini değiştir (captcha-first + verified kontrolü + e-posta fail sayacı):
```ts
  private failedLogins = new Map<string, { count: number; resetAt: number }>();
  private readonly loginFailWindowMs = 15 * 60_000;
  private readonly loginFailMax = 10;

  async login(
    email: string,
    password: string,
    captchaToken: string,
    context: { userAgent?: string; ipAddress?: string; ip?: string },
  ) {
    const ip = context.ipAddress ?? context.ip;
    if (!(await this.turnstile.verify(captchaToken, "login", ip))) {
      throw new BadRequestException("Doğrulama başarısız. Lütfen tekrar deneyin.");
    }
    // e-posta bazlı brute-force (IP limiti main.ts'te ayrı)
    const now = Date.now();
    const fl = this.failedLogins.get(email);
    if (fl && fl.resetAt > now && fl.count >= this.loginFailMax) {
      throw new ForbiddenException({ code: "TOO_MANY_ATTEMPTS", message: "Çok fazla başarısız deneme. Lütfen sonra tekrar deneyin." });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await argon2.verify("$argon2id$v=19$m=65536,t=3,p=4$ZmFrZS1zYWx0LWZvci10aW1pbmc$XXX", password).catch(() => false);
      this.registerFail(email, now);
      throw new UnauthorizedException("Geçersiz e-posta veya şifre.");
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      this.registerFail(email, now);
      throw new UnauthorizedException("Geçersiz e-posta veya şifre.");
    }
    if (!user.emailVerifiedAt) {
      // KABUL EDİLEN RİSK (spec §11): yalnız doğru şifrede döner. Otomatik resend YOK.
      throw new ForbiddenException({ code: "EMAIL_NOT_VERIFIED", message: "Lütfen önce e-posta adresinizi doğrulayın." });
    }
    this.failedLogins.delete(email);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokenPair(user, context);
  }

  private registerFail(email: string, now: number) {
    const fl = this.failedLogins.get(email);
    if (!fl || fl.resetAt <= now) this.failedLogins.set(email, { count: 1, resetAt: now + this.loginFailWindowMs });
    else fl.count += 1;
  }
```

- [ ] **Step 4: Test geçsin + Commit**

Run: `pnpm --filter @markala/api test -- auth.service` → PASS
```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): login — captcha-first, doğrulanmamışta 403, e-posta brute-force throttle"
```

### Task 12: AuthService.verifyEmail (TDD)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Failing test ekle**

```ts
describe("AuthService.verifyEmail", () => {
  const hashOf = (raw: string) => require("crypto").createHash("sha256").update(raw).digest("hex");

  it("geçerli token → emailVerifiedAt set, consume, {status:verified}", async () => {
    const d = makeDeps();
    d.prisma.emailVerificationToken.findUnique = vi.fn().mockResolvedValue({ id: "tk", userId: "u1", consumedAt: null, expiresAt: new Date(Date.now() + 1000), user: { id: "u1", emailVerifiedAt: null, deletedAt: null } });
    d.prisma.emailVerificationToken.update = vi.fn().mockResolvedValue({});
    d.prisma.user.update = vi.fn().mockResolvedValue({});
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.verifyEmail("rawtok");
    expect(res.status).toBe("verified");
    expect(d.prisma.user.update).toHaveBeenCalled();
  });

  it("zaten doğrulanmış kullanıcı → ALREADY_VERIFIED (mail/iş yok)", async () => {
    const d = makeDeps();
    d.prisma.emailVerificationToken.findUnique = vi.fn().mockResolvedValue({ id: "tk", userId: "u1", consumedAt: new Date(), expiresAt: new Date(Date.now() + 1000), user: { id: "u1", emailVerifiedAt: new Date(), deletedAt: null } });
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.verifyEmail("rawtok");
    expect(res.status).toBe("already_verified");
  });

  it("bulunamadı → INVALID_TOKEN (BadRequest)", async () => {
    const d = makeDeps();
    d.prisma.emailVerificationToken.findUnique = vi.fn().mockResolvedValue(null);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await expect(svc.verifyEmail("x")).rejects.toMatchObject({ response: expect.objectContaining({ code: "INVALID_TOKEN" }) });
  });

  it("süresi dolmuş + doğrulanmamış → TOKEN_EXPIRED", async () => {
    const d = makeDeps();
    d.prisma.emailVerificationToken.findUnique = vi.fn().mockResolvedValue({ id: "tk", userId: "u1", consumedAt: null, expiresAt: new Date(Date.now() - 1000), user: { id: "u1", emailVerifiedAt: null, deletedAt: null } });
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await expect(svc.verifyEmail("x")).rejects.toMatchObject({ response: expect.objectContaining({ code: "TOKEN_EXPIRED" }) });
  });
});
```

- [ ] **Step 2: Test fail görsün**

Run: `pnpm --filter @markala/api test -- auth.service` → FAIL (verifyEmail yok).

- [ ] **Step 3: verifyEmail'i ekle**

```ts
  async verifyEmail(rawToken: string) {
    if (!rawToken) throw new BadRequestException({ code: "INVALID_TOKEN", message: "Geçersiz bağlantı." });
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tok = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!tok || !tok.user || tok.user.deletedAt) {
      throw new BadRequestException({ code: "INVALID_TOKEN", message: "Geçersiz bağlantı." });
    }
    // zaten doğrulanmış (2x tıklama / önizleme botu) → başarı gibi
    if (tok.consumedAt || tok.user.emailVerifiedAt) {
      return { status: "already_verified" as const };
    }
    if (tok.expiresAt < new Date()) {
      throw new BadRequestException({ code: "TOKEN_EXPIRED", message: "Bağlantının süresi dolmuş. Yeni bağlantı isteyin." });
    }
    await this.prisma.user.update({ where: { id: tok.userId }, data: { emailVerifiedAt: new Date() } });
    await this.prisma.emailVerificationToken.update({ where: { id: tok.id }, data: { consumedAt: new Date() } });
    return { status: "verified" as const };
  }
```

- [ ] **Step 4: Test geçsin + Commit**

Run: `pnpm --filter @markala/api test -- auth.service` → PASS
```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): verifyEmail — invalid/expired/already-verified/verified ayrımı"
```

### Task 13: AuthService.resendVerification (TDD)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Failing test ekle**

```ts
describe("AuthService.resendVerification", () => {
  it("doğrulanmamış kullanıcı → resend, generic {ok:true}", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", emailVerifiedAt: null, deletedAt: null });
    d.prisma.emailVerificationToken.findFirst.mockResolvedValue(null);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.resendVerification("a@b.com");
    expect(res).toEqual({ ok: true });
    expect(d.mail.sendVerificationEmail).toHaveBeenCalled();
  });

  it("bilinmeyen e-posta → generic {ok:true}, mail YOK (enumeration)", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue(null);
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    const res = await svc.resendVerification("yok@b.com");
    expect(res).toEqual({ ok: true });
    expect(d.mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("zaten doğrulanmış → generic {ok:true}, mail YOK", async () => {
    const d = makeDeps();
    d.prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", emailVerifiedAt: new Date(), deletedAt: null });
    const svc = new AuthService(d.prisma, d.jwt as any, d.config as any, d.mail as any, d.turnstile as any);
    await svc.resendVerification("a@b.com");
    expect(d.mail.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test fail görsün** → Run: `pnpm --filter @markala/api test -- auth.service` → FAIL.

- [ ] **Step 3: resendVerification'ı ekle**

```ts
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // enumeration: her durumda generic cevap
    if (user && !user.emailVerifiedAt && !user.deletedAt) {
      await this.sendVerification(user.id, email); // cooldown + daily-cap içeride
    }
    return { ok: true as const };
  }
```

- [ ] **Step 4: Test geçsin + Commit**

Run: `pnpm --filter @markala/api test` (tümü) → PASS
```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): resendVerification — generic cevap + cooldown/daily-cap"
```

### Task 14: AuthModule bağımlılıkları

**Files:**
- Modify: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: MailModule + CaptchaModule import et**

`auth.module.ts` `imports` dizisine ekle:
```ts
import { MailModule } from "../mail/mail.module";
import { CaptchaModule } from "../captcha/captcha.module";
// imports: [ ...mevcut, MailModule, CaptchaModule ]
```

- [ ] **Step 2: app.module.ts'e modülleri ekle (gerekirse)**

`MailModule`/`CaptchaModule` AuthModule üzerinden geliyor; ayrıca global gerekmez. type-check ile doğrula.

- [ ] **Step 3: type-check + Commit**

Run: `pnpm --filter @markala/api type-check` → hata yok
```bash
git add apps/api/src/auth/auth.module.ts
git commit -m "feat(api): AuthModule → MailModule + CaptchaModule"
```

---

## Faz 6 — Auth controller

### Task 15: Controller — captcha akışı, IP, yeni endpoint'ler

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 1: register/login imza + IP kaynağı + yeni endpoint'ler**

`clientIp`'i `req.ip` tabanlı yap (trust proxy ayarlı):
```ts
  private clientIp(req: Request): string | undefined {
    return req.ip; // app.set('trust proxy', 1) → CF-Connecting-IP / Nginx real_ip
  }
```
`register` ve `login` handler'larını servisin yeni imzasına uyarla (captchaToken servise gider; register artık `{status,email}` döner, cookie yazılmaz):
```ts
  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, { userAgent: req.headers["user-agent"], ip: this.clientIp(req) });
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, dto.captchaToken, {
      userAgent: req.headers["user-agent"], ip: this.clientIp(req),
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return { accessToken: result.accessToken, user: result.user };
  }
```
Yeni endpoint'ler ekle:
```ts
  @Post("verify-email")
  async verifyEmail(@Body() body: { token: string }) {
    return this.auth.verifyEmail(body?.token ?? "");
  }

  @Post("resend-verification")
  async resend(@Body() body: { email: string; captchaToken: string }, @Req() req: Request) {
    // resend de captcha ister (bot mail-bombing)
    return this.auth.resendVerification((body?.email ?? "").toLowerCase().trim());
  }
```
(Not: resend captcha kontrolü için `TurnstileService`'i controller'a inject edip `verify(body.captchaToken,"login",ip)` çağırabilir veya basitlik için yalnız rate-limit + cooldown'a güvenilir. Karar: resend'e captcha doğrulaması ekle — controller'a `TurnstileService` inject et, geçersizse generic `{ok:true}` dön ki enumeration/bot bilgi almasın.)

- [ ] **Step 2: type-check + Commit**

Run: `pnpm --filter @markala/api type-check` → hata yok
```bash
git add apps/api/src/auth/auth.controller.ts
git commit -m "feat(api): controller — register token vermez, verify/resend endpoint'leri, req.ip"
```

---

## Faz 7 — Guest sipariş rate-limit

### Task 16: /orders/guest IP limiti

**Files:**
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Limit ekle**

`main.ts` rate-limit blokuna ekle:
```ts
app.use(rateLimit({ windowMs: 60 * 60_000, max: 10, path: "/orders/guest", method: "POST" }));
```
(Turnstile widget'ı guest checkout UI'sına bu iterasyonda eklenmez — spec §12.)

- [ ] **Step 2: type-check + Commit**

```bash
git add apps/api/src/main.ts
git commit -m "feat(api): guest sipariş IP rate-limit (10/saat)"
```

---

## Faz 8 — Frontend (web)

### Task 17: api-client güncellemeleri

**Files:**
- Modify: `packages/api-client/src/index.ts`

- [ ] **Step 1: auth bölümünü güncelle**

`auth` nesnesini değiştir:
```ts
  auth = {
    register: (data: { email: string; password: string; fullName: string; phone?: string; captchaToken: string; kvkkAccepted: boolean; marketingConsent?: boolean; consentVersion: string }) =>
      this.request<{ status: "verification_sent"; email: string }>("POST", "/auth/register", data),
    login: (data: { email: string; password: string; captchaToken: string }) =>
      this.request<{ accessToken: string; user: User }>("POST", "/auth/login", data),
    me: () => this.request<User>("GET", "/auth/me", undefined, { auth: true }),
    refresh: () => this.request<{ accessToken: string; user: User }>("POST", "/auth/refresh"),
    logout: () => this.request<{ ok: boolean }>("POST", "/auth/logout"),
    verifyEmail: (token: string) => this.request<{ status: "verified" | "already_verified" }>("POST", "/auth/verify-email", { token }),
    resendVerification: (email: string, captchaToken: string) => this.request<{ ok: boolean }>("POST", "/auth/resend-verification", { email, captchaToken }),
  };
```

- [ ] **Step 2: build/type-check + Commit**

Run: `pnpm --filter @markala/api-client type-check` (veya build)
```bash
git add packages/api-client/src/index.ts
git commit -m "feat(api-client): verify/resend/refresh/logout + captcha alanları"
```

### Task 18: auth-store mock→gerçek + bootstrap

**Files:**
- Modify: `apps/web/src/lib/auth-store.ts`

- [ ] **Step 1: Store'u yeniden yaz**

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@markala/types";
import { createMarkalaClient } from "@markala/api-client";

type Status = "idle" | "bootstrapping" | "authenticated" | "anonymous";

interface AuthState {
  user: User | null;
  accessToken: string | null; // BELLEKTE — persist edilmez
  status: Status;
  isLoading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string, captchaToken: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  register: (input: { email: string; password: string; fullName: string; phone?: string; marketingConsent?: boolean; kvkkAccepted: boolean; consentVersion: string; captchaToken: string }) => Promise<{ ok: boolean; status?: string; error?: string }>;
  verifyEmail: (token: string) => Promise<{ ok: boolean; status?: string; code?: string }>;
  resendVerification: (email: string, captchaToken: string) => Promise<{ ok: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
}

const api = createMarkalaClient({ getToken: () => useAuthStore.getState().accessToken });

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: "idle",
      isLoading: false,

      bootstrap: async () => {
        set({ status: "bootstrapping" });
        try {
          const { accessToken } = await api.auth.refresh();
          const user = await api.auth.me();
          set({ accessToken, user, status: "authenticated" });
        } catch {
          set({ accessToken: null, user: null, status: "anonymous" });
        }
      },

      login: async (email, password, captchaToken) => {
        set({ isLoading: true });
        try {
          const { accessToken } = await api.auth.login({ email, password, captchaToken });
          set({ accessToken });
          const user = await api.auth.me();
          set({ user, status: "authenticated", isLoading: false });
          return { ok: true };
        } catch (e: any) {
          set({ isLoading: false });
          return { ok: false, error: e?.message ?? "Giriş başarısız.", code: e?.code };
        }
      },

      register: async (input) => {
        set({ isLoading: true });
        try {
          const res = await api.auth.register(input);
          set({ isLoading: false });
          return { ok: true, status: res.status };
        } catch (e: any) {
          set({ isLoading: false });
          return { ok: false, error: e?.message ?? "Kayıt başarısız." };
        }
      },

      verifyEmail: async (token) => {
        try {
          const res = await api.auth.verifyEmail(token);
          return { ok: true, status: res.status };
        } catch (e: any) {
          return { ok: false, code: e?.code, status: e?.details?.code };
        }
      },

      resendVerification: async (email, captchaToken) => {
        try { return await api.auth.resendVerification(email, captchaToken); }
        catch { return { ok: true }; } // generic
      },

      logout: async () => {
        try { await api.auth.logout(); } catch { /* devam */ }
        set({ user: null, accessToken: null, status: "anonymous" });
      },

      updateProfile: (patch) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ...patch } });
      },
    }),
    {
      name: "markala-auth",
      version: 2, // mock v1 → v2
      partialize: (s) => ({ user: s.user }),
      migrate: (_persisted, version) => {
        // mock dönemi (v<2) persist'i ve eski consent anahtarını temizle (hayalet oturum)
        if (version < 2 && typeof window !== "undefined") {
          try { window.localStorage.removeItem("markala-marketing-consent"); } catch {}
        }
        return { user: null } as any;
      },
    },
  ),
);
```

- [ ] **Step 2: type-check + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/lib/auth-store.ts
git commit -m "feat(web): auth-store gerçek backend + bootstrap + persist v2 migrate"
```

### Task 19: AuthBootstrap + layout

**Files:**
- Create: `apps/web/src/components/auth-bootstrap.tsx`
- Modify: `apps/web/src/app/layout.tsx` (provider/komponenti mount et)

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// apps/web/src/components/auth-bootstrap.tsx
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function AuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return; // Strict-Mode çift-çağrı guard
    ran.current = true;
    void bootstrap();
  }, [bootstrap]);
  return null;
}
```

- [ ] **Step 2: layout'a ekle**

`apps/web/src/app/layout.tsx` içinde `<body>` başına `<AuthBootstrap />` mount et (import ederek).

- [ ] **Step 3: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/components/auth-bootstrap.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): AuthBootstrap — açılışta /auth/refresh ile oturum geri yükleme"
```

### Task 20: Turnstile bileşeni

**Files:**
- Create: `apps/web/src/components/turnstile.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// apps/web/src/components/turnstile.tsx
"use client";
import { useEffect, useRef, useState } from "react";

declare global { interface Window { turnstile?: any } }

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function Turnstile({ action, onToken }: { action: "register" | "login"; onToken: (t: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) { onToken("dev-bypass"); return; } // dev: key yoksa akış kilitlenmesin
    if (!document.querySelector(`script[src="${SCRIPT}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT; s.async = true; s.defer = true;
      s.onload = () => setReady(true);
      document.head.appendChild(s);
    } else { setReady(true); }
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!ready || !siteKey || !ref.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      action,
      callback: (t: string) => onToken(t),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });
    return () => { if (widgetId.current) window.turnstile.remove(widgetId.current); };
  }, [ready, siteKey, action, onToken]);

  // Hata sonrası dışarıdan reset için global expose edilebilir; basitçe widget yeniden çizilir.
  if (!siteKey) return null;
  return <div ref={ref} className="my-2" />;
}
```

- [ ] **Step 2: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/components/turnstile.tsx
git commit -m "feat(web): Turnstile bileşeni (dev-bypass + expired/error reset)"
```

### Task 21: kayit/page.tsx

**Files:**
- Modify: `apps/web/src/app/kayit/page.tsx`

- [ ] **Step 1: Captcha + şifre kuralı + başarı ekranı + yeni alanlar**

Değişiklikler:
- `import { Turnstile } from "@/components/turnstile";` + `import { LEGAL_VERSION } from "@markala/mock-data";`
- state: `const [captchaToken, setCaptchaToken] = useState<string | null>(null);` + `const [sent, setSent] = useState(false);`
- Şifre input'u `minLength={6}` → `minLength={8}` + placeholder "En az 8 karakter, büyük/küçük harf ve rakam".
- KVKK checkbox metnini "KVKK Aydınlatma Metni'ni **okudum**" (rıza ifadesi yok) olarak güncelle.
- Form sonuna (submit'ten önce) `<Turnstile action="register" onToken={setCaptchaToken} />`.
- `onSubmit`'te captcha kontrolü + yeni payload:
```ts
    if (!captchaToken) { setError("Lütfen güvenlik doğrulamasını tamamlayın."); return; }
    const res = await register({ email, password, fullName, phone, marketingConsent: marketingOptIn, kvkkAccepted, consentVersion: LEGAL_VERSION, captchaToken });
    if (res.ok) setSent(true);
    else setError(res.error ?? "Kayıt başarısız.");
```
- `sent === true` ise formu gizleyip "Mailini kontrol et" ekranı göster + "Tekrar gönder" butonu (`resendVerification(email, captchaToken)`; yeni captcha gerekir → reset).

- [ ] **Step 2: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/app/kayit/page.tsx
git commit -m "feat(web): kayıt — Turnstile, şifre 8+, KVKK metni, mail-gönderildi ekranı"
```

### Task 22: giris/page.tsx

**Files:**
- Modify: `apps/web/src/app/giris/page.tsx` (mevcut içeriği oku, gerçek login'e bağla)

- [ ] **Step 1: Gerçek login + captcha + EMAIL_NOT_VERIFIED**

- `Turnstile action="login"` ekle; `captchaToken` state.
- `login(email, password, captchaToken)` çağır.
- Hata `code === "EMAIL_NOT_VERIFIED"` ise: "E-postanız doğrulanmamış" uyarısı + "Doğrulama mailini tekrar gönder" butonu (`resendVerification`).
- Başarıda `/hesabim`'a yönlendir.

- [ ] **Step 2: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/app/giris/page.tsx
git commit -m "feat(web): giriş — gerçek backend, Turnstile, doğrulanmamış uyarısı+resend"
```

### Task 23: eposta-dogrula sayfası

**Files:**
- Create: `apps/web/src/app/eposta-dogrula/page.tsx`

- [ ] **Step 1: Sayfayı oluştur**

```tsx
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Button } from "@markala/ui";
import { useAuthStore } from "@/lib/auth-store";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const [state, setState] = useState<"loading" | "ok" | "expired" | "invalid">("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // Strict-Mode + tek-kullanımlık token guard
    ran.current = true;
    const token = params.get("token") ?? "";
    router.replace("/eposta-dogrula"); // token'ı URL'den temizle
    verifyEmail(token).then((res) => {
      if (res.ok && (res.status === "verified" || res.status === "already_verified")) setState("ok");
      else if (res.status === "TOKEN_EXPIRED" || res.code === "TOKEN_EXPIRED") setState("expired");
      else setState("invalid");
    });
  }, [params, router, verifyEmail]);

  return (
    <Container className="py-24 max-w-md text-center">
      <meta name="referrer" content="no-referrer" />
      {state === "loading" && <p>Doğrulanıyor…</p>}
      {state === "ok" && (<>
        <h1 className="text-2xl font-semibold">Hesabınız aktif ✅</h1>
        <p className="mt-3 text-ink-700">Artık giriş yapabilirsiniz.</p>
        <Button className="mt-6" onClick={() => router.replace("/giris")}>Giriş yap</Button>
      </>)}
      {state === "expired" && (<>
        <h1 className="text-2xl font-semibold">Bağlantı süresi dolmuş</h1>
        <p className="mt-3 text-ink-700">Giriş ekranından yeni doğrulama bağlantısı isteyebilirsiniz.</p>
        <Button className="mt-6" onClick={() => router.replace("/giris")}>Giriş ekranına git</Button>
      </>)}
      {state === "invalid" && (<>
        <h1 className="text-2xl font-semibold">Geçersiz bağlantı</h1>
        <p className="mt-3 text-ink-700">Bağlantı hatalı görünüyor.</p>
        <Button className="mt-6" onClick={() => router.replace("/giris")}>Giriş ekranına git</Button>
      </>)}
    </Container>
  );
}

export default function Page() {
  return <Suspense fallback={null}><VerifyInner /></Suspense>;
}
```

- [ ] **Step 2: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/app/eposta-dogrula/page.tsx
git commit -m "feat(web): /eposta-dogrula — Suspense + tek-kullanım guard + URL temizleme"
```

### Task 24: Korumalı sayfa guard'ları status'e bağla

**Files:**
- Modify: `apps/web/src/app/hesabim/**` (oturum guard'ı olan sayfalar)

- [ ] **Step 1: Guard'ları güncelle**

`useAuthStore` kullanan korumalı sayfalarda `user` yerine `status`'e bak: `status === "bootstrapping"` → iskelet/yükleniyor; `status === "anonymous"` → `/giris`'e redirect; `authenticated` → içerik. (Grep: `useAuthStore` ile kullanan korumalı route'ları bul.)

Run: `pnpm --filter @markala/web exec grep -rl "useAuthStore" src/app/hesabim || true`

- [ ] **Step 2: build + Commit**

Run: `pnpm --filter @markala/web type-check`
```bash
git add apps/web/src/app/hesabim
git commit -m "feat(web): korumalı sayfa guard'ları bootstrap status'üne bağlandı"
```

---

## Faz 9 — Legal + Infra + Env

### Task 25: KVKK aydınlatma metni güncellemesi

**Files:**
- Modify: `packages/mock-data/src/legal.ts`

- [ ] **Step 1: Üçüncü-taraf aktarım listesini güncelle**

KVKK metnindeki yurtdışı/üçüncü-taraf aktarım bölümüne ekle: **Cloudflare Turnstile** (bot koruması; IP + tarayıcı sinyali; ABD/AB) ve **SMTP e-posta sağlayıcısı (mail.324ajans.com)**. SendGrid ibaresini gerçek duruma göre düzelt/çıkar. `lastUpdated` ve `LEGAL_VERSION` (Task 8) tutarlı güncellensin.

- [ ] **Step 2: build + Commit**

```bash
git add packages/mock-data/src/legal.ts
git commit -m "docs(legal): KVKK metni — Turnstile + SMTP aktarımı eklendi"
```

### Task 26: docker-compose.production.yml env

**Files:**
- Modify: `docker-compose.production.yml`

- [ ] **Step 1: api + web environment'a anahtarları ekle**

`api` servisi `environment` bloğuna:
```yaml
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_SECURE: ${SMTP_SECURE}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      MAIL_FROM: ${MAIL_FROM}
      TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY}
```
`web` servisi `environment` bloğuna:
```yaml
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.production.yml
git commit -m "feat(deploy): compose'a SMTP + Turnstile env'leri"
```

### Task 27: Nginx auth-zone (user host'ları)

**Files:**
- Modify: `scripts/esxi/.../markala.conf` veya `nginx.conf` (gerçek yol Step 1'de grep ile bulunur)

- [ ] **Step 1: Konumu bul**

Run: `pnpm exec grep -rl "zone=auth" . 2>/dev/null || true` (veya repo'da `markala.conf` ara).

- [ ] **Step 2: User host bloklarına location ekle**

Hem `markala.com.tr` hem `api.markala.com.tr` server bloğuna:
```nginx
location ~ ^/api/auth/(login|register|resend-verification)$ {
    limit_req zone=auth burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://api_upstream;   # mevcut upstream adıyla hizala
    include /etc/nginx/proxy_params;  # mevcut proxy header set'iyle hizala
}
location = /api/auth/verify-email {
    limit_req zone=auth burst=10 nodelay;
    proxy_pass http://api_upstream;
}
```
(Mevcut `proxy_pass`/header düzenini birebir kopyala — yalnız `limit_req` eklenir.)

- [ ] **Step 3: Commit**

```bash
git add scripts/esxi
git commit -m "feat(nginx): /api/auth/* için auth-zone rate-limit (user host'ları)"
```

### Task 28: .env.example güncellemeleri + .env.local oluştur

**Files:**
- Modify: `apps/api/.env.example`, `.env.production.example`, `apps/web/.env.example`
- Create (gitignore — commit edilmez): `apps/api/.env.local`, `apps/web/.env.local`

- [ ] **Step 1: apps/api/.env.example'a ekle**

```bash
# === Mail (SMTP) ===
SMTP_HOST=localhost          # dev: MailHog · prod: mail.324ajans.com
SMTP_PORT=1025               # dev: 1025 · prod: 465
SMTP_SECURE=false            # prod: true
SMTP_USER=                   # prod: markala@324ajans.com
SMTP_PASS=
MAIL_FROM=Markala <markala@324ajans.com>

# === Cloudflare Turnstile ===
# Dev test (her zaman geç): secret 1x0000000000000000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

- [ ] **Step 2: .env.production.example'ı hizala**

`SENDGRID_FROM_EMAIL` çelişkisini gider; gerçek prod değerleri için SMTP_* + TURNSTILE_SECRET_KEY placeholder'ları ekle (gönderen `markala@324ajans.com`).

- [ ] **Step 3: apps/web/.env.example'a ekle**

```bash
# Cloudflare Turnstile (dev test site key — her zaman geç)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

- [ ] **Step 4: Yerel .env.local dosyalarını oluştur (commit YOK)**

`apps/api/.env.local` (dev → MailHog) ve `apps/web/.env.local` (dev test site key) spec §9'daki dev değerleriyle. **Prod şifresi yalnız sunucudaki `.env.production`'a elle girilir.**

- [ ] **Step 5: Commit (yalnız .example'lar)**

```bash
git add apps/api/.env.example .env.production.example apps/web/.env.example
git commit -m "docs(env): SMTP + Turnstile örnekleri (dev test key'leri)"
```

---

## Faz 10 — Doğrulama

### Task 29: Tam doğrulama + manuel e2e

- [ ] **Step 1: Tüm backend testleri**

Run: `pnpm --filter @markala/api test`
Expected: TurnstileService(4) + MailService(2) + rate-limit(2) + AuthService(register/login/verify/resend ~13) PASS.

- [ ] **Step 2: type-check + build (api + web)**

Run: `pnpm --filter @markala/api type-check && pnpm --filter @markala/web type-check`
Run: `pnpm --filter @markala/api build && pnpm --filter @markala/web build`
Expected: hata yok.

- [ ] **Step 3: Servisleri başlat (dev)**

Run: `docker compose up -d postgres mailhog` (Postgres + MailHog)
Run: `pnpm --filter @markala/api dev` ve ayrı terminalde `pnpm --filter @markala/web dev`

- [ ] **Step 4: Manuel e2e checklist**

1. `/kayit` → form doldur (şifre 8+), Turnstile (dev bypass), gönder → "Mailini kontrol et" ekranı.
2. MailHog UI (`http://localhost:8025`) → doğrulama maili geldi mi, link doğru mu.
3. Link → `/eposta-dogrula` → "Hesabınız aktif" → `/giris`.
4. `/giris` → doğru şifre → `/hesabim` (profilde fullName görünür).
5. Doğrulanmamış 2. hesapla giriş → "doğrulanmamış" uyarısı + resend.
6. Aynı maille tekrar kayıt (doğrulanmamış) → kilitlenmez, yeni mail.
7. Bozuk/expired token ile `/eposta-dogrula` → doğru mesaj (mail döngüsü yok).
8. Backfill: migration sonrası eski kullanıcı (varsa) giriş yapabiliyor.
9. Rate-limit: `/api/auth/login`'e 6 hızlı POST → 6.'da 429 `RATE_LIMITED`.

- [ ] **Step 5: Branch'i bitir**

Çalışan branch: `feat/kayit-guvenligi-mail-captcha`. PR aç (superpowers:finishing-a-development-branch ile) veya merge — Hasan'a sor.

---

## Self-review notları (planı yazan için)
- **Spec kapsamı:** §2 backfill→Task 2; §3.1 mail→Task 5; §3.2 captcha→Task 3-4; §3.3 DTO→Task 9; §3.4 register/login/verify/resend→Task 10-13; §3.5 limiter/Throttler/IP→Task 6-7,15; §4 frontend→Task 17-24; §5 rate tablo→Task 6,15,16,27; §6 nginx→Task 27; §7 KVKK→Task 8,10,25; §8 mail/sender→Task 5,28; §9 env→Task 26,28; §10 test→her task + Task 29. Tümü kapsanıyor.
- **Tip tutarlılığı:** `verify(token, action, ip)`, `register(input{...captchaToken,kvkkAccepted,consentVersion}, ctx)`, `login(email,password,captchaToken,ctx)`, `verifyEmail` dönüşleri {status:"verified"|"already_verified"} / hata code'ları INVALID_TOKEN|TOKEN_EXPIRED, store status union'ı — tüm task'larda aynı.
- **Açık nokta (Task 24):** `apps/web/src/app/hesabim` altındaki guard'lı sayfaların kesin listesi uygulama anında grep ile bulunur; pattern aynı.
