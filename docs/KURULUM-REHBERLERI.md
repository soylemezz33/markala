# Teknik Kurulum Rehberleri — markala.com.tr

> Son güncelleme: Ağustos 2026  
> Bu rehberler Hasan tarafından manuel olarak uygulanacak adımları içerir.

---

## İçindekiler

1. [DKIM Kurulumu (Plesk → Cloudflare)](#1-dkim-kurulumu)
2. [Cloudflare Email Obfuscation Kapatma](#2-cloudflare-email-obfuscation-kapatma)
3. [Cloudflare AI Crawl Control (Bot İzinleri)](#3-cloudflare-ai-crawl-control)
4. [Google Ads Kimlik Doğrulama](#4-google-ads-kimlik-doğrulama)
5. [Meta Custom Audience Şartlarını Kabul Etme](#5-meta-custom-audience-şartları)

---

## 1. DKIM Kurulumu

**Amaç:** E-posta gönderilerinin spam kutusuna düşmesini önlemek. DKIM, DMARC ve SPF birlikte e-posta kimliğini kanıtlar.

**Tahmini süre:** 15–30 dakika  
**DNS yayılma süresi:** 15 dakika – 48 saat

---

### Adım 1 — Plesk'te DKIM Anahtarını Oluştur

1. Plesk yönetim paneline giriş yap (genellikle `mail.markala.com.tr:8443` veya sunucu IP'si`:8443`)
2. Sol menüden **"Mail"** → **"Mail Hesapları"** bölümüne git
3. `markala.com.tr` domain'ini bul, yanındaki **"DNS Ayarları"** veya **"E-posta Ayarları"** ikonuna tıkla
4. Alternatif yol: **"Websites & Domains"** → `markala.com.tr` → **"Mail"** → **"DKIM Desteği"**
5. **"DKIM anahtarı etkinleştir"** veya **"Enable DKIM signing"** seçeneğini aç
6. Plesk, otomatik olarak bir anahtar çifti oluşturur

> 📌 **Not:** Bazı Plesk sürümlerinde DKIM, **"Tools & Settings" → "Mail Server Settings" → "DKIM"** altında bulunabilir.

---

### Adım 2 — TXT Kaydını Kopyala

1. DKIM etkinleştirildikten sonra Plesk ekranda şuna benzer bir kayıt gösterir:

   ```
   Ad:    default._domainkey.markala.com.tr
   Tür:   TXT
   Değer: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
   ```

2. **Tüm "Değer" alanını** seçip kopyala (başında `v=DKIM1` ile başlar, uzun bir p= değeriyle biter)
3. Bu değeri bir yere not al — Cloudflare'e yapıştıracaksın

> ⚠️ **Dikkat:** `p=` değerinin tamamını kopyalamak kritik. Bazı paneller metni keser — ekranı kaydırarak tamamını aldığından emin ol.

---

### Adım 3 — Cloudflare DNS'e DKIM Kaydı Ekle

1. [dash.cloudflare.com](https://dash.cloudflare.com) adresine git ve hesabına giriş yap
2. Domain listesinden **`markala.com.tr`** üzerine tıkla
3. Sol menüden **"DNS"** → **"Records"** sayfasına git
4. Sağ üstteki **"Add record"** butonuna tıkla
5. Açılan formu şu şekilde doldur:

   | Alan | Değer |
   |------|-------|
   | **Type** | `TXT` |
   | **Name** | `default._domainkey` |
   | **Content** | Plesk'ten kopyaladığın `v=DKIM1; k=rsa; p=...` değeri |
   | **TTL** | `Auto` |
   | **Proxy status** | **DNS only** (turuncu bulut değil, gri bulut) |

6. **"Save"** butonuna tıkla

> 📌 **Önemli:** Selector ismi Plesk'te `mail._domainkey` olarak görünüyorsa, "Name" alanına `default._domainkey` değil `mail._domainkey` yaz.

---

### Adım 4 — DMARC Kaydı Ekle

DMARC, DKIM ve SPF'i bir araya getiren üst katman politikasıdır. Cloudflare DNS'te aynı sayfada ikinci bir kayıt ekle:

1. Tekrar **"Add record"** tıkla
2. Formu şu şekilde doldur:

   | Alan | Değer |
   |------|-------|
   | **Type** | `TXT` |
   | **Name** | `_dmarc` |
   | **Content** | `v=DMARC1; p=none; rua=mailto:hasansylemezz@gmail.com` |
   | **TTL** | `Auto` |
   | **Proxy status** | DNS only (gri bulut) |

3. **"Save"** tıkla

> 📌 `p=none` ayarı başlangıç için güvenlidir — sadece raporlama yapar, e-postaları bloklamaz. Birkaç hafta sonra raporları inceleyip `p=quarantine` veya `p=reject`'e geçebilirsin.

---

### Adım 5 — Doğrulama

DNS yayıldıktan sonra (15 dakika – 24 saat) şu araçlarla test et:

**DKIM testi:**
- [mxtoolbox.com/dkim](https://mxtoolbox.com/dkim.aspx) adresine git
- Domain: `markala.com.tr`, Selector: `default` yaz → "Check DKIM" tıkla
- Yeşil ✅ sonuç beklenir

**Kapsamlı e-posta skoru:**
- [mail-tester.com](https://www.mail-tester.com) adresine git
- Verilen adrese bir test e-postası gönder
- 10/10 veya en az 8/10 hedefle

---

## 2. Cloudflare Email Obfuscation Kapatma

**Amaç:** Cloudflare'in e-posta adreslerini otomatik olarak şifrelemesi sitedeki mailto: linklerini bozuyor. Bu özelliği kapatmak gerekiyor.

**Tahmini süre:** 2 dakika

---

### Adımlar

1. [dash.cloudflare.com](https://dash.cloudflare.com) adresine git
2. **`markala.com.tr`** domain'ini seç
3. Sol menüden **"Scrape Shield"** sayfasına git

   > Bulamazsan: Sol menüde aşağı kaydır, **"Security"** bölümünün altında veya ayrı bir menü öğesi olarak görünür

4. **"Email Address Obfuscation"** satırını bul
5. Toggle'ı tıklayarak **OFF** (kapalı/gri) konumuna getir
6. Sayfanın otomatik kaydettiğini teyit et (bazı sürümlerde "Save" butonu çıkar)

**Sonuç:** Sitedeki `info@markala.com.tr` gibi e-posta linkleri artık düzgün görüntülenir ve tıklanabilir.

---

## 3. Cloudflare AI Crawl Control

**Amaç:** GPTBot, ClaudeBot gibi yapay zeka tarayıcılarına siteye erişim izni vermek. Bu olmadan Perplexity, ChatGPT ve diğer AI arama motorları sitenin içeriğini listeleyemiyor.

**Tahmini süre:** 5 dakika

---

### Adımlar

1. [dash.cloudflare.com](https://dash.cloudflare.com) adresine git
2. **`markala.com.tr`** domain'ini seç
3. Sol menüden **"Security"** → **"Bots"** sayfasına git
4. **"AI Scrapers & Crawlers"** bölümünü bul

   > Bu bölüm bazı Cloudflare planlarında **"Bot Fight Mode"** altında görünebilir

5. Aşağıdaki botların her biri için **"Allow"** seç:

   | Bot Adı | Açıklama |
   |---------|----------|
   | **GPTBot** | ChatGPT / OpenAI'nın tarayıcısı |
   | **ClaudeBot** | Anthropic'in tarayıcısı |
   | **Google-Extended** | Google Gemini ve AI Overviews |
   | **PerplexityBot** | Perplexity AI arama motoru |
   | **CCBot** | Common Crawl (genel amaçlı) |

6. Değişiklikleri kaydet

> 📌 **Alternatif yöntem:** Eğer Cloudflare panelinde bu arayüzü göremiyorsan, robots.txt dosyasına şunu ekleyebilirsin:
>
> ```
> User-agent: GPTBot
> Allow: /
>
> User-agent: ClaudeBot
> Allow: /
>
> User-agent: Google-Extended
> Allow: /
>
> User-agent: PerplexityBot
> Allow: /
> ```
>
> robots.txt dosyası sitenin kök dizininde bulunmalı: `markala.com.tr/robots.txt`

---

## 4. Google Ads Kimlik Doğrulama

**Amaç:** Türkiye'de reklam yayınlamak için Google, reklamveren kimliğini doğrulamayı zorunlu kılıyor. Bu yapılmazsa reklamlar durdurulabilir.

**Tahmini süre:** 10–15 dakika (belge yükleme) + 1–3 iş günü (Google incelemesi)

---

### Adımlar

1. [ads.google.com](https://ads.google.com) adresine git, hesabına giriş yap
2. Sağ üstteki **araç simgesi (⚙️)** → **"Kurulum"** → **"Kimlik Doğrulama"** bölümüne git

   > Alternatif yol: Üst menüden **"Araçlar ve Ayarlar"** → **"Politika Merkezi"** → **"Kimlik Doğrulama"**

3. **"Doğrulamayı Başlat"** veya **"Get started"** butonuna tıkla
4. Ülke olarak **Türkiye** seç
5. Kimlik belgesi yükle:

   **Kabul edilen belgeler:**
   - 🪪 Nüfus cüzdanı (ön ve arka yüz)
   - 🛂 Pasaport (kimlik sayfası)

   **Belge gereksinimleri:**
   - Net ve okunaklı fotoğraf/tarama
   - Tüm köşeler görünmeli
   - Dosya formatı: JPG, PNG veya PDF
   - Dosya boyutu: Genellikle maksimum 10 MB

6. İşletme bilgilerini doldur:
   - Yasal işletme adı
   - Vergi numarası (varsa)
   - Adres

7. Formu gönder

---

### Sonuç ve Takip

- Google, belgeleri **1–3 iş günü** içinde inceler
- E-posta bildirimi gelir (Google Ads hesabına kayıtlı mail adresine)
- Onaylandıktan sonra reklamlar kısıtsız yayınlanabilir
- Reddedilirse, talep edilen düzeltmeleri yapıp tekrar başvurabilirsin

> ⚠️ Kimlik doğrulama tamamlanana kadar bazı reklam türleri (özellikle yeniden pazarlama ve kişisel finans kategorileri) kısıtlı kalabilir.

---

## 5. Meta Custom Audience Şartları

**Amaç:** Facebook/Instagram'da Özel Hedef Kitle (Custom Audience) oluşturabilmek için Meta'nın kullanım şartlarını kabul etmek zorunlu. Bu yapılmadan retargeting (yeniden hedefleme) kampanyası başlatılamaz.

**Tahmini süre:** 2 dakika

---

### Adımlar

1. Tarayıcında şu adresi aç (doğrudan link):

   ```
   https://www.facebook.com/customaudiences/app/tos/?act=1492007215052815
   ```

   > `act=` parametresindeki numara reklam hesabı ID'ndir. Yukarıdaki numara senin hesabına aittir.

2. Facebook hesabınla giriş yaptığından emin ol
3. Sayfa yüklendiğinde **"Özel Hedef Kitle Kullanım Koşulları"** metni görünür
4. Sayfanın altına kadar kaydır
5. **"Kabul Et"** butonuna tıkla

---

### Doğrulama

Kabul işleminin başarılı olup olmadığını kontrol etmek için:

1. [Meta Business Suite](https://business.facebook.com) → **Hedef Kitleler** sayfasına git
2. **"Hedef Kitle Oluştur"** → **"Özel Hedef Kitle"** seçeneğini dene
3. Artık web sitesi ziyaretçisi, müşteri listesi veya uygulama aktivitesi gibi kaynaklardan hedef kitle oluşturabilirsin

> 📌 **Sorun çıkarsa:** Reklam hesabı ID'si yanlışsa (1492007215052815), doğru ID'yi şuradan bul:
> - Meta Business Suite → Ayarlar → Reklam Hesapları → Hesap ID

---

## Hızlı Kontrol Listesi

| Görev | Durum | Tahmini Süre |
|-------|-------|--------------|
| ☐ DKIM kaydı Cloudflare'e eklendi | — | 15 dk |
| ☐ DMARC kaydı Cloudflare'e eklendi | — | 5 dk |
| ☐ DKIM doğrulandı (mxtoolbox) | — | DNS yayılma sonrası |
| ☐ Email Obfuscation kapatıldı | — | 2 dk |
| ☐ AI bot izinleri verildi | — | 5 dk |
| ☐ Google Ads kimlik doğrulama gönderildi | — | 15 dk |
| ☐ Meta Custom Audience ToS kabul edildi | — | 2 dk |

---

*Bu dokümanda sorun ya da güncelleme ihtiyacı varsa Hasan'a bildir.*
