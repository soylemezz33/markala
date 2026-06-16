# DNS Yapılandırma Kılavuzu — markala.com.tr

> ⚠️ **ÖNEMLİ:** Bu belge yalnızca öneri niteliğindedir. Üretim DNS kayıtlarını değiştirmeden önce Hasan Söylemez onayı alınmalıdır.

Son güncelleme: 2026-06-15  
Hazırlayan: Sertifika & DNS İzleyici Ajanı

---

## 1. Temel DNS Kayıtları (Mevcut Durum & Öneriler)

### A / AAAA Kayıtları

| Ad | Tür | Değer | TTL | Not |
|----|-----|-------|-----|-----|
| `markala.com.tr` | A | `<Sunucu IP>` | 300 | Cloudflare proxy önerilir |
| `www.markala.com.tr` | CNAME | `markala.com.tr` | 300 | Cloudflare proxy |
| `api.markala.com.tr` | A | `<Sunucu IP>` | 300 | API endpoint |

> TTL: Kritik kayıtlar 300s, statik içerik/kurumsal kayıtlar 3600s.

---

## 2. E-posta Güvenliği

### 2.1 SPF (Sender Policy Framework)

```dns
markala.com.tr.  IN  TXT  "v=spf1 include:<mail-provider> ip4:<sunucu-ip> -all"
```

**Açıklama:**
- `include:<mail-provider>` → Kullanılan e-posta servisinin SPF kaydı eklenmeli
- `ip4:<sunucu-ip>` → Üretim sunucusu IP'si (transactional mail için)
- `-all` → Listedeki dışındakileri reddet (hard fail)

> Eğer SendGrid / SES kullanılıyorsa ilgili `include:` eklenecek.

### 2.2 DKIM (DomainKeys Identified Mail)

DKIM public key, e-posta sağlayıcısı tarafından sağlanır ve TXT kaydı olarak eklenir:

```dns
mail._domainkey.markala.com.tr.  IN  TXT  "v=DKIM1; k=rsa; p=<PUBLIC_KEY>"
```

> Public key, e-posta sağlayıcısı panelinden alınır. **Asla private key paylaşılmaz.**

### 2.3 DMARC (Domain-based Message Authentication)

Önerilen politika — aşamalı geçiş:

```dns
# Aşama 1: İzleme modu (önce bu)
_dmarc.markala.com.tr.  IN  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@markala.com.tr; ruf=mailto:dmarc@markala.com.tr; adkim=s; aspf=s"

# Aşama 2: Karantina (izleme verisi incelendikten sonra)
_dmarc.markala.com.tr.  IN  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@markala.com.tr"

# Aşama 3: Tam ret politikası (BIMI için zorunlu)
_dmarc.markala.com.tr.  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@markala.com.tr; ruf=mailto:dmarc@markala.com.tr"
```

> **Önce `p=none` ile 2-4 hafta izle**, sonra `p=quarantine`, ardından `p=reject`.  
> `rua` adresi, DMARC raporlarını alacak posta kutusu.

---

## 3. SSL/TLS Güvenliği

### 3.1 CAA (Certification Authority Authorization)

Yalnızca Let's Encrypt'in sertifika çıkarmasına izin ver:

```dns
markala.com.tr.  IN  CAA  0 issue "letsencrypt.org"
markala.com.tr.  IN  CAA  0 issuewild "letsencrypt.org"
markala.com.tr.  IN  CAA  0 iodef "mailto:ssl-alert@markala.com.tr"
```

**Neden?**
- Yetkisiz CA'ların sertifika çıkarmasını engeller (domain hijack koruması)
- `iodef` → Yetkisiz istek gelirse bildirim al

### 3.2 HSTS (HTTP Strict Transport Security)

HSTS DNS kaydı değil, HTTP response header'ıdır. Nginx/uygulama katmanına eklenmeli:

```nginx
# nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

HSTS Preload başvurusu (tek yönlü, dikkatli ol):
- Önce tüm subdomainlerin HTTPS'e geçtiğinden emin ol
- https://hstspreload.org adresinden başvur
- **Geri alınması 1-3 ay sürer**

---

## 4. BIMI (Brand Indicators for Message Identification)

Gmail ve Apple Mail'de marka logosunu e-posta başlığında gösterir. **Gereklilik: DMARC `p=reject`**

```dns
default._bimi.markala.com.tr.  IN  TXT  "v=BIMI1; l=https://markala.com.tr/assets/bimi-logo.svg; a="
```

**Logo gereksinimleri:**
- SVG format (Tiny PS profili)
- Kare (1:1 oran), minimum 32×32px
- Şeffaf arka plan yok (dolu arka plan)

> Logo onayı için Pazarlama / Marka ekibi ile koordinasyon gerekir.

---

## 5. DNS Sağlık Kontrol Komutları

```bash
# A kaydı kontrol
dig +short A markala.com.tr @1.1.1.1

# SPF kontrol
dig +short TXT markala.com.tr @1.1.1.1 | grep spf

# DMARC kontrol
dig +short TXT _dmarc.markala.com.tr @1.1.1.1

# CAA kontrol
dig +short CAA markala.com.tr @1.1.1.1

# SSL expiry kontrol
bash scripts/check-ssl-expiry.sh

# DKIM kontrol (selector biliniyorsa)
dig +short TXT mail._domainkey.markala.com.tr @1.1.1.1
```

---

## 6. Öncelik Sırası

| Öncelik | Konu | Durum |
|---------|------|-------|
| P0 | SSL auto-renew + CAA kaydı | ⏳ Onay bekliyor |
| P0 | SPF kaydı (SendGrid/SES dahil) | ⏳ Onay bekliyor |
| P0 | DMARC `p=none` izleme başlat | ⏳ Onay bekliyor |
| P1 | DMARC `p=reject`'e geçiş | DMARC izleme sonrası |
| P1 | BIMI logo + TXT kaydı | DMARC reject sonrası |
| P2 | HSTS preload başvurusu | Tüm subdomain HTTPS sonrası |

---

## 7. GitHub Actions Otomasyonu

Bu repo'da `.github/workflows/cert-monitor.yml` ile otomatik izleme kuruldu:
- Her gün 10:00 Türkiye saatinde çalışır
- SSL expiry + temel DNS kontrolleri yapar
- Kritik durumlarda Telegram bildirimi gönderir

**Gerekli GitHub Secrets:**

| Secret Adı | Açıklama |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CERT_ALERT_CHAT_ID` | Alarm mesajlarının gönderileceği chat ID |

---

*Bu doküman, `scripts/check-ssl-expiry.sh` ve `.github/workflows/cert-monitor.yml` ile birlikte çalışır.*
