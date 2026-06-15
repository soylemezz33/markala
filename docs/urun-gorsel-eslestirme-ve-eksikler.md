# Ürün Görselleri — Eşleştirme, Eksikler ve Tasarım Brief'i

**Tarih:** 2026-06-15
**Kaynak:** `C:\Users\Hasan\Downloads\markala-mockup` (30 mockup, 1080×1080 JPG)
**Durum:** 42 üründen **29'u eşleşti** (otomatik atamaya hazır), **13'ü eksik**, 1 görsel fazlalık.

---

## 1. Otomatik toplu atama (hazır)

- Slug-adlı görsel seti: `markala-mockup/_upload-ready/<slug>.jpg` (29 dosya)
- Eşleştirme manifesti: `_upload-ready/manifest.csv`
- Atama script'i: `scripts/assign-product-images.sh`

**Çalışma:** her `<slug>.jpg` → R2'ye `products/<slug>.jpg` anahtarıyla yüklenir → `products.images = [<R2_PUBLIC_URL>/products/<slug>.jpg]` (kapak). Prod'da R2 zaten kurulu (`R2_*` env).

```bash
scp -P 23422 _upload-ready/*.jpg root@178.157.14.10:/opt/markala/_img/
ssh -p 23422 root@178.157.14.10 'cd /opt/markala && ./scripts/assign-product-images.sh _img'
```

> Not: Script `images`'ı **değiştirir** (tek kapak görsel atar). Deploy adımıyla birlikte, R2/SSH erişimi açıkken çalıştırılacak.

---

## 2. İsim uyumsuzlukları (çözüldü)

| Dosya adı | Ürün slug'ı | Aksiyon |
|-----------|-------------|---------|
| `girlangic-bayrak-3m-1.jpg` | `kirlangic-bayrak-3m` | g→k düzeltildi (kırlangıç) |
| `el-ilanı-1.jpg` | `el-ilani` | Türkçe ı→i |
| `kapi-aski-brosür-1.jpg` | `kapi-aski-brosur` | Türkçe ü→u |
| `ilan.jpg` | — (karşılığı yok) | **ATANMADI** — katlı el ilanı/broşür mockup'ı; `el-ilani` zaten görselli. el-ilani'nin 2. görseli mi yoksa fazlalık mı? **Karar gerekiyor.** |

---

## 3. ★ Görseli OLMAYAN 13 ürün — Tasarım Brief'i

Aşağıdaki ürünler için mevcut mockup setiyle **aynı stilde** (bkz. §4) görsel üretilmeli:

| # | Slug | Ürün | Aile |
|---|------|------|------|
| 1 | `cam-folyosu-kesimli` | Cam Vitrin Folyosu — Kesimli | folyo-sticker-levha |
| 2 | `arac-sticker-yan` | Araç Yan Cam Sticker | folyo-sticker-levha |
| 3 | `arac-magneti-30x40` | Araç Magneti — 30×40 cm | folyo-sticker-levha |
| 4 | `fosforlu-cikis-folyo` | Fosforlu Acil Çıkış Folyosu | folyo-sticker-levha |
| 5 | `guvenlik-levhasi-sigorta` | İSG Güvenlik Levhası — Standart | folyo-sticker-levha |
| 6 | `dekota-baski-5mm` | Dekota Baskı — 5 mm | folyo-sticker-levha |
| 7 | `oto-paspas` | Oto Paspas — 85 gr kraft 34×49 cm Tek Renk | folyo-sticker-levha |
| 8 | `plastik-duba-baskili` | Plastik Reklam Dubası — Baskılı | folyo-sticker-levha |
| 9 | `mesh-branda` | Mesh (Gözenekli) Branda | branda-stand |
| 10 | `kapaksiz-bloknot` | Kapaksız Bloknot — 50'lik Tutkallı Cilt | bloknot ailesi |
| 11 | `notluk` | Notluk — 7.8×14 cm 70'lik | kağıt/bloknot |
| 12 | `makbuz` | Makbuz — 54 gr Kendinden Kopyalı (1 Asıl + 1 Suret) | kağıt ürünleri |
| 13 | `amerikan-servis` | Amerikan Servis — Tek Yön Renkli Baskı | kağıt ürünleri |

> **`folyo-sticker-levha` kategorisinin TAMAMI eksik** (8 ürün) — öncelik bu aile.

---

## 4. Stil rehberi (mevcut mockup'lara uyum)

Yeni görseller mevcut 29 mockup'la tutarlı olmalı:

- **Format:** 1080×1080 px kare, JPG
- **Arka plan:** açık gri stüdyo + yumuşak gölge (ürün havada/ortada)
- **Marka:** markala kimliği — **mor/indigo (ana) + sarı/turuncu aksan** + `markala.com.tr` logosu
- **Üslup:** temiz, tek ürün odaklı, fotoğraf-gerçekçi mockup
- **Adlandırma:** dosya adı = ürün slug'ı (`<slug>-1.jpg`), Türkçe karaktersiz (ı→i, ü→u, ç→c…)

> **Marka rengi notu:** Mockup'lar **mor-ağırlıklı**; proje memory'sinde "sarı palet" yazıyordu. Site tasarımı bu mor+sarı kimlikle hizalanmalı (ayrı kontrol).

---

## 5. Özet

- ✅ 29 ürün → görsel hazır, otomatik atamaya hazır
- ⚠️ 13 ürün → görsel üretilmeli (8'i folyo-sticker-levha)
- ❓ `ilan.jpg` → atama kararı bekliyor
- ▶️ Atama, görsel-upload deploy'uyla birlikte R2'ye yapılacak
