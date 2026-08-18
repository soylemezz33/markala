# Deploy Sorunu — Devir Notu (2026-08-17) · ✅ ÇÖZÜLDÜ (2026-08-17 akşam)

> Bu not SEO oturumundan "website düzenlemeleri" oturumuna devir içindi.
> **Devralındı ve sorun kapatıldı.** Aşağıda önce güncel durum, sonra tarihsel kayıt var.

---

## ✅ GÜNCEL DURUM — buradan oku

**Deploy çalışıyor.** Sorun çözüldü, ama devir notunun önerdiği yolla DEĞİL.

### Neden `SSH_HOST` düzeltmesi yetmedi

Prod (`APP-VM`) **iç ağda** (10.20.33.5); dışarıya güvenlik duvarı NAT'ı ile açılıyor
(185.121.126.22). GitHub Actions dışarıdan SSH ile bağlanmaya çalışınca zincir kırılgan:
`SSH_HOST` + `SSH_PORT` + `SSH_USER` + anahtarın sunucuda yetkili olması — göç sırasında
GitHub deploy anahtarı yeni makineye taşınmamıştı, kullanıcı da uyuşmuyordu. `SSH_HOST`/`PORT`
düzeltildi ama `Permission denied (publickey)` alındı (TCP açıktı, yani ağ değil kimlik sorunu).

### Kalıcı çözüm: APP-VM içinde self-hosted runner (commit `bbd43e7`)

- Runner APP-VM'in **içinde** çalışır, GitHub'a **dışarı doğru** bağlanır → hiçbir port açılmaz,
  NAT/SSH zinciri tamamen devre dışı.
- Kurulum: `/opt/actions-runner`, systemd servisi
  `actions.runner.soylemezz33-markala.app-vm-runner`, kullanıcı `hasan`
  (docker grubunda + passwordless sudo), `enabled` → VM yeniden başlarsa kendi gelir.
- `deploy.yml`: build job GitHub-hosted (imaj → GHCR), deploy job `runs-on: [self-hosted, app-vm]`
  → checkout + `sudo bash scripts/deploy-appvm.sh`.
- **Neden sudo:** `.env.production` root-only (600), `/opt/markala` root-yazılır.
- Deploy sadece **web/admin/api** yeniler. `postgres`, `nginx` (baskiport ile PAYLAŞIMLI ingress),
  `baskiport`, `backup` **DOKUNULMAZ**.

### Eklenen 4. savunma (notun 3'ünün üstüne)

`deploy.yml` → *"Canlı gerçekten güncellendi mi (uptime kanıtı)"*: deploy sonrası canlı
`/api/health` uptime'ı okunur; konteyner az önce yenilendiğine göre KÜÇÜK olmalı. 900 sn'den
büyükse **deploy kırmızı düşer** ve "deploy edilen sunucu canlı trafiği alan sunucu değil" der.
Bu, 2026-08-17'de günlerce fark edilmeyen sessiz sapmayı imkânsız kılar.

### Doğrulama (2026-08-18)

Test deploy `354e42e` → success, canlı uptime **64 sn** (taze recreate), adres + ETBİS + ürün
detay canlıda. Runner: `active` + `enabled`. Konteynerler healthy.

### Notun "bekleyen" dediği iş

`d898db3` (adres tek kaynağa alındı — Menteş Mah.) **canlıda**. Doğrulandı: `/`, `/hakkimizda`,
`/iletisim` → Menteş var; eski Çiftlikköy adresi ve `33060` posta kodu hiçbir yerde yok;
JSON-LD `PostalAddress` tutarlı. → **Merchant Center itirazı açılabilir.**

### Bilinen tuzak

`5d5988f` deploy'u düştü ama sebep GitHub'ın kendi altyapısıydı (`Set up job`, bizim kodumuz
çalışmadan önce). O commit yalnız `scripts/` değiştirdiği için canlıda eksik bir şey yaratmadı.
Böyle bir hata görülürse: GitHub status'e bak, boş commit ile tekrar tetikle.

---

## Tarihsel kayıt (sorun nasıl bulundu)

### Kök neden

Prod 2026-08-15 20:16'da Cloudflare DNS ile eski Hetzner VPS'ten (`178.157.14.10` — aslında
"VPS4-chatwoot") 324 Ajans ESXi'deki **APP-VM**'e taşındı. GitHub Actions eski VPS'e deploy
etmeye devam etti → değişiklikler canlıya hiç ulaşmadı, ama **yeşil raporlandı**: sağlık ve
`StartedAt` kontrolleri yanlış makinede doğru çalışıyordu.

### Belirti geçmişi

| Tarih/saat | Gözlem |
|---|---|
| 15 Ağu 20:16 | Prod DNS kayıtları APP-VM'e taşındı (asıl kırılma anı) |
| 17 Ağu 12:07 | Deploy yeşil, canlıda değişiklik yok |
| 17 Ağu ~12:20 | web/api uptime **37 saat** → konteynerler hiç yenilenmemiş |
| 17 Ağu 12:36 | `--force-recreate` + restart doğrulaması eklendi, yine etkisiz |
| 17 Ağu ~13:00 | Cloudflare DNS okundu → prod IP değişmiş, `SSH_HOST` eski |
| 17 Ağu ~14:00 | APP-VM'de elle recreate → ETBİS canlıya indi |
| 17 Ağu 14:44 | Self-hosted runner kuruldu, otomatik deploy geri geldi |

**Ders:** "yeşil deploy" tek başına kanıt değildir. Doğrulama, deploy edilen makineden değil
**canlı trafiği alan uçtan** yapılmalı (uptime kanıtı bunu yapar).

## Altyapı haritası (ileride lazım olur)

| Ne | Nerede |
|---|---|
| Prod markala (web/api/admin) + baskiport | **APP-VM** `10.20.33.5` (dış `185.121.126.22`), düz docker compose, `/opt/markala` |
| CloudPanel + küçük siteler | WEB-VM `10.20.33.4` (dış `185.121.126.21`) |
| ESXi host | `185.121.126.18` (srv.324ajans.com) |
| Eski VPS (artık yalnız staging) | `178.157.14.10` → `test.markala.com.tr` |
| İmajlar | `ghcr.io/soylemezz33/markala/{web,admin,api}:latest` |

## Sahiplik sınırı (değişmedi)

- **SEO oturumu:** kod değişikliği + `main`'e push + canlıda doğrulama. Deploy hattına dokunmaz.
- **"website düzenlemeleri" oturumu:** deploy hattı, sunucu, secret'lar, runner.
