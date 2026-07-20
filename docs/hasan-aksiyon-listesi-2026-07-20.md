# Hasan Aksiyon Listesi — 2026-07-20 Denetim Sonrası

> 12-ajan denetiminden çıkan, **yalnız panel/insan erişimi gerektiren** işler.
> Kod tarafı işler ayrıca commit'lendi; bu dosyadakiler API ile yapılamıyor.

## 1. 🔴 Cloudflare — AI bot bloklarını kaldır (5 dk, en yüksek etki)

AI arama görünürlüğü şu an 0/5 sorgu ailesi; kökü CF'nin İKİ ayrı bloku. Sıra:

1. dash.cloudflare.com → **markala.com.tr** zone (fe161f96) → **AI Crawl Control** (eski adı: Bots → AI bots)
2. **Managed robots.txt** özelliğini KAPAT (veya bot bazında Allow'a çek).
   - İstersen `ai-train=no` (Content-Signal) korunabilir — arama/cevap botları açılır, eğitim reddi sürer. Öneri: **arama+cevap AÇIK, eğitim kapalı**.
   - En kritik: **GPTBot, ClaudeBot, Google-Extended, PerplexityBot, OAI-SearchBot** → Allow.
3. Aynı ekranda **"Block AI bots" / WAF kuralı** varsa kapat — robots.txt'ten bağımsız ikinci blok bu (llms.txt isteği 404 yerine 403 dönüyordu = edge kesiyor).

**Doğrulama (ben yaparım, "CF'yi doğrula" demen yeter):**
```powershell
curl -A "GPTBot" -s -o NUL -w "%{http_code}" https://markala.com.tr/   # beklenen: 200 (403 değil)
curl -s https://markala.com.tr/robots.txt | Select-String "GPTBot"      # beklenen: Disallow: / YOK
```

## 2. 🔴 Meta — Custom Audience ToS onayı (30 sn)

Remarketing kitleleri API'den kurulamadı; hesap için tek seferlik sözleşme onayı gerekiyor:

- Aç: **https://www.facebook.com/customaudiences/app/tos/?act=1492007215052815** → kabul et.
- Sonra bana **"Meta kitlelerini kur"** de — 4 kitle + PAUSED retargeting adset'i hazır scriptle kurarım
  (Site 180g · Sepete Ekleyen 14g · Satın Alan 180g hariç-tutma · IG Etkileşim 365g).

Not: IG bütçe indirimi YAPILDI (IG Profil adset 1.000→300₺/gün, API'den doğrulandı).
Satış adset'inin optimizasyonu Purchase→IC değişimi API'de mevcut adset üzerinde yapılamıyor
(Meta kısıtı) — istersen yeni adset olarak klonlarım, kararın sonrası.

## 3. 🔴 Google Ads — reklamveren kimlik doğrulaması

Ads bildirim merkezindeki kimlik doğrulamayı tamamla. Süre dolarsa **tüm reklamlar otomatik durur**
(İSG kampanyası dahil). Bu tamamen Google'ın kimlik akışı — API'den yapılamıyor.

Not: İSG "Genel Uyarı ve İkaz" reklamının final URL'i API'den düzeltildi
(eski `/kategori/guvenlik-uyari-levhalari` → `/kategori/is-guvenligi-uyari-ikaz`, doğrulandı).
URL değişikliği reklamı kısa bir yeniden incelemeye sokar — 1-2 saat içinde normale döner.

## 4. 🟠 DKIM — mail sunucusunda imzalama aç (~1 saat, teslim edilebilirlik)

DMARC `p=quarantine` + DKIM YOK = herhangi bir mail yönlendirmesi SPF'i kırar → karantina.

1. Lisan Fen ortak mail sunucusu paneli (Plesk/cPanel — mail.lisanfen.k12.tr'yi barındıran):
   **markala.com.tr** domain'i için DKIM imzalamayı etkinleştir → panel bir selector + TXT değeri verir
   (ör. `default._domainkey.markala.com.tr`).
2. TXT kaydını Cloudflare DNS'e ekle (CF → markala.com.tr → DNS → Add record → TXT).
3. Bana **"DKIM'i doğrula"** de — selector'ı sorgulayıp Gmail başlık testine kadar kontrol ederim.

Kod tarafı YAPILDI: MAIL_FROM fallback'leri `bilgi@markala.com.tr`'ye çekildi
(324ajans.com hizalama bombası kaldırıldı).

## 5. 🟡 Karar bekleyenler (panel işi değil, strateji)

| Karar | Bağlam | Varsayılan önerim |
|---|---|---|
| ACILIS15 (29 Tem'de bitiyor) | Kuponlu reklam metinleri hazır ama yayın buna bağlı | Uzat (31 Ağu) veya HOSGELDIN'i tek ana teklif yap |
| Misafir/hafif checkout | Meta 5.614₺/30g → 0 satış; kök neden giriş+doğrulama duvarı | Reklam trafiğine OTP-hafif misafir akışı A/B'si |
| Font/palet geçişi (DM Sans→Poppins, #F5B800→#FFB91C, mor token) | UI değişikliği — önizleme kuralına tabi | Önizleme paketi hazırlıyorum, görselle geleceğim |
| Kargo eşiği 1500 vs 1000 testi | Tek DB anahtarı, kod değişikliği yok | 2 hafta dönüşümlü test |
| TürkPatent "Markala" tescili | Marka şikâyet mekanizmasının ön koşulu | Durumu teyit ettir |
