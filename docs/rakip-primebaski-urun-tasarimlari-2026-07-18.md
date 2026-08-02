# primebaski.com — Ürün Tasarımları Derin İncelemesi (2026-07-18)

> Yöntem: Hallmark `study` (URL modu + Playwright ekran görüntüsü ⇒ ritim körlüğü kapatıldı).
> Kapsam: anasayfa, kategori listeleme, 7 temsilci PDP (kartvizit, broşür, avrupa vinil, roll-up,
> kupa, amerikan servis, cam plaket), mobil (390px). DOM + hesaplanmış stil + konsol + curl teyidi.
> Kural: rakip DNA'sı yalnız **teşhis** — tasarım sistemine işlenmez, piksel kopyalanmaz.
> Bağlam: `docs/rakip-analizi-2026-07-18.md` (5 rakip genel study) üzerine ürün-sayfası derinleştirmesi.

## 1. Envanter

| | |
|---|---|
| Ürün sayısı | **117** (9 kategori) |
| En büyük kategori | Promosyon & Hediyelik **54 ürün** — tedarikçi kataloğu toplu import (ilçe adlı ürünler: "Tarsus Metal Kalem", "Seyhan Plastik Kalem"…) |
| Diğerleri | Kurumsal 12 · Dijital Baskı 12 · Restoran/Cafe 10 · Reklam 10 · Kartvizit 7 · Bayrak 6 · El İlanı/Broşür 3 · Sektörel 3 |
| Sektör sayfaları | 11 (lojistik, sağlık, düğün… `/urunler/sektor/…`) |

## 2. Tasarım DNA'sı (Hallmark study şeması, özet)

```json
{
  "source_mode": "url+screenshot", "source": "public-reference (rakip)", "refusal": "ok — teşhis serbest, design.md emisyonu YOK",
  "macrostructure": "Katalog PDP — 3 kolon (galeri / seçenekler / fiyat+teslim+upload paneli)",
  "nav": "N11 mega-menü (9 kategori + hover dropdown) + üst yardımcı bant",
  "footer": "Ft3 4-kolon index + hakkında metni",
  "display_face": "Roboto (tek aile, 300-700)", "body_face": "Roboto", "pairing_logic": "tek aile — jenerik",
  "paper_value": "#ffffff", "body_color": "rgb(90,89,89)",
  "accent_value": "#3bb77e (Nest şablon yeşili)", "accent_footprint": "recurring — CTA'lar soluk mint (#def9ec) zeminli",
  "treatments": ["ThemeForest Nest şablonu", "Bootstrap 5.0.0-beta1", "jQuery 3.6", "marka görselleri yeşil degrade mock"],
  "motion_library": "swiper + animate.css", "reveal": "yok",
  "density": "orta; PDP altı DEV boşluklar (kırık bölümler)", "asymmetry": "3 kolon dengeli",
  "anti_patterns": ["transition-all", "tek yüz font", "user-scalable=no", "h1 yok / 63 h2", "boş bölümler"]
}
```

**Görsel dili:** Ürün görselleri fotoğraf değil, marka yeşili degrade **mock üretimler** (kartvizit/vinil rulosu üzerinde prime logosu). Tutarlı ama steril; güven veren gerçek üretim fotoğrafı yok. Galeri thumb'ları çoğu üründe **aynı görselin kopyası** (kartvizitte 2 benzersiz görselin 6 kopyası, kupada 1, vinilde 1).

## 3. PDP anatomisi (7 ürün karşılaştırması)

| Ürün | Seçenek grupları | Adet/fiyat kurgusu | Teslim |
|---|---|---|---|
| Standart Kartvizit | Tasarım desteği (+100₺) · Yön · Tek/Çift · Selefon | 1000→500₺ … 5000→2500₺ **tam lineer, hacim indirimi SIFIR** | 25 July (5 iş g.) |
| Broşür | Kırım (Tek/Z/İçe) · Gramaj · ebat select | 1000→2.158₺ … 10000→11.716₺ **gerçek kademeli** ✓ | 25 July |
| Avrupa Vinil | Gramaj · Solvent/UV · bitiş (Dikiş+Kopça…) | **m² hesaplayıcı**: En×Boy inputu + Birim/Toplam/Çevre tablosu + stepper; 90₺/m²+KDV | **21 July (1 iş g.)** |
| Roll Up | Poster/Mekanizma/İkisi | 380₺+KDV tek satır | 25 July |
| Kupa | — | 1→121₺ … **250→30.250₺ (250 adette bile tane 121₺!)** | 25 July |
| Amerikan Servis | Ebat+gramaj select | 2000→4.125₺, 6000→11.475₺ hafif kademeli | 25 July |
| Önder Cam Plaket | tek-seçenekli 2 grup | 260₺ tek satır, 1 görsel, 2 cümle açıklama | 25 July |

**Buybox mimarisi (tüm PDP'lerde aynı şablon):** başlık(h2) + boş yıldız "(0 yorum)" → radyo grupları (`secenek-1..5` jenerik isimli) → adet radyoları (value=**fiyat**, etiket=adet) → sağ panel: "Toplam Fiyat KDV Dahil" + soluk mint "Sepete Ekle" + tarihli kargo kutusu + drag-drop dosya yükleme + format/DPI/CMYK bilgi bloğu. KDV'li/KDV'siz **switch** mevcut (B2B jesti, iyi fikir).

## 4. Kusur envanteri (kanıtlı)

### 🔴 P0 — satışı fiilen durduranlar
1. **www ↔ apex CORS faciası**: `www.primebaski.com` 200 dönüyor (redirect YOK), tüm AJAX apex'e hardcoded → CORS bloke → **www'dan giren herkese boş anasayfa** ("Ürünler yüklenirken bir hata oluştu" ×2), sepet toplamı/kupon/canlı fiyat ÇALIŞMIYOR ("Veritabanına ulaşılamadı!"). curl teyitli: `Access-Control-Allow-Origin` header'ı hiç yok.
2. **Prod HTML'de dev URL'leri**: kampanya "Sipariş Ver" CTA'ları `http://localhost/prime-baski/…` (2×) ve `http://78.187.11.217.nip.io/prime-baski/…` (2×) — hem kırık CTA hem **dev sunucu IP'sini dünyaya ilan ediyor**.
3. **PDP alt bölümleri boş kabuk**: "Siparişlerim ne zaman teslim edilir?" = boş beyaz kutu; "Sıklıkla Tercih Edilen Benzer Ürünler" = başlık + ~800px boşluk (öneri motoru hiç dolmuyor). Her PDP ~7.400px, yarısı boşluk.

### 🟠 P1 — güven/dönüşüm kırıcılar
4. Buybox içine **ham CSS sızmış**: `.product-detail-qty { border: … }` bloğu görünür metin olarak render oluyor (tüm PDP'ler).
5. Teslim tarihi **İngilizce**: "25 July Saturday günü kargoya verilecektir" (locale unutulmuş).
6. **m² hesap modülü her üründe**: kartvizit/kupa/plaket sayfasında bile "En (m²) / Çevre (m) / Birim 100.00" tablosu duruyor — şablon koşulu yok.
7. Kupa fiyatı 250 adette bile birim indirimsiz (121₺×250) — hacim müşterisini kovalıyor; kartvizit de tam lineer.
8. Çerez bandı **buybox'ın üstüne biniyor** (desktop'ta seçenekleri örtüyor, mobilde ekranın ~%40'ı).
9. **Tek-seçenekli radyo grupları** ("Ofset", "4+0 CMYK", "Tek Yön Baskı", plakette ebat) — seçim yokken seçim UI'ı.
10. "Tasarım Şablonları" kutusu PDP'de boş-durum mesajıyla canlı: "herhangi bir tasarım şablonu bulunmamaktadır" (nav'da da menü öğesi).
11. Yanlış etiket: broşür ebadı **"A7 (10x21 cm)"** — 10×21 DL'dir, A7 değil (7,4×10,5).
12. `magnific-popup.css` 404 (text/html dönüyor) · PayTR taksit tablosu `innerHTML of null` hatası (Taksit tabı muhtemelen boş) · `kupon/` JSON parse hatası (Kazı Kazan/kampanya ölü).
13. Görsel hijyeni: `resim-yok.jpg` placeholder canlıda (Mesh Vinil); 3 emlak afişi aynı görsel; galeri kopya thumb'lar.

### 🟡 P2 — SEO/a11y
14. **h1 sıfır, tek PDP'de 63 h2** (katalog kartlarının hepsi h2) · JSON-LD sıfır · canonical sıfır · `user-scalable=no` (zoom engelli, a11y ihlali) · kart fiyat formatı karışık ("1,000 Adet" İng. binlik + "500,00 ₺" TR) · kategori sayfasında filtre yok, tüm katalog tek sayfada · sticky mobil CTA yok (7.400px sayfada "Sepete Ekle" statik) · CTA kontrastı zayıf (mint #def9ec zemin üzerine yeşil metin).

## 5. Fikir olarak değerli olanlar (Markala'ya uyarlanabilir)

| Fikir | primebaski'de durumu | Markala'ya uyarlama |
|---|---|---|
| KDV'li/KDV'siz fiyat switch'i | Çalışıyor (B2B jesti) | Markala KDV-dahil-tek-fiyat konumunu koruyor; B2B panelde "KDV hariç göster" düşünülebilir |
| m² hesap tablosu: Birim/Toplam satırı + **Çevre (m)** kolonu | Çalışıyor (vinilde) | Çevre metresi branda kopça/dikiş fiyatlaması için mantıklı; Markala area modülüne "çevre" türetimi eklenebilir |
| Tarihli kargo kutusu ("şimdi verirseniz X günü kargoda") | Fikir doğru, uygulama İngilizce | Rakip analizi P1-1'de zaten planda — Markala 1-2 iş günüyle en iddialı tarihi verebilir |
| PDP sağ panelde format/DPI/CMYK bilgi bloğu | İyi içerik, iyi konum | Markala PDP'sinde dosya kuralları benzer görünürlükte mi kontrol edilmeye değer |
| "Her tasarım için ayrı adet seçimi" uyarısı | Net, doğru yerde | Markala'da çoklu tasarım siparişinde aynı netlik faydalı |
| Ücretli "Profesyonel Tasarım Desteği" opsiyonu (+100₺) | Çalışıyor — %20 upsell | Markala "ücretsiz tasarım desteği" söylemiyle ayrışıyor; bilinçli tutulmalı |
| Niyet odaklı arama placeholder'ı ("Ne bastırmak istiyorsunuz?") | Çalışıyor | Zaten P1-4'te planda ("Ne bastıracaksın?" sen diliyle) |

## 6. Sonuç / konumlanma

- Önceki teşhis güçlenerek doğrulandı: **en zayıf rakip** — dahası ürün sayfaları "bitmemiş şantiye": boş bölümler, CSS sızıntısı, dev URL'leri, İngilizce tarihler. Analytics'i de sıfır olduğu için bunu ölçüp fark etmeleri de zor.
- **Tehdit düzeyi: düşük.** Aksiyon gerektiren tek şey izleme (3 ayda bir yeniden study — mevcut plan yeterli).
- **Markala'ya ders (kendi evimiz):** www↔apex davranışı primebaski'yi nasıl vurduysa, Markala'daki bekleyen "CF www-robots" maddesi de aynı aileden — www.markala.com.tr'nin redirect/robots durumu netleştirilmeli (Hasan'da bekleyen madde, önceliği artırmaya değer).
- Fiyat referansı: kartvizit 1000 adet 600₺ KDV dahil, 5 iş günü teslim; Markala 1-2 iş günü üretimle hem hız hem tarih taahhüdünde üstünlük alanına sahip.

## 7. Ham veri

Ekran görüntüleri (repo kökü, commit edilmemiş): `pb-home-desktop.jpeg`, `pb-kategori-kartvizit.jpeg`,
`pb-pdp-kartvizit-full.jpeg`, `pb-pdp-vinil-full.jpeg`, `pb-mobil-pdp-ust.jpeg`, `pb-mobil-pdp-buybox.jpeg`.
Konsol kanıtları: `.playwright-mcp/console-2026-07-18T13-53-08*.log` (www CORS), `…13-54-45*.log` (PayTR/magnific/kupon).
