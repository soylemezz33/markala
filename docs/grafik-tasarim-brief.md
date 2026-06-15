# Markala — Ürün Görseli Hazırlama Brief'i

> **Kime:** Grafik tasarımcı · **Site:** markala.com.tr · **Marka:** 324 Ajans / Markala
> Bu doküman, sitedeki gerçek görsel konteynerlerine göre hazırlanmıştır. Aşağıdaki kurallar
> teknik zorunluluktur — sitenin kodu görselleri **kare (1:1)** ve **kenardan kesilerek** gösterir.

---

## 1. Teslim Ölçüleri

| Kullanım | Teslim ölçüsü | Oran | Not |
|---|---|---|---|
| **Ana ürün görseli** | **1500 × 1500 px** | 1:1 (kare) | Hem ürün kartı hem detay sayfası bunu kullanır |
| Detay küçük resimler | Ayrı export GEREKMEZ | 1:1 | Site aynı dosyayı küçülterek kullanır |
| Sosyal paylaşım (OG / WhatsApp önizleme) | **1200 × 630 px** | 1.91:1 | Ürün başına 1 adet, opsiyonel |
| Kategori / hero banner (istenirse) | **1920 × 800 px** | ~2.4:1 | Sadece talep edilen kategoriler için |

**Standart = her ürün için 1500 × 1500 px kare.** Tek ölçü hem kartı hem detayı karşılar.

> ⚠️ **DPI/PPI yanılgısı:** Web'de DPI önemsizdir, **sadece piksel ölçüsü** sayar.
> "300 DPI" baskı dosyası içindir; web görseli için **1500×1500 px** ve **sRGB** yeterli/doğrudur.

---

## 2. Renk Profili & Format

| Konu | Web görseli (BU brief) | Baskı dosyası (ayrı iş) |
|---|---|---|
| **Renk profili** | **sRGB** (zorunlu) | CMYK |
| **Format** | **WebP** (tercih) veya JPG | PDF / TIFF |
| **Dosya ağırlığı** | **150–250 KB altı** (zorunlu) | — |

- ⚠️ **CMYK teslim ETME.** Site CMYK görselleri soluk/yanlış renkte gösterir. Web görselleri **sRGB** olacak.
- Dosya boyutu kritik: site görselleri otomatik sıkıştırmaz, teslim ettiğin dosya doğrudan kullanıcıya iner. WebP kalite ~80 hedefle.

---

## 3. Kompozisyon Kuralları (kesilmeyi önler)

- **Tam kare çalış (1500×1500).** Kare teslim edilirse hiçbir şey kesilmez. Dikey/yatay teslim edilirse kenarlar otomatik kırpılır → ürün/yazı kesilir.
- **Güvenli alan:** Ürünü kenardan **%10 (≈150 px) içeride** tut. Kartlarda hover ile görsel %4 büyür; kenara dayalı ürün taşar.
- **Tutarlı arka plan:** TÜM ürünlerde **aynı** arka plan. Öneri: **saf beyaz (#FFFFFF)** veya hafif krem (#FBF7EC — site kart zemini). 30 farklı arka plan amatör durur; tek tip = profesyonel katalog.
- **Tutarlı ışık & açı:** Aynı yön, aynı gölge, aynı perspektif. Grid'de yan yana gelince seri görünmeli.
- **Marka rengi:** Markala sarısı **#F5B800** aksan olarak hafif kullanılabilir; ürünü boğmasın.

---

## 4. Ürün Başına Görsel Seti (5 görsel önerilir)

Detay galerisi 5 küçük resim gösterir. İdeal sıra:

1. **Kahraman mockup** — ürün gerçekçi sunumda. *(Kapak görseli — kartta bu görünür, en güçlü olan.)*
2. **Bağlam / ölçek** — elde tutulan kartvizit, masada kupa, ortamda rollup. Boyut algısı verir.
3. **Yakın çekim / malzeme dokusu** — kuşe kağıt, selefon, lak, kabartma detayı.
4. **Düz önden görünüm** — net, dümdüz ürün.
5. **Arka / varyant / açık hali** — örn. broşürün katlanmış + açık hali.

> Matbaa ürünlerinde **bağlam (ölçek)** ve **malzeme dokusu** satışı belirler — müşteri kağıt kalitesini ve gerçek boyutu görmek ister.

---

## 5. Dosya İsimlendirme

Ürün adı (slug) + sıra numarası, küçük harf, Türkçe karaktersiz, tireli:

```
kartvizit-kuse-deluxe-1.webp
kartvizit-kuse-deluxe-2.webp
kartvizit-kuse-deluxe-3.webp
rollup-ekonomik-1.webp
kupa-sublimasyon-1.webp
```

- `-1` = kapak (kahraman) görseli, sıralama galeri sırasını belirler.
- Türkçe karakter (ç, ş, ı, ğ, ö, ü) ve boşluk **kullanma**; tire ile ayır.
- Slug listesi için Markala ile koordine ol (her ürünün sabit bir slug'ı var).

---

## Hızlı Kontrol Listesi (teslimden önce)

- [ ] 1500 × 1500 px, tam kare
- [ ] sRGB renk profili
- [ ] WebP (veya JPG), dosya < 250 KB
- [ ] Tüm ürünlerde aynı arka plan
- [ ] Ürün kenardan %10 içeride (güvenli alan)
- [ ] Ürün başına 5 görsel (kahraman + bağlam + doku + önden + varyant)
- [ ] Dosya adları slug-1.webp formatında, Türkçe karaktersiz
- [ ] Ayrı OG görseli 1200 × 630 px (opsiyonel)

---

## 6. Ürün Dosya Adları (42 ürün × 5 görsel)

Kalıp: `slug-1.webp` (kapak) → `slug-5.webp`. Tümü küçük harf, Türkçe karaktersiz, WebP.
**Slug isimlerini birebir koru; sadece sondaki numara değişir. `-1` her zaman kart kapağıdır (en güçlü görsel).**

### Kartvizit & Broşür
| Ürün | Dosya adları |
|---|---|
| Klasik Kartvizit | `klasik-kartvizit-1.webp` … `-5.webp` |
| Broşür 115 gr Kuşe | `brosur-1.webp` … `-5.webp` |
| Pro Broşür 128 gr | `pro-brosur-1.webp` … `-5.webp` |
| Selefonlu Broşür 200 gr | `selefonlu-brosur-1.webp` … `-5.webp` |
| El İlanı 105 gr | `el-ilani-1.webp` … `-5.webp` |
| Kapı Askı Broşür | `kapi-aski-brosur-1.webp` … `-5.webp` |
| Afiş 105 gr | `afis-105gr-1.webp` … `-5.webp` |

### Kâğıt Ürünler
| Ürün | Dosya adları |
|---|---|
| Antetli Kağıt 90 gr | `antetli-kagit-1.webp` … `-5.webp` |
| Diplomat Zarf Tek Renk | `zarf-diplomat-tek-renk-1.webp` … `-5.webp` |
| Diplomat Zarf Renkli | `zarf-diplomat-renkli-1.webp` … `-5.webp` |
| Torba Zarf 24×32 | `zarf-torba-1.webp` … `-5.webp` |
| Etiket 90 gr Kuşe | `etiket-1.webp` … `-5.webp` |
| Makbuz (NCR Kopyalı) | `makbuz-1.webp` … `-5.webp` |
| Cepli Dosya | `cepli-dosya-1.webp` … `-5.webp` |
| Amerikan Servis | `amerikan-servis-1.webp` … `-5.webp` |
| Oto Paspas 34×49 | `oto-paspas-1.webp` … `-5.webp` |

### Bloknot Ailesi
| Ürün | Dosya adları |
|---|---|
| Küp Bloknot 78×78 | `kup-bloknot-1.webp` … `-5.webp` |
| Spiralli Bloknot | `spiralli-bloknot-1.webp` … `-5.webp` |
| Kapaklı Bloknot | `kapakli-bloknot-1.webp` … `-5.webp` |
| Kapaksız Bloknot | `kapaksiz-bloknot-1.webp` … `-5.webp` |
| Notluk 7.8×14 | `notluk-1.webp` … `-5.webp` |

### Çanta & Magnet
| Ürün | Dosya adları |
|---|---|
| Çanta 210 gr Bristol | `canta-1.webp` … `-5.webp` |
| Promosyon Magnet 46×68 | `magnet-promosyon-1.webp` … `-5.webp` |
| Araç Magneti 30×40 | `arac-magneti-30x40-1.webp` … `-5.webp` |

### Bayrak Ailesi
| Ürün | Dosya adları |
|---|---|
| Damla Yelken Bayrak | `yelken-bayrak-damla-1.webp` … `-5.webp` |
| Kırlangıç Bayrak 3m | `kirlangic-bayrak-3m-1.webp` … `-5.webp` |
| Krom Masa Bayrağı | `masa-bayragi-krom-1.webp` … `-5.webp` |
| Püsküllü Makam Bayrağı | `makam-bayragi-puskullu-1.webp` … `-5.webp` |

### Branda & Stand
| Ürün | Dosya adları |
|---|---|
| Vinil Branda 440 gr | `vinil-branda-440gr-1.webp` … `-5.webp` |
| Mesh Branda | `mesh-branda-1.webp` … `-5.webp` |
| Standart Roll-Up 85×200 | `rollup-standart-1.webp` … `-5.webp` |
| Lightbox LED 100×70 | `lightbox-led-100cm-1.webp` … `-5.webp` |
| Dekota Baskı 5 mm | `dekota-baski-5mm-1.webp` … `-5.webp` |

### Folyo · Sticker · Levha
| Ürün | Dosya adları |
|---|---|
| Araç Yan Cam Sticker | `arac-sticker-yan-1.webp` … `-5.webp` |
| Cam Vitrin Folyosu (Kesimli) | `cam-folyosu-kesimli-1.webp` … `-5.webp` |
| Fosforlu Acil Çıkış Folyosu | `fosforlu-cikis-folyo-1.webp` … `-5.webp` |
| İSG Güvenlik Levhası | `guvenlik-levhasi-sigorta-1.webp` … `-5.webp` |

### Promosyon & Tören
| Ürün | Dosya adları |
|---|---|
| Klasik Beyaz Kupa | `klasik-beyaz-kupa-1.webp` … `-5.webp` |
| Kristal Plaket | `kristal-plaket-1.webp` … `-5.webp` |
| Madalya 7 cm Kurdela | `madalya-7cm-kurdela-1.webp` … `-5.webp` |
| Trodat Printy 4912 Kaşe | `trodat-printy-4912-1.webp` … `-5.webp` |
| Plastik Reklam Dubası | `plastik-duba-baskili-1.webp` … `-5.webp` |
