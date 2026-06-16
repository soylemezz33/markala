# Markala Teknik Yazım Stil Rehberi

> **Son güncelleme:** 2026-06-15
> **Sorumlu:** Hasan Söylemez
> **Kapsam:** `docs/`, `README.md`, `apps/*/README.md`, KB makaleleri, blog içerikleri.

Bu rehber tüm doküman içerik üreticileri (insan ve ajan) için bağlayıcıdır.

---

## 1. Terim Standardı

### 1.1 Marka ve ürün adı

| Doğru | Yanlış | Neden |
|---|---|---|
| Markala | MARKALA, markala | Başlık büyük harf, geri kalanı küçük |
| 324 Ajans | 324ajans, 324 AJANS | Şirket adı resmi yazım |
| markala.com.tr | www.markala.com.tr | Kanonik domain (Cloudflare apex) |

### 1.2 Sektör terimleri — baskı/matbaa ikiliği

**Kural:** Site adı "Markala", sektör terimi "matbaa" değil "baskı" öne çıkarılır (SEO hedefi). Ürün sayfalarında "baskı" tercih edilir; kurumsal tanıtımda "matbaa & reklam ürünleri" kabul edilir.

| Tercih edilen | Kaçınılan |
|---|---|
| kartvizit baskı | kartvizit matbaası |
| broşür baskı | broşür baskıevi |
| online baskı | online matbaa |
| baskı merkezi | matbaa |

> İstisna: "matbaa" terimi rakip analizi, SEO içerik ve long-tail keyword stratejisinde serbest kullanılabilir.

### 1.3 Teknik terimler

| Türkçe tercih | İngilizce/hibrit (teknik dokümanda kabul) | Kaçınılan |
|---|---|---|
| kapsayıcı | container | konteyner |
| çalışma zamanı | runtime | — |
| yapılandırma | configuration/config | konfigurasyon |
| kimlik doğrulama | authentication/auth | — |
| dağıtım / yayın | deploy / deployment | deploymant |
| yedek | backup | bek-ap |
| bağımlılık | dependency | dependensi |

> **Kural:** Aynı belgede tutarlı ol. Teknik kılavuzda İngilizce terim tutarlı kullanılabilir; pazarlama ve müşteri belgelerinde Türkçe tercih edilir.

---

## 2. Tarih ve Saat Formatı

- **Tarih:** `YYYY-MM-DD` (ISO 8601). Örn: `2026-06-15`.
- **Saat (gerekirse):** `YYYY-MM-DDThh:mm:ssZ` (UTC). Örn: `2026-06-15T09:00:00Z`.
- **Kısaltma:** `Haz 2026` (Türkçe ay) — sadece kullanıcıya yönelik içeriklerde.
- Her dokümanda başlık altında `> **Son güncelleme:** YYYY-MM-DD` satırı zorunlu.

---

## 3. Başlık Hiyerarşisi

```
# H1 — Her dosyada yalnızca 1 tane. Proje/bölüm adı.
## H2 — Ana bölümler. Numara kullanma (ör. ## 1. Kurulum DEĞİL, ## Kurulum).
### H3 — Alt bölümler.
#### H4 — İstisnai; tercih etme.
```

**Doğru:**
```md
# Markala — Deploy Rehberi
## Önkoşullar
### Hetzner Hesabı
```

**Yanlış:**
```md
# Markala — Deploy Rehberi
## 1. Önkoşullar
### 1.1. Hetzner Hesabı
```

---

## 4. Kod Blokları

Her kod bloğunda dil etiketi zorunlu:

```md
```bash    → Shell komutları (sh/bash fark etmez; bash yaz)
```sql     → Veritabanı sorguları
```json    → JSON yapılandırma
```nginx   → Nginx config
```yaml    → YAML (docker-compose, GitHub Actions)
```ts / ```tsx → TypeScript / React
```

**Yanlış:**
```
```
docker ps
```
```

**Doğru:**
```
```bash
docker ps
```
```

---

## 5. Emoji Politikası

- `docs/` altındaki teknik belgeler: **sadece uyarı ikonu** olarak sınırlı kullanım.
  - `> ⚠️ Uyarı: ...` — kritik risk
  - `> 💡 Not: ...` — bilgi notu
  - Başlık veya madde listesi başında emoji: **yasak**.
- Pazarlama içerikleri (blog, kampanya): serbest ama tutumlu.
- README.md: tablolarda durum için `✅ ⚠️ ❌` kabul edilir.

---

## 6. Gizli Veri Politikası (Dokümanlarda)

Aşağıdakiler **hiçbir zaman** `docs/` veya repo içine yazılmaz:

- Gerçek IP adresleri (placeholder: `<VPS_IP>`)
- SSH port numarası (placeholder: `<SSH_PORT>`)
- API anahtarları, token, parola
- Gerçek veritabanı bağlantı string'leri
- Domain kaydedici giriş bilgileri

**Placeholder formatı:** `<BÜYÜK_HARF_SNAKE_CASE>` — ör. `<SENTRY_AUTH_TOKEN>`, `<VPS_IP>`.

---

## 7. Ton ve Ses

| Bağlam | Ton | Örnek |
|---|---|---|
| Teknik kılavuz (`docs/DEPLOY.md`, `RUNBOOK.md`) | Kısa, komut kipli, net | "SSH ile bağlan. Script'i çalıştır. Çıktıyı doğrula." |
| Yardım merkezi, SSS | Açıklayıcı, nazik, kullanıcı odaklı | "Dosyanızı yüklediğinizde sistem otomatik kontrol eder." |
| Blog, pazarlama | Özgüvenli, premium, birinci tekil şahıs yok | "Markala, her siparişte kaliteyi garanti eder." |
| Hata mesajı, uyarı | Doğrudan, çözüm odaklı | "⚠️ .env.production bulunamadı. Adım 4'ü tekrarlayın." |

**Kaçın:**
- Belirsiz: "bu tamamlanabilir", "gerekli olabilir"
- Gereksiz kişisel: "İyi sabahlar Hasan. Ben hazırım, sıra sende."
- Övgü: "Harika, profesyonel bir yapı"

---

## 8. Tablo Formatı

- Başlık satırı: kısa, büyük harf yok.
- Hizalama: soldan; sayısal sütunlar sağdan.
- Boş hücre için: `—` (dash), `N/A` değil.
- Tablo genişliği: satır 120 karakteri geçmesin (IDE wrap sorununu önler).

---

## 9. Çapraz Referans Kuralları

Aynı repo içindeki belgeler için göreli link:

```md
Bkz. [DEPLOY.md](./DEPLOY.md)       # docs/ içinden docs/ içine
Bkz. [docs/DEPLOY.md](docs/DEPLOY.md)  # kök README'den
```

Harici link: tam URL, HTTPS zorunlu.

Belgeler arası tutarlılık için kritik terimler:
- SSL yöntemi: her zaman "Cloudflare Origin Certificate" (`DEPLOY.md` §3)
- VPS tipi: "CX22+" (`DEPLOY.md` §1)
- Env dosya yolu: `/opt/markala/.env.production` (`DEPLOY.md` §4)
- Deploy user: `markala` (root değil)

---

## 10. Dokümantasyon Tipleri ve Sahiplik

| Tip | Kapsam | Güncelleme tetikleyicisi |
|---|---|---|
| **Operasyon kılavuzu** (DEPLOY, RUNBOOK, DR, MONITORING) | DevOps/teknik | Altyapı veya deploy süreci değiştiğinde |
| **Yasal** (LEGAL_CHECKLIST, legal.ts) | Hukuk + Hasan | VERBİS/ETBİS onayı, adres değişikliği |
| **Strateji** (SEO_STRATEJI, RAKIP-ANALIZI) | Pazarlama + Hasan | Aylık (SEO) / çeyreklik (rakip) |
| **Brief** (grafik-tasarim-brief, urun-gorsel) | Tasarım koordinasyonu | Yeni ürün eklendiğinde |
| **Konfigürasyon brief** (SENTRY_SETUP, MONITORING) | Tek seferlik kurulum | SDK güncelleme veya yeni servis |
| **Reklam/test** (REKLAM-ONCESI-TEST-PLANI) | Operasyon | Her reklam döngüsü öncesi |
| **Tarihsel snapshot** (SABAH_RAPORU) | Arşiv | Güncellenmez; başına `⚠️ TARİHSEL SNAPSHOT` notu koy |

---

## 11. Yeni Doküman Oluşturma Şablonu

```md
# Markala — [Başlık]

> **Son güncelleme:** YYYY-MM-DD
> **Sorumlu:** [Ad Soyad / Rol]
> **Kapsam:** [Bu belgenin ele aldığı konu]

Giriş cümlesi — belgenin amacını 1-2 cümlede açıkla.

---

## Bölüm 1

...

## Bölüm 2

...
```
