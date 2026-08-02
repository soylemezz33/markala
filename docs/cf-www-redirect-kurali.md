# CF www→apex Redirect Kuralı (2026-07-18)

> Tetikleyici: primebaski incelemesinde www↔apex CORS faciası görüldü; Markala'daki bekleyen
> "CF www-robots" maddesi aynı hata ailesi. Bu doküman mevcut durumu ve edge kuralını kayda alır.

## Mevcut durum (2026-07-18 teşhisi — canlı doğrulandı)

| Test | Sonuç |
|---|---|
| `https://www.markala.com.tr/derin/yol?query` | ✅ 301 → apex, **yol+query korunuyor** |
| `http://www...` | ✅ 301 zinciri (http→https→apex, 2 hop) |
| Yönlendirmenin yeri | ⚠️ **Origin nginx** (`cf-cache-status: DYNAMIC`) — CF edge'de kural YOK |
| `www/robots.txt` | 200, yalnız CF Managed içerik (zararsız — diğer tüm www URL'leri 301) |
| `apex/robots.txt` | CF Managed (AI-bot blokları + Content-Signal ai-train=no) + kendi kurallarımız + Sitemap ✓ |

**Sorun yok ama kırılganlık var:** primebaski'nin başına gelen (www ziyaretçisine bozuk site) bizde
origin nginx sayesinde olmuyor; fakat origin düşerse/nginx conf bozulursa www yönlendirmesi de gider.
Edge kuralı bunu Cloudflare katmanına taşır: origin'den bağımsız, http+https tek hop, www isteği origin'e hiç gitmez.

## Uygulama — 2 seçenek

### A) Script (hazır): `scripts/cf-www-redirect.ps1`
1. Token oluştur (60 sn): dash.cloudflare.com → My Profile → **API Tokens** → Create Token → Custom:
   - `Zone → Zone → Read` + `Zone → Dynamic URL Redirects → Edit`
   - Zone Resources: **yalnız markala.com.tr**
2. Çalıştır:
   ```powershell
   $env:CLOUDFLARE_API_TOKEN = "<token>"
   pwsh scripts/cf-www-redirect.ps1        # idempotent: varsa dokunmaz; sonda canlı doğrular
   ```
3. Token'ı işi bitince sil (tek kullanımlık yaklaşım) ya da rotasyon takvimine bağla.

### B) Dashboard (30 sn, API'siz)
markala.com.tr zone → **Rules → Redirect Rules** → Create → şablon **"Redirect from WWW to Root"**
→ 301, preserve query string → Deploy. (Şablon `concat("https://markala.com.tr", http.request.uri.path)` üretir.)

## Doğrulama
```powershell
pwsh scripts/cf-www-redirect.ps1 -VerifyOnly    # token gerekmez; 3 senaryo + hop sayısı raporlar
```
Kural edge'e geçince `https://www` yanıtında `cf-cache-status` başlığı kaybolmalı (origin'e gitmiyor).

## Notlar
- 2026-06-13'te chat'e düşen `cfut_`/`cfk_` anahtarları **hâlâ rotate edilmedi** — bu token işi, rotasyon için de fırsat.
- Wrangler OAuth (2026-06-22'de süresi doldu) ruleset yetkisi taşımıyor; CF MCP connector'ünde redirect aracı yok → script/dashboard tek yol.
- Gözlem (ayrı karar konusu): apex robots.txt hem CF Managed hem kendi kurallarımızla **tüm AI botlarını
  (ClaudeBot/GPTBot/Google-Extended/Perplexity) blokluyor**. AI aramalarında görünürlük (AEO) istenirse bu
  politika gevşetilebilir — iş kararı, Hasan'a ait.
