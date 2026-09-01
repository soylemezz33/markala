# Markala (markala.com.tr) — Yerel SEO (Local SEO) Bulguları

Denetlenen kaynaklar: anasayfa, /iletisim, /hakkimizda, /matbaa (indeks), /matbaa/mersin, /matbaa/gaziantep,
/matbaa/antalya, /matbaa/osmaniye, /matbaa/mersin/akdeniz, /matbaa/mersin/yenisehir, /matbaa/mersin/tarsus
(render_page.py ile, JS sonrası içerik + JSON-LD). Google Business Profile ve Google Haritalar durumu bu
oturumda canlı arama/harita sorgusuyla doğrulanmadı — sayfa-içi (on-page) sinyallerden çıkarım yapılmıştır
(bkz. GBP bölümündeki not).

---

## Özet (İlk 5 Bulgu)

1. **[KRİTİK] NAP tutarsızlığı — iki farklı adres aynı sitede.** JSON-LD (Organization + LocalBusiness,
   site genelinde tekrarlanıyor) `Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir/Mersin,
   33060` adresini veriyor; ancak `/iletisim` sayfasındaki görünür "Adres & Ziyaret" kartı ve site genelindeki
   footer `Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A, Yenişehir/Mersin` adresini gösteriyor ve bu adresi
   "**324 Ajans Bilgi Teknolojileri Reklam Pazarlama**" (Markala değil, ana şirket) adına bağlıyor. Bu, GBP
   doğrulaması ve her citation kaydında NAP eşleşmesini doğrudan tehlikeye atar (NAP consistency = Whitespark
   2026 top-15 faktörlerinden #12).
2. **[KRİTİK] Google Business Profile kanıtı yok / muhtemelen oluşturulmamış.** Sitede Google Haritalar
   iframe/gömme yok (yalnızca `maps.google.com/?q=...` dış bağlantısı var), `aggregateRating`/`review` şema
   bloğu yok, yıldız/puan widget'ı yok, "Google'da bizi değerlendirin" CTA'sı yok. GBP birincil kategori tek
   başına en güçlü local pack faktörü (skor 193, Whitespark 2026); doğrulanmış profil yoksa Mersin yerel
   paketinde (local pack) görünürlük pratik olarak imkânsız.
3. **[YÜKSEK] İl (şehir) sayfaları gerçek farklılaşmaya sahip, ilçe sayfaları şablonik ve doorway riski
   taşıyor.** İl sayfaları (Mersin, Gaziantep, Antalya, Osmaniye) her biri o ilin ekonomisine özgü metin,
   ürün listesi ve FAQPage şeması içeriyor (bkz. aşağıdaki tablo). İlçe sayfaları (Akdeniz, Yenişehir, Tarsus)
   ise kısa bir "yerel sektör" cümlesi + mahalle adları listesi + aynı üç rozet ("1 iş günü kargo, Hızlı
   üretim, Kalite garantili") kalıbından oluşuyor; FAQPage şeması yok, yerel kanıt (fotoğraf, referans,
   proje örneği, harita) yok.
4. **[YÜKSEK] Yorum/itibar sinyali sıfır.** Ne şema düzeyinde (`aggregateRating` yok) ne de görsel olarak
   (yıldız, yorum sayısı, yorum carousel'i) herhangi bir review sinyali tespit edilmedi. Review Signals ağırlığı
   Whitespark 2026'da ~%20'ye çıktı; Search Atlas ML çalışmasında review count tek başına varyansın %19,2'sini
   açıklıyor.
5. **[ORTA] Şema teknik olarak güçlü ama tutarsız kapsam.** `LocalBusiness` bloğunda `geo` 6 ondalık hane
   (36.812061, 34.641482 — Google'ın önerdiği min. 5 haneyi aşıyor), `openingHoursSpecification`,
   `telephone`, `url`, `priceRange`, `paymentAccepted` mevcut — bu iyi bir temel. Ancak `areaServed` alanı
   Mersin, Adana, İstanbul, Ankara, İzmir listeliyor; oysa gerçek `/matbaa/{sehir}` sayfaları Mersin, Antalya,
   Adana, Şanlıurfa, Hatay, Osmaniye, Gaziantep için var — İstanbul/Ankara/İzmir için sayfa yok, Gaziantep ve
   Şanlıurfa `areaServed` listesinde yok. Şema ile gerçek site mimarisi birbirini yansıtmıyor.

---

## /matbaa/ Şehir + İlçe Sayfaları — Güç ve Doorway Riski Değerlendirmesi

### İl (şehir) sayfaları — örnek: Mersin, Gaziantep, Antalya, Osmaniye

**Gözlemlenen farklılaşma (evidence, çıkarılan metinden):**

| Sayfa | Açılış cümlesi / yerel açı | Öne çıkan ürün listesi |
|---|---|---|
| /matbaa/mersin | "Mersin Limanı, Yenişehir ticaret bölgesi, Tarsus OSB ve Toroslar sanayi siteleri... 12.000+ aktif müşteri" | Klasik kartvizit, kurumsal antetli kâğıt+zarf, restoran menü... |
| /matbaa/gaziantep | "Güneydoğu'nun ticaret ve sanayi başkenti. Tekstil, makine, gıda (baklava, fıstık), mobilya" | Baklava/fıstık premium ambalaj, tekstil etiket/kart, mobilya katalog |
| /matbaa/antalya | "Türkiye'nin turizm başkenti. Otel, restoran, marina, kongre merkezi... sezonsal talep" | Otel anahtar zarfı/kart, restoran menü kartı, masa standı... |
| /matbaa/osmaniye | "Çukurova ve Doğu Akdeniz arasında kavşak. Demir-çelik, tarım, gıda" | Demir-çelik üretim etiket/barkod, gıda ambalaj, yer fıstığı/tahıl ambalajı |

Bu dört sayfa gerçekten **sektöre özel içerik** üretmiş (kopyala-yapıştır şablon değil): her ilin baskın
sanayi/ticaret profiline göre ürün önerisi ve metin farklı. Ayrıca her il sayfasında tespit edilen şema
blokları: `Service` + `AggregateOffer` (fiyat aralığı, teklif sayısı) + `FAQPage` (5 soru-cevap, örn. Mersin
sayfasında "Mersin'deki ofisinizi ziyaret edebilir miyim?" → "Evet, randevu ile Yenişehir'deki atölye ve
showroom'umuza gelebilirsiniz") + `BreadcrumbList`. Mersin sayfasında ayrıca `areaServed.geoRadius = 80km`
tanımlı — teknik olarak iyi bir SAB (service-area business) şema paterni.

**Değerlendirme: Doorway page değil, ama "ince kanıt" (thin proof) riski var.**
- Olumlu: Sayfalar sahte "X ilinde şubemiz var" iddiası yapmıyor; dürüstçe "Mersin merkezli atölyeden X iline
  kargo/kurye" diyor. Bu, Google'ın doorway page politikasının hedeflediği yanıltıcı çoklu-şube taklidinden
  kaçınıyor.
- Eksik: Hiçbir örnek sayfada (metin örneklemesinde) o şehre özel **fotoğraf kanıtı, müşteri referansı/testimonial,
  vaka çalışması veya yerel telefon/adres** görülmedi — yalnızca genel Markala telefon/adresi (Mersin) ve
  genel FAQ tekrar ediyor. "12.000+ aktif müşteri" gibi rakamlar doğrulanamıyor (kaynak belirtilmemiş).
  Bu haliyle sayfalar **Whitespark'ın #10 sıradaki "dedicated service pages" (local organic'te #1 faktör)**
  kriterini kısmen karşılıyor ama tam güç için müşteri kanıtı eksik.
- **Öncelik notu:** Gaziantep sayfası "gaziantep matbaa" için #34 sırada (720 arama/ay, Semrush) — bu, sayfanın
  temelde çalıştığını ama zayıf olduğunu gösteriyor; iyileştirme (yerel referans, daha derin içerik, backlink)
  ile sıralama potansiyeli var. **Severity: Yüksek (fırsat + risk bir arada) — thin content nedeniyle tavan
  yapmış durumda.**

### İlçe sayfaları — örnek: Mersin/Akdeniz, Mersin/Yenişehir, Mersin/Tarsus

**Gözlemlenen kalıp (evidence):**

| Sayfa | Yerel açı cümlesi | Yapı |
|---|---|---|
| /matbaa/mersin/akdeniz | "Liman bölgesini ve eski şehir merkezini kapsar. Lojistik, ihracatçı, gümrük müşavirleri için kaşe/etiket/faturalama formu" | mahalle listesi (Hal, Nusratiye, Çay, Camişerif, Kazanlı OSB, Liman Cad., Anadolu...) + 3 rozet |
| /matbaa/mersin/yenisehir | "Mersin'in modern iş/eğitim merkezi. Üniversite, hastane, hukuk büroları için kurumsal kimlik" | mahalle listesi (Bahçelievler, Eğriçam, Mahmudiye, Pirireis, Çiftlikköy...) + 3 rozet |
| /matbaa/mersin/tarsus | "En yoğun ticaret hacmine sahip ilçelerden. Otomotiv yan sanayi, tekstil, gıda" | mahalle listesi (Cumhuriyet, Şahin, Kazanlı, Yenice OSB, Gazipaşa...) + 3 rozet |

Bu üç sayfada tespit edilen şema: yalnızca `Service` + `AdministrativeArea` (`containedInPlace: City=Mersin`)
+ `BreadcrumbList`. **`FAQPage`, `AggregateOffer`, `GeoCoordinates` şeması yok** — il sayfalarına göre daha
zayıf bir şema seti. İçerik uzunluğu da il sayfalarına yakın (extraction ~500 karakterle sınırlı görüldü) ama
büyük kısmı mahalle adı listesi — bu, klasik "doorway/programmatic" kalıbına il sayfalarından daha yakın.

**Değerlendirme: Orta-yüksek doorway riski, özellikle küçük/az talep gören ilçelerde.**
- Akdeniz ve Yenişehir gerçekten iş yoğunluğu yüksek, tanınabilir ilçeler (liman/lojistik, üniversite/hastane
  bölgesi) — buradaki sektörel eşleme (Akdeniz→lojistik/gümrük evrakı, Yenişehir→kurumsal kimlik/hukuk bürosu)
  mantıklı ve savunulabilir bir yerelleştirme.
- Ancak 8 Mersin ilçesinin tamamının (Tarsus, Yenişehir, Akdeniz, Toroslar, Mezitli, Erdemli, Silifke, Anamur)
  aynı şablonla (mahalle listesi + 3 rozet) üretilmiş olması, özellikle **Anamur ve Silifke gibi Mersin
  merkezine 80-150 km uzak, düşük ticaret hacimli ilçelerde** — gerçek talep/arama hacmi düşükken sayfa
  üretmek — klasik "her lokasyon için otomatik sayfa" (programmatic doorway) profiline giriyor. Bu ilçelerde
  aynı üretim tesisinden 1-2 iş günü teslim iddiası, Mersin merkez ilçeleriyle aynı avantajı sunmuyor
  (coğrafi olarak daha uzak), bu yüzden sayfanın değer önerisi (value proposition) zayıflıyor.
- **Severity: Orta (Akdeniz, Yenişehir, Toroslar, Mezitli, Tarsus için — merkeze yakın, yüksek ticaret hacmi)
  / Yüksek risk (Anamur, Silifke, Erdemli için — merkeze uzak, "aynı gün/1 gün teslim" iddiası ile çelişkili,
  arama hacmi muhtemelen çok düşük, doğrulanamadı bu oturumda).**

---

## NAP Tutarlılığı + LocalBusiness Şeması

### NAP kaynak karşılaştırma tablosu

| Kaynak | İşletme adı | Adres | Telefon | E-posta |
|---|---|---|---|---|
| JSON-LD `Organization` (site geneli, her sayfada tekrarlanıyor: home, /iletisim, /hakkimizda, tüm /matbaa/* sayfaları) | Markala (legalName: "324 Ajans · Markala") | Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir/Mersin, 33060, TR | +90-324-433-3351 | merhaba@markala.com.tr / kurumsal@markala.com.tr |
| JSON-LD `LocalBusiness` (site geneli) | Markala — Matbaa & Reklam Ürünleri | Aynı (Çiftlikköy/Astoria One) + `geo`: 36.812061, 34.641482 | +90-324-433-3351 | merhaba@markala.com.tr |
| Görünür `/iletisim` sayfası — "Adres & Ziyaret" kartı | (etiketsiz, sayfa Markala'ya ait) | **Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A, Yenişehir/Mersin** · "randevu ile ziyaret" | 0324 433 33 51 (eşleşiyor) | e-posta Cloudflare email-protection ile gizlenmiş (bkz. not) |
| Görünür footer (site geneli) | **324 Ajans Bilgi Teknolojileri Reklam Pazarlama** | **Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A, Yenişehir/Mersin** | tel:+903244333351 (eşleşiyor) | — |
| /matbaa/mersin FAQ metni ("ofisinizi ziyaret edebilir miyim?") | "Yenişehir'deki atölye ve showroom" | Sokak adı verilmiyor, sadece "Yenişehir" | — | — |
| Görev bağlamında verilen (muhtemelen GBP/ticari sicil hedefi) adres | Markala | Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir/Mersin | 0324 433 33 51 | merhaba@markala.com.tr |

**Bulgular:**

- **[KRİTİK] Adres çatışması.** Şema (Astoria One) ile görünür sayfa + footer (Menteş Mah./100. Yıl Cumhuriyet
  Cad.) birbirini tutmuyor. Her ikisi de Yenişehir ilçesinde ama farklı sokaklar/binalar. Bu, ister bilinçli
  (biri showroom, biri üretim tesisi/hukuki merkez), ister güncellenmemiş eski veri olsun, GBP doğrulaması ve
  citation inşası için **önce çözülmesi gereken** bir sorun: Google, aynı işletme için farklı adres sinyalleri
  gördüğünde ya profili reddeder ya da yanlış konumda gösterir; ayrıca üçüncü taraf dizinler (Yandex, Foursquare,
  Cybo vb.) hangi adresi tarayıp kaydettiğine göre birbiriyle çelişen kayıtlar oluşturur.
  **Önerilen aksiyon:** Owner, hangi adresin (a) resmi ticari sicil/vergi levhası adresi, (b) fiziksel
  ziyaret/showroom adresi, (c) GBP doğrulama adresi olacağını netleştirmeli. Genellikle GBP doğrulaması posta
  ile gelen kod veya Business Profile ekibinin görüntülü/belge doğrulamasıyla yapılır ve **gerçek, fiziksel
  olarak erişilebilir adres** gerekir — "randevu ile ziyaret" ifadesi bir home-based/hybrid model olduğunu
  gösteriyor, bu GBP'de mümkündür (adres gizlenip sadece hizmet bölgesi gösterilebilir) ama yine de tek, doğru
  ve tutarlı bir adres şart.
- **[YÜKSEK] Footer'da marka adı "Markala" değil, "324 Ajans Bilgi Teknolojileri Reklam Pazarlama".** Bu
  parent-company/sub-brand karmaşası GBP kategori ve isim eşleşmesi açısından risklidir: GBP'ye "Markala"
  adıyla mı yoksa "324 Ajans" adıyla mı kayıt açılacağı netleşmeli. Şema `legalName: "324 Ajans · Markala"` ve
  `alternateName: ["Markala Matbaa", "markala.com.tr"]` kullanıyor — bu makul bir yapı (GBP'de "Markala" ana ad,
  açıklamada 324 Ajans'a referans verilebilir) ama footer'daki tam ticari unvan kullanımı normal ve beklenen bir
  pratiktir (Türkiye'de KVKK/ticari bilgi zorunluluğu), sorun bu değil — sorun **adresin de bu farklı unvanla
  birlikte farklı bir sokakta görünmesi**.
- **[ORTA] E-posta Cloudflare email-protection ile gizli/obfuscate edilmiş** (`/cdn-cgi/l/email-protection#...`
  linkleri tespit edildi). Bu, spam bot korumasıdır ve kullanıcı tarayıcıda görürken JS ile çözülür (muhtemelen
  `merhaba@markala.com.tr` olarak render ediliyor — extracted_text'te "[email protected]" görüldü, bu genellikle
  obfuscation'ın düzgün çözülmediği bir işaret ya da metin çıkarma aracının onu maskelemesi). Google'ın crawler'ı
  JS render ediyorsa sorun yaşamaz, ama bazı üçüncü parti citation/scraper araçları veya AI arama motorları
  (statik HTML okuyanlar) e-postayı **hiç göremeyebilir**. Düşük-orta öncelik; NAP'ın "P" kısmı olmadığı için
  ranking riski değil ama tutarlılık/erişilebilirlik notu olarak işaretlendi.
- **[İYİ] Telefon numarası tüm kaynaklarda tutarlı:** `+90-324-433-3351` / `0324 433 33 51` / `tel:+903244333351`
  — format farkları var (uluslararası vs yerel yazım) ama bu normal ve NAP eşleştirme algoritmaları bunu
  toplerans dahilinde eşleştirir. WhatsApp numarası (0531 900 41 02) ayrı ve doğru şekilde "WhatsApp" olarak
  etiketlenmiş, ana telefon numarasıyla karıştırılmamış — iyi pratik.
- **Google Haritalar gömme (embed) yok.** `/iletisim` sayfasında yalnızca dış bağlantı
  (`https://maps.google.com/?q=Menteş+Mah....`) var, gerçek `<iframe>` embed tespit edilmedi. Embed, GBP
  place-id referansı için dolaylı bir sinyal ve kullanıcı deneyimi açısından faydalıdır ama adres tutarsızlığı
  çözülmeden embed eklemek **yanlış adresi pekiştirir** — önce adres netleşmeli, sonra doğru adresle embed
  eklenmeli. **Severity: Orta.**

### LocalBusiness şema — teknik değerlendirme

| Özellik | Durum | Not |
|---|---|---|
| `name` | Var | "Markala — Matbaa & Reklam Ürünleri" — GBP'de kullanılacak adla birebir eşleşmeli (henüz GBP yok, bu isim referans olabilir ama GBP kural olarak markanın gerçek/tabeladaki adını ister, alt başlık/slogan eklenmemeli) |
| `address` (PostalAddress) | Var ama tartışmalı | streetAddress/locality/region/postalCode/country tam — ama görünür sayfayla çelişiyor (yukarıda) |
| `geo` (GeoCoordinates) | Var, **5 ondalık haneyi aşıyor** (36.812061, 34.641482 — 6 hane) | Google önerisinin üzerinde, iyi |
| `telephone` | Var, tutarlı | — |
| `openingHoursSpecification` | Var (Pzt-Cum 09:00-18:00, Cmt 09:00-17:00) | Pazar kapalı — bilgi eksik değil, muhtemelen doğru; GBP'de "özel gün/tatil saatleri" ayrıca girilmeli |
| `url` | Var | — |
| `priceRange` | Var (`₺₺`) | Uygun |
| `image` | Var ama zayıf | Sadece `og-default.png` (genel OG görseli) — gerçek işletme/atölye fotoğrafı değil, önerilen `image` alanı için özel foto önerilir |
| `aggregateRating` / `review` | **Yok** | Beklenen — henüz review toplanmamış |
| `@type` | Genel `LocalBusiness` | Schema.org'da matbaa/print shop için özel bir alt tip yok (local-schema-types.md referansında da listelenmiyor); bu nedenle genel `LocalBusiness` kabul edilebilir. Ancak site aynı zamanda online konfigüratör/checkout ile bir e-ticaret modeli çalıştırdığından `Store` alt tipi (fiziksel+online satış noktası) daha isabetli olabilir. **Severity: Düşük** — ranking etkisi yok (schema doğrudan sıralama faktörü değil), ama entity-understanding için ufak bir iyileştirme fırsatı. |
| `areaServed` tutarlılığı | **Tutarsız** | LocalBusiness `areaServed`: Türkiye + Mersin, Adana, İstanbul, Ankara, İzmir. Gerçek `/matbaa/{il}` sayfaları: Mersin, Antalya, Adana, Şanlıurfa, Hatay, Osmaniye, Gaziantep. **İstanbul/Ankara/İzmir için sayfa yok, Gaziantep/Şanlıurfa/Antalya/Hatay/Osmaniye areaServed listesinde yok.** Şema, sitenin gerçek il-sayfası mimarisini yansıtmıyor. **Severity: Orta** — hem kullanıcı hem arama motoru için kafa karıştırıcı sinyal. |
| Sayfa-özel `Service` şeması (il/ilçe sayfaları) | İl sayfalarında güçlü (`AggregateOffer`, `FAQPage`, `geoRadius`), ilçe sayfalarında zayıf (FAQPage yok) | Yukarıda detaylandırıldı |
| Her sayfada aynı `LocalBusiness` bloğunun tekrarlanması | Doğru pratik | Tek `@id` (`#localbusiness`) ile referans veriliyor — iyi (duplicate/çelişen ID riski yok) |

---

## Google Business Profile — Kurulum/Optimizasyon Kontrol Listesi

**Durum notu:** GBP profili varlığı bu oturumda canlı Google Haritalar/arama sorgusuyla doğrulanmadı (coordinator
talimatıyla veri toplama bu noktada durduruldu). Ancak sayfa-içi kanıtların **toplamı** güçlü şekilde "GBP yok
veya optimize edilmemiş" hipotezini destekliyor: harita embed yok, `aggregateRating` yok, "Google'da
değerlendirin" CTA'sı yok, GBP post/Q&A/review referansı hiçbir sayfada geçmiyor. **Bir sonraki adımda bu,
`site:google.com/maps markala matbaa` / doğrudan Google Haritalar araması ile teyit edilmeli.**

### Kritik alanlar (GBP puanlama tablosunda ağırlığı en yüksek — bkz. maps-gbp-checklist.md)

1. **Birincil kategori** — Whitespark 2026'da #1 faktör (skor 193); yanlış kategori #1 negatif faktör (skor 176).
   Önerilen birincil kategori: **"Printing Shop" (Matbaa)**. Alternatif/ek kategoriler:
   - Ek kategori adayları: "Print Shop", "Custom Sticker Shop"/"Etiket", "Business Card Designer/Printer",
     "Sign Shop" (branda/tabela baskısı varsa), "Graphic Designer" (ücretsiz tasarım desteği hizmeti nedeniyle),
     "Corporate Office" **kullanılmamalı** (bu, tüketici aramalarında görünürlüğü azaltır).
   - "Kurumsal kimlik" hizmeti sunduğu için "Advertising Agency" ek kategori olarak düşünülebilir ama birincil
     olmamalı — birincil kategori arama niyetiyle (matbaa/baskı) en dar eşleşen olmalı.
2. **İşletme adı** — Tabeladaki/gerçek kullanılan adla birebir: "Markala" (şema `name` alanındaki uzun sürüm
   "Markala — Matbaa & Reklam Ürünleri" GBP'de kullanılmamalı; GBP politika ihlali — açıklayıcı ek ibare GBP
   kural ihlalidir).
3. **Adres** — Önce NAP çatışması (yukarıda) çözülmeli. Adres fiziksel olarak doğrulanabilir olmalı (posta kodlu
   doğrulama veya video doğrulama). "Randevu ile ziyaret" modeliyse GBP'de **"bu işletme müşterileri bu adreste
   ağırlamaz" (hizmet bölgesi işletmesi/hibrit)** ayarı seçilerek sokak adresi gizlenip sadece hizmet bölgesi
   (Mersin ili + komşu iller) gösterilebilir — ama görev bağlamında fiziksel üretim tesisi olduğu belirtildiği
   için muhtemelen **hibrit (adres görünür + hizmet bölgesi tanımlı)** en doğru kurulumdur.
4. **Telefon** — 0324 433 33 51 (yerel numara, doğru — 0800/servis numarası kullanmayın).
5. **Web sitesi URL'si** — Ana sayfa yerine, birincil hedef sayfa olarak `/matbaa/mersin` veya ana sayfa
   düşünülebilir; "Diversity Update" riski nedeniyle en güçlü/rakip sayfaya değil, gerçek ana işletme sayfasına
   yönlendirin (Sterling Sky, Mart 2025 bulgusu: SAB modelinde sıralama doğrulama adresine göre, GBP servis
   alanı ayarı doğrudan sıralamayı etkilemiyor — dolayısıyla URL seçimi öncelik değil, tutarlılık önemli).
6. **Çalışma saatleri** — Şemadaki ile birebir: Pzt-Cum 09:00-18:00, Cmt 09:00-17:00, Pazar kapalı. Resmi tatil
   ve özel gün saatleri (bayram tatilleri vb.) GBP'de ayrıca girilmeli — "business open at time of search"
   Whitespark'ta #5 faktör.
7. **Doğrulama (Verified badge)** — Şart; doğrulanmamış profil local pack'te neredeyse hiç görünmez.

### Önemli alanlar

8. **Hizmetler menüsü** — GBP "Services" bölümüne konfigüratördeki ürün kategorileri tek tek girilmeli: Kartvizit
   baskı, Broşür baskı, Afiş baskı, Branda baskı, Kupa baskı, Etiket baskı, Antetli kâğıt, Kurumsal kimlik
   paketleri, Kaşe, CMR/sevk irsaliyesi baskısı (Akdeniz sayfasında geçen lojistik evrak hizmeti dahil). Her
   hizmete kısa açıklama + varsa fiyat/fiyat aralığı eklenmeli — Whitespark'ta "dedicated service pages" #10
   local organic faktörü, AI visibility'de #2.
9. **Ürünler** — 30+ ürün konfigüratöründeki en çok satan 8-10 kalem (klasik kartvizit, antetli kâğıt+zarf seti,
   restoran menü kartı, branda vb.) GBP "Products" bölümüne fotoğraf + fiyat aralığıyla eklenmeli.
10. **İşletme açıklaması (250-750 karakter)** — Mersin/matbaa/baskı anahtar kelimelerini doğal şekilde içermeli;
    şema `description` alanındaki metin ("Markala, 324 Ajans çatısı altında matbaa ve reklam ürünleri
    e-ticareti yapan butik markadır") iyi bir başlangıç ama "Mersin merkezli", "Türkiye'nin 81 iline kargo"
    gibi somut yerel+kapsam ifadeleri eklenerek GBP açıklamasına özel olarak zenginleştirilmeli.
11. **Fotoğraflar (10+, çeşitli tip)** — Atölye/üretim tesisi dış-iç mekan, baskı makineleri, ekip, paketleme
    süreci (5 adımlı süreç şemasında zaten "fotoğraflı tutanak" vurgusu var — bu görseller GBP'ye de
    yüklenmeli), tamamlanmış ürün örnekleri (kartvizit, branda, kupa), logo, kapak fotoğrafı. Fotoğraf varlığı
    yön tarifi taleplerini %45 artırıyor (WebFX/Sterling Sky).
12. **Fotoğraf güncelliği** — Ayda en az 2-4 yeni fotoğraf (özellikle tamamlanmış müşteri projeleri, izin
    alınarak) yükleme rutini kurulmalı.
13. **Nitelikler (Attributes)** — "Kadın işletmesi" gibi kimlik nitelikleri uygunsa eklenmeli; ödeme
    nitelikleri (kredi kartı, banka kartı — şemada zaten `paymentAccepted` var, GBP'de de aynı şekilde
    işaretlenmeli), erişilebilirlik (tekerlekli sandalye erişimi vb., showroom içindir).
14. **Hizmet bölgesi (Service areas)** — GBP'de tanımlanabilecek 20 alan sınırı için öncelik: Mersin (ve tüm
    ilçeleri), Adana, Gaziantep, Antalya, Hatay, Şanlıurfa, Osmaniye — yani zaten `/matbaa/` sayfası olan iller.
    İstanbul/Ankara/İzmir gibi sayfası olmayan şehirleri GBP hizmet bölgesine eklemek gerçekçi değil (kargo ile
    ulaşılıyor olsa da GBP hizmet bölgesi genelde makul sürüş/mantıksal yarıçapla sınırlı tutulmalı; ulusal
    kargo hizmeti web sitesinde "81 ile kargo" olarak zaten anlatılıyor, bu GBP'nin işi değil).
15. **Menü/hizmet bağlantısı** — Konfigüratör URL'si (`/urunler`) "hizmetler" veya "sipariş" bağlantısı olarak
    GBP'ye eklenmeli.

### Tamamlayıcı alanlar

16. **Google Posts** — Haftada en az 1 post (ürün lansmanı, kampanya, mevsimsel promosyon — örn. Antalya
    sayfasında bahsedilen "sezon başı toplu kampanya" gibi). Doğrudan sıralama etkisi yok ama Post
    Justification'ları tetikleyebilir ve GBP'nin "aktif işletme" sinyalini güçlendirir.
17. **Rezervasyon/randevu linki** — "randevu ile ziyaret" modeli olduğundan, showroom ziyareti için bir
    randevu/booking linki (Calendly vb.) GBP'ye eklenebilir.
18. **Sosyal profiller** — Instagram (`instagram.com/markala.com.tr`) ve LinkedIn (`linkedin.com/company/324ajans`)
    zaten şemada `sameAs` olarak tanımlı; GBP profilinde de bu bağlantılar eklenmeli.
19. **Q&A bölümü** — Sitedeki mevcut FAQPage içeriği (Mersin sayfasındaki 5 soru gibi) GBP Q&A'ya taşınmalı/
    kendi kendine sorulup yanıtlanmalı (Google politikasına uygun şekilde, sahte kullanıcı hesabı kullanmadan —
    işletme sahibi kendi sorusunu ekleyip yanıtlayabilir).
20. **Sahiplik/yönetim** — Tek bir Google hesabından (kurumsal, kişisel değil) yönetilmeli; "324 Ajans" ile
    "Markala" arasındaki marka ilişkisi GBP açıklamasında netleştirilmeli ama **iki ayrı GBP profili aynı
    adres için açılmamalı** (Whitespark'ın #2 negatif faktörü: "duplicate profiles at same address", skor 142)
    — eğer 324 Ajans için ayrı bir GBP zaten varsa ve aynı adresi kullanıyorsa, bu doğrudan bir risk oluşturur;
    kontrol edilmeli.

---

## Yerel Citation Kaynakları (Türkiye'ye Özgü)

*Not: local-schema-types.md'deki Tier 1-3 kaynak listesi ABD merkezlidir (Yelp, BBB, Data Axle vb.) ve
Türkiye'de sınırlı etkiye sahiptir. Aşağıdaki liste Türkiye pazarı için önceliklendirilmiştir. Owner'ın zaten
bir backlink planı olduğu belirtildi (`docs/BACKLINK-PLANI-2026-08.md`) — bu bölüm yalnızca yerel/citation
değeri ve NAP tutarlılığı kurallarına odaklanır, genel backlink stratejisini tekrarlamaz.*

### Tier 1 — Evrensel/kritik (mutlaka, öncelik sırasıyla)

1. **Google Business Profile** — birincil, yukarıda detaylandırıldı.
2. **Yandex Business (Yandex Haritalar)** — Türkiye'de özellikle B2B/lojistik/sanayi aramalarında hâlâ trafik
   kaynağı; Mersin Limanı'na yakın lojistik/ihracat odaklı müşteri profili (Akdeniz sayfasında vurgulanan)
   düşünülünce değerli.
3. **Apple Business Connect** — iOS/Apple Haritalar kullanıcıları için; kurulumu ücretsiz, NAP'ı GBP ile birebir
   aynı girilmeli.
4. **Bing Places** — Copilot/Bing tabanlı AI aramalarında kaynak; ücretsiz ve hızlı kurulur.
5. **Facebook Sayfa** (İşletme bilgisi sekmesi) — Instagram zaten bağlı (`instagram.com/markala.com.tr`);
   Facebook işletme sayfası da NAP ile birlikte açılmalı/güncellenmeli.

### Tier 2 — Türkiye'ye özgü genel dizinler

6. **Mersin Ticaret ve Sanayi Odası (MTSO) üye dizini** — Mersin'de fiziksel üretim tesisi olan bir işletme
   için en güçlü yerel-otorite citation kaynaklarından biri; MTSO üyeliği hem NAP citation hem de yerel E-E-A-T
   (fiziksel varlık kanıtı) sağlar. Üyelik zaten varsa dizin profili güncellenmeli/tamamlanmalı, yoksa üyelik
   önerilir.
7. **Türkiye Odalar ve Borsalar Birliği (TOBB) Sanayi Veritabanı** — kurumsal B2B alıcılar için güven sinyali,
   dolaylı citation.
11. **Cybo.com, Yellowpages.com.tr / Türkiye Sarı Sayfalar benzeri dizinler, Firmarehberi.com, Firmabul.com,
    Kobiavantaj gibi Türkiye iş dizinleri** — DA'ları düşük ama toplu NAP tutarlılığı sinyali için ucuz/hızlı
    kazanımlar.
8. **Foursquare/Factual tabanlı veri** — Uber, bazı harita entegrasyonlarını besliyor; Türkiye'de dolaylı etki
   ama ücretsiz, ihmal edilebilir maliyetle eklenmeli.
9. **Sektörel B2B dizinler:** Ambalaj/matbaa sektörü dernek ve platformları — örn. **Matbaa Sanayicileri
   Derneği**, **AMBALAJ Sanayicileri Derneği (ASD)** benzeri sektör kuruluşlarının üye/tedarikçi dizinleri
   (üyelikleri teyit edilmeli) — hem citation hem sektörel otorite/backlink değeri taşır.
10. **Trendyol/Hepsiburada gibi pazaryeri "mağaza" profilleri** (eğer ürünler bu platformlarda satılıyorsa) —
    doğrudan local citation değil ama marka NAP'ı ile eşleşen ek bir "işletme profili" sinyali.

### NAP tutarlılığı kuralları (her citation'a uygulanmalı)

- **Tek bir "kaynak adres" belirlenmeli** (bu denetimde tespit edilen çatışma önce çözülmeli — bkz. yukarı).
  Tüm citation'lar bu tek adresi, tek format ile kullanmalı (örn. "Yenişehir Mah." değil "Yenişehir/Mersin",
  bina/kapı no formatı standartlaştırılmalı: "No:13 İç Kapı No:61" vs "No:13/61" gibi varyasyonlardan kaçının).
- **İşletme adı tüm dizinlerde birebir "Markala" olmalı** (bazı yerlerde "Markala Matbaa" alternatif adı
  kullanılabilir ama tutarlı şekilde — GBP'de birincil ad olarak kullanılmamalı, yalnızca ikincil/açıklama
  metninde).
- **Telefon formatı standardize edilmeli:** Uluslararası (+90 324 433 33 51) vs yerel (0324 433 33 51) —
  citation sitesine göre hangisi kabul ediliyorsa o kullanılmalı ama aynı numara.
- Citation kurulumu, **adres çatışması çözülmeden** başlatılmamalı — aksi halde yanlış/çelişen NAP çok sayıda
  üçüncü taraf sitede çoğalır ve sonradan düzeltmek her dizinde tek tek güncelleme gerektirir (maliyetli).

---

## Yorum (Review) Toplama Planı — B2B Matbaa İçin

Mevcut durum: **Sıfır review sinyali** tespit edildi (ne şema ne görsel). Bu, hem Whitespark'ın #6/#7/#9 sıradaki
faktörlerini (yüksek puan, review adedi, review hızı/velocity) hem de Sterling Sky'ın **"Magic 10" eşiğini**
(10 review'da belirgin sıralama artışı) tamamen kaçırıyor. **18 günlük kural**: 3 hafta yeni review gelmezse
sıralamalar sert düşüyor — bu yüzden tek seferlik bir "review kampanyası" değil, **sürekli bir akış** kurulmalı.

### Pratik plan (B2B/E-ticaret matbaa modeline uygun)

1. **Tetikleyici an:** Sipariş süreci zaten 5 adımlı ve şeffaf (konfigüratör → tasarım → üretim → paketleme →
   kargo, "takip linki SMS/e-posta ile" gönderiliyor — bu zaten var olan bir otomasyon noktası). Kargo teslim
   onayından **2-3 gün sonra** (ürünü inceleyecek zaman tanınarak) otomatik SMS/e-posta ile Google review linki
   gönderilmeli. Mevcut sipariş takip altyapısına eklenmesi görece düşük mühendislik maliyetli bir entegrasyon.
2. **Doğrudan review linki:** GBP kurulduktan sonra "kısa link" (g.page/markala/review veya benzeri) oluşturulup
   hem SMS/e-posta şablonuna hem de fatura/irsaliye alt bilgisine, hem paketleme kutusu içine (küçük kart:
   "Bizi nasıl bulduğunuz bizim için değerli — 30 saniyede değerlendirin: [QR kod]") eklenmeli. Fiziksel QR kod,
   B2B alıcı firmaların satın alma/pazarlama çalışanına ulaşmanın en düşük sürtünmeli yolu.
3. **Segmentasyon:** Kurumsal (sales) müşteriler için (`kurumsal@markala.com.tr` kontak noktası) hesap
   yöneticisi/satış temsilcisi teslimattan birkaç gün sonra kişisel bir takip e-postası/telefonuyla review rica
   edebilir — B2B'de kişisel talep, otomatik SMS'ten daha yüksek dönüşüm sağlar.
4. **Review gating YASAK:** Sadece memnun müşterilere link gönderme, olumsuz deneyimi filtreleme gibi
   uygulamalardan kaçının — hem Google politika ihlali hem FTC (ABD) emsali var; Türkiye'de doğrudan FTC
   uygulanmasa da Google'ın küresel politikası aynı şekilde işler ve tespit edilirse review'lar toplu silinebilir.
5. **Yanıt rutini:** Her review'a (olumlu/olumsuz) 48 saat içinde yanıt hedeflenmeli (hedef: %80+ yanıt oranı —
   GBP checklist madde 24). Olumsuz review'lara sakin, çözüm odaklı yanıt B2B güven sinyali için özellikle
   önemli (kurumsal alıcılar review geçmişini itina ile inceler).
6. **Hız (velocity) hedefi:** İlk 90 günde en az 15-20 review toplanarak "Magic 10" eşiği rahatça geçilmeli;
   sonrasında ayda en az 4-6 yeni review ile 18 günlük kuralın altına düşülmemeli (haftalık takip önerilir).
7. **Çeşitlendirme:** Google ana odak olmalı (kullanım %71, hâlâ en yüksek — BrightLocal 2026) ama Instagram
   yorumları/DM referansları da (kullanım %37, yükselişte) marka sayfasında öne çıkarılabilir; site içinde bir
   "Müşteri Yorumları" bölümü (şu an eksik) hem `aggregateRating` şeması hem sosyal kanıt için eklenmeli —
   bu, GBP review'ları web sitesine widget olarak taşımanın (ör. Elfsight, EmbedSocial gibi araçlar) yerini
   tutmaz ama tamamlayıcıdır.
8. **İlk kaynak — mevcut müşteri tabanı:** "12.000+ aktif müşteri" iddiası doğruysa (Mersin sayfası metni),
   GBP kurulur kurulmaz geçmiş memnun müşterilere toplu bir e-posta dalgası (CRM varsa segment: son 6 ay içinde
   sipariş verenler) ile "ilk 10 review"a hızla ulaşmak mümkün — bu tek seferlik patlama Magic 10 eşiğini
   aşmak için idealdir, sonrasında madde 6'daki sürekli akışa geçilmeli.

---

## Yerel İçerik Boşlukları — Yeni Sayfa Kararları

### Yeni il (şehir) sayfası — savunulabilir adaylar

Mevcut 7 il sayfası (Mersin, Adana, Antalya, Şanlıurfa, Hatay, Osmaniye, Gaziantep) coğrafi olarak Akdeniz/
Güneydoğu bölgesine yoğunlaşmış — mantıklı çünkü Mersin'den kargo/kurye süresi bu bölgede en kısa (1-2 iş günü
iddiası inandırıcı). Yeni sayfa için önerilen değerlendirme kriteri: **(a) Semrush/arama hacmi verisi olan bir
talep sinyali + (b) Mersin'e lojistik/coğrafi mantığı olan bir yakınlık veya sektörel bağlantı + (c) sayfaya
özel, gerçek bir yerel açı yazılabilecek kadar içerik zenginliği.**

- **Şanlıurfa, Hatay, Adana zaten var** — bölgesel tutarlılık iyi korunmuş.
- **Konya** — Mersin'e kara yoluyla yakın, büyük sanayi/ticaret hacmi olan bir il; mevcut 7 ile aynı bölgesel
  mantıkla savunulabilir bir sonraki aday. (Talep/arama hacmi bu oturumda doğrulanmadı — Semrush ile teyit
  önerilir.)
- **Kahramanmaraş, Adıyaman, Mardin, Diyarbakır** — Güneydoğu/Akdeniz kargo ağı mantığına uyan, aynı DHL/Aras
  1-2 iş günü iddiasını destekleyebilecek iller; ancak her biri için önce arama hacmi kontrolü yapılmalı —
  hacim çok düşükse (Osmaniye örneğinde olduğu gibi düşük nüfus/talep) sayfa yatırımı marjinal getiri sağlar.
- **İstanbul, Ankara, İzmir — DİKKAT:** Şemanın `areaServed` alanında zaten geçiyorlar ama bu üç büyük şehir
  için (a) 1-2 iş günü kargo iddiası daha az inandırıcı (mesafe uzun), (b) bu şehirlerde onlarca yerleşik,
  güçlü rakip matbaa zaten güçlü local pack'e sahip olacaktır — Mersin merkezli bir işletmenin bu şehirler için
  "yerel" sayfa açması hem **doorway riski hem de gerçekçi olmayan bir "yerellik" iddiası** taşır. Eğer bu
  şehirler için sayfa açılacaksa, il sayfası formatı yerine **"Türkiye Geneli Kargo ile Matbaa" tipi genel bir
  sayfa + bu şehirleri örnek/vaka olarak anma** yaklaşımı daha dürüst ve daha az risklidir.

### Yeni ilçe sayfası — dikkatli olunması gereken alan

- Kalan Mersin ilçeleri (Toroslar, Mezitli, Erdemli, Silifke, Anamur) zaten mevcut — bunların **kalite
  iyileştirmesi, yeni sayfa eklemekten daha öncelikli** olmalı (bkz. yukarıdaki ilçe sayfası bulguları:
  FAQPage şeması eksik, yerel kanıt eksik).
- **Yeni ilçe sayfası açmadan önce öneri:** Adana, Gaziantep, Antalya gibi il sayfalarının ilçe kırılımına
  inmek (örn. /matbaa/gaziantep/sehitkamil) — ancak bu YALNIZCA o ilçe için gerçek, ölçülebilir arama hacmi
  varsa (Semrush/GSC verisiyle teyit edilmeli) ve il sayfasının kendisi zaten iyi performans gösteriyorsa
  (şu an #34 sırada olan Gaziantep için henüz olgunlaşmamış — önce il sayfasını güçlendirin, sonra ilçeye inin)
  yapılmalı. Şu anki olgunluk seviyesinde ilçe kırılımına inmek **doorway riskini artırır** (thin content x N
  sayfa çoğalması) ve önceliklendirme hatasıdır.
- **Doorway riski en yüksek adaylar (yapılmamalı / ertelenmeli):** Mersin dışındaki illerde ilçe sayfası açmak
  (örn. Gaziantep/Şehitkamil) — çünkü mevcut Mersin ilçe sayfaları bile (merkeze en yakın, en güçlü coğrafi
  mantığa sahip olanlar) zayıf/şablonik durumda; bu şablonun başka bir ile taşınması sorunu çoğaltır, çözmez.

### Doorway riski taşıyan mevcut sayfalar için iyileştirme (yeni sayfa yerine)

Görev kapsamı dışında olsa da not: **Anamur ve Silifke** sayfaları (Mersin merkezine en uzak ilçeler, en düşük
ticaret hacmi) mevcut haliyle en yüksek risk taşıyan sayfalar — ya (a) FAQPage + gerçek yerel kanıt eklenerek
güçlendirilmeli ya da (b) arama hacmi gerçekten çok düşükse `/matbaa/mersin` ana sayfasına yönlendirilip
noindex/konsolide edilmesi değerlendirilmeli (bu kararın verilmesi için Semrush/GSC arama hacmi verisi bu
oturumda çekilmedi — sonraki adımda teyit gerekir).

---

## Sınırlamalar / Bu Oturumda Doğrulanamayanlar

- **Google Business Profile'ın gerçekten var olup olmadığı** canlı Google Haritalar/arama sorgusuyla teyit
  edilmedi (coordinator talimatıyla veri toplama erken durduruldu) — yalnızca sayfa-içi dolaylı kanıtlara
  dayanarak "muhtemelen yok/optimize değil" sonucuna varıldı. **Sonraki adım:** `google.com/maps` üzerinde
  "Markala Mersin matbaa" ve "324 Ajans Mersin" aramaları ile doğrudan teyit.
  yapılmalı.
- **Yelp, BBB Türkiye karşılığı gibi Tier 1 dizinlerde site: arama testi** yapılmadı (Türkiye'de Yelp/BBB
  kültürel/pazar karşılığı zaten sınırlı — bu yüzden Türkiye'ye özgü alternatif liste sunuldu, ama mevcut
  citation varlığı canlı kontrol edilmedi).
  ölçülmedi.
- **Gerçek arama hacmi verileri** (yeni il/ilçe sayfası önerileri için) bu oturumda Semrush/GSC'den çekilmedi;
  yalnızca görev bağlamında verilen iki veri noktasına (gaziantep matbaa #34/720 arama, mersin yenişehir
  matbaa #55) dayanıldı.
- **Sayfa metinlerinin tamamı** değil, extraction aracının döndürdüğü ilk ~500-2500 karakterlik kesit
  incelendi (JSON çıktı modu içerik alanlarını kırpıyor); sayfaların alt kısımlarında ek yerel kanıt
  (fotoğraf galerisi, testimonial bloğu) bulunma ihtimali tamamen dışlanamaz — görsel/ekran görüntüsü
  incelemesi yapılmadı.
- **Rakip local pack analizi** (Mersin'de "matbaa" araması için gerçek 3 sonuç kim, proximity/prominence
  karşılaştırması) yapılmadı — bu denetim yalnızca Markala'nın kendi sinyallerine odaklandı.
- Proximity, local pack sıralama varyansının **%55,2**'sini açıklıyor (Search Atlas ML) ve bu, sayfa
  optimizasyonuyla kontrol edilemez bir faktördür — GBP doğrulama adresi netleştikten sonra bile Mersin
  dışındaki aramalarda üst sıralarda çıkmak yapısal olarak zordur; stratejinin ağırlığı organik/ulusal
  arama + kargo/e-ticaret konumlandırmasında kalmalı, yalnızca yerel pack'e bel bağlanmamalı.
