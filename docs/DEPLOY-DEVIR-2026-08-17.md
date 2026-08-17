# Deploy Sorunu — Devir Notu (2026-08-17)

> Bu not, SEO oturumunda tespit edilen deploy sorununun **"website düzenlemeleri yapma"** oturumuna devri içindir.
> SEO oturumu bundan sonra deploy'a müdahale etmeyecek.

---

## Tek cümlelik özet

Otomatik deploy, **yanlış sunucuya** bağlanmaya çalışıyor: prod 15 Ağustos'ta yeni makineye taşındı, `SSH_HOST` GitHub secret'ı hâlâ eski makineyi gösteriyor.

## Belirti geçmişi

| Tarih/saat | Gözlem |
|---|---|
| 15 Ağu 23:14 | Konteynerlerin son gerçek başlangıcı (yeni sunucuda) |
| 17 Ağu 12:07 | Deploy **yeşil** raporlandı, ama canlıda hiçbir değişiklik yok |
| 17 Ağu ~12:20 | Teşhis: web + api uptime **37 saat** → konteynerler hiç yenilenmemiş |
| 17 Ağu 12:36 | `--force-recreate` + yeniden başlatma doğrulaması eklendi, yine yeşil/etkisiz |
| 17 Ağu sonrası | Deploy artık **kırmızı düşüyor** — `Deploy via SSH` adımında |

**Kritik nokta:** Deploy uzun süre *sessizce* başarılı raporlandı. Sebep: sağlık kontrolü eski-ama-çalışan konteynerleri doğruluyordu. Yani "yeşil deploy" kanıt değildi.

## Kök neden

`.github/workflows/deploy.yml:93` → `host: ${{ secrets.SSH_HOST }}`

Bu secret eski VPS'i (`178.157.14.10`) gösteriyor. Prod ise yeni makinede. Deploy eski makineyi güncelliyordu; siteyi yeni makine servis ediyordu → değişiklikler asla görünmedi.

## Çözüm

GitHub → **Settings → Secrets and variables → Actions**:

- `SSH_HOST` → yeni sunucunun IP'si
- Gerekirse `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` de yeni makineye göre güncellenmeli

**Doğrulama:** Cloudflare'daki `markala.com.tr` A kaydının IP'si ile `SSH_HOST` aynı olmalı.

Düzeltildikten sonra: Actions → *Deploy to Production* → **Re-run**. Bekleyen tüm commit'ler tek seferde iner.

## Bu oturumda deploy.yml'e eklenenler (korunmalı)

Sessiz başarısızlığı imkânsız kılmak için üç savunma eklendi:

1. **`--force-recreate`** — aynı imaj digest'inde bile konteyner yenilenir
2. **Pull öncesi imaj digest logu** — imajın gerçekten değişip değişmediği görünür
3. **Yeniden başlatma doğrulaması** — `StartedAt` 10 dakikadan eskiyse deploy **kırmızı düşer**

Bu üçü sayesinde artık "yeşil ama uygulanmamış" durumu oluşamaz. Silinmemeli.

## Bekleyen tek değişiklik

`d898db3` — **adres birleştirmesi** (doğru adres: Menteş Mah.). `main`'de hazır, deploy edilemedi.

Kapsamı:
- Yeni tek kaynak: `apps/web/src/lib/company.ts` (unvan, adres, telefon, KEP, ETBİS linki)
- `json-ld.tsx` (Organization + LocalBusiness), `hakkimizda`, `iletisim`, `packages/mock-data/src/legal.ts` hepsi bu kaynağa bağlandı
- Bilerek kaldırıldı: posta kodu `33060` ve geo koordinatı `36.812061, 34.641482` — ikisi de **eski Çiftlikköy adresine** aitti. Harita artık adres sorgusuyla çalışıyor.
- `tsc --noEmit`: web ve mock-data temiz

### ⚠️ Neden acele

Google Merchant Center hesabı **"Misrepresentation"** gerekçesiyle askıda. Askının bir numaralı şüphelisi, sitedeki **tutarsız işletme kimliği** (adres üç farklı yerde farklıydı). Bu commit onu düzeltiyor.

**İtiraz, adres canlıya indikten SONRA açılmalı** — Google siteye baktığında hâlâ eski adresi görürse itiraz baştan zayıflar.

## Zaten canlıda olanlar (elle yayınlandı, tekrar gerekmez)

İSG ürün içeriği (10/10), ETBİS künyesi + rozeti, sitemap'e eklenen 5 yasal sayfa, HowTo şeması temizliği, `/yardim` ve `/hizmetler` gerçek 404'leri, breadcrumb/ItemList şemaları.

## Sahiplik sınırı

- **Bu oturum (SEO):** deploy'a müdahale etmez. Kod değişikliği yapar, `main`'e push eder, canlıda doğrular.
- **"website düzenlemeleri yapma" oturumu:** deploy hattı, sunucu, secret'lar.
