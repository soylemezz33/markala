# Kayıt Güvenliği — Mail Doğrulama + Cloudflare Turnstile + Gerçek Auth

> Tasarım dokümanı · 2026-06-13 · Markala (markala.com.tr)
> Durum: onay bekliyor → onaylanınca implementasyon planı (writing-plans)

## 1. Problem & Kapsam

### Mevcut durum (denetim bulgusu)
| Katman | Durum |
|---|---|
| Backend `/api/auth/register` | ✅ Sağlam: argon2, rate limit (3/saat), user-enumeration koruması, şifre complexity |
| Web frontend kayıt/giriş | ❌ **Tamamen mock** — `apps/web/src/lib/auth-store.ts` backend'e hiç gitmez, `setTimeout` ile sahte user üretir |
| Mail doğrulama | ❌ Yok — `User.emailVerifiedAt` kolonu var ama hiç set/kontrol edilmez |
| Mail gönderimi | ❌ Stub — `apps/api/src/integrations/sendgrid/sendgrid.service.ts` sadece log atar |
| Captcha | ❌ Hiçbir yerde yok |
| Şifre kuralı | ⚠️ Çelişki — frontend `minLength=6`, backend 8 + complexity |

### Hedef
Kullanıcı **üye olurken** gerçek bir güvenli akıştan geçsin:
1. Cloudflare Turnstile captcha (kayıt **ve** giriş).
2. Mail doğrulaması — kayıt sonrası doğrulama maili; hesap doğrulanmadan **giriş yapılamaz**.
3. Frontend mock auth'u kaldırılıp gerçek NestJS backend'e bağlanır (aksi halde yukarıdakiler gerçek kullanıcı için çalışmaz).
4. KVKK rıza kayıtları (`ConsentLog`) ve şifre kuralı tutarlılığı.

### Alınan kararlar
- **Captcha sağlayıcı:** Cloudflare Turnstile (site zaten Cloudflare'de; ücretsiz, KVKK dostu).
- **Doğrulama gücü:** Kayıtta mail doğrulama → doğrulanmadan giriş engellenir (`403 EMAIL_NOT_VERIFIED`).
- **Captcha kapsamı:** Kayıt + Giriş.
- **Doğrulama sonrası:** Giriş sayfasına yönlendir ("Hesabınız aktif, giriş yapın"). Verify endpoint token vermez; oturumu login açar.
- **SMTP:** `mail.324ajans.com:465 SSL`, gönderen `markala@324ajans.com`.
- **Kapsam:** Tam gerçek auth (frontend mock → backend).

## 2. Veri Modeli (Prisma)

Yeni tablo — raw token DB'de **tutulmaz**, yalnızca SHA-256 hash:

```prisma
model EmailVerificationToken {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  tokenHash  String    @unique @map("token_hash") // sha256(rawToken)
  expiresAt  DateTime  @map("expires_at")          // createdAt + 24s
  consumedAt DateTime? @map("consumed_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("email_verification_tokens")
}
```

`User` modeline ilişki eklenir: `emailVerificationTokens EmailVerificationToken[]`.
`User.emailVerifiedAt` zaten mevcut — artık gerçekten kullanılır.

Migration adı: `email_verification_tokens`.

## 3. Backend (NestJS)

### 3.1 MailService — yeni `apps/api/src/mail/` modülü
- `nodemailer` ile gerçek SMTP gönderimi (yeni bağımlılık: `nodemailer` + `@types/nodemailer`).
- Konfig env'den: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
- Metot: `sendVerificationEmail(to, verifyUrl)` — sade HTML + plain-text şablon (TR).
- Konfig eksikse: dev'de uyarı + log'a düşer (mevcut stub davranışına benzer fail-soft); prod'da `MAIL_*` zorunlu.
- Mevcut `SendgridService` stub'ı bozulmaz; yeni akış MailService kullanır.

### 3.2 TurnstileService — yeni `apps/api/src/captcha/` modülü
- `verify(token: string, ip?: string): Promise<boolean>` — `https://challenges.cloudflare.com/turnstile/v0/siteverify`'a POST (`secret`, `response`, `remoteip`).
- `TURNSTILE_SECRET_KEY` env'den. Dev'de Cloudflare "her zaman geç" test secret'ı (`1x0000000000000000000000000000000AA`).
- Modül `exports: [TurnstileService]` → AuthModule import eder.

### 3.3 DTO değişiklikleri
**RegisterDto** (`apps/api/src/auth/dtos/register.dto.ts`):
- `+ captchaToken: string` (`@IsString @IsNotEmpty`)
- `+ kvkkAccepted: boolean` (`@IsBoolean` + `@Equals(true)` — onaysız kayıt reddedilir)
- `+ marketingConsent?: boolean` (`@IsOptional @IsBoolean`)

**LoginDto**: `+ captchaToken: string` (zorunlu).

### 3.4 AuthService akış değişiklikleri
| Metot | Yeni davranış |
|---|---|
| `register` | (1) captcha doğrula, geçersizse `BadRequestException`. (2) Mevcut kullanıcı → generic fail (enumeration korunur). (3) user oluştur `emailVerifiedAt=null`. (4) **ConsentLog yaz**: `kvkk granted=true` + `marketing granted=marketingConsent`, IP/UA/version ile; `user.marketingConsent*` alanlarını set et. (5) verification token üret + maille. (6) **token VERMEZ** → `{ status: "verification_sent", email }`. |
| `login` | Şifre doğrulandıktan sonra `emailVerifiedAt == null` ise `ForbiddenException` (`code: "EMAIL_NOT_VERIFIED"`) — token verilmez. Captcha controller'da doğrulanır. |
| `verifyEmail(rawToken)` | Hash'le → token bul → consumed/expired kontrol → `emailVerifiedAt=now`, token'ı tüket. **Oturum açmaz**, `{ ok: true }` döner. |
| `resendVerification(email)` | Her zaman generic `{ ok: true }`. Kullanıcı varsa & doğrulanmamışsa: eski tokenları consume et, yeni üret + maille. |

### 3.5 Controller (`apps/api/src/auth/auth.controller.ts`)
- `POST /auth/register` — `@Throttle 3/saat`, captcha service ile doğrulanır (IP geçilir).
- `POST /auth/login` — `@Throttle 5/dk`, captcha doğrulanır.
- `POST /auth/verify-email` `{ token }` — `@Throttle` (örn. 10/dk).
- `POST /auth/resend-verification` `{ email, captchaToken }` — `@Throttle 3/saat`.
- `refresh` / `logout` / `me` değişmez.
- `main.ts` in-memory rate limiter'a `/auth/resend-verification` eklenir.

## 4. Frontend (Next.js — apps/web)

### 4.1 api-client (`packages/api-client/src/index.ts`)
- `auth.register` artık `{ status, email }` döner (token yok).
- `+ auth.verifyEmail(token)`, `+ auth.resendVerification(email, captchaToken)`.
- `login`/`register` body'sine `captchaToken` eklenir.

### 4.2 auth-store (`apps/web/src/lib/auth-store.ts`) — mock kaldırılır
- Gerçek api-client çağrıları.
- Access token **bellekte** (zustand state, localStorage'a yazılmaz — XSS yüzeyini düşürür); yalnızca `user` persist edilir.
- Açılışta `/auth/refresh` (httpOnly cookie) ile oturum geri yükleme.
- `register` → `{ ok, status }` (auto-login yok). `login` → `EMAIL_NOT_VERIFIED` kodunu yüzeye çıkarır. `verifyEmail`, `resendVerification` eklenir. `logout` → `/auth/logout` çağırır.

### 4.3 Sayfalar
| Dosya | Değişiklik |
|---|---|
| `apps/web/src/app/kayit/page.tsx` | Turnstile widget; şifre `minLength 6→8` + complexity ipucu; başarıda "Mailini kontrol et" ekranı + "tekrar gönder" butonu; `captchaToken`+`kvkkAccepted`+`marketingConsent` gönderir. |
| `apps/web/src/app/giris/page.tsx` | Gerçek login; Turnstile widget; `EMAIL_NOT_VERIFIED` → uyarı + tekrar gönder. |
| **Yeni** `apps/web/src/app/eposta-dogrula/page.tsx` | `?token=` okur → `verifyEmail` → başarıda `/giris`'e "Hesabınız aktif, giriş yapın" mesajıyla yönlendirir; hata durumunda tekrar gönder seçeneği. |
| **Yeni** `apps/web/src/components/turnstile.tsx` | Turnstile script yükleyici + render wrapper; `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. |

## 5. Sırlar & Env (gitignore'da — koda yazılmaz)

`apps/api/.env.local`:
```
SMTP_HOST=mail.324ajans.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=markala@324ajans.com
SMTP_PASS=********              # Hasan'ın verdiği şifre — yalnızca burada
MAIL_FROM=Markala <markala@324ajans.com>
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA   # dev test; prod'da gerçek
```
`apps/web/.env.local`:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA      # dev test; prod'da gerçek
NEXT_PUBLIC_API_URL=http://localhost:4000                     # zaten var
```
`apps/api/.env.example` ve `apps/web/.env.example` placeholder (sırsız) ile güncellenir.

## 6. Güvenlik notları
- Verification token: `crypto.randomBytes(32).base64url`, DB'de yalnızca SHA-256 hash; süre 24 saat; tek kullanımlık (`consumedAt`).
- `resendVerification` ve `register` user-enumeration sızdırmaz (generic cevap).
- Captcha hem register hem login'de zorunlu; başarısız doğrulama 400.
- Login: doğrulanmamış hesaba token verilmez.
- KVKK: rıza `ConsentLog`'a IP/UA/zaman damgası ile yazılır (ispat yükümlülüğü).
- Mail gönderen domain (324ajans.com) ile SMTP auth eşleşir; teslimat için SPF/DKIM önerisi (prod notu).

## 7. Test
- **Unit:** `TurnstileService.verify` (fetch mock — geç/kal), `MailService` (transporter mock), `AuthService.register` (unverified + token üretimi + token dönmemesi), `verifyEmail` (geçerli/expired/consumed), `login` doğrulanmamışta 403.
- **Manuel e2e checklist:** kayıt → MailHog/gerçek inbox → link → `/giris` → giriş → `/hesabim`; bozuk captcha → 400; doğrulanmamış giriş → uyarı + resend.

## 8. Hasan'ın sağlaması gerekenler (prod)
- **Cloudflare Turnstile** site + secret key (dash.cloudflare.com → Turnstile → widget). Dev'de test anahtarları kullanılır.
- SMTP şifresi güncel (verildi → `.env.local`).
- Postgres ayakta + migrate edilmiş (bkz. pending setup).

## 9. Kapsam dışı (YAGNI)
- Şifre sıfırlama akışı (ayrı iş; token modeli ileride genişletilebilir).
- 2FA (kolonlar mevcut, bu işte ele alınmaz).
- Newsletter/iletişim formlarına captcha (gerekirse ayrı).
