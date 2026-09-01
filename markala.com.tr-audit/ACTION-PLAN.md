# markala.com.tr — SEO Eylem Planı
> Denetim tarihi: 2026-08-17 · Yöntem: 8 uzman ajan + doğrudan doğrulama
> Bu dosyadaki her bulgu canlı siteden doğrulandı. Ölçülemeyen şeyler açıkça işaretlendi.

## Durum özeti

**Temel çok iyi, vitrin bozuk.** Teknik altyapı bu yaştaki bir site için beklenenin üstünde: schema işaretlemesi zengin ve hatasız (Product + AggregateOffer + MerchantReturnPolicy + LocalBusiness + FAQPage + BreadcrumbList), canonical'lar doğru, alt metinler %100 dolu, title/description uzunlukları uygun, HTTPS/HSTS sağlam. Sorun teknik SEO'da değil; **içerik doldurulmamış, kimlik bilgisi tutarsız ve sayfalar yavaş.**

Sert gerçek: son 90 günde organik arama toplam **88 oturum** getirdi (47'si ana sayfa). 53 kelimede sıralanıyoruz ama hepsi 17-79. sıralarda — yani görünüyoruz, tıklanmıyoruz.

---

# 🔴 KRİTİK — önce bunlar

### 1. Firma adresi sitede 3 farklı şekilde yazılmış
**Kanıt:** Ana sayfa JSON-LD → `Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir`. Footer ve `/yasal/mesafeli-satis` → `Menteş Mah ...`. `/yasal/on-bilgilendirme` → ikisini karıştırıyor.

**Neden kritik:** Google Merchant Center'daki **"Misrepresentation"** askısının bir numaralı şüphelisi tam olarak budur — Google, işletme kimliğinin site genelinde tutarsız olmasını yanlış beyan sayar. 59 ürünün tamamının reddedilmesi ve ücretsiz Shopping listelemelerinin kapalı olması bu askıya bağlı.

**Ayrıca:** Bu düzelmeden backlink/dizin kaydı yapılırsa yanlış NAP internete yayılır ve geri toplamak aylar alır. **Backlink planı bu maddeye bağlı — önce bu.**

**Sadece adres değil, isim de çakışıyor:** `/iletisim` ve footer, `Menteş Mah. 100. Yıl Cumhuriyet Cad.` adresini **"324 Ajans"** adıyla gösteriyor; schema ise **"Markala"** adıyla Astoria One adresini veriyor. Google açısından bu "sitenin sahibi kim, nerede?" sorusunun cevapsız kalması demek — Misrepresentation tanımının tam ortası.

**Yapılacak:** Hangi ad+adres ikilisinin resmî olduğuna karar ver → sitedeki tüm geçtiği yerleri (JSON-LD, footer, `/iletisim`, 3 yasal sayfa) tek kimliğe eşitle. *(Karar senin, uygulama bende.)*

**Ek uyumsuzluk:** `LocalBusiness.areaServed` alanı Mersin/Adana/İstanbul/Ankara/İzmir diyor, ama gerçek şehir sayfaları Gaziantep/Antalya/Hatay/Şanlıurfa/Osmaniye. İkisi eşitlenmeli.

### 2. Yayında "başvuru bekliyor" placeholder'ı duruyor
**Kanıt:** `/yasal/kullanim-kosullari` sayfasında canlı metin: `ETBİS kayıt numarası: [BAŞVURU BEKLEMEDE...]`

**Neden kritik:** Site, zorunlu e-ticaret kaydının eksik olduğunu herkese açık ilan ediyor. Merchant Center incelemesinde doğrudan aleyhte delil. **Yapılacak:** ETBİS numarası varsa yaz, yoksa placeholder'ı kaldır.

### 3. İSG ürün sayfalarının %95'i boş
**Kanıt:** Örneklenen 22 İSG levha sayfasının 21'inde `"Teknik özellik bilgisi yakında eklenecek"` placeholder'ı var. Özgün içerik sayfa başına sadece **~30-47 kelime** (sayfanın ~%79'u site geneli tekrar).

**Kıyas:** Klasik Kartvizit, Broşür gibi standart ürünlerde içerik gerçekten dolu (735-830 kelime). Yani sistem çalışıyor, **veri girilmemiş.** Sorun teknik değil, operasyonel.

**Neden kritik:** En iyi sıralamalarımız İSG kümesinde. O sayfalar boş olduğu için 17-35. sıralarda takılıyor.

### 4. Birbirinin kopyası ürün sayfaları
**Kanıt:** `sigara-icilmez` ailesi **%97-100** kelime-seti benzerliği; `exit-asagi` / `exit-sol` dekota çifti **%99,4**. Sitemap'te `-levhasi-2`, `-levhasi-3` gibi varyant slug'lar var.

**Yapılacak:** Gerçek varyantları tek sayfada seçenek olarak birleştir, gereksiz URL'leri 301 ile ana sayfaya yönlendir.

### 5. Olmayan sayfalar HTTP 200 dönüyor (soft-404)
**Kanıt (kendi testim):**
| İstek | Dönen |
|---|---|
| `/urun/olmayan-urun-9999` | **200 OK** (içerik "Sayfa Bulunamadı") |
| `/kategori/olmayan-kategori-9999` | **200 OK** |
| `/yasal/olmayan-sayfa-12345` | **200 OK** + ana sayfa başlığı |
| `/rastgele-olmayan-sayfa` | 404 ✅ (doğru) |

**Neden önemli:** Google sınırsız çöp URL indeksleyebilir; silinen ürünlerin adresleri sonsuza kadar 200 döner; tarama bütçesi boşa gider. Koddaki `notFound()` üretimde gerçek 404 üretmiyor. **Bu tamamen bende — düzeltebilirim.**

### 6. Ana sayfa mobilde çok yavaş
**Kanıt (Lighthouse, mobil, tek koşu):** Performans **51/100** · LCP **8,85 sn** (eşik 2,5) · CLS **0,292** (eşik 0,1) · TBT 317 ms · TTFB 160 ms (iyi).

Sunucu hızlı (TTFB 160 ms), sorun ön yüzde. Tespitim: hero görselleri `api.markala.com.tr`'den geliyor, **~200 KB JPEG** (WebP/AVIF değil) ve `preload`/`fetchpriority` verilmemiş — preload edilen tek görsel logo. `srcset` hiç kullanılmıyor.
*Not: Alan adına `preconnect` mevcut (bir ajan eksik demişti, doğrulayıp düzelttim).*

---

# 🟠 YÜKSEK

### 7. Şehir sayfaları birbirine fazla benziyor
**Kanıt (8-gram Jaccard ölçümüm):** Şehir sayfaları arası benzerlik **%63-86** (Adana↔Hatay %86,3). Farklı sayfa tipleri arası boilerplate tabanı ise sadece **%20**. Yani benzerlik menü/footer'dan değil, içerikten geliyor.

İlçe sayfalarında özgün içerik sayfa başına sadece **~40-60 kelime** (toplam ~440 kelime). Mersin'in 8 ilçe sayfası var, diğer 6 şehrin hiç yok.

**Risk:** Doorway-page. AS 2 otoriteyle bu yapıyı çoğaltmak tehlikeli. **Yapılacak:** Mevcutları güçlendir, yeni ilçe sayfası ekleme.

### 8. AI botları — durum sandığımdan iyi (önceki uyarımın düzeltmesi)

Konuşmanın başında "AI alıntı botları kapalı" demiştim; bot bazında incelenince **bu yanlış çıktı.** Gerçek tablo:

| Bot | Görevi | Durum | Karar |
|---|---|---|---|
| `OAI-SearchBot` | ChatGPT canlı alıntı | **Açık** ✅ | Açık kalsın (kurala açıkça yaz) |
| `Claude-User` / `Claude-SearchBot` | Claude canlı alıntı | **Açık** ✅ | Açık kalsın (açıkça yaz) |
| `PerplexityBot` | Perplexity alıntı | **Açık** ✅ | Açık kalsın (açıkça yaz) |
| `GPTBot` | OpenAI **eğitim** | Kapalı | Kapalı kalsın — alıntıya etkisi yok |
| `Google-Extended` | Gemini **eğitim** | Kapalı | Kapalı kalsın — **AI Overviews'ı etkilemiyor** |
| `CCBot` | Toplu arşiv | Kapalı | Kapalı kalsın |
| `ClaudeBot` | Anthropic genel tarayıcı | Kapalı | ⚠️ **Tek şüpheli madde** |

**Tek gerçek risk `ClaudeBot`:** Anthropic canlı getirmeyi ayrı token'lara böldü, ama bir kısmı hâlâ `ClaudeBot` üzerinden geliyorsa, **tek satışımızı getiren kanalı** kapatıyor olabiliriz. Doğru yaklaşım: alıntı botlarını `robots.txt`'e açıkça yaz, GA4'te "AI Assistant" kanalını izle; düşüş olursa `ClaudeBot`'u aç.

**Asıl AI görünürlük engeli robots.txt değil:** üçüncü taraf doğrulama eksikliği (Wikipedia/Reddit/YouTube'da marka izi yok) ve **Bing Webmaster kaydının olmaması** — ChatGPT ve Copilot Bing indeksine dayanıyor.

### 9. İade ve kargo politikası sitemap'te yok
**Kanıt:** Sitemap'te yalnız `/yasal/gizlilik`, `/yasal/kvkk`, `/yasal/mesafeli-satis` var. `/yasal/iade`, `/yasal/kargo`, `/yasal/on-bilgilendirme`, `/yasal/kullanim-kosullari` **yok** (footer'dan linkli, o yüzden taranabiliyor ama sitemap'te olmalı — Merchant itirazında önemli).

### 10. Ürün schema'sında uydurma stok kodu
**Kanıt:** Bazı ürünlerde `sku`/`mpn` alanına gerçek kod yerine **URL slug'ı kopyalanmış**. Merchant Center aktif "Misrepresentation" askısındayken ürün kimlik verisinin uydurma olması ek risk. **Yapılacak:** Gerçek stok kodu yoksa alanı tamamen kaldır (boş bırakmak, uydurmaktan iyidir).

### 11. Ana sayfada kaldırılmış schema tipi
**Kanıt:** Ana sayfada **HowTo** bloğu var — Google bu tipi Eylül 2023'te kaldırdı. Zararsız ama ölü kod; temizlenmeli. Ayrıca `Offer.seller` dolu Organization kaydına bağlanmak yerine zayıf bir stub olarak duruyor.

### 12. Diğer teknik düzeltmeler
- **CSP sadece report-only** — gerçek XSS koruması yok (ödeme alan site için ciddi).
- **Sitemap `lastmod` güvenilmez** — 897 URL'nin 826'sı aynı milisaniye damgasını taşıyor, 56'sında (ana sayfa dahil) hiç yok.
- **`http://www` iki hop** ile canonical'a gidiyor, tek kuralla çözülmeli.

---

# 🔍 Sıralama analizi — önceki önceliklendirme düzeltmesi

Gerçek Google TR sonuçları incelendiğinde sayfa-tipi stratejisinin **büyük ölçüde doğru** olduğu görüldü. Sorun "yanlış sayfa tipi" değil, üç ayrı sebep:

**1. "zorunluluk ifade eden... hangi renk kullanılır" (1.900/ay, #76) — beklediğimden düşük değerli.**
Bu sorgunun SERP'i **İSG sınav hazırlık siteleri** (isgsorucoz.com, isgasistan.net) tarafından domine ediliyor. Yani aramaların önemli kısmı **sınava hazırlanan öğrenciler**, levha satın alacak işletmeler değil. Daha önce bunu en büyük fırsat olarak işaretlemiştim — **hacim büyük ama ticari değeri düşük**, öncelik sırasını buna göre düşürüyorum. (Yine de rehber sayfasının H1'i bu spesifik soruyu cevaplamıyor; cevap SSS'nin 2. maddesinde gömülü.)

**2. "gaziantep matbaa" (720/ay, #34) — içerikle kazanılamaz.**
İlk 9 sonucun 8'i Gaziantep'te fiziksel işletme; sorgu yerel-paket bölgesi. Mersin merkezli hizmet-alanı sayfasıyla bu sıralama alınmaz. **Bu kelimeyi bırak** veya yalnız GBP/yerel stratejiyle ele al.

**3. Ürün sorgularında sorun otorite.**
"dikkat kaygan zemin", "dikkat ölüm tehlikesi", "emniyet kemeri" gibi ticari sorgularda sayfa tipimiz doğru (ürün sayfası) ve schema'mız sağlam — kaybettiğimiz yer Trendyol/Hepsiburada/Cimri karşısında **AS 2 otorite farkı.** Burada çözüm içerik değil, backlink + içerik doldurma.

**4. Gerçek tip uyumsuzluğu bulundu:** "topraklama sembolü" (210/ay, **#71**) — çıplak ürün sayfası, ama SERP "nedir/anlamı" tipi bilgi içeriğiyle dolu. Bu tam da aradığımız kalıp. Benzer "sembol/işaret anlamı" sorguları için `/sozluk` altına açıklayıcı sayfalar açıp oradan ürüne link vermek doğru hamle.

**Persona değerlendirmesi:** en zayıf olduğumuz iki profil — teknik araştırmacı (21/100) ve İSG sınav adayı (35/100); ikisi de tanım/açıklama içeriğinin yokluğundan ve sayfaların yalnız "satın al" çağrısı sunmasından kaynaklanıyor.

---

# ✅ İyi durumda olanlar (dokunma)

- **Schema işaretlemesi** — Product, AggregateOffer, MerchantReturnPolicy, OfferShippingDetails, LocalBusiness, FAQPage, BreadcrumbList, CollectionPage, Service, WebSite. Örneklemde hata yok. Bu yaştaki bir site için sıra dışı iyi.
- **Görsel alt metinleri** — örneklenen 19 sayfada eksik yok.
- **Title/meta uzunlukları** — 26-60 / 85-158 karakter, uygun.
- **Canonical + indexability** — 33 URL örneğinde hepsi doğru.
- **Standart ürün içerikleri** — kartvizit/broşür ailesinde gerçek teknik içerik var.

---

# 📋 İş listesi

## A. Hasan'ın yapacakları (karar/hesap gerektirir)

| # | İş | Süre | Not |
|---|---|---|---|
| A1 | **Ads faturası** | 10 dk | 8 gündür kampanyalar kapalı |
| A2 | **Doğru adrese karar ver** (Astoria One mı, Menteş Mah mı?) | 5 dk | 1 ve 2 numaralı kritik maddeler buna bağlı |
| A3 | **ETBİS numarası** — varsa ver, yoksa başvur | — | Placeholder yayında |
| A4 | **Google Business Profile** kaydı | 15 dk | A2'den sonra, doğru adresle |
| A5 | **İSG ürün açıklamalarını doldur** (~21+ sayfa) | operasyonel | En yüksek sıralama getirisi burada |
| A6 | **Bing Webmaster** kaydı | 5 dk | GSC'den tek tıkla içe aktarma |
| A7 | Merchant Center itirazı | A2+A3 sonrası | Düzeltmeler yapılmadan itiraz etme |

## B. Bende (kod — onayınla yaparım)

| # | İş | Etki | Görünür mü? |
|---|---|---|---|
| B1 | Soft-404 düzeltmesi (`/urun`, `/kategori`, `/yasal`) | Tarama bütçesi, indeks temizliği | Hayır |
| B2 | Adres tutarlılığı — tüm geçtiği yerleri eşitle | Merchant askısı | Sadece adres metni |
| B3 | Hero görselleri: WebP/AVIF + `fetchpriority=high` + `srcset` | LCP 8,85sn → hedef <2,5sn | Hayır (görsel aynı) |
| B4 | CLS: üstteki görsel/alanlara boyut rezervasyonu | CLS 0,292 → hedef <0,1 | Hayır |
| B5 | Sitemap: eksik yasal sayfaları ekle + `lastmod` düzelt | İndeksleme, Merchant | Hayır |
| B6 | `robots.txt`: alıntı botlarını açıkça yaz (zaten açıklar), eğitim botları kapalı kalsın | Koruma amaçlı | Hayır |
| B7 | CSP'yi enforce moda al | Güvenlik | Hayır |
| B8 | `http://www` tek-hop redirect | Küçük | Hayır |
| B9 | Kopya ürün sayfalarını birleştir + 301 | Duplicate içerik | Evet — onay gerekir |
| B10 | Yeni İSG rehber sayfaları (2-3 adet) | Yeni sıralama alanı | Yeni sayfa (mevcuda dokunmaz) |

## Önerilen sıra

1. **A2 + A3** (karar) → **B2 + B5** (uygula) → **A7** (Merchant itirazı)
2. **B1, B3, B4** (teknik, görünmez, hızlı kazanç)
3. **A5** (İSG içerik doldurma — sıralamayı asıl bu taşır)
4. **B6 + A6** (AI görünürlüğü — tek satışın geldiği kanal)
5. **A4** (GBP) → backlink planı devreye girer
6. **B9, B10** (içerik konsolidasyonu ve genişleme)

---

## Ölçülemeyenler (dürüstlük notu)

- **Alan/sayfa CWV alan verisi (CrUX):** PSI API anahtarı olmadığı için çekilemedi. Elimizdeki tek ölçüm ana sayfa mobil lab koşusu. Kategori/ürün/rehber sayfaları hiç ölçülmedi.
- **Search Console verisi:** Toolkit token'ında GSC yetkisi yok — gerçek tıklama/gösterim verisi yerine Semrush tahminleri kullanıldı.
- **Ahrefs:** Abonelik API erişimini kapsamıyor.
- **Semrush backlink detayı:** Aylık API kotası doldu.
- **860 ürünün tamamı taranmadı** — 26 sayfa tam metin analiz edildi, kalan katalog için örnekleme ve slug analizi kullanıldı.
