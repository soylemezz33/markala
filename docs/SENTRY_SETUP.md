# Sentry Error Tracking — Kurulum Talimatı

Bu doküman Markala için Sentry'nin **production** ortamında devreye alınması için
adım adım talimattır. Kod entegrasyonu hazır; yalnızca hesap + DSN + env değişkenleri
girmen gerekiyor.

## 1. Sentry Hesabı Açma

1. https://sentry.io/signup/ adresine git
2. GitHub ile giriş yap (Hasan'ın `hasansylemezz@gmail.com` hesabı)
3. Organization adı: **324-ajans** veya **markala** öner
4. Plan: **Developer (Free)** — 5000 error/ay yeterli (mockup trafik az)

## 2. Projeleri Oluşturma

Sentry dashboard → **Projects** → **Create Project**:

### Web (frontend)

- Platform: **Next.js**
- Alert frequency: **On every new issue**
- Project name: **markala-web**
- Team: Default

DSN ve auth token'ı not al (sonraki adımda kullanacaksın).

### Admin (frontend)

Aynı adımları tekrarla:

- Project name: **markala-admin**
- Platform: **Next.js**

> Tek proje altında her iki app'i tutmak istersen — `SENTRY_PROJECT_ADMIN` env'ini
> set etme; ikisi de `markala-web` projesine düşer. Önerim: ayır, dashboard temiz kalır.

## 3. DSN ve Auth Token

### DSN (her proje için ayrı)

Sentry → Project → **Settings** → **Client Keys (DSN)** → Kopyala

Format: `https://abc123...@o123456.ingest.sentry.io/4567890`

### Auth Token (source map upload için, bir kez)

Sentry → **Settings** (sol alt) → **Account** → **API** → **Auth Tokens** →
**Create New Token**

Scopes (zorunlu):
- `project:read`
- `project:releases`
- `org:read`

Token'ı bir kerede kopyala — bir daha gösterilmez.

## 4. Environment Değişkenleri

### `.env.production` (web + admin) — VPS'te `/var/www/markala/.env`

```bash
# Sentry — error tracking
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project-id>
SENTRY_ENVIRONMENT=production
SENTRY_ORG=324-ajans
SENTRY_PROJECT=markala-web
SENTRY_PROJECT_ADMIN=markala-admin
# Auth token — yalnız build/deploy aşamasında gerekli, runtime'da değil
SENTRY_AUTH_TOKEN=sntrys_eyJ...
```

> `NEXT_PUBLIC_` prefix'i build-time'da bundle'a gömülür. Auth token **asla**
> client'a sızmaz çünkü `NEXT_PUBLIC_` yok.

### Yerel geliştirme (`.env.local`)

```bash
# Lokal'de Sentry kapalı (NODE_ENV !== production → enabled: false)
# Test etmek istersen aşağıdaki satırı aç:
# NEXT_PUBLIC_SENTRY_DSN=https://...
```

## 5. GitHub Actions Secret'ları

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret adı | Değer |
|---|---|
| `SENTRY_AUTH_TOKEN` | Auth token (4. adımda aldığın) |
| `SENTRY_ORG` | `324-ajans` |
| `SENTRY_PROJECT` | `markala-web` |
| `SENTRY_PROJECT_ADMIN` | `markala-admin` |
| `NEXT_PUBLIC_SENTRY_DSN` | Web DSN'i |

> Admin için ayrı DSN kullanıyorsan ikinci bir secret olarak `NEXT_PUBLIC_SENTRY_DSN_ADMIN`
> ekle ve admin build job'unda override et.

## 6. Dependency Kurulumu

Sentry SDK package.json'a eklendi ama henüz kurulmadı:

```bash
cd c:\Users\Hasan\Projects\baskisitesi
pnpm install
```

## 7. İlk Hata Fırlatma Testi

Build + start sonrası tarayıcıda test:

```tsx
// apps/web/src/app/sentry-test/page.tsx (geçici test sayfası)
"use client";
export default function SentryTest() {
  return (
    <button onClick={() => { throw new Error("Sentry test — Markala canlı!"); }}>
      Patlat
    </button>
  );
}
```

1. `pnpm --filter @markala/web build && pnpm --filter @markala/web start`
2. http://localhost:3000/sentry-test → butona tıkla
3. Sentry dashboard → **Issues** → 30 sn içinde hata görünmeli

> Test bittikten sonra `sentry-test/page.tsx` dosyasını sil.

## 8. Production Doğrulama

Deploy sonrası:

1. https://markala.com.tr/sentry-test (veya benzer geçici endpoint)
2. Sentry → Issues → `production` environment filter → hata görünmeli
3. Source map upload başarılı mı? → Issue detay → **Stack trace** → TS satır numaraları
   görünüyor mu? (Eğer minified JS satırları görünüyorsa upload başarısız demektir →
   GitHub Actions log'unda `Sentry CLI` çıktısını kontrol et)

## 9. Alert Kuralları (Opsiyonel ama önerilir)

Sentry → Project → **Alerts** → **Create Alert Rule**:

- **High-frequency error**: Aynı issue 1 saat içinde >10 kez tekrarlanırsa → e-mail
- **New issue in production**: Yeni issue görüldüğünde → e-mail (`hasansylemezz@gmail.com`)
- **Performance degradation**: P95 transaction > 3sn → e-mail (ileride trafik artınca)

## 10. PII / KVKK Notu

Web app'te session replay açık (`replaysOnErrorSampleRate: 1.0`) ama:

- `maskAllText: true` → tüm metin maskelenir
- `blockAllMedia: true` → görseller bloklanır

Admin app'te replay tamamen kapalı (PII riski yüksek).

Yine de KVKK gizlilik politikasına Sentry'yi veri işleyen olarak ekle:
"Hata izleme için Sentry (sentry.io) kullanıyoruz; teknik hata verisi AB sunucularında
işlenir."

## Yapılanların Özeti (Kod Tarafı)

- `apps/web/sentry.{client,server,edge}.config.ts` — runtime config'leri
- `apps/web/instrumentation.ts` — Next.js 14 hook (server/edge bridge)
- `apps/web/next.config.mjs` — `withSentryConfig` wrapper
- `apps/admin/sentry.{client,server}.config.ts` — admin config'leri (replay kapalı)
- `apps/admin/instrumentation.ts` — Node.js runtime hook
- `apps/admin/next.config.mjs` — `withSentryConfig` wrapper
- Her iki `package.json` — `@sentry/nextjs@^8.40.0` eklendi

`SENTRY_AUTH_TOKEN` set edilmediği sürece build kırılmaz (`dryRun: true`).
