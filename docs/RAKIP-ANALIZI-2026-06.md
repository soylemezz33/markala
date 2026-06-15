# Rakip Analizi & Markala Karşılaştırma Raporu

> Tarih: 2026-06-13 · Kapsam: bidolubaski.com, baskikapinda.com, bayraksantekstil.com.tr vs markala.com.tr
> Yöntem: 4 paralel ajan (3 rakip web araştırması + markala kod analizi) → sentez

## 1. Yönetici Özeti

- **Markala'nın en büyük gerçeği: site ucuna kadar MOCK.** Storefront (apps/web) NestJS API'ye hiç bağlı değil; ödeme, auth, dosya yükleme, mail/SMS, kargo, fatura ve kurumsal başvuru tümü stub/localStorage. Yani rakiplerle kıyaslanan "özelliklerin" çoğu **kod olarak var ama operasyonel olarak çalışmıyor**. Rapor boyunca bunlar ⚠️ ile işaretlendi.
- **Ürün yelpazesi darlığı net açık.** Markala 35 kategori / 48 ürün; Bidolubaskı 150+ ürün ve sektörel dikeyler (HoReCa, ambalaj, sağlık, fuar), Baskıkapında reçete/adisyon/yağ değişim kartı/emlak gibi nişler, Bayraksan ise bayrak/tekstil dikeyinde Markala'dan çok daha derin. Markala "yatay genişlik" ve "sektörel dikey paket" ekseninde **geride**.
- **Markala'nın teknik temeli rakiplerin hepsinden modern.** Next.js 14 + NestJS + Prisma, deterministik fiyat motoru (m² alan/çevre, matrix grid), SVG mockup motoru, embed fiyat widget'ı, iki kademeli local SEO, JSON-LD/structured data, KVKK altyapısı. Bu, **canlıya alındığında** rakiplerin WooCommerce/Ticimax hissi veren altyapısına karşı gerçek üstünlük.
- **Online tasarım editörü hiçbir rakipte (gerçek anlamda) yok — Bidolubaskı hariç.** Baskıkapında ve Bayraksan'da editör yok; Bidolubaskı'da şablon-tabanlı editör var. Markala'da da yok. Bu, **Bidolubaskı dışında herkesin ortak boşluğu** ve Markala'nın farklılaşma fırsatı.
- **Baskıya uygunluk (preflight) kontrolü Markala'da hiç yok.** Bidolubaskı'da "otomasyon robotu + grafiker" çift kontrol var, Baskıkapında/Bayraksan manuel kontrol yapıyor. Markala dosyayı gerçekte yüklemiyor bile — matbaa e-ticareti için **kritik eksik**.
- **Prova/onay adımı Markala'da yok.** Baskıkapında WhatsApp dijital prova onayı, Bidolubaskı ödeme-sonrası grafiker onayı, Bayraksan manuel onay yapıyor. Markala ödeme akışında hiç onay yok (zaten ödeme de mock). Türk müşterisinde güven için **olmazsa olmaz**.
- **Markala'nın ucuz kazanımları hazır:** ücretsiz kargo eşiği (1500₺) zaten var (Bayraksan'ın 1 numaralı şikayeti gizli/alıcı-ödemeli kargo), dinamik teslim tarihi rakiplerde dönüşüm tetikliyor, sadakat puanı (Bidolubaskı ParaPuan) tekrar siparişi kilitliyor. Bunlar düşük eforla kapatılabilir.

**Tek cümlelik konum:** Markala ürün/UX vizyonu ve teknik temelde önde, ama **operasyonel olarak henüz canlı bir mağaza değil**; rakipler işlevsel-ama-eski, Markala modern-ama-mock.

---

## 2. Rakip Profilleri

| Marka | Konumlandırma | En Güçlü Yanı | En Zayıf Yanı |
|---|---|---|---|
| **Markala** (markala.com.tr) | 324 Ajans alt markası, genel matbaa+reklam ürünleri e-ticareti, modern Next.js stack, sarı palet, mock-first | Deterministik m²/matrix fiyat motoru + SVG mockup motoru + modern UX + KVKK/SEO altyapısı | Uçtan uca MOCK: ödeme/auth/upload/mail/kargo çalışmıyor; storefront API'ye bağlı değil; ürün yelpazesi dar (48 ürün) |
| **Bidolubaskı** | "Türkiye'nin en büyük online matbaası", B2B2C, KOBİ/ajans odaklı, Pro üyelik | 150+ ürün + sektörel dikeyler + Pro/ParaPuan sadakat + online editör + numune kutusu + ayrı yardım merkezi | Düşük memnuniyet (Şikayetvar ~2.6/5): kalite/kesim tutarsızlığı, teslim gecikmeleri, çözümsüz destek |
| **Baskıkapında** | "İlk ve tek en büyük online baskı merkezi", Mersin merkez, esnaf+bayi (B2B2B), agresif fiyat-hız | Geniş sektörel niş katalog (reçete/adisyon/emlak/otomotiv) + WhatsApp prova onayı + ücretsiz tasarım desteği + E-BAYİ programı | Gerçek editör yok, üretim 7-10 iş günü uzun, KDV gösterimi tutarsız, eski WooCommerce hissi, bağımsız itibar verisi yok |
| **Bayraksan Tekstil** | Bayrak/tekstil dikey uzmanı, fuar/etkinlik B2B, "3 iş günü üretim" hız vurgusu | Bayrak/tekstil derinliği (yelken/makam/gönder vb.) + açık kademeli adet fiyat tablosu + fuar stand paketleri + bundle çapraz satış | Alıcı-ödemeli gizli kargo (1 numaralı şikayet), editör yok, Gmail/tutarsız iletişim, kuruluş yılı çelişkisi, zayıf B2B self-servis |

---

## 3. Büyük Karşılaştırma Matrisi

Hücre kodları: ✅ Var · ⚠️ Kısmi / Mock · ❌ Yok · — İlgisiz · ❓ Doğrulanamadı

| Boyut | Markala | Bidolubaskı | Baskıkapında | Bayraksan |
|---|---|---|---|---|
| Geniş ürün yelpazesi | ⚠️ (48 ürün, dar) | ✅ (150+) | ✅ (250+ iddia) | ⚠️ (bayrak derin, matbaa sınırlı) |
| Sektörel dikey paketler | ❌ | ✅ (HoReCa/sağlık/fuar) | ✅ (reçete/emlak/otomotiv) | ✅ (fuar stand paketleri) |
| Online tasarım editörü | ❌ | ✅ (şablon-tabanlı) | ❌ | ❌ |
| İndirilebilir hazır şablon | ❌¹ | ✅ (PSD/AI/PDF) | ✅ (PDF/AI/EPS) | ⚠️ (örnek şablon sayfası) |
| Anlık/dinamik fiyat hesaplama | ✅ (motor güçlü) | ✅ | ✅ | ❌ (sabit kademeli tablo) |
| Dosya yükleme | ⚠️² (sadece dosya adı) | ✅ | ✅ | ❓ (e-posta/WhatsApp) |
| Baskıya uygunluk (preflight) kontrolü | ❌ | ✅ (robot+grafiker) | ⚠️ (manuel) | ⚠️ (manuel grafik kontrol) |
| Prova / baskı onayı adımı | ❌ | ✅ (ödeme sonrası) | ✅ (WhatsApp dijital prova) | ⚠️ (manuel/telefon) |
| Ücretsiz tasarım desteği | ⚠️³ (toggle, mock akış) | ✅ | ✅ | ✅ |
| Kademeli toplu/adet indirimi | ⚠️ (matrix grid var, motor) | ✅ (Pro %10+ParaPuan) | ⚠️ (pakete gömülü) | ✅ (açık tablo: 1/4-12/13-99/100+) |
| Hızlı/acil baskı kategorisi | ❌⁴ | ⚠️ (sınırlı aynı gün) | ✅ (ayrı kategori) | ✅ (3 iş günü vaadi) |
| Dinamik ürün-bazlı teslim tarihi | ❌ | ✅ | ✅ ("en geç X kargoda") | ⚠️ (genel 3 gün vaadi) |
| Ücretsiz kargo | ✅⁵ (1500₺ üstü) | ✅ (eşiksiz tüm sipariş) | ⚠️ (sadece kampanyalı) | ❌ (alıcı-ödemeli, gizli) |
| Kredi kartı taksit | ⚠️ (iyzico stub) | ✅ | ✅ | ✅ (12 taksit) |
| Havale/EFT | ⚠️ (form var, tahsilat mock) | ✅ | ✅ | ✅ |
| Kapıda ödeme | ❌ (model gereği) | ❌ | ❌ | ❓ |
| Kurumsal/bayi hesabı | ⚠️⁶ (başvuru formu mock) | ✅ (Pro program) | ✅ (E-BAYİ) | ⚠️ (söylem var, akış yok) |
| Cari / açık (vadeli) hesap | ❌ | ❓ | ❓ | ❓ |
| Sadakat puanı programı | ❌ | ✅ (ParaPuan) | ❌ | ❌ |
| Tek-tık tekrar sipariş | ⚠️⁷ (sayfa var, mock) | ✅ | ❓ | ❓ |
| Sipariş takip | ⚠️ (tracking-mock) | ✅ | ⚠️ (Yurtiçi üzerinden) | ❓ |
| Numune kutusu | ❌ | ✅ ("Kalitenizi Görmek İstiyorum") | ❌ | ❌ |
| Canlı destek (site içi chat) | ❌ | ✅ (widget) | ❌ (WhatsApp birincil) | ❌ (WhatsApp) |
| WhatsApp destek | ❌ | ❓ | ✅ (prova onayı da) | ✅ |
| Blog / içerik pazarlaması | ✅⁸ (statik ama render) | ✅ (güçlü) | ⚠️ (blog var, sığ) | ❌ (zayıf) |
| Ayrı yardım merkezi / sözlük | ✅ (yardım+sözlük) | ✅ (subdomain) | ⚠️ (SSS) | ❌ |
| Modern mobil/UX | ✅⁹ (Next.js, R3F) | ✅ (modern standart) | ❌ (WooCommerce hissi) | ❌ (eski okul) |
| KVKK/veri yönetimi olgunluğu | ✅ (export/sil/consent log) | ❓ | ❓ | ❓ |
| Embed fiyat widget'ı | ✅ (iframe) | ❌ | ❌ | ❌ |
| Local SEO (şehir/ilçe) | ✅ (matbaa/[city]/[district]) | ⚠️ (kategori SEO) | ⚠️ | ⚠️ (ürün landing) |
| Bağımsız itibar/sosyal kanıt | ❌¹⁰ | ⚠️ (düşük: ~2.6/5) | ❌ (veri yok) | ⚠️ (düşük: şikayetler) |

**Markala dipnotları (MOCK / durum açıklaması):**
1. **¹** İndirilebilir hazır şablon kütüphanesi yok; sadece "tasarım desteği iste" toggle'ı.
2. **²** `design-upload.tsx` yüklenen File'dan sadece `file.name` alıyor; R2'ye hiçbir şey gitmiyor, 200MB/format kontrolü gerçek değil (sadece HTML accept).
3. **³** Tasarım desteği toggle'ı var ama arkasında gerçek grafik ekip akışı/ticket yok.
4. **⁴** Acil/hızlı baskı kategorisi yok; üretim süresi sadece `product.productionTime` statik alanı.
5. **⁵** Kargo sabit 79₺ / 1500₺ üstü ücretsiz **hardcoded**; desi/ağırlık/bölge hesabı ve gerçek DHL etiketi yok (tracking-mock).
6. **⁶** Kurumsal başvuru formu `setTimeout(800ms)` mock; API'ye POST yok, dosyalar yüklenmiyor.
7. **⁷** `hesabim/tekrar-siparis` sayfası var ama auth mock (e-postada "@" varsa giriş), siparişler localStorage'da.
8. **⁸** Blog/sözlük/kampanya içeriği statik TS'ten geliyor ama gerçekten render ediliyor.
9. **⁹** İki-yüzey strateji (marketing dark/3D + transactional light) gerçek kod; mobil sticky CTA var.
10. **¹⁰** Yorum/değerlendirme sistemi `lib/reviews.ts` ile mock.

---

## 4. Onlarda Var, Bizde Yok (Kapatılması Gereken Boşluklar)

### YÜKSEK ETKİ

| # | Boşluk | Hangi rakipte | Markala'ya etkisi | Efor |
|---|---|---|---|---|
| 1 | **Gerçek dosya yükleme + depolama (R2)** | Bidolubaskı, Baskıkapında | Şu an müşteri tasarımını gönderemiyor — sipariş fiziksel olarak üretilemez. Mağazanın varlık şartı. | M |
| 2 | **Baskıya uygunluk (preflight) kontrolü** | Bidolubaskı (robot+grafiker) | DPI/CMYK/taşma payı kontrolü yok → hatalı dosya = iade/şikayet (Bidolubaskı'nın 1 numaralı şikayet kaynağı). Otomatik+insan çift kontrol fark yaratır. | M-L |
| 3 | **Prova / baskı onayı adımı** | Baskıkapında (WhatsApp), Bidolubaskı | Türk müşterisi "onaylamadan basılmasın" ister; onay yoksa güven düşük, iade riski yüksek. | M |
| 4 | **Ürün-bazlı dinamik teslim tarihi** | Bidolubaskı, Baskıkapında ("en geç X kargoda") | Net teslim taahhüdü dönüşümü artıran kanıtlanmış tetikleyici; Markala'da sadece statik productionTime. | S |
| 5 | **Ürün yelpazesi + sektörel dikeyler** | Hepsi | 48 üründe dar kalıyor; HoReCa/sağlık/emlak/otomotiv dikeyleri hem sepet büyütür hem niş SEO getirir. | L |

### ORTA ETKİ

| # | Boşluk | Hangi rakipte | Markala'ya etkisi | Efor |
|---|---|---|---|---|
| 6 | **Sadakat/puan programı (ParaPuan benzeri)** | Bidolubaskı | B2B tekrar siparişini kilitler; matbaada müşteri ömür değeri yüksek. | M |
| 7 | **Hızlı/acil baskı kategorisi** | Baskıkapında, Bayraksan | Aciliyet segmenti yüksek marjlı; ayrı kategori navigasyonda dönüşüm kancası. | S-M |
| 8 | **WhatsApp destek + prova kanalı** | Baskıkapında, Bayraksan | Düşük maliyetli, Türk müşterisine uygun; hem destek hem onay akışı. | S |
| 9 | **İndirilebilir hazır şablon kütüphanesi** | Bidolubaskı, Baskıkapında | Editör maliyetine girmeden self-servis tasarım girişi + SEO içeriği. | M |
| 10 | **Numune kutusu** | Bidolubaskı | Satın alma öncesi kalite güveni; matbaada güçlü dönüşüm aracı. | M (operasyonel) |
| 11 | **Bağımsız sosyal kanıt / değerlendirme** | (gerçek yorum) | Markala'da yorumlar mock; canlı yorum + dış puan güven açığını kapatır. | M |
| 12 | **E-BAYİ / esnaf paketi programı** | Baskıkapında, Bidolubaskı Pro | B2B2B gelir kanalı; ajans/bayi segmentini kilitler. | M |

### DÜŞÜK ETKİ

| # | Boşluk | Hangi rakipte | Markala'ya etkisi | Efor |
|---|---|---|---|---|
| 13 | **Online tasarım editörü (canvas)** | Bidolubaskı | Fark yaratır ama maliyetli; şablon kütüphanesi + tasarım desteği kısa vadede yeterli. | L |
| 14 | **Site içi canlı chat widget** | Bidolubaskı | WhatsApp ile telafi edilebilir; düşük öncelik. | S |
| 15 | **Cari/açık (vadeli) hesap** | (hiçbirinde net değil) | Kurumsal alıcı için artı ama rakiplerde de doğrulanamadı; rekabet baskısı düşük. | L |

---

## 5. Bizde Var, Onlarda Yok / Daha İyi (Avantajlarımız)

> Not: Markala'nın birçok "avantajı" kod olarak hazır ama **mock**. Aşağıda dürüstçe işaretlendi — bunlar "potansiyel avantaj, önce canlıya alınmalı" kategorisinde.

| Avantaj | Durum | Neden rakiplerden iyi |
|---|---|---|
| **Modern teknik stack** (Next.js 14 + NestJS + Prisma) | ✅ Gerçek | Rakipler WooCommerce/Ticimax/eski tema; Markala mobil/hız/UX'te yapısal üstün. |
| **Deterministik m² fiyat motoru** (alan+çevre, çevre-bazlı ek dikiş/kopça, 1m² altı otomatik fire) | ✅ Gerçek (frontend) | Bayraksan sabit tablo gösteriyor; Markala branda/afiş gibi ürünlerde **canlı, doğru** hesap yapıyor. |
| **Matrix fiyat grid'i** (NCR/makbuz kademeli adet) | ✅ Gerçek | Rakiplerde bu granülerlikte konfigüratör yok. |
| **SVG mockup motoru** (31 kategoriye özel, OG kartı üretiyor) | ✅ Gerçek | Gerçek foto olmadan profesyonel görsel; rakiplerde yok. **Ama** canlıda atölye fotoğrafıyla desteklenmeli. |
| **Embed edilebilir fiyat widget'ı** (iframe) | ✅ Gerçek | B2B lead aracı; hiçbir rakipte yok. |
| **İki kademeli local SEO** (şehir + ilçe landing) | ✅ Gerçek | Rakipler kategori SEO'da; Markala coğrafi long-tail'i yakalıyor. |
| **JSON-LD/structured data olgunluğu** (Product/Breadcrumb/HowTo/FAQ) | ✅ Gerçek | SEO görünürlüğünde yapısal avantaj. |
| **KVKK olgunluğu** (veri-export, hesap-sil, consent/audit log, opt-in) | ⚠️ Kısmi (web route var, API bağlı değil) | Yasal uyumda rakiplerin önünde — ama uçtan uca bağlanmalı. |
| **Ücretsiz kargo eşiği (1500₺)** | ⚠️ Hardcoded ama çalışıyor | Bayraksan'ın gizli/alıcı-ödemeli kargosuna karşı net üstünlük. |
| **İki-yüzey tasarım stratejisi** (marketing dark/3D + transactional light) | ✅ Gerçek | Marka algısı + dönüşüm dengesi; rakipler tek-yüzey işlevsel. |
| **Güvenlik-sertleştirilmiş auth** (argon2, token rotation) | ⚠️ Yazılmış, bağlanmamış | Canlıya alınınca rakiplerden güvenli; şu an storefront çağırmıyor. |

**Özet:** Markala'nın gerçek ve şu an çalışan farklılaştırıcıları = fiyat motoru kalitesi + mockup motoru + embed widget + local SEO + modern UX. Geri kalan "avantajların" yarısı canlıya alınana kadar **sadece kod**.

---

## 6. Süreç & İşleyiş Karşılaştırması

### Sipariş Akışı

| Adım | Markala | Bidolubaskı | Baskıkapında | Bayraksan |
|---|---|---|---|---|
| Ürün seçimi | Konfigüratör (radio/dimension/matrix) | Kategori/arama + özellik | Kategori + sınırlı opsiyon | Ürün + varyant model |
| Fiyat | Anlık, deterministik motor | Anlık, adet kademeli | Anlık "KDV Dahil" | Sabit kademeli tablo |
| Tasarım | "Destek iste" toggle / dosya adı (gerçek upload yok) | Editör / şablon / hazır tasarım | Şablon indir / yükle / ücretsiz destek | Şablon + manuel ekip |
| Ödeme | **Mock 3D Secure (setTimeout)** | Önce öde → sonra tasarım onayı | Öde → sonra prova | Öde |
| Onay/prova | **Yok** | Grafiker+robot 24 saat | WhatsApp dijital prova | Manuel/telefon |
| Üretim/teslim | Statik productionTime | 3-5 (bazı 21) iş günü | 7-10 + kargo 1-2 | 3 iş günü |

**Markala'nın süreçteki kopukları:**
- **Ödeme = mock**, üstelik iki kopuk mock katmanı (frontend setTimeout + API iyzico stub) birbirine bağlı bile değil.
- **Prova/onay adımı tamamen yok** → müşteri ne bastığını onaylamadan (mock) ödeme yapmış oluyor.
- **Dosya gerçekten yüklenmiyor** → üretilebilir bir iş çıktısı yok.
- **Sipariş localStorage'da** → sayfa yenileyince/başka cihazda kaybolur.

### Fiyatlandırma Mantığı

- **Markala:** En sofistike motor (alan/çevre/matrix/modifier), KDV "dahil" kabul ediliyor — ama özet sayfasında ayrı %20 satırı da var (**çift gösterim/karışıklık riski**). TC/VKN doğrulaması sadece uzunluk (gerçek checksum yok).
- **Bidolubaskı:** Adet kademeli + Pro %10 + ParaPuan; en olgun sadakat katmanı.
- **Baskıkapında:** Katalogda KDV hariç, detayda KDV dahil — **tutarsız**.
- **Bayraksan:** Açık kademeli tablo ama KDV hariç gösterim → sepette sürpriz.

### Teslimat Modeli

- **Markala:** 79₺ sabit / 1500₺ üstü ücretsiz (hardcoded, desi yok), DHL stub.
- **Bidolubaskı:** Eşiksiz ücretsiz kargo + dinamik teslim tarihi (en iyi teklif) **ama** gerçekte gecikiyor (Şikayetvar).
- **Baskıkapında:** Ücretsiz sadece kampanyalı; "en geç X kargoda" taahhüdü güçlü.
- **Bayraksan:** Alıcı-ödemeli gizli kargo — **en zayıf**, Markala'nın net fırsat alanı.

---

## 7. Önceliklendirilmiş Aksiyon Planı (Markala İçin)

> **0. GERÇEK (her şeyden önce): Mock'ları canlıya al.** Aşağıdaki "özellik" aksiyonlarının çoğu, altyapı bağlanmadan anlamsız. Storefront'u NestJS API'ye bağlamadan; ödeme, auth, upload, mail/SMS, kargo gerçek olmadan Markala bir "demo"dur, mağaza değil. Tüm liste bu gerçeğin üzerine kuruludur.

| # | Aksiyon | Neden | İlham (rakip) | Efor |
|---|---|---|---|---|
| 1 | **Storefront'u API'ye bağla + gerçek auth (argon2/JWT zaten yazılı)** | Sipariş/oturum localStorage'da kayboluyor; mağazanın temel şartı. | — (iç gereklilik) | L |
| 2 | **iyzico'yu gerçek entegre et** (BIN, 3D Secure, başarısız ödeme, iade) | Mock ödeme = gelir yok. İki kopuk mock katmanı birleştirilmeli. | Hepsi (taksit standardı) | M-L |
| 3 | **R2 dosya yükleme + preflight (DPI/CMYK/bleed) kontrolü** | Tasarım yüklenmeden üretim imkânsız; preflight iade/şikayeti azaltır. | Bidolubaskı (robot+grafiker) | M-L |
| 4 | **Prova/onay adımını akışa ekle (WhatsApp + hesap içi onay)** | Türk müşterisinde güven şartı; onaysız baskı = iade. | Baskıkapında (WhatsApp prova) | M |
| 5 | **Ürün-bazlı dinamik teslim tarihi göster** ("en geç X kargoda") | Düşük efor, kanıtlanmış dönüşüm tetikleyicisi. | Baskıkapında, Bidolubaskı | S |
| 6 | **Mail/SMS bildirimlerini gerçekleştir** (SendGrid+NetGSM stub'larını bağla) | Sipariş/kargo/prova onay maili gitmiyor; müşteri körlüğü. | Hepsi | S-M |
| 7 | **Ürün yelpazesini genişlet + 3-4 sektörel dikey aç** (HoReCa, emlak, sağlık, otomotiv landing+ürün) | Sepet büyüklüğü + niş SEO; en büyük yapısal açık. | Bidolubaskı, Baskıkapında | L |
| 8 | **Hızlı/acil baskı kategorisi** (navigasyonda birinci sınıf) | Yüksek marjlı aciliyet segmenti, dönüşüm kancası. | Baskıkapında, Bayraksan | S-M |
| 9 | **Sadakat puanı programı (ParaPuan benzeri)** | B2B tekrar siparişini kilitler; API'de Coupon/model altyapısı zaten var. | Bidolubaskı | M |
| 10 | **Kupon motorunu olgunlaştır** (limit/son kullanma/min sepet/sayaç) | Tek hardcoded kod (HOSGELDIN) iptidai; pazarlama esnekliği yok. | — (iç gereklilik) | S-M |
| 11 | **Gerçek yorum/değerlendirme + dış sosyal kanıt** | Yorumlar mock; güven açığı. Rakiplerin düşük puanı Markala için fırsat. | (Bidolubaskı'nın tersi ders) | M |
| 12 | **KDV gösterimini tekilleştir + TC/VKN gerçek checksum** | Çift KDV gösterimi karışıklık/yasal ibraz riski; VKN/TC doğrulaması yüzeysel. | (Baskıkapında'nın hatasından kaçın) | S |

**Bonus / orta vade (düşük öncelik):** indirilebilir şablon kütüphanesi (M), numune kutusu operasyonu (M), E-BAYİ programı (M), online canvas editör (L), site içi canlı chat (S — WhatsApp ile telafi edilebilir).

**Stratejik özet:** Markala'nın yol haritası net iki fazlı olmalı — **Faz A: mock'ları canlıya al** (1-6, 10, 12 — mağazayı çalışır kıl), **Faz B: rekabet genişliği** (7-9, 11 + bonuslar — pazarda farklılaş). Rakiplerin ortak zayıflığı (kargo şeffaflığı, kalite tutarlılığı, çözüm odaklı destek, modern UX) Markala'nın doğal konumlanma alanı: **"modern, şeffaf, güven veren matbaa"** — ama bu vaadi ancak altyapı canlıya alınınca verebilir.
