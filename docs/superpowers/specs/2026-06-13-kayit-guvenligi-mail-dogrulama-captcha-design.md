# Kayıt Güvenliği — Mail Doğrulama + Cloudflare Turnstile + Gerçek Auth (v2)

> Tasarım dokümanı · 2026-06-13 · Markala (markala.com.tr)
> v2: 6-mercekli adversarial inceleme (51 ham → 28 bulgu) sonrası sertleştirildi.
> Durum: onaylı → implementasyon planı (writing-plans) çıkarılacak.

## 1. Problem & Kapsam

### Mevcut durum (denetim bulgusu — kodla doğrulandı)
| Katman | Durum |
|---|---|
| Web frontend kayıt/giriş | ❌ **Tamamen mock** — `apps/web/src/lib/auth-store.ts` backend'e hiç gitmez, `setTimeout` ile sahte user üretir |
| Mail doğrulama | ❌ Yok — `User.emailVerifiedAt` kolonu var ama hiç set/kontrol edilmez (→ DB'deki TÜM mevcut kullanıcılarda null) |
| Mail gönderimi | ❌ Stub — `sendgrid.service.ts` sadece log atar |
| Captcha | ❌ Hiçbir yerde yok |
| **Rate limit** | ⚠️ **`@Throttle` dekoratörleri + `ThrottlerModule.forRoot` var AMA `ThrottlerGuard`/`APP_GUARD` register edilmemiş → ÖLÜ KOD.** Tek gerçekten aktif limit: `main.ts:73-74` in-memory limiter (login 5/dk + register 3/saat). |
| Şifre kuralı | ⚠️ Çelişki — frontend `minLength=6`, backend 8 + complexity |

### Hedef
Kullanıcı **üye olurken** gerçek, çalışan bir güvenli akıştan geçsin: Turnstile captcha (kayıt+giriş), mail doğrulaması (doğrulanmadan giriş yok), frontend mock→backend bağlama, gerçek çalışan rate-limit, KVKK uyumu.

### Alınan kararlar (kesin)
1. **Captcha:** Cloudflare Turnstile, kayıt **ve** giriş. Fail-**closed**. action+hostname doğrulanır.
2. **Doğrulama gücü:** Kayıtta mail doğrulama → doğrulanmadan giriş engellenir.
3. **Doğrulama sonrası:** verify endpoint oturum açmaz; `/giris`'e "Hesabınız aktif, giriş yapın" mesajıyla yönlendirir.
4. **SMTP:** `mail.324ajans.com:465 SSL`, gönderen `markala@324ajans.com` (prod). Dev: MailHog `localhost:1025`.
5. **Rate limit mekanizması:** **ThrottlerModule tamamen kaldırılır.** TÜM auth limitleri tek mekanizmaya — `main.ts` in-memory limiter'a — toplanır; e-posta-bazlı boyut + kenar katmanı (Nginx auth-zone + Cloudflare Rate Limiting) eklenir. (Bkz. §5.)
6. **Kapsam:** Tam gerçek auth (frontend mock → backend). `apps/admin` ayrı env-tabanlı auth kullanır, **bu işten etkilenmez**.

## 2. Veri Modeli (Prisma) + Migration

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
`User`'a `emailVerificationTokens EmailVerificationToken[]` ilişkisi eklenir.

**Migration `email_verification_tokens` İÇİNDE backfill (KRİTİK):**
```sql
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;
```
Mock auth döneminde kaydolanlar zaten doğrulama yapmamıştı; mevcut güven havuzu kabul edilir. Aksi halde deploy anında her eski hesap `403 EMAIL_NOT_VERIFIED` ile kilitlenir.

## 3. Backend (NestJS)

### 3.1 MailService — yeni `apps/api/src/mail/` modülü
- `nodemailer` (yeni bağımlılık: `nodemailer` + `@types/nodemailer`).
- Env: `SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS/MAIL_FROM`.
- `connectionTimeout / greetingTimeout / socketTimeout = 10sn` (zorunlu — register'ı bloke etmemek için).
- `sendVerificationEmail(to, verifyUrl): Promise<boolean>` — **hata FIRLATMAZ**; başarısızlıkta log + `false` döner.
- Her denemede **NotificationLog** yazar: `channel=email, template=email-verification, recipient, status=sent|failed, metadata={messageId|error}` (deliverability teşhisi + resend kötüye-kullanım görünürlüğü).
- `SMTP_SECURE=false` (dev/MailHog) iken auth gönderilmez. Yalnızca **işlemsel** mail; pazarlama maili göndermez.
- HTML + plain-text TR şablon; footer: "Markala — 324 Ajans BT tarafından gönderilmiştir" + işlemsel ileti ibaresi.

### 3.2 TurnstileService — yeni `apps/api/src/captcha/` modülü
- `verify(token: string, expectedAction: 'register'|'login', ip?: string): Promise<boolean>`.
- `fetch` 5sn **AbortController** timeout.
- **FAIL-CLOSED:** ağ hatası/timeout/non-200/parse hatası → `false`. Hata yutulmaz, loglanır.
- `true` koşulu: HTTP 200 **ve** `success===true` **ve** yanıt `action===expectedAction` **ve** `hostname` whitelist'te (`markala.com.tr`, dev'de `localhost`).
- **Dev fail-open:** `NODE_ENV!=production` ve `TURNSTILE_SECRET_KEY` yok → `true` (yalnız dev). Prod'da secret yoksa boot uyarısı.
- Modül `exports: [TurnstileService]`; AuthModule import eder.

### 3.3 DTO değişiklikleri
**RegisterDto** (`register.dto.ts`):
- `+ captchaToken: string` (`@IsString @IsNotEmpty`)
- `+ kvkkAccepted: boolean` — `@IsBoolean` + `@Equals(true)`. **NOT: "Aydınlatma metnini okudum" teyidi, açık rıza DEĞİL** (sözleşmesel işleme KVKK m.5/2-c'ye dayanır; zorunlu hizmeti rızaya bağlamak rızayı geçersiz kılar).
- `+ marketingConsent?: boolean` (`@IsOptional @IsBoolean`) — **tek açık rıza alanı budur.**
- `+ consentVersion: string` — yasal metin sürümü (kaynak: §8'de tanımlanacak tek sabit).

**LoginDto:** `+ captchaToken: string` (zorunlu).

### 3.4 AuthService akışı

**Zorunlu istek sırası (her auth endpoint):**
`(1) IP rate-limit → (2) DTO validation → (3) captcha verify (geçersiz → 400, hiçbir DB/argon2 işlemi YOK) → (4) iş mantığı (findUnique/argon2)`.
Captcha, `findUnique`+`argon2` çağrılarından **kesin önce** (argon2 DoS koruması).

| Metot | Davranış |
|---|---|
| `register` | (1) captcha verify, geçersiz→400. (2) `existing && emailVerifiedAt!=null` → generic fail (enumeration). (3) **`existing && emailVerifiedAt==null` → yeni user OLUŞTURMA; sessizce resend mantığı (eski token consume + yeni token + mail) + aynı `{status:verification_sent, email}` dön** (kullanıcı kilitlenmez). (4) yeni → user oluştur (`emailVerifiedAt=null`). (5) **ConsentLog**: `kvkk` = okudum teyidi (granted=true), `marketing` = açık rıza (granted=marketingConsent); IP/UA/`version=consentVersion`. (6) token üret + maille. (7) **token VERMEZ** → `{status:"verification_sent", email}`. |
| `login` | captcha→password. Şifre doğru ve `emailVerifiedAt==null` → `403 EMAIL_NOT_VERIFIED`. **Otomatik resend YOK** (kullanıcı UI'dan manuel basar). Bkz. §11 kabul edilen risk. |
| `verifyEmail(rawToken)` | Üç çıktı: **(a)** token yok/hash eşleşmedi → `400 INVALID_TOKEN` (generic). **(b)** `consumedAt!=null` VEYA kullanıcı `emailVerifiedAt!=null` → `200 ALREADY_VERIFIED` (başarı; yeni mail YOK). **(c)** token var + expired + doğrulanmamış → `410 TOKEN_EXPIRED`. Başarıda `emailVerifiedAt=now` + token consume. **Oturum açmaz.** `deletedAt!=null` kullanıcı için geçersiz. |
| `resendVerification(email)` | Her zaman generic `{ok:true}`. Kullanıcı var & doğrulanmamış & `deletedAt==null` ise: **per-email cooldown** (son token `createdAt`'ten <60-120sn → sessizce çık) + günlük tavan (5 mail/gün/e-posta) kontrolü; geçerse eski tokenları consume + yeni + maille. |

**Mail best-effort:** user create + token commit **işlemden çıkarılır/önce commit edilir**; `sendVerificationEmail` await edilse de hatası yutulur (try/catch + NotificationLog). Mail hatası register'ı düşürmez; kullanıcı yine `verification_sent` alır. Telafi = resend.

**user payload tutarlılığı:** `issueTokenPair` minimal `{id,email,role}` döndürmeye devam eder. **Frontend login başarısından sonra daima `auth.me()` çağırıp tam profili çeker** (tek doğruluk kaynağı = `me`). register zaten user göstermez.

### 3.5 Controller + rate limiter
- Endpoint'ler: mevcut `register/login/refresh/logout/me` + yeni `POST /auth/verify-email {token}`, `POST /auth/resend-verification {email, captchaToken}`.
- **`@Throttle` dekoratörleri ve `ThrottlerModule` import'u SİLİNİR** (app.module.ts'ten de). Tek mekanizma = `main.ts` in-memory limiter (§5).
- **IP kaynağı:** `app.set('trust proxy', 1)` + `req.ip` kullan (Nginx `CF-Connecting-IP`'yi real_ip yapıyor). **Ham `X-Forwarded-For[0]` elle parse EDİLMEZ** — client sahte XFF enjekte edip IP-limit spoof'layabilir. `main.ts` limiter ve `clientIp` bu kaynağa taşınır.
- **429 tek format:** `{statusCode:429, code:"RATE_LIMITED", message, retryAfter}` + `Retry-After` header.

## 4. Frontend (Next.js — apps/web)

### 4.1 api-client (`packages/api-client/src/index.ts`)
- `auth.register` dönüşü `{status, email}` (token yok). `+ verifyEmail(token)`, `+ resendVerification(email, captchaToken)`. `login`/`register` body'sine `captchaToken`.
- Tek tüketici = auth-store (doğrulandı; admin ayrı route kullanır → kırıcı değil). `getToken = () => state.accessToken`. `429/RATE_LIMITED` ve `EMAIL_NOT_VERIFIED` kodları yüzeye çıkar.

### 4.2 auth-store (`auth-store.ts`) — mock kaldırılır + oturum bootstrap
- Gerçek api-client. **Access token bellekte** (state, localStorage'a yazılmaz). Yalnız `user` persist.
- **`status: idle|bootstrapping|authenticated|anonymous`** alanı eklenir.
- **AuthBootstrap** client component (root layout): açılışta **tek kez** `/auth/refresh` çağırır; bitene kadar `status=bootstrapping`.
- **zustand persist version bump + migrate:** eski mock `markala-auth` ve `markala-marketing-consent` localStorage anahtarları temizlenir (hayalet oturum/eski `u_<base36>` id önlenir). `user` yalnız refresh başarılıysa korunur.
- Korumalı sayfa guard'ları `user` yerine `status`'e bakar (`bootstrapping`→iskelet, `anonymous`→`/giris`).
- `register`→`{ok,status}` (auto-login yok). `login`→`EMAIL_NOT_VERIFIED` yüzeye çıkar; başarıda `me()` ile profil çeker. `logout` async: `api.auth.logout()` (hata olsa da devam) → `{user:null, accessToken:null, status:anonymous}`. `verifyEmail`, `resendVerification` eklenir.

### 4.3 Sayfalar & bileşenler
| Dosya | Değişiklik |
|---|---|
| `kayit/page.tsx` | Turnstile widget (`action=register`); şifre `minLength 6→8` + complexity ipucu; başarıda "Mailini kontrol et" + tekrar gönder; `captchaToken`+`kvkkAccepted`+`marketingConsent`+`consentVersion` gönderir. KVKK checkbox metni rıza ifadesinden arındırılır ("KVKK Aydınlatma Metni'ni okudum"). |
| `giris/page.tsx` | Gerçek login; Turnstile (`action=login`); `EMAIL_NOT_VERIFIED`→uyarı + manuel tekrar gönder. |
| **Yeni** `eposta-dogrula/page.tsx` | `'use client'` + **Suspense** (`useSearchParams`); **ref guard** (Strict-Mode çift-çağrı); token okunur okunmaz `router.replace` ile URL'den temizle; `<meta name=referrer content=no-referrer>`. `ALREADY_VERIFIED`→`/giris` (mail YOK); `TOKEN_EXPIRED`→resend göster; `INVALID`→generic hata. |
| **Yeni** `components/turnstile.tsx` | Script yükleyici + render; `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. **Token tek-kullanımlık + ~300sn ömürlü:** `expired/error-callback`→token null; submit token yokken disabled; her başarısız API yanıtından sonra `turnstile.reset(widgetId)`. Site key yoksa dev'de sabit bypass token. |

## 5. Rate Limiting (kullanıcı talebi — sertleştirildi)

**Mekanizma kararı:** Throttler kaldırılır; `main.ts` in-memory limiter **genişletilir** (per-email key + cooldown + günlük tavan desteği). Tek-instans VPS için yeterli; çok-instansa geçilirse `redis` zaten ayakta → `@nestjs/throttler` + `ThrottlerStorageRedis`'e yükseltilir (kabul edilen risk: restart'ta in-memory sıfırlanır, kenar katmanı telafi eder).

**İki katman:** (A) Uygulama (in-memory) · (B) Kenar (Nginx auth-zone + Cloudflare Rate Limiting).

| Endpoint | Uygulama limiti | Anahtar | Kenar (Nginx + Cloudflare) |
|---|---|---|---|
| `POST /auth/register` | IP 3/saat + e-posta günlük mail tavanı 5 | IP + e-posta | Nginx `limit_req zone=auth burst=5` (hem `markala.com.tr` hem `api.markala.com.tr`); CF 3/saat/IP → managed challenge |
| `POST /auth/login` | IP 5/dk + e-posta 10 başarısız/15dk (captcha+argon2'den ÖNCE) | IP + e-posta kombine | Nginx `auth burst=5` (user host'larına da — şu an yalnız admin'de); CF 5/dk/IP |
| `POST /auth/resend-verification` | IP 3/saat + e-posta 60-120sn cooldown + 5 mail/gün | IP + e-posta | Nginx `auth burst=3`; CF 3/saat/IP |
| `POST /auth/verify-email` | IP 10/dk (in-memory'e EKLENİR) | IP | Nginx `auth burst=10` |
| `POST /auth/refresh` | IP 30/dk (in-memory'e TAŞINIR — şu an ölü `@Throttle`) | IP | Nginx `zone=api` yeterli |
| `POST /orders/guest` | IP 10/saat + Turnstile (şu an HİÇ limit/captcha yok) | IP + e-posta | Nginx `auth burst=5`; CF 10/saat/IP → challenge |

## 6. Kenar katmanı (Nginx / Cloudflare)
- `nginx.conf` `zone=auth rate=5r/s` mevcut ama yalnız admin host'unda uygulanıyor. **`markala.conf`'ta hem `markala.com.tr` hem `api.markala.com.tr` server bloklarına `/api/auth/(login|register|resend-verification|verify-email)` location'ları eklenir** (yukarıdaki burst değerleriyle). real_ip (`CF-Connecting-IP`) zaten doğru kurulu.
- **Cloudflare Rate Limiting Rules** + Bot Fight Mode: tablo edgeNote'larındaki eşikler.

## 7. KVKK & Hukuk
- `kvkkAccepted` = okudum teyidi (rıza değil); yalnız `marketingConsent` açık rıza. ConsentLog ikisini ayrı `consentType` ile yazar, `version=consentVersion`.
- **Aydınlatma metni güncellenir** (`packages/mock-data/src/legal.ts`): yurtdışı/üçüncü-taraf aktarıma **Cloudflare Turnstile** (IP+tarayıcı sinyali) + **yeni SMTP** (mail.324ajans.com) eklenir; SendGrid ibaresi gerçek duruma göre düzeltilir; `lastUpdated`/`version` güncellenir.
- İYS/ETK: pazarlama maili + İYS ticari-ileti kaydı **kapsam dışı** (§12). `marketingConsent` toplanır ama bu işte pazarlama maili gönderilmez.
- Saklama: `ConsentLog` hesap silinse de saklanır (ETK/zamanaşımı); silinen hesapta `email` anonimleştirme kuralı belirtilir. `EmailVerificationToken` soft-delete'te `onDelete:Cascade` TETİKLENMEZ → verify/resend `deletedAt!=null` reddeder + expired token cleanup (yeni token üretiminde eski expired'leri sil).

## 8. Mail teslimat & gönderen kimliği
- **Gönderen kararı:** `markala@324ajans.com` (Hasan verdi). `.env.production.example`'daki `merhaba@markala.com.tr` ile çelişki **buna hizalanır**.
- From-domain (324ajans.com) ile içerik domain'i (markala.com.tr) uyuşmazlığı spam riski → **SPF (mail.324ajans.com IP) + DKIM imza + DMARC (p=none, rua) + PTR** DNS kayıtları (prod checklist). Shared hosting IP reputation (94.199.201.79) izlenir.
- `consentVersion` ve yasal metin sürümü için `legal.ts`'e makine-okur `LEGAL_VERSION` sabiti; frontend + backend tek kaynaktan okur.

## 9. Sırlar & Env (gitignore'da)
**Dev** `apps/api/.env.local` → MailHog:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Markala <markala@324ajans.com>
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA   # Cloudflare resmi test (her zaman geç)
```
**Prod** `.env.production` → gerçek SMTP:
```
SMTP_HOST=mail.324ajans.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=markala@324ajans.com
SMTP_PASS=********          # Hasan'ın verdiği şifre — yalnız .env.production'da
TURNSTILE_SECRET_KEY=********  # Cloudflare gerçek secret
```
`apps/web/.env.local`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` (dev test; prod gerçek).
- **`docker-compose.production.yml` güncellenir:** api environment'a `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM`, `TURNSTILE_SECRET_KEY` (`${...}`); web environment'a `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- `.env.example` + `.env.production.example` bu 8 anahtarla güncellenir (Cloudflare resmi test key'leri yorumla).

## 10. Test
- **Unit:** `TurnstileService.verify` (fetch mock — fail-closed, action/hostname, dev fail-open), `MailService` (transporter mock — hata yutma + NotificationLog), `AuthService.register` (yeni/var-doğrulanmamış/var-doğrulanmış; token dönmemesi; mail hatası register'ı düşürmez), `verifyEmail` (invalid/expired/already-verified/deleted), `login` doğrulanmamışta 403, request order (captcha argon2'den önce).
- **Manuel e2e:** kayıt → MailHog (:8025) → link → `/giris` → giriş → `me()` profil → `/hesabim`; bozuk/expired captcha + reset; doğrulanmamış giriş + manuel resend; var-doğrulanmamış re-register; backfill sonrası eski kullanıcı giriş yapabilir.

## 11. Güvenlik kararları & kabul edilen riskler
- **Captcha fail-closed**, action+hostname doğrulanır, argon2'den önce. Token tek-kullanımlık → frontend reset.
- **Verify auto-login yapmaz** (session-fixation yüzeyini kapatır); token URL'den temizlenir + no-referrer.
- **Login 403 EMAIL_NOT_VERIFIED = kabul edilen risk:** yalnız şifre doğruyken döner → doğrulanmamış hesaplar için şifre-doğruluğu sızdırır. Gerekçe: doğrulanmamış pencere kısa; captcha + rate-limit credential-stuffing'i sınırlar; otomatik resend YOK.
- **IP spoofing kapatılır:** `trust proxy=1` + `req.ip`; ham XFF parse edilmez.
- Verification token: `randomBytes(32).base64url`, DB'de SHA-256 hash, 24s, tek-kullanım.
- In-memory limiter restart'ta sıfırlanır = kabul edilen risk (kenar telafi eder).

## 12. Kapsam dışı (YAGNI / sonraki iş)
- Şifre sıfırlama akışı (token modeli ileride genişletilebilir).
- 2FA (kolonlar mevcut, ele alınmaz).
- **E-posta değiştirme:** ayrı iş. Mevcut `UpdateProfileDto` email içermez (`whitelist:true` korur) — **eklenmemeli**; eklenirse `emailVerifiedAt=null` + yeniden doğrulama tetiklenmeli.
- **Guest checkout Turnstile widget'ı** UI tarafında bu iterasyonda eklenmez; app+kenar **rate-limit** eklenir, politika §5/§13'te kayıt altına alınır (bilinçli kısmi kapsam).
- İYS ticari-ileti kaydı + pazarlama maili gönderimi.
- Newsletter/iletişim formu captcha'sı.
- `apps/admin` auth (ayrı, env-tabanlı — değişmez).

## 13. Hasan'ın sağlaması gerekenler (prod checklist)
- [ ] **Cloudflare Turnstile** site + secret key (dash.cloudflare.com → Turnstile). Dev'de resmi test key'leri kullanılır.
- [ ] SMTP şifresi güncel → `.env.production` (verildi).
- [ ] **Deploy sırasında backfill `UPDATE`** çalıştı mı (yoksa eski hesaplar kilitli).
- [ ] **`docker-compose.production.yml`'a 8 env eklendi** + `.env.production` dolduruldu.
- [ ] **SPF + DKIM + DMARC + PTR** DNS kayıtları (324ajans.com mail).
- [ ] Cloudflare Rate Limiting kuralları + Bot Fight Mode.
- [ ] `legal.ts` KVKK metni (Turnstile + SMTP aktarımı) güncellendi.
- [ ] Postgres ayakta + migrate edilmiş.
