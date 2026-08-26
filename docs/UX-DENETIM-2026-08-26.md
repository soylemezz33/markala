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

## İş bölümü önerisi
- **Dev oturumu (çekirdek ödeme/checkout):** #2, #3, #5, #6, #9, #10, #11, #13, #16-18 — bu dosyadan spec olarak işletilebilir.
- **SEO oturumu (Hasan onayıyla, küçük/izole):** #1 (yazım hatası), #8 (sayaç tutarsızlığı araştırma+düzeltme), #12 (arama hata durumu), #14 (blog kapakları — otomasyona kapak üretimi eklenebilir)
- **Hasan (tasarım kararı):** #7 çerez kutusu mobil tasarımı, #19-20 yerleşim tercihleri
