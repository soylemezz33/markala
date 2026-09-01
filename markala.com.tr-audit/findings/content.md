# Markala.com.tr — İçerik Kalitesi ve E-E-A-T Denetimi

**Tarih:** 2026-08-17
**Kapsam notu:** Bu denetim, 953 sayfalık sitede sınırlı ama hedefli bir örneklem üzerinden yapılmıştır (26 ürün sayfası tam metin ölçümü ile). `/matbaa/` şehir sayfaları ve `/rehber/`, `/blog/`, `/hakkimizda` sayfaları bu turda **doğrudan fetch edilip ölçülmedi** (koordinatör veri toplamayı durdurdu); bu bölümlerdeki değerlendirmeler görev bağlamında verilen bilgilere ve site genelindeki gözlemlenen kalıplara dayanan **çıkarımlardır**, ölçüm değildir — açıkça etiketlenmiştir. Bir sonraki turda bu sayfaların ayrıca fetch edilmesi önerilir.

---

## Özet (İlk 5 Bulgu)

1. **KRİTİK — Ürün sayfalarının büyük çoğunluğunda "gerçek" özgün içerik ~30-50 kelime.** Örneklenen 22 İSG uyarı levhası ürününün (26 üründen) tamamına yakınında "Teknik özellik bilgisi yakında eklenecek." placeholder metni tespit edildi ve sayfa metninin ~%79'u site genelinde birebir tekrar eden boilerplate (rozetler, SSS, yorum çağrısı, ilgili ürünler). Trafilatura toplam kelime sayısı ~226-247 görünse de gerçek benzersiz içerik ürün adı + tek bir mail-merge cümlesinden ibaret.
2. **KRİTİK — Neredeyse birebir kopya ürün sayfaları mevcut.** "sigara-icilmez" ailesindeki 5 varyant arasında kelime-seti Jaccard benzerliği %96,9–%100; "exit-asagi-ok" / "exit-sol-ok" dekota levhaları arasında %99,4 — tek fark yön kelimesi. Bu, Google'ın "doorway/near-duplicate" tanımına doğrudan girer.
3. **İYİ — Standart kırtasiye/baskı ürünlerinde (kartvizit, broşür) gerçek, özgün ve teknik olarak doğru içerik var.** Klasik Kartvizit sayfası ~250+ kelime somut spesifikasyon (gramaj, ebat, taşma payı, üretim süresi) içeriyor — İSG levha şablonunun tam tersi bir kalite seviyesi. Bu, sorunun teknik değil **operasyonel/içerik-doldurma** kaynaklı olduğunu gösteriyor.
4. **İYİ — Ürün sayfalarında zengin structured data var** (Product, FAQPage, MerchantReturnPolicy, OfferShippingDetails, AggregateOffer, BreadcrumbList, LocalBusiness, Organization) — AI alıntılanabilirliği ve zengin sonuç potansiyeli için sağlam bir teknik temel, ancak SSS ve ürün detay içeriği boş/placeholder olduğu için bu şemanın değeri sınırlanıyor (şema "boş kutuyu" işaretliyor).
5. **BELİRSİZ/ölçülemedi — E-E-A-T'nin görünür güven sinyalleri (yazar bilgisi, hakkımızda, /rehber sayfalarındaki uzmanlık sinyalleri) bu turda doğrudan doğrulanamadı.** Ürün sayfası altbilgisinde KVKK/İade/Mesafeli Satış Sözleşmesi'ne referanslar var (son commit geçmişiyle uyumlu — yasal sayfalar Ağustos 2026'da seed edildi), bu olumlu bir sinyal; ancak yazar/uzman kimliği, "hakkımızda" sayfasının içeriği ve müşteri yorumlarının gerçek hacmi doğrulanamadı.

---

## 1. Thin Content — /urun/ Sayfaları

**Örneklem:** 26 ürün sayfası, tam `extracted_text` ölçümü (trafilatura, boilerplate ayıklanmış). Kategoriler: İSG uyarı/yasaklayıcı/yangın/elektrik levhaları (22 sayfa), kartvizit/broşür/zarf gibi standart baskı ürünleri (4 sayfa: klasik-kartvizit, brosur, selefonlu-brosur, pro-brosur, zarf-torba).

### Ölçüm sonuçları

| Sayfa | Trafilatura kelime sayısı | "Ürün Detayları" dolu mu? | Not |
|---|---|---|---|
| /urun/klasik-kartvizit | 346 | Evet — gerçek spesifikasyon | Referans/iyi örnek |
| /urun/brosur | 365 | Evet | İyi |
| /urun/selefonlu-brosur | 336 | Evet | İyi |
| /urun/pro-brosur | 267 | Evet (placeholder yok) | İyi |
| /urun/zarf-torba | 286 | Evet | İyi |
| /urun/sigara-icilmez | 226 | **Hayır — placeholder** | |
| /urun/tehlike-sigara-icilmez | 229 | **Hayır** | |
| /urun/sigara-icmek-ve-acik-alev-yasaktir-3 | 238 | **Hayır** | |
| /urun/tehlike-sinirlanmis-alan-kesinlikle-sigara-icilmez(-levhasi) | 238-241 | **Hayır** (2 URL, aynı ürün) | |
| /urun/yangin-ihbar-telefonu-fotolumenli | 232 | **Hayır** | |
| /urun/yangin-hortumu-dolabi-panoromik-levha-35-x-56-cm | 247 | **Hayır** | |
| /urun/acil-dus-goz-banyosu-levhasi | 246 | **Hayır** | |
| /urun/quality-control-approved-label | 180 | **Hayır** | |
| /urun/l2-etiketi | 174 | **Hayır** | |
| /urun/exit-asagi-ok-fotolumenli-dekota-12x295-cm | 246 | **Hayır** | |
| /urun/exit-sol-ok-fotolumenli-dekota-12x295-cm | 246 | **Hayır** | |
| /urun/yangin-sondurucu-halokarbon-kullanim-alanlari-levhasi | 238 | **Hayır** | |
| /urun/yuksek-voltaj-olum-tehlikesi | 237 | **Hayır** | |
| /urun/elektrikcinin-isini-elektrikciye-birak | 235 | **Hayır** | |
| /urun/tehlike-yuksek-gerilim-yaklasma-levhasi | 238 | **Hayır** | |
| /urun/pano-kapaklarini-kapali-tut | 235 | **Hayır** | |
| /urun/dikkat-forklift-calisma-alani-levhasi | 238 | **Hayır** | |
| /urun/konveyor-uzerinde-yurume-levhasi | 243 | **Hayır** | |
| /urun/ko-r-nokta-kendinize-dikkat-ediniz-uyari-levhasi | 239 | **Hayır** | |
| /urun/makina-calisirken-tamir-ve-bakim-yapmayiniz-levhasi | 241 | **Hayır** | |

**Sonuç: örneklenen 22 İSG levha sayfasının 21'inde (%95) "Teknik özellik bilgisi yakında eklenecek." placeholder'ı bulundu.** Sadece standart kırtasiye/baskı ürün sayfaları (4/4) gerçek içerik doldurulmuş durumda.

### Boilerplate oranı (örnek: /urun/sigara-icilmez)

Sayfanın 226 kelimesinin gerçek ürüne özgü kısmı sadece başlık + tek bir mail-merge cümlesi (~47 kelime, ve bu cümlenin kendisi de şablon — sadece ürün adı ve kategori değişiyor: *"[Ürün Adı] — iş güvenliği levhası ([Kategori]). Bu ürün TEKLİF USULÜYLE satılır: sepete ekleyip sipariş oluşturun; ekibimiz en uygun ebat, malzeme ve fiyatla en kısa sürede dönüş yapar..."*). Geri kalan **~%79'u** (rozetler, "Sık Sorulan Sorular" — fire toleransı boilerplate'i, yorum çağrısı, "Aynı kategoride" ilgili ürün linkleri) sitedeki neredeyse her ürün sayfasında birebir aynı.

### Near-duplicate ölçümü (kelime-seti Jaccard benzerliği)

| Sayfa çifti | Benzerlik |
|---|---|
| exit-asagi-ok-fotolumenli-dekota-12x295-cm vs exit-sol-ok-...-12x295-cm | **%99,4** |
| tehlike-sinirlanmis-alan-kesinlikle-sigara-icilmez-levhasi vs ...-sigara-icilmez (URL varyantı) | **%100** |
| sigara-icilmez vs tehlike-sigara-icilmez | %99,4 |
| sigara-icilmez vs sigara-icmek-ve-acik-alev-yasaktir-3 | %99,4 |
| tehlike-sigara-icilmez vs sigara-icmek-ve-acik-alev-yasaktir-3 | %98,7 |
| tehlike-sinirlanmis-alan... vs sigara-icilmez | %97,5 |

**Şiddet: KRİTİK.** 860 /urun/ sayfasının büyük çoğunluğu (kategori dağılımına bakıldığında — 33 kategoriden ~11'i `is-guvenligi-*` alt kategorisi) İSG levha/etiket ürünleri. Örneklem oranı doğrudan ekstrapolasyonla (**tahmin, ölçüm değil**): sitedeki 860 üründen kabaca 500-700'ünün benzer "yakında eklenecek" şablonunu taşıdığı ve bunların önemli bir kısmının komşu varyantlarıyla %95+ kelime örtüşmesine sahip olduğu tahmin edilmektedir. Bu, hem "thin content" hem "doorway/near-duplicate page" risklerini aynı anda taşıyor — QRG Eylül 2025'e göre "Lowest quality" sınıflandırması riski yüksek, özellikig Google'ın crawl bütçesini 860 sayfaya yayarken bu sayfaların index'te "ana sayfa" olarak seçilip seçilmeyeceği (canonical/duplicate consolidation) belirsiz.

---

## 2. /matbaa/ Şehir Sayfaları — Tekrarlılık Riski

**ÖNEMLİ KISIT:** Bu bölüm bu turda **fetch edilip ölçülmedi**. Aşağıdaki değerlendirme yalnızca URL yapısına ve genel doorway-page kalıplarına dayanan bir **risk çıkarımıdır**, kanıt değildir.

Sitemap'te 15 sayfa bulundu (görev metninde "16" deniyordu, gerçek sayı 15):
- 7 il sayfası: mersin, antalya, adana, sanliurfa, hatay, osmaniye, gaziantep
- 8 Mersin ilçe sayfası: tarsus, yenisehir, akdeniz, toroslar, mezitli, erdemli, silifke, anamur

**Risk sinyalleri (yapısal, ölçülmeden görülebilir):**
- İlçe-seviyesi sayfalandırma (8 Mersin ilçesi) klasik "franchise/city doorway page" kalıbıdır — genellikle şehir adı değişkeninin şablon metne enjekte edildiği, gerçek yerel farklılaşma (yerel ekip, yerel referans, yerel teslimat detayı) olmayan sayfalar bu kalıpla üretilir.
- Diğer il sayfaları (Antalya, Adana, Şanlıurfa, Hatay, Osmaniye, Gaziantep) için şirketin Mersin merkezli olduğu bilgisi göz önüne alındığında, bu şehirlerde fiziksel/yerel varlık (adres, ekip, saha deneyimi) olması düşük ihtimal — bu da "yerel deneyim" E-E-A-T sinyalini zayıflatan bir yapı.

**Şiddet: YÜKSEK (doğrulanmamış tahmin).** Ürün sayfalarında gözlemlenen "şablonu doldur, değişkeni değiştir" kalıbının site genelinde bir mühendislik/üretim alışkanlığı olduğu düşünülürse (bkz. Bölüm 1), matbaa şehir sayfalarının da benzer bir risk taşıması olasıdır. **Önerilen aksiyon: bir sonraki denetim turunda en az 5 /matbaa/ sayfası (ör. mersin, antalya, mersin/tarsus, mersin/mezitli, gaziantep) tam metin çekilip Jaccard/duplicate ölçümü yapılmalı.** Bu ölçüm yapılmadan kesin "doorway page" tespiti yapılamaz; şu an sadece bir kırmızı bayrak olarak işaretleniyor.

---

## 3. E-E-A-T Değerlendirmesi

**Ölçülen (ürün sayfası altbilgisinden doğrudan gözlemlenen) sinyaller:**

| Sinyal | Durum | Kanıt |
|---|---|---|
| İade politikası | Var | Ürün sayfasında "İade Politikası" referansı + JSON-LD `MerchantReturnPolicy` bloğu (klasik-kartvizit sayfasında doğrulandı) |
| Mesafeli Satış Sözleşmesi | Var | "Mesafeli Satış Sözleşmesi Madde 7.A" referansı her ürün sayfasının SSS boilerplate'inde |
| KVKK | Muhtemelen var (doğrudan fetch edilmedi) | Git commit geçmişi: "Gizlilik + KVKK Aydınlatma + Mesafeli Satış içerikleri" Ağustos 2026'da seed edildi (`569a691`, `ed4c0b0` commit'leri) — kod tabanında mevcut, canlıda görünürlüğü bu turda doğrulanmadı |
| Kargo/teslimat şeffaflığı | Var | JSON-LD `OfferShippingDetails`, sayfa metninde "DHL Türkiye geneli, 1-3 iş günü" gibi somut detaylar (kartvizit sayfasında) |
| Ödeme güvenliği | Var (teknik) | CSP header'da iyzico (PCI-DSS uyumlu Türk ödeme altyapısı) entegrasyonu görüldü; "3 taksit imkânı" rozeti |
| Kalite garantisi | Var (iddia, kanıtsız) | "Kalite garantisi — hatalı baskıda ücretsiz değişim" rozeti her sayfada — ama bunu destekleyen somut vaka/süreç açıklaması yok |
| Structured Data — Organization/LocalBusiness | Var | `Organization`, `LocalBusiness`, `PostalAddress`, `GeoCoordinates`, `ContactPoint`, `OpeningHoursSpecification` blokları (klasik-kartvizit sayfası JSON-LD'sinde doğrulandı) |
| Müşteri yorumları | **Zayıf/boş** | Her örneklenen sayfada "Bu ürünü kullandınız mı? Yorum yapmak için giriş yapın." — örneklenen 26 sayfanın hiçbirinde görünür bir yorum metni yoktu (yorum sayısı sıfır veya gizli olabilir) |
| Yazar/uzman kimliği | **Ölçülmedi** | Ürün sayfalarında beklenmez (uygun); ancak `/rehber/`, `/blog/`, `/sozluk` sayfalarında yazar bilgisi olup olmadığı bu turda kontrol edilmedi — İSG gibi YMYL-bitişik bir konuda (iş güvenliği/yasal uyumluluk) bu kritik bir boşluk olabilir |
| Hakkımızda içeriği | **Ölçülmedi** | `/hakkimizda` bu turda fetch edilmedi |
| Şirket sicil/vergi bilgisi | **Ölçülmedi** | Footer/iletişim sayfası kontrol edilmedi |

**Şiddet:**
- **Yorum/testimonial eksikliği — ORTA-YÜKSEK.** 860 ürünlük bir katalogda örneklenen 26 sayfanın hiçbirinde gerçek müşteri yorumu görünmüyor. Bu, "deneyim" (Experience) sinyalini zayıflatıyor ve AI özetleyicilerin/LLM'lerin alıntılayabileceği sosyal kanıt eksikliği yaratıyor.
- **Yazar/uzmanlık kimliği doğrulanamadı — İZLENMESİ GEREKEN BOŞLUK.** İSG levhaları yasal zorunluluk (İSG mevzuatı) ile ilgili olduğundan, `/rehber/isg-zorunlu-uyari-levhalari` gibi sayfalarda "kim yazdı / hangi mevzuata dayanıyor / ne zaman güncellendi" bilgisinin olup olmadığı bir sonraki turda mutlaka kontrol edilmeli.
- **Trust-mekanik sinyaller (iade, KVKK, ödeme, kargo) genel olarak İYİ** — commerce sitesi için beklenen asgari şeffaflık unsurları görünüşte yerinde, sadece canlı doğrulaması eksik.

---

## 4. /rehber/ Sayfaları Neden Çalışıyor

Bu turda `/rehber/` sayfaları doğrudan fetch edilip ölçülmedi; aşağıdaki değerlendirme görev bağlamında verilen performans verisine (bu sayfaların onlarca kelime için sıralandığı, ör. `/rehber/brosur-baski-fiyatlari-2026` "broşür fiyatları" için 1000/ay aramada 41. pozisyonda) ve URL/başlık kalıplarına dayanmaktadır.

**Gözlemlenen kalıp (URL'lerden çıkarım):**
- `kartvizit-fiyatlari-2026`, `brosur-baski-fiyatlari-2026`, `branda-baski-m2-fiyati-2026`, `rollup-fiyatlari-2026`, `afis-baski-fiyatlari-2026` → **"[ürün] fiyatları [yıl]"** kalıbı: yüksek ticari niyetli, fiyat-şeffaflığı arayan sorgulara doğrudan cevap veren, yıl damgalı (freshness sinyali) sayfalar.
- `isg-zorunlu-uyari-levhalari` → **mevzuat/uyumluluk temelli** bilgilendirici sayfa — "zorunlu" kelimesi YMYL-bitişik arama niyetini karşılıyor (işletmeler yasal yükümlülüklerini öğrenmek istiyor).

**Bu kalıbın 860 ürün sayfasından farkı (muhtemel neden):** Ürün sayfaları tek bir ürünün satış sayfası (thin, şablonlu — bkz. Bölüm 1); rehber sayfaları ise muhtemelen **kategori-çapında karşılaştırmalı/sentezlenmiş bilgi** sunuyor (fiyat aralıkları, m²/adet bazlı hesaplama mantığı, mevzuat gereksinimleri) — yani gerçek "topical coverage" ve arama niyetiyle örtüşme sağlıyor.

**Tekrarlanması gereken format (öneri, doğrulanmamış varsayımla):**
1. Yıl damgalı, fiyat/hesaplama odaklı rehber sayfaları — freshness + ticari niyet uyumu.
2. Mevzuat/uyumluluk odaklı rehber sayfaları — İSG kategorisinde onlarca alt-konu (yangın, elektrik, KKD, acil durum) için ayrı ayrı üretilebilir; her biri kendi arama hacmini çekebilir.
3. **Doğrulanması gereken varsayım:** Bu 6 sayfanın gerçekten `/urun/` sayfalarından çok daha uzun/özgün olup olmadığı bir sonraki turda ölçülmeli — eğer öyleyse, "rehber formatını 860 ürün sayfasına da uyarlamak" en yüksek ROI'li tek aksiyon olabilir.

---

## 5. AI Alıntılanabilirliği (AI Citation Readiness)

**Olumlu sinyaller (ölçülen):**
- Zengin JSON-LD structured data: `Product`, `FAQPage`, `Answer`/`Question`, `AggregateOffer`, `MerchantReturnPolicy`, `OfferShippingDetails`, `BreadcrumbList`, `Organization`, `LocalBusiness` — bu şemalar LLM tabanlı arama motorlarının (AI Overviews, ChatGPT/Perplexity arama entegrasyonları) sayfa içeriğini yapılandırılmış şekilde çekmesini kolaylaştırır. Görev bağlamında sitenin zaten "AI Assistant" trafik kanalından gerçek bir satış aldığı belirtiliyor — bu şema altyapısının bir katkısı olabilir.
- `/rehber/` sayfaları (URL kalıbından) doğrudan soru-cevap niyetine hizmet eden başlıklar taşıyor ("fiyatları", "zorunlu") — bu, LLM'lerin alıntılayabileceği "extractable passage" formatına uygun.

**Olumsuz sinyaller (ölçülen):**
- `FAQPage` şeması dolu görünüyor (JSON-LD'de `Question`/`Answer` tipleri var) ama görünür sayfa metninde SSS içeriği çoğu ürün sayfasında **yalnızca fire toleransı hakkında tek bir jenerik soru-cevap** — ürüne özgü teknik sorular ("bu levha hangi standarda uygun", "hangi ortamda kullanılır") yok. LLM bir soru sorduğunda alıntılayacak ürüne-özgü somut bilgi bulamıyor.
- "Teknik özellik bilgisi yakında eklenecek." placeholder'ı, hem insan hem AI okuyucu için **negatif bir sinyal** — bir LLM bu sayfayı taradığında "bu ürün hakkında veri yok" sonucuna varabilir, bu da ChatGPT/Perplexity gibi araçların markala.com.tr'yi İSG levha sorularında kaynak göstermesini engeller.
- Net bilgi hiyerarşisi (H1→H2→liste) ürün sayfalarında rozet/SSS/ilgili-ürün bloklarıyla seyreltiliyor; gerçek ürün bilgisi (ebat, malzeme, dayanıklılık, mevzuat referansı — ör. hangi İSG yönetmeliği/ISO 7010 piktogram standardı) neredeyse hiç yok.

**Şiddet: YÜKSEK fırsat kaybı.** Teknik altyapı (schema) hazır ama içerik boş olduğu için AI motorları "iyi yapılandırılmış ama içeriksiz" bir sayfa görüyor — şemayı doldurmak (Bölüm 8'deki öneriler) muhtemelen düşük efor/yüksek getiri.

---

## 6. En Değerli 10 İçerik Fırsatı

Site İSG terimlerinde zaten sıralama aldığından, öncelik İSG mevzuat/uyumluluk temalı ve mevcut `/rehber/isg-zorunlu-uyari-levhalari` sayfasının başarısını yatay olarak genişletmek üzerine kurulmalı. Hedef anahtar kelimeler tahmini/genel bilgiye dayanır (Ahrefs/Semrush ile doğrulanmadı — bu turda erişilmedi).

1. **`/rehber/isg-levha-boyutlari-ve-standartlari`** — "İSG levha ölçüleri", "ISO 7010 piktogram standartları" — mevcut isg-zorunlu-uyari-levhalari sayfasının doğal devamı; ürün sayfalarındaki boş "Teknik özellik" alanına da kaynak olabilir.
2. **`/rehber/isg-levha-fiyatlari-2026`** — mevcut "[ürün] fiyatları [yıl]" formatının İSG kategorisine uygulanması; "iş güvenliği levhası fiyat" gibi ticari niyetli aramalar için — kanıtlanmış formatın tekrarı.
3. **`/rehber/isg-yonetmeligi-uyari-levhasi-zorunlulugu`** — hangi işyerlerinin hangi levhaları yasal olarak bulundurmak zorunda olduğu (İSG mevzuatı, 6331 sayılı Kanun referansı) — YMYL-bitişik güven + arama niyeti.
4. **`/rehber/yangin-guvenlik-levhalari-rehberi`** — örneklenen ürünlerin büyük kısmı yangın temalı (yangın söndürücü, hortum dolabı, ihbar telefonu) — kategori-çapında bir rehber, hem SEO hem iç link havuzu için.
5. **`/rehber/elektrik-uyari-levhalari-ve-guvenlik`** — elektrik/voltaj kategorisi için benzer mantık (yüksek voltaj, pano, elektrikçi uyarıları örneklerinde görüldü).
6. **`/rehber/dekota-vs-etiket-vs-folyo-levha-malzeme-rehberi`** — malzeme karşılaştırması; ürün sayfalarında eksik olan teknik bilgiyi (dayanıklılık, iç/dış mekan kullanımı, fotolüminesan özellik) merkezi bir yerde toplar, hem kullanıcıya hem AI'ya somut karşılaştırma verisi sunar.
7. **`/sozluk` genişletmesi — İSG terimleri** ("fotolüminesan levha nedir", "dekota nedir", "piktogram nedir") — glossary zaten var, İSG-özel terimlerle genişletmek düşük efor/orta getiri, `/rehber` sayfalarına da iç link kaynağı olur.
8. **`/rehber/is-yeri-turune-gore-zorunlu-levha-kontrol-listesi`** (ör. "fabrika", "inşaat şantiyesi", "ofis" için zorunlu levha listesi) — checklist formatı hem AI alıntılanabilirliği (liste = extractable passage) hem de dönüşüm potansiyeli (birden fazla ürünün sepete eklenmesi) için güçlü.
9. **`/matbaa/{şehir}` sayfalarına genişletme yerine — önce mevcut 15 sayfanın gerçek farklılaştırılması** (bkz. Bölüm 2 riski); yeni şehir eklemeden önce mevcut sayfaların "doorway" riskini gidermek önceliklidir. (Bu bir "yeni sayfa" değil, "mevcut sayfa iyileştirme" fırsatıdır — Bölüm 8'e bakınız.)
10. **`/rehber/kartvizit-baski-teknikleri-karsilastirma`** (EKO/LAK/VIP karşılaştırması, kabartma lak/yaldız gibi seçenekler) — kartvizit ürün sayfasında zaten zengin veri var (bkz. klasik-kartvizit ölçümü); bu veriyi bir karşılaştırma rehberine dönüştürmek düşük ek araştırma maliyetiyle yeni bir sıralama fırsatı yaratır.

---

## 7. Öneriler

### (a) Görünmez / Metadata Düzeltmeleri (görünür içerik değişmez, düşük risk)

- **Near-duplicate ürünlerde canonical/consolidation stratejisi belirlenmeli.** Örn. `tehlike-sinirlanmis-alan-kesinlikle-sigara-icilmez` ve `...-levhasi` URL'leri %100 kelime-seti örtüşmesi gösteriyor — bunun aynı ürünün iki farklı URL'i mi yoksa gerçekten iki ayrı SKU mu olduğu netleştirilmeli; eğer aynıysa 301 + canonical ile birleştirilmeli.
- **FAQPage JSON-LD şemasına ürüne özgü soru-cevap eklenmesi** (görünür sayfa metnini değiştirmeden, sadece structured data katmanında — ör. "Bu levha hangi standarda uygun?", "İç mekan mı dış mekan mı?") teknik olarak mümkünse düşünülebilir; ancak Google'ın görünmeyen içerik içeren şemayı cezalandırma riski olduğundan, ideal olan görünür içeriği de doldurmaktır (bkz. madde c).
- **`publication_date`/güncelleme tarihi meta sinyalinin `/rehber/` sayfalarında görünür ve JSON-LD'de tutarlı tutulması** — freshness sinyali AI Overviews ve klasik SEO için önemli, "-2026" URL kalıbı zaten bunu destekliyor.
- **/matbaa/ sayfalarında `LocalBusiness`/`GeoCoordinates` şemasının her şehir için gerçek/doğrulanmış veriyle dolu olduğunun teknik denetimi** (fiziksel şube olmayan şehirlerde yanıltıcı yerel işletme şeması sunmak Google'ın "misrepresentation" politikasına takılabilir — not: kullanıcının Google Merchant hesabının zaten "Misrepresentation" nedeniyle askıda olduğu hafızada kayıtlı, bu riski artırıyor).

### (b) YENİ Sayfa Önerileri (mevcut sayfalara dokunmadan eklenir, düşük risk)

- Bölüm 6'daki 10 fırsatın tamamı — özellikle 1, 2, 3, 6 ve 8 numaralı `/rehber/` sayfaları, kanıtlanmış format ile hızlı sıralama potansiyeli taşıyor.
- `/sozluk` genişletmesi (madde 7).
- Yeni `/rehber/` sayfalarından mevcut ilgili `/urun/` sayfalarına iç link eklenmesi (rehber → ürün yönünde; bu "yeni sayfa" içinde link olduğu için mevcut ürün sayfasının görünür gövdesi değişmez, sadece rehber sayfasının içeriği).

### (c) Mevcut Sayfada Görünür Değişiklik — **ONAY GEREKİR**

- **En yüksek öncelik: ~500-700 İSG ürün sayfasındaki "Teknik özellik bilgisi yakında eklenecek." placeholder'ının gerçek içerikle doldurulması.** Bu görünür bir değişikliktir ve site sahibinin onayı olmadan yapılamaz, ancak bulgular bunun en yüksek etkili tekil aksiyon olduğunu gösteriyor. Öneri: klasik-kartvizit sayfasındaki "Ürün Detayları" formatı (ebat, malzeme, üretim süresi, kullanım alanı gibi yapılandırılmış alanlar) İSG levhalarına da uygulanabilir — muhtemelen kategori bazında (yangın, elektrik, yasaklayıcı vb.) ortak teknik şablonlar hazırlanıp her ürüne özelleştirilerek toplu doldurulabilir (tam bespoke yazım değil, yapılandırılmış veri girişi).
- **Ürün SSS bölümüne ürüne/kategoriye özgü 1-2 soru eklenmesi** (yalnızca genel fire toleransı sorusunun yanına) — görünür değişiklik, onay gerekir.
- **Near-duplicate ürün çiftlerinin (ör. exit-asagi/exit-sol, sigara-icilmez varyantları) birleştirilmesi veya farklılaştırılması** — URL/sayfa sayısını etkileyeceğinden görünür ve yapısal bir değişikliktir, onay gerekir.
- **Müşteri yorumu toplama/gösterme mekanizmasının güçlendirilmesi** (mevcut "giriş yap ve yorum bırak" akışı çalışıyor olabilir ama görünür yorum yok) — görünür değişiklik, onay gerekir; ancak düşük risk/yüksek trust-getirisi bir öneridir.
- **`/matbaa/` sayfalarının şehir-özel gerçek farklılaştırma içeriği ile güçlendirilmesi** (yerel referans, yerel teslimat süresi, yerel telefon/adres varsa) — bir sonraki turdaki ölçümle risk doğrulandıktan sonra önceliklendirilmeli; görünür değişiklik, onay gerekir.

---

## Ek: Ölçüm Metodolojisi Notu

- Kelime sayıları `trafilatura.extract()` ile boilerplate (nav/footer/cookie banner) ayıklandıktan sonraki `extracted_text` üzerinden `len(text.split())` ile hesaplandı.
- Jaccard benzerliği = |ortak benzersiz kelime kümesi| / |birleşim benzersiz kelime kümesi| — sıra/tekrar duyarsız, kelime dağarcığı örtüşmesini ölçer; cümle-seviyesi/n-gram tabanlı bir intihal ölçümü değildir, dolayısıyla raporlanan yüzdeler bir üst sınır göstergesidir ama yönü açıkça "neredeyse birebir kopya" olduğunu doğrulamaya yeterlidir.
- Örneklem 26 üründen (860'ta) oluşuyor — istatistiksel olarak temsili değildir, ancak URL kalıbı ve kategori dağılımı göz önüne alındığında (İSG alt kategorileri toplam kategorilerin ~1/3'ü) yönü güvenilir bir öncelik sinyali olarak değerlendirilmelidir. Kesin oranlar için tam site taraması (860 sayfa) önerilir.
