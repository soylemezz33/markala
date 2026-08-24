# Markala — Ortam Değişkenleri Kurulum Rehberi

> **Durum:** Üretim ortamı için hazırlandı — Ağustos 2026  
> **Hedef:** VPS sunucusunda eksik env değişkenlerini doğru şekilde tanımlamak

---

## İçindekiler

1. [Genel Mimari](#1-genel-mimari)
2. [VPS Kök `.env` Dosyası (Docker Compose)](#2-vps-kök-env-dosyası-docker-compose)
3. [Kritik Eksikler — Hemen Yapılması Gerekenler](#3-kritik-eksikler--hemen-yapılması-gerekenler)
4. [SMTP — E-posta Ayarları](#4-smtp--e-posta-ayarları)
5. [Google Analytics 4](#5-google-analytics-4)
6. [Cloudflare Turnstile (Bot Koruması)](#6-cloudflare-turnstile-bot-koruması)
7. [Anthropic AI (Opsiyonel)](#7-anthropic-ai-opsiyonel)
8. [Google ile Giriş](#8-google-ile-giriş)
9. [Google Ads Dönüşüm Takibi](#9-google-ads-dönüşüm-takibi)
10. [Cloudflare R2 (Görsel Depolama)](#10-cloudflare-r2-görsel-depolama)
11. [iyzico (Ödeme)](#11-iyzico-ödeme)
12. [Meta / Facebook Pixel](#12-meta--facebook-pixel)
13. [Bakım Modu & Cache Temizleme](#13-bakım-modu--cache-temizleme)
14. [Admin Paneli](#14-admin-paneli)
15. [docker-compose.production.yml'deki Eksikler](#15-docker-composeproductionyml-deki-eksikler)
16. [Hızlı Kontrol Listesi](#16-hızlı-kontrol-listesi)

---

## 1. Genel Mimari

```
VPS Kökü (.env)
    ↓
docker-compose.production.yml
    ├── markala-api   → apps/api/.env (production override)
    ├── markala-web   → apps/web ortam değişkenleri
    └── markala-admin → apps/admin ortam değişkenleri
```

**Tüm gizli anahtarlar VPS'deki `/root/markala/.env` (veya proje kökünde `.env`) dosyasına girer.** Docker Compose bu dosyayı `${DEGISKEN_ADI}` sözdizimi ile okur.

---

## 2. VPS Kök `.env` Dosyası (Docker Compose)

VPS'de proje dizinine gir ve `.env` dosyası oluştur (henüz yoksa):

```bash
cd /root/markala   # veya projenin bulunduğu dizin
nano .env
```

Aşağıdaki **tam şablon**u kopyala ve boş değerleri doldur:

```env
# ══════════════════════════════════════════════
# MARKALA — ÜRETIM ORTAMI (.env)
# VPS'de /root/markala/.env olarak saklanır.
# GİT'E ASLA EKLEME — .gitignore'da.
# ══════════════════════════════════════════════

# ─── PostgreSQL ───────────────────────────────
POSTGRES_DB=markala
POSTGRES_USER=markala
POSTGRES_PASSWORD=                   # ← ZORUNLU: güçlü şifre

# ─── JWT & Şifreleme ──────────────────────────
# openssl rand -base64 48  →  çıktıyı buraya yapıştır
JWT_SECRET=                          # ← ZORUNLU
# openssl rand -base64 48  →  ilk 32 karakteri kullan (ASLA değiştirme!)
ENCRYPTION_KEY=                      # ← ZORUNLU (API için)

# ─── Admin Paneli ─────────────────────────────
ADMIN_SESSION_SECRET=                # ← ZORUNLU: openssl rand -hex 32
ADMIN_EMAIL=hasan@markala.com.tr
ADMIN_NAME=Hasan Söylemez
# bcrypt hash üret: node -e "const b=require('bcryptjs');b.hash('ŞİFREN',12).then(console.log)"
ADMIN_PASSWORD_HASH=                 # ← ZORUNLU

# ─── Cache Temizleme (admin → web webhook) ────
# openssl rand -hex 32
REVALIDATE_SECRET=                   # ← ZORUNLU
WEB_REVALIDATE_URL=https://markala.com.tr/api/revalidate

# ─── Bakım Modu ───────────────────────────────
MAINTENANCE_BYPASS_SECRET=           # openssl rand -hex 32

# ─── SMTP (İletişim formu + API e-postaları) ──
SMTP_HOST=mail.markala.com.tr
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@markala.com.tr
SMTP_PASS=                           # ← Plesk/cPanel'deki e-posta şifresi
MAIL_FROM=Markala <info@markala.com.tr>
CONTACT_TO=hasansylemezz@gmail.com
KVKK_TO=kvkk@markala.com.tr

# ─── Analytics ────────────────────────────────
NEXT_PUBLIC_GA4_ID=                  # G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=              # Microsoft Clarity proje ID
NEXT_PUBLIC_GTM_ID=                  # GTM-XXXXXXX (opsiyonel)
NEXT_PUBLIC_META_PIXEL_ID=           # Facebook Pixel ID (opsiyonel)
NEXT_PUBLIC_HOTJAR_ID=               # (opsiyonel)

# ─── Arama Motoru Doğrulama ───────────────────
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_VERIFICATION=
NEXT_PUBLIC_YANDEX_VERIFICATION=

# ─── Google Ads ───────────────────────────────
NEXT_PUBLIC_ADS_CONVERSION_ID=       # AW-XXXXXXXXX
NEXT_PUBLIC_ADS_PURCHASE_LABEL=      # dönüşüm etiketi kodu

# ─── Cloudflare Turnstile (Bot Koruması) ──────
NEXT_PUBLIC_TURNSTILE_SITE_KEY=      # Site key (public)
TURNSTILE_SECRET_KEY=                # Secret key (gizli)

# ─── Google ile Giriş ─────────────────────────
NEXT_PUBLIC_GOOGLE_CLIENT_ID=        # console.cloud.google.com

# ─── Anthropic AI (Ürün açıklaması asistanı) ──
ANTHROPIC_API_KEY=                   # sk-ant-... (opsiyonel)
ANTHROPIC_MODEL=claude-haiku-4-5    # varsayılan, override için

# ─── Cloudflare R2 (Görsel Depolama) ──────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=markala-uploads
R2_PUBLIC_URL=https://uploads.markala.com.tr

# ─── iyzico (Ödeme) ───────────────────────────
IYZICO_API_KEY=                      # sandbox-... veya prod
IYZICO_SECRET=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# ─── Meta Conversions API (sunucu tarafı) ─────
META_CAPI_TOKEN=                     # business.facebook.com → Pixels → CAPI
META_PIXEL_ID=1112404194692078

# ─── Entegrasyonlar (ileride) ─────────────────
# PARASUT_CLIENT_ID=
# PARASUT_CLIENT_SECRET=
# PARASUT_USERNAME=
# PARASUT_PASSWORD=
# PARASUT_COMPANY_ID=
# (SENDGRID_API_KEY kaldırıldı 2026-08-24 — mail SMTP_* ile gider)
# NETGSM_USERNAME=
# NETGSM_PASSWORD=
# DHL_API_KEY=
# DHL_ACCOUNT_NUMBER=
```

---

## 3. Kritik Eksikler — Hemen Yapılması Gerekenler

Aşağıdaki değişkenler **tanımlanmadan üretim düzgün çalışmaz:**

| Değişken | Neden Kritik | Nasıl Üretilir |
|---|---|---|
| `POSTGRES_PASSWORD` | Veritabanı şifresi | Manuel güçlü şifre |
| `JWT_SECRET` | Kullanıcı oturumları | `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | 2FA/şifreli alanlar | `openssl rand -base64 48` (ilk 32 karakter) |
| `ADMIN_SESSION_SECRET` | Admin çerez güvenliği | `openssl rand -hex 32` |
| `ADMIN_PASSWORD_HASH` | Admin girişi | bcrypt hash (aşağıya bak) |
| `REVALIDATE_SECRET` | Cache temizleme güvenliği | `openssl rand -hex 32` |
| `SMTP_PASS` | İletişim formu çalışması | Plesk e-posta şifresi |

### Güvenli anahtar üretme komutları (VPS'de çalıştır):

```bash
# JWT_SECRET
openssl rand -base64 48

# ENCRYPTION_KEY (ilk 32 karakter al)
openssl rand -base64 48 | head -c 32

# ADMIN_SESSION_SECRET ve REVALIDATE_SECRET
openssl rand -hex 32

# ADMIN_PASSWORD_HASH (Node.js gerekli)
node -e "const b=require('bcryptjs'); b.hash('ADMIN_SIFREN',12).then(h=>console.log(h))"
# bcryptjs yoksa: npm install -g bcryptjs
```

---

## 4. SMTP — E-posta Ayarları

İletişim formu, KVKK başvuruları, teklif talepleri ve API'nin gönderdiği doğrulama e-postaları için zorunludur.

### 4.1 Değişkenler

```env
SMTP_HOST=mail.markala.com.tr
SMTP_PORT=587
SMTP_SECURE=false          # 587 portu STARTTLS = false; 465 için true
SMTP_USER=info@markala.com.tr
SMTP_PASS=<e-posta şifresi>
MAIL_FROM=Markala <info@markala.com.tr>
CONTACT_TO=hasansylemezz@gmail.com    # formlar bu adrese gider
KVKK_TO=kvkk@markala.com.tr          # KVKK başvuruları
```

### 4.2 Nasıl Alınır (Plesk)

1. Plesk paneline giriş yap → **E-posta** bölümüne git
2. `info@markala.com.tr` hesabını bul → **Şifreyi Değiştir**
3. Yeni şifreyi belirle ve `.env` dosyasına `SMTP_PASS=` olarak gir
4. SMTP ayarlarını doğrulamak için Plesk → **E-posta Hesapları** → **SMTP Sunucusu**'na bak

### 4.3 Test Et (VPS'de)

```bash
# Bağlantı testi
node -e "
const n = require('nodemailer');
const t = n.createTransport({
  host: 'mail.markala.com.tr', port: 587, secure: false,
  auth: { user: 'info@markala.com.tr', pass: 'SMTP_PASS_BURAYA' },
  tls: { servername: 'mail.lisanfen.k12.tr' }
});
t.verify().then(()=>console.log('✅ SMTP bağlandı')).catch(e=>console.error('❌', e.message));
"
```

> **Not:** Sunucu TLS sertifikası `mail.lisanfen.k12.tr` adına verilmiş. Kod zaten bunu biliyor (`tls: { servername: 'mail.lisanfen.k12.tr' }`). Elle yapılandırma gerekmez.

---

## 5. Google Analytics 4

```env
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
```

### Nasıl Alınır

1. [analytics.google.com](https://analytics.google.com) → Sol menü **Admin** (dişli)
2. **Veri Akışları** → Markala web akışını seç
3. **Ölçüm Kimliği** — `G-` ile başlayan kod (kopyala)

---

## 6. Cloudflare Turnstile (Bot Koruması)

İletişim formu, teklif talebi, bülten kayıt formları bot koruması için Turnstile kullanıyor.
`TURNSTILE_SECRET_KEY` üretimde **zorunlu** — tanımlanmazsa tüm form gönderimleri engellenir.

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...    # tarayıcıya gönderilir (public)
TURNSTILE_SECRET_KEY=0x...              # sunucuda doğrulama (gizli)
```

### Nasıl Alınır

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** bölümü
2. **Site ekle** → Domain: `markala.com.tr` → Widget tipi: **Managed**
3. Oluşturulan iki anahtarı kopyala (Site Key + Secret Key)

---

## 7. Anthropic AI (Opsiyonel)

Ürün sayfası açıklaması asistanı için kullanılıyor. Tanımlanmazsa AI özelliği sessizce devre dışı kalır — sitenin geri kalanı etkilenmez.

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-haiku-4-5    # varsayılan, değiştirme (maliyet düşük)
```

### Nasıl Alınır

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**
2. Anahtarı kopyala (bir daha gösterilmez)

> **Maliyet notu:** Haiku modeli 1M token için ~$1 (input) + $5 (output). Günlük birkaç cent düzeyinde kalır.

---

## 8. Google ile Giriş

Müşteri hesabı oluşturma ekranında Google ile giriş butonu için.

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=XXXXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### Nasıl Alınır

1. [console.cloud.google.com](https://console.cloud.google.com) → Proje seç (veya oluştur)
2. **API'ler ve Hizmetler** → **Kimlik Bilgileri**
3. **+ Kimlik Bilgisi Oluştur** → **OAuth 2.0 İstemci Kimliği**
4. Uygulama türü: **Web uygulaması**
5. Yetkili yönlendirme URI'si: `https://markala.com.tr/api/auth/google/callback`
6. Oluşturulan **İstemci Kimliği**'ni kopyala

---

## 9. Google Ads Dönüşüm Takibi

Ödeme tamamlama sayfasında Google Ads'e satın alma olayı gönderilir.

```env
NEXT_PUBLIC_ADS_CONVERSION_ID=AW-XXXXXXXXX
NEXT_PUBLIC_ADS_PURCHASE_LABEL=xxxxxxxxxxxxxx
```

### Nasıl Alınır

1. [ads.google.com](https://ads.google.com) → **Araçlar** → **Dönüşümler**
2. Mevcut **Satın Alma** dönüşümünü aç (veya yeni oluştur)
3. **Etiket Kur** → **Manuel** → `gtag('event', 'conversion', {...})` satırındaki değerleri al
   - `AW-XXXXXXXXX` → `NEXT_PUBLIC_ADS_CONVERSION_ID`
   - `'send_to': 'AW-XXXXXXXXX/xxxxxx'` → son kısım `NEXT_PUBLIC_ADS_PURCHASE_LABEL`

---

## 10. Cloudflare R2 (Görsel Depolama)

Ürün görselleri yerel disk yerine R2'de saklanır. Tanımlanmazsa API görselleri local diske yazar (Docker volume).

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=markala-uploads
R2_PUBLIC_URL=https://uploads.markala.com.tr
```

### Nasıl Alınır

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → `markala-uploads` bucket'ı
2. **Yönet** → **R2 API Tokenleri** → **API Token Oluştur**
3. İzinler: **Nesne Oku & Yaz** (yalnızca bu bucket)
4. **Account ID**: sağ panelde görünür
5. Oluşturulan token: `Access Key ID` ve `Secret Access Key`

---

## 11. iyzico (Ödeme)

Şu an sandbox modunda. Canlıya geçişte endpoint değişecek.

```env
# Sandbox (test):
IYZICO_API_KEY=sandbox-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IYZICO_SECRET=sandbox-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Canlı (hazır olunca):
# IYZICO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# IYZICO_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# IYZICO_BASE_URL=https://api.iyzipay.com
```

### Nasıl Alınır

1. [merchant.iyzipay.com](https://merchant.iyzipay.com) → Sandbox hesabına giriş
2. **Ayarlar** → **Merchant Settings** → **API Key** ve **Secret Key**

---

## 12. Meta / Facebook Pixel

```env
NEXT_PUBLIC_META_PIXEL_ID=1112404194692078   # zaten tanımlı, doğrula
META_CAPI_TOKEN=                             # sunucu tarafı CAPI (opsiyonel)
```

**Pixel ID zaten `docker-compose.production.yml`'de varsayılan olarak tanımlı.** CAPI token'ı tanımlanmazsa Meta sunucu tarafı eventleri sessizce atlanır (checkout etkilenmez).

### CAPI Token Nasıl Alınır

1. [business.facebook.com](https://business.facebook.com) → **Olay Yöneticisi**
2. Piksel → **Ayarlar** → **Conversions API** → **Token Oluştur**

---

## 13. Bakım Modu & Cache Temizleme

```env
MAINTENANCE_BYPASS_SECRET=    # openssl rand -hex 32
REVALIDATE_SECRET=            # openssl rand -hex 32 (admin ile AYNI değer)
WEB_REVALIDATE_URL=https://markala.com.tr/api/revalidate
```

- `MAINTENANCE_BYPASS_SECRET`: Admin panelinden bakım moduna rağmen siteyi önizleme için
- `REVALIDATE_SECRET`: Admin panelinde ürün/kategori güncellenince storefront cache'i anında temizler
- Her iki servise (web + admin) **aynı `REVALIDATE_SECRET` değeri** girilmeli

---

## 14. Admin Paneli

```env
ADMIN_EMAIL=hasan@markala.com.tr
ADMIN_NAME=Hasan Söylemez
ADMIN_PASSWORD_HASH=          # bcrypt hash
ADMIN_SESSION_SECRET=         # openssl rand -hex 32
```

### bcrypt Hash Üretme

```bash
# VPS'de Node.js ile:
node -e "
const b = require('bcryptjs');
b.hash('BURAYA_ADMIN_SIFRENI_YAZ', 12).then(h => console.log(h));
"
```

Çıkan `$2b$12$...` ile başlayan uzun metni `ADMIN_PASSWORD_HASH=` değeri olarak kullan.

---

## 15. docker-compose.production.yml'deki Eksikler

**Önemli:** Mevcut `docker-compose.production.yml`'de bazı değişkenler `web` ve `api` servislerine iletilmiyor. Bu değişkenler `.env` dosyasında tanımlı olsa bile container'a ulaşmaz. Aşağıdaki blokları `docker-compose.production.yml`'e eklemen gerekiyor:

### `web` servisine eklenecek:

```yaml
# docker-compose.production.yml → services.web.environment altına ekle:
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      MAIL_FROM: ${MAIL_FROM}
      CONTACT_TO: ${CONTACT_TO}
      KVKK_TO: ${KVKK_TO}
      TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY}
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      NEXT_PUBLIC_META_PIXEL_ID: ${NEXT_PUBLIC_META_PIXEL_ID}
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      NEXT_PUBLIC_ADS_CONVERSION_ID: ${NEXT_PUBLIC_ADS_CONVERSION_ID}
      NEXT_PUBLIC_ADS_PURCHASE_LABEL: ${NEXT_PUBLIC_ADS_PURCHASE_LABEL}
      MAINTENANCE_BYPASS_SECRET: ${MAINTENANCE_BYPASS_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      ANTHROPIC_MODEL: ${ANTHROPIC_MODEL:-claude-haiku-4-5}
```

### `api` servisine eklenecek:

```yaml
# docker-compose.production.yml → services.api.environment altına ekle:
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      WEB_ORIGIN: https://markala.com.tr,https://www.markala.com.tr
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      MAIL_FROM: ${MAIL_FROM}
      TURNSTILE_SECRET_KEY: ${TURNSTILE_SECRET_KEY}
```

---

## 16. Hızlı Kontrol Listesi

Deploy öncesi her değişkeni işaretle:

### Kritik (olmadan çalışmaz)
- [ ] `POSTGRES_PASSWORD` — veritabanı şifresi
- [ ] `JWT_SECRET` — kullanıcı oturumları
- [ ] `ENCRYPTION_KEY` — şifreli alanlar (2FA)
- [ ] `ADMIN_SESSION_SECRET` — admin oturumu
- [ ] `ADMIN_PASSWORD_HASH` — admin girişi
- [ ] `REVALIDATE_SECRET` — cache güvenliği
- [ ] `SMTP_PASS` — e-posta gönderimleri
- [ ] `TURNSTILE_SECRET_KEY` — bot koruması (prod'da olmadan formlar bloklanır)

### Önemli (eksikse özellik çalışmaz)
- [ ] `NEXT_PUBLIC_GA4_ID` — analitik izleme
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — form widget'ı görünmez
- [ ] `MAINTENANCE_BYPASS_SECRET` — bakım modu atlatma
- [ ] `ANTHROPIC_API_KEY` — AI ürün asistanı (opsiyonel ama önerilir)

### İleride (henüz zorunlu değil)
- [ ] `IYZICO_API_KEY` / `IYZICO_SECRET` — ödeme (Faz 4)
- [ ] `R2_ACCESS_KEY_ID` vb. — görsel CDN
- [ ] `META_CAPI_TOKEN` — sunucu tarafı pixel
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google girişi

---

## Değişkenleri Uyguladıktan Sonra

```bash
# VPS'de proje dizininde:
cd /root/markala

# Stack'i yeniden başlat (değişkenler yeniden yüklenir)
docker compose -f docker-compose.production.yml up -d

# Logları izle
docker compose -f docker-compose.production.yml logs -f web api

# SMTP test
docker compose -f docker-compose.production.yml exec web node -e "
const {isMailConfigured,getContactTo}=require('./src/lib/mailer');
console.log('SMTP yapılandırılmış:', isMailConfigured());
console.log('Hedef adres:', getContactTo());
"
```

---

*Son güncelleme: Ağustos 2026 — Hasan Söylemez*
