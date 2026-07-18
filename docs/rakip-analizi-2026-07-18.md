# Rakip Analizi — 5 Online Matbaa (2026-07-18)

> Yöntem: Hallmark `study` URL-modu (tasarım DNA'sı) + e-ticaret UX katmanı; 5 paralel ajan,
> her site için ana sayfa + kategori + ürün detay ham HTML/CSS incelemesi.
> Kural: rakip DNA'sı yalnız **teşhis**tir — `design.md`'ye/tasarım sistemine işlenmez, piksel kopyalanmaz.
> Markala kimliği: `docs/marka-kimligi.md` (ALTIN KURAL) + kök `design.md`.

## 1. Karşılaştırma matrisi

| Boyut | baskikapinda | bidolubaski | primebaski | matbuu | baskimo | **Markala** |
|---|---|---|---|---|---|---|
| Platform | Custom PHP + Bootstrap 5 + jQuery | **Next.js + headless Drupal Commerce** | Custom PHP + ThemeForest "Nest" şablonu | Custom PHP (jQuery 1.11, 2014!) | web2print SaaS (tahmin: OnPrintShop) | Next.js + NestJS (özel) |
| Font | Roboto | Roboto | Roboto | proxima-nova | Poppins | **Poppins + Caveat** |
| Accent | fuşya #e60087 (hover turuncu — tutarsız) | gök mavisi #0ea9f1 | şablon yeşili #3bb77e | açık mavi #1aa5de | turuncu #ff4a00 + siyah | **mor #4B3AA0 + sarı #FFB91C** |
| Kart fiyatı | +KDV (PDP'de dahil — tutarsız) | **+KDV** | KDV toggle (B2B jesti) | format tutarsız (62,00 / 239.00) | +KDV, İngilizce format (1,778.48TL) | **KDV dahil, TR format** ✓ |
| "X₺'den başlayan" çıpası | yok | yok | yok | **var** | yok | **var** ✓ |
| Ücretsiz kargo eşiği | söylem yok | 1500₺ | 1500₺ | yok | 1950₺ (KDV hariç!) | **1500₺ + progressbar** ✓ |
| Görünür yorum/puan | yok | **PDP'de 4.78 / 1.321 yorum** | tümü "0 yorum" | statik 3 testimonial | Yotpo yüklü, boş | var ✓ (birikim gerekiyor) |
| PDP Product/Offer JSON-LD | yok | var (client-inject, riskli) | yok | yok | yok | **var, SSR** ✓ |
| WhatsApp | var (0552…) | yok | yok | yok | yok | **var** ✓ |
| Online tasarım editörü | yok | **var** | yok | **var** | **var** | branch'te (feat/tasarim-araci, merge edilmedi) |
| Üretim hızı vaadi | 7–10 gün | 5 gün std / 2 gün **paralı ekspres** | muğlak | 2–8 gün ürün bazlı | ~10 gün | **1–2 iş günü** ✓ |
| Tarihli teslim gösterimi | **"En geç 21 Temmuz Salı kargoda"** | "Tahmini Kargo Tarihi" | yok | kartta "X Gün" | dinamik tahmini tarih | **var** ✓ (EstimatedDelivery: "En geç X kargoda" + 14:00 cutoff — ilk sürüm raporu yanlışlıkla "yok" demişti) |
| Analytics/reklam | GA4+Ads+Pixel | GTM | **SIFIR** | GTM+Criteo | GTM+Pixel+Klaviyo+Optimonk | GA4+Ads+Pixel+**CAPI** ✓ |

## 2. Sektör genelinde görülen desenler

**Herkesin yaptığı:** banner-karusel hero (5/5) · tek yüz font (5/5, hepsi jenerik) · mega/dropdown menü ·
"ücretsiz tasarım desteği" söylemi · transition-all + hover-scale şablon refleksleri.

**Kimsenin yapmadığı (Markala'nın boş sahnesi):**
- Tutarlı, tanınır marka kimliği — 5 rakibin 5'i de jenerik şablon estetiğinde; sarı hap CTA + mor zeminle çakışan kimse yok.
- KDV dahil şeffaf fiyat (yalnız Markala) — reklam karşılaştırma kozu.
- Hız liderliği: 1–2 iş günü vaadi (en yakın rakip paralı ekspresle 2 gün).
- SSR Product/Offer JSON-LD + kart yıldızı + fiyat çıpası kombinasyonu.

## 3. Site bazlı özet teşhisler

### baskikapinda.com — ⚠️ MERSİN'DE YEREL RAKİP (Akdeniz/Matiat İş Merkezi)
Bootstrap teması + fuşya; Trendyol öykünmesi (rozet ikonu Trendyol CDN'inden hotlink). 12 slaytlık hero, 108 slide anasayfa.
Güçlü: **tarihli kargo taahhüdü** ("En geç … Salı kargoda"), şablon indirme, "Acil Baskı" kategorisi, Ads+Pixel aktif.
Zayıf: +KDV/dahil tutarsızlığı, 7–10 gün üretim, JSON-LD ve h1 yok, sıfır yorum, 3 ikon fontu + 30 font kesimi (performans).

### bidolubaski.com — SEKTÖR LİDERİ, EN CİDDİ RAKİP
Next.js + headless Drupal; shadcn token'lı ama Roboto-jenerik yüzey; kimlik banner'lara ve emoji'lere ihale edilmiş.
Güçlü: **ekspres üretim upsell'i** (hızı opsiyon olarak satıyor), tek üründe 1.321 yorum (4.78), online editör + şablon kütüphanesi,
alt limitsiz 6 taksit, ilk sipariş %40 edinim kampanyası, "Önerilen/Daha Avantajlı" tiraj rozetleri.
Zayıf: +KDV fiyat (sepette büyür), WhatsApp/canlı destek yok, buybox client-side (yavaş ilk fiyat), ana sayfa/kategori JSON-LD yok,
h1 sayfa dibinde, 1,2–1,5 MB HTML payload.

### primebaski.com — EN ZAYIF RAKİP
ThemeForest "Nest" şablonu (market yeşili, sektörle bağsız); Bootstrap 5.0.0-beta1.
Güçlü (fikir olarak): KDV'li/KDV'siz toggle, 11 sektör kartı girişi, "Ne bastırmak istiyorsunuz?" niyet odaklı arama, Kazı Kazan.
Zayıf: **canlıda localhost'a link veren kırık hero CTA**, **sıfır analytics** (ölçemiyor, remarketing yapamıyor),
tümü 0 yorum, WhatsApp yok (destek cep no), JSON-LD/canonical/h1 yok, user-scalable=no.

### matbuu.com — KIDEM OYUNCUSU
2015-18 dönemi yüzey (jQuery 1.11), tek mavi, proxima-nova.
Güçlü: "69 Yıllık Tecrübe" + Turkcell/Philips logo duvarı, kartta **"25 Adet / 8 Gün"** ikilisi, agresif title çıpaları
("Kartvizit Bastır | 1000 Adet 149₺'den"), şablon indirme (PSD/AI/CDR/INDD), online tasarla.
Zayıf: PDP JSON-LD sıfır, yıldız/puan yok, WhatsApp yok, ücretsiz kargo söylemi yok, kategori sayfaları cılız (5 ürün, filtresiz),
fiyat ancak AJAX "Hesaplanıyor…" sonrası, ondalık format tutarsız.

### baskimo.com — BÜYÜME YIĞINI GÜÇLÜ, YERELLEŞTİRME ÖZENSİZ
Web2print SaaS platformu; siyah birincil + dağınık turuncu accent.
Güçlü: 4-yollu tasarım akışı (şablon/yükle/online tasarla/hizmet), "satın al, dosyayı sonra yükle", dinamik teslim tarihi,
Klaviyo+Optimonk+Yotpo yığını, geri sayımlı sitewide kampanya.
Zayıf: KDV hariç + İngilizce sayı formatı ("1,778.48TL"), "0.00TL" bozuk kartlar, **dosya kontrolü +300₺ ücretli**,
telefon/WhatsApp yok, 1950₺ (KDV hariç) yüksek kargo eşiği, ~10 gün üretim, "%10 fire / ±%15 renk sapması" güven kırıcı söylem.

## 4. Aksiyon planı (öncelikli)

### P1 — hızlı, yüksek etki (kod tarafı küçük)
1. **Tarihli teslim taahhüdü** PDP'ye: "En geç <tarih> kargoda" (baskikapinda/baskimo kalıbı; Markala 1–2 iş günüyle en iddialı tarihi verebilir). *UI değişikliği → önce önizleme + Hasan onayı.*
2. **Tiraj satırlarına "Önerilen" / "Daha avantajlı" rozetleri** (bidolubaski mekaniği; birim fiyat düşüşünü görünür kılar). *Önizleme + onay.*
3. **Reklam/karşılaştırma söylemi:** "KDV dahil şeffaf fiyat — sepette sürpriz yok" + "1–2 iş günü üretim" (rakipler 5–10 gün). Ads metinlerine ve site güven bandına işlenebilir.
4. Arama placeholder'ı niyet odaklı yap — ama rakiplerden farklılaşarak marka diliyle: **"Ne bastıracaksın?"** (sen dili). *Önizleme + onay.*

### P2 — orta vade
5. **feat/tasarim-araci merge kararı** — 3/5 rakipte online editör CANLI; bu artık sektör hijyen faktörü. (Bekleyen: ICC + hukuk, Hasan'da.)
6. **Şablon indirme** (ürün bazlı PDF/AI baskı şablonları) — matbuu/baskikapinda/baskimo'da var; tasarımcı segmentini yakalar.
7. **Sektör kartları vitrini** anasayfaya (primebaski'nin 11 kartı fikir; Markala'da /teklif-al?sektor= altyapısı hazır). *Önizleme + onay.*
8. **Yorum birikimi motoru:** teslim sonrası yorum daveti e-postası (bidolubaski'nin 1.321 yorumu tek gerçek hendeği; DB sıfırlandığı için birikim sıfırdan başlıyor).

### P3 — konumlanma / izleme
9. **Mersin yerel cephesi:** baskikapinda aynı şehirde ve Ads+Pixel çalıştırıyor → Mersin geo hedefli kampanya + Google Business Profile güçlendirme.
10. "Hız zaten dahil" söylemi: bidolubaski hıza para alıyor — "Bizde ekspres ücretsiz: standart üretim 1–2 iş günü" karşı-konumlanması.
11. İlk sipariş kampanya kıyası: bidolubaski %40 (en düşük ürüne), Markala ACILIS15 %15 — edinim teklifinin gözden geçirilmesi (marj kararı Hasan'ın).
12. İzleme: primebaski analytics'siz (agresifleşirse görürüz), baskimo Klaviyo/Optimonk büyüme denemeleri yapıyor — 3 ayda bir yeniden study.

## 5. Ham veri

Ajan ham dosyaları (HTML/CSS): oturum scratchpad'i (`…\49e0f6fe…\scratchpad\`) — kalıcı değil.
Bu rapor tek kalıcı kaynak; ayrıntılı ajan çıktıları konuşma kaydında.
