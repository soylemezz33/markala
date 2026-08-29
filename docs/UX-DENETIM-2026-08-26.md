# UX/UI Denetim Raporu — 2026-08-26

> İki koldan yapıldı: (A) Playwright ile canlı görsel/akış denetimi — 10 sayfa × masaüstü+mobil,
> ekran görüntüleri `markala.com.tr-audit/screenshots/ux-2026-08-26/` · (B) kod seviyesi etkileşim
> denetimi (apps/web/src). Aşağıda birleşik, önem sıralı liste. [G]=görsel denetim, [K]=kod denetimi.

## KRİTİK

1. **[G] Anasayfa hero'sunda yazım hatası: "daha tfazlası"** — otomatik slider'da, fold üstünde,
   masaüstü+mobil her zaman görünür. Baskı firması için imaj zedeleyici. Kanıt: `_crop_anasayfa-desktop-hero.png`.
2. **[K] Ödeme başlatma hatasında her tekrar deneme YENİ "ödeme bekliyor" siparişi yaratıyor** —
   `odeme/page.tsx:582,640-667`: sipariş DB'ye yazılınca idempotency tuzu yenileniyor; iyzico
   başlatma başarısız olup kullanıcı tekrar denediğinde ikinci sipariş oluşuyor. Çift tahsilat yok
   ama bekleyen sipariş çöplüğü + müşteri karmaşası. (21 Ağu'daki ikili "beklemede" siparişleri
   muhtemelen bu senaryo.) Çözüm: tuz yenilemeyi ödeme başlatma başarısına taşı / mevcut orderId ile retry.
3. **[K] Misafir müşteri ödeme hatasında çıkmazda** — `odeme/hata/page.tsx:38-50` birincil CTA
   `/hesabim/siparislerim/...`e gider → misafir `/giris` duvarına çarpar, misafir siparişi hesapta
   görünmez; sepet de iyzico'ya yönlenmeden önce boşaltılmış (`odeme/page.tsx:657`). Self-servis
   kurtuluş yok. Çözüm: misafire nonce'lu public "ödemeyi tamamla" linki veya orderId'li farklı CTA.

## YÜKSEK

4. **[G] Konfigüratörde tutarsız doğrulama** (canlı test edildi):
   - Adet=0 → hatasız kabul, sepete sessizce 1 olarak ekleniyor (ekran 0 göstermeye devam ediyor)
   - En=5cm (min 30) → hiç uyarı yok, fiyat "min 1 m²" kuralıyla sessiz devam
   - Boy=9999 → ✅ örnek davranış: net hata + CTA'nın "Teklif Al/WhatsApp"a dönüşü
   Alt sınır ve adet doğrulaması üst sınırdaki kaliteye çekilmeli. Kartvizitteki paket-buton
   modeli (serbest giriş yok) yapısal çözüm örneği.
5. **[K] Tasarım dosyası yüklenirken "Sepete Ekle" engellenmiyor** — `configurator.tsx:301-322` +
   `design-upload.tsx:32`: yavaş bağlantıda upload bitmeden eklenen kalem `uploadedFileUrl`süz
   kaydediliyor → sipariş dosyasız düşüyor, müşteri gönderdiğini sanıyor. Upload sürerken CTA kilitlenmeli.
6. **[K] 5 lead formunda (teklif-al, iletişim, kurumsal, KVKK, numune) doğrulama yalnız sunucuda;
   hata bandı formun tepesinde ve scroll/focus yok** — uzun formda mobil kullanıcı "hiçbir şey olmadı"
   sanıyor; hatalar tek tek dönüyor (her düzeltme bir ağ turu). Çözüm: `scrollIntoView` + checkout'taki
   `stepIssues` deseninin kopyalanması.
7. **[G] Mobil ilk ziyarette çerez kutusu hero altındaki fiyat çapası + ana CTA'ları tamamen örtüyor**
   (`_crop_anasayfa-mobile-hero.png`). Kutunun mobilde daha kompakt/alt-bant tasarımı gerekiyor.
8. **[G] Büyük kategoride ürün sayacı tutarsız: başlıkta 164, grid'de 146** (uyarı-ikaz kategorisi).
   Muhtemel bayat meta sayaç vs canlı sorgu — güven + veri tutarlılığı sorunu.
9. **[K] Tüm form inputları 14px (text-sm) → iOS Safari focus'ta zoom'luyor** — checkout dahil 8+ dosya
   (`odeme/page.tsx:1577`, `phone-input.tsx:139`...). Global 16px kuralı gerekli. Mobil sürtünmenin
   sessiz büyük kalemi.

## ORTA

10. **[K] Sepet fiyatları ekleme anında donuyor; iyzico tutarı farklılaşabilirse bildirim yok**
    (`cart-store.ts:105-106`) — reorder akışındaki "fiyat güncellendi" banner'ı normal akışa da gelmeli.
11. **[K] Ham teknik hata kodları kullanıcıya gösteriliyor** — "backend_unreachable", İngilizce NestJS
    validation mesajları (`siparis-kaydet/route.ts:105-313` → `odeme/page.tsx:626`). Türkçe eşleme tablosu gerekli.
12. **[K] Arama API hatası "sonuç bulunamadı" olarak sunuluyor** (`search-modal.tsx:157-159`) —
    kesintide her arama "yok" görünüyor; hata durumu + tekrar dene eklenmeli.
13. **[K] teklif-al'da telefon görünürde opsiyonel, sunucuda zorunlu** (`teklif-al/page.tsx:389` vs
    `api/teklif-al/route.ts:101`).
14. **[G] Blog'da 11 makalenin tamamı aynı jenerik placeholder kapakla** — ayırt edilemiyor,
    "şablon site" izlenimi; CTR kaybı. Makale başına kapak üretimi gerekli.
15. **[G+K] Erişilebilirlik:** konfigüratör sayı girişlerinde aria-label belirsiz; checkout'ta
    promosyon/puan inputlarının label ilişkisi yok (`odeme/page.tsx:1302-1370`); Bireysel/Kurumsal
    seçimi yalnız renkle iletiliyor (`:813-836`, aria-pressed yok). (Konfigüratörün radiogroup/focus
    tarafı örnek düzeyde iyi.)

## DÜŞÜK

16. [K] Sipariş detayında ağ hatası "Sipariş bulunamadı"ya dönüşüyor, retry yok (`siparislerim/[orderId]/page.tsx:57-74`)
17. [K] Kayıt: şifre kuralları yalnız yardım metninde, client kontrolü sadece minLength (`kayit/page.tsx:339-350`)
18. [K] Checkout oturum düşmesi mesajında giriş linki yok (`siparis-kaydet/route.ts:286`)
19. [G] 2 ürünlü kategoride tam boy fiyat filtresi orantısız
20. [G] Mobilde WhatsApp balonu sabit alt CTA barına çok yakın
21. [G] /odeme'ye boş sepetle gelişte açıklamasız sessiz yönlendirme

## Bozulmaması gereken iyi yönler
- Mobil ürün sayfasındaki sabit "Toplam + Sepete Ekle" alt barı (dönüşüm kritik)
- Mini sepet çekmecesi (ücretsiz kargo ilerleme çubuğu dahil)
- Kartvizit paket-buton adet modeli; branda üst-sınır hata akışı (CTA dönüşümü)
- 10 sayfa × 2 viewport sıfır yatay taşma; tutarlı header/breadcrumb/footer
- Checkout'un çekirdeği: submit kilidi, idempotency, boş sepet yönlendirmesi, iskeletler

## DEV OTURUMU GÖREV PROMPTU (2026-08-26 ek — Hasan'ın seçtiği 3 iş)

> Aşağıdaki bloğu olduğu gibi geliştirici oturumuna verebilirsin.

---

**Görev: Konfigüratör doğrulama + kategori sayacı düzeltmeleri (3 iş)**
Bağlam: docs/UX-DENETIM-2026-08-26.md denetiminin 4. ve 8. bulguları. Storefront: apps/web.

**İş 1 — Adet alanına 0/geçersiz değer girilemesin (site geneli kural)**
- Belirti: Vinil branda konfigüratöründe Adet=0 girilip "Sepete Ekle"ye basılınca sepete sessizce
  1 adet ekleniyor ama ekrandaki input 0 göstermeye devam ediyor (ekran-sepet tutarsızlığı).
- İstenen davranış: adet asla 0/negatif/boş kalamaz — blur ve sepete-ekleme anında otomatik 1'e
  yuvarlanır VE görünür input değeri de 1'e güncellenir (kullanıcı ne olduğunu görür).
  İnput'a `min=1 inputMode=numeric` + değer temizleme (`onBlur` clamp) uygulanır.
- Kapsam taraması: yalnız branda değil — TÜM konfigüratör tiplerindeki sayısal alanları denetle
  (apps/web/src/components/product/configurator-fields/ altındaki alan bileşenleri + reducer).
  Serbest adet girişi olan her üründe aynı clamp; en/boy alanları İş 2'nin konusu.
- Kabul ölçütü: Adet=0 yazıp sepete ekleyince input 1'i gösterir ve sepete 1 düşer; 0 ile
  "Sepete Ekle" hiçbir üründe 0'lı kalem yaratamaz.

**İş 2 — Ürün bazlı minimum/maksimum ölçü sistemi (sistem geneli)**
- Belirti: Özel ölçülü üründe En=5 cm (üretim minimumu 30 cm'in altında) hiç uyarısız kabul
  ediliyor. Üst sınır (50 m²) ise doğru çalışıyor: kırmızı hata + CTA'nın "Teklif Al/WhatsApp"a
  dönüşmesi — İSTENEN kalite bu, alt sınıra ve tüm ürünlere simetrik uygulanacak.
- Yapılacak:
  1. Veri modeli: özel ölçü (en/boy) girişi olan ürünlerin konfigürasyon şemasına
     `minEn/maxEn/minBoy/maxBoy` (cm) alanları ekle (ürün `content`/options yapısında nerede
     duruyorsa oraya; mevcut 50 m² alan-kuralı nasıl tanımlıysa onunla tutarlı biçimde).
  2. Veri doldurma: özel ölçülü TÜM ürünleri tara (admin API), her biri için üretim min/max
     değerlerini mevcut ürün açıklama/spec'lerinden türet; açıklamada yoksa kategori bazlı makul
     varsayılan uygula ve doldurulan değerleri Hasan'ın onayına tablo hâlinde sun (üretilemez
     değer basmayalım).
  3. Konfigüratör: sınır dışı girişte üst-sınır davranışının aynısı — kırmızı inline hata
     ("Bu ürün için en az X cm / en fazla Y cm"), Sepete Ekle kilitlenir; makul durumlarda
     "Teklif Al/WhatsApp" alternatifi gösterilir.
  4. Sunucu tarafı: aynı sınırlar sipariş kaydında da doğrulanır (yalnız client değil).
- Kabul ölçütü: hiçbir özel ölçülü ürün, tanımlı min/max dışında bir ölçüyle sepete eklenemez;
  sınır ihlali kullanıcıya alanın yanında Türkçe ve net gösterilir.

**İş 3 — Kategori ürün sayacı tutarsızlığı (164 vs 146)**
- Kök sebep (tespit edildi): başlık bandı `cat.productCount` gösteriyor — bu değer API'nin
  Prisma `_count.products` ham ilişki sayısından geliyor (apps/web/src/lib/catalog.ts:236) ve
  pasif/yayında olmayan ürünleri de sayıyor. Grid ise `getProductsByCategory()` ile gelen GERÇEK
  (aktif) listeyi gösteriyor → 164 (ham) vs 146 (aktif) farkı = 18 pasif ürün.
- Düzeltme (ikisinden biri, tercihen a):
  a) Basit ve garantili: kategori sayfası başlığında `cat.productCount` yerine sayfada zaten
     çekilmiş `products.length` kullan (tek kaynak, tutarsızlık imkânsızlaşır); VEYA
  b) API'de `_count`'u filtrele (yalnız aktif ürünler) — diğer tüketiciler de düzelir.
- Kabul ölçütü: başlık ve grid her kategoride aynı sayıyı gösterir.

**İş 4 — WhatsApp tıklama ölçümü (GA4 olayı, site geneli)**
- Amaç: WhatsApp butonlarına yapılan tıklamalar şu an hiç ölçülmüyor; özellikle teklif-usulü
  satışlarda (İSG levhaları) reklam getirisinin kör noktası. Tıklamalar GA4 olayı olarak
  gönderilecek; sonrasında SEO oturumu bunu GA4 anahtar etkinliği + Google Ads ikincil dönüşümü
  olarak bağlayacak ve raporlara/grafiklere ekleyecek (o kısım dev işi DEĞİL — yalnız olay gönderimi).
- Yapılacak:
  1. Mevcut ölçüm altyapısını izle: `apps/web/src/lib/analytics.ts` içindeki olay gönderme
     desenini (generate_lead / cookie_consent nasıl gönderiliyorsa aynı yol) kullan — consent
     mimarisini BOZMA; gtag consent mode zaten onay/onaysız davranışı yönetiyor.
  2. Tek merkezî nokta: dağınık onClick'ler yerine ortak bir helper/bileşen
     (ör. `WhatsAppLink` veya `trackWhatsAppClick(kaynak)`).
  3. Olay şeması: ad `whatsapp_tikla`, parametreler: `kaynak`
     (`balon` | `urun_cta` | `iletisim` | `odeme_hata` | `footer` | başka nereden geliyorsa)
     ve `sayfa` (pathname).
  4. Kapsam — sitedeki TÜM WhatsApp temas noktaları taransın ve bağlansın; bilinenler:
     yüzen WhatsApp balonu (site geneli), konfigüratörün üst-sınır aşımında çıkan
     "Teklif Al / WhatsApp" CTA'sı, iletişim sayfası WhatsApp kartı, ödeme hata sayfasındaki
     WhatsApp linki, (varsa) footer/yardım sayfası linkleri.
  5. Teknik dikkat: link aynı sekmede navigasyona yol açıyorsa olay kaybolmasın
     (`transport_type: 'beacon'` veya `target="_blank"` garanti edilsin — balon zaten _blank ise sorun yok).
- Kabul ölçütü: GA4 DebugView/Realtime'da her temas noktasından `whatsapp_tikla` olayı doğru
  `kaynak` parametresiyle düşer; consent reddedilmiş oturumda site davranışı değişmez (hata yok).
- Deploy sonrası SEO oturumuna haber verilsin: anahtar etkinlik işaretleme + Ads ikincil dönüşüm
  bağlama + günlük rapora ekleme oradan yapılacak.

**İş 5 — Admin: iade ve iptal akışlarının bağlanması (2026-08-29, Hasan'ın canlı testinden)**
- Belirti: "Ödemeyi İade Et" ile "Siparişi İptal Et" tamamen bağımsız. Hasan test siparişinde
  iadeyi yaptı → para döndü, paymentStatus=iade_edildi oldu; ama sipariş durumu "Kargoda" kaldı
  ve iptal ayrıca yapılmadıkça öyle görünmeye devam ediyor. Kafa karıştırıcı + müşteri
  "Siparişlerim"de iade edilmiş siparişini hâlâ "Kargoda" görür.
- İstenen davranış:
  1. **"Siparişi İptal Et"** akışı: sipariş ödenmişse (paymentStatus=basarili) onay penceresine
     seçenek eklensin: "Ödeme de iade edilsin mi?" → evet ise önce refundOrder, başarılıysa
     updateStatus(iptal-edildi) zinciri; iade başarısızsa iptal DURDURULUR ve hata gösterilir
     (parası iade edilmemiş "iptal edilmiş" sipariş oluşmasın).
  2. **"Ödemeyi İade Et"** tek başına kullanıldığında sipariş durumu değişmez (kısmi/istisna
     senaryolar için doğru) AMA: (a) detay sayfasındaki mevcut bant kalsın, (b) siparişler
     LİSTESİNDE ödeme sütununda "İade Edildi" rozeti net görünsün, (c) müşteri tarafında
     (hesabım/siparişlerim) da "Ödemesi iade edildi" ibaresi gösterilsin.
  3. İade edilmiş+iptal edilmiş siparişin zaman çizelgesi yeşil "tamamlandı" adımları yerine
     iptal görünümüne dönsün (yeşil tikler yanıltıcı).
- Kabul ölçütü: iade+iptal tek akışta tamamlanabilir; iade edilen sipariş hem admin listesinde
  hem müşteri panelinde doğru etiketlenir; para iadesi olmadan iptal işaretlenemez (ödenmiş
  siparişlerde) ya da bilinçli onayla ayrışır.

---

## İş bölümü önerisi
- **Dev oturumu (çekirdek ödeme/checkout):** #2, #3, #5, #6, #9, #10, #11, #13, #16-18 — bu dosyadan spec olarak işletilebilir.
- **SEO oturumu (Hasan onayıyla, küçük/izole):** #1 (yazım hatası), #8 (sayaç tutarsızlığı araştırma+düzeltme), #12 (arama hata durumu), #14 (blog kapakları — otomasyona kapak üretimi eklenebilir)
- **Hasan (tasarım kararı):** #7 çerez kutusu mobil tasarımı, #19-20 yerleşim tercihleri
