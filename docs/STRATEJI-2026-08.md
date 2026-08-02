# Markala.com.tr — Strateji & Yol Haritasi 2026-08
> Hazirlayan: Claude | Tarih: 2026-08-03

## OZET: Markala'nin Gercegi
**Site gorsel olarak mukemmel, teknik temeli guclu — ama 0 satis yapiyor cunku kullanici odeme yapmadan once giris duvarına carpiyor.**

## 1. KRITIK SORUNLAR

### 1.1 Satis Olduren Kok Sorunlar
- Giris duvari: Meta reklamina 5.614 TL harcandi -> 0 satis
- Google Ads kimlik dogrulamasi eksik (reklamlar durabilir!)
- AI bot blokaji (Cloudflare): GPTBot/ClaudeBot engeli = AI arama gorum. 0/5
- SMTP kurulmamis: Iletisim formu sessizce yutuyor
- GA4 ID girilmemis: Hicbir donusum verisi yok

### 1.2 Teknik Borclar
- Dosya yukleme stub: file.name aliyor, R2'ye hicbir sey gitmiyor
- Auth localStorage: Gercek kullanici hesabi yok
- DKIM eksik: DMARC quarantine + DKIM yok = spam klasoru
- Email Obfuscation: CF acik -> 953 sayfa 'kirik linkli' (Ahrefs)
- Iyzico mock: Odeme WhatsApp'a yonlendiriyor (gecici cozum)


### 1.3 Pazarlama Hatalari
- 4 haftalik icerik ritmi (Urun/Kampanya/Guven/B2B) uygulanmiyor
- Kartvizit 480 TL/1000 adet fiyati reklamlarda yoksa en guclu kanca bosta
- 'KDV dahil' avantaji one cikarilmiyor (rakipler KDV'yi sonradan ekliyor!)
- 'Numune talebi' ozelligi var ama hic tanitilmiyor
- ACILIS15 kuponu 29 Tem'de bitmis — yeni siparisler icin kupon yok

### 1.4 Rakiplere Gore Aciklar
- Urun: 48 vs Bidolubaskı 150+ (geride)
- Dosya yukleme: Stub vs calisıyor (kritik eksik)
- Prova/onay: Yok vs var (guven sorunu)
- Sablonlar (PDF/AI): Yok vs var
- Sadakat puani: Yok vs ParaPuan

### 1.5 Rakiplere Gore Ustunlukler (REKLAMLARDA KULLAN)
- KDV dahil seffaf fiyat (KIMSE YAPMIYOR)
- Embed fiyat widget (iframe — rakiplerde yok)
- Modern Next.js UX (rakipler WooCommerce/Ticimax)
- KVKK tam uyumluluk (export/sil/consent log)
- Local SEO sayfaları (matbaa/sehir/ilce)
- 1-2 is gunu uretim (rakipler 5-10 gun)


---

## 2. YOL HARITASI

### ASAMA 0 — BU HAFTA (Hasan Elle Yapacak — 30 Dakika)

#### 0-A Cloudflare AI Bot Blocku Kaldir (5 dk) — EN KRITIK
dash.cloudflare.com -> markala.com.tr -> AI Crawl Control
GPTBot, ClaudeBot, Google-Extended, PerplexityBot -> Allow
Managed robots.txt -> KAPAT
=> AI arama gorunurlugu 0->5 olur

#### 0-B Meta Custom Audience ToS (30 saniye)
https://www.facebook.com/customaudiences/app/tos/?act=1492007215052815
-> Kabul Et
=> Sonra 'Meta kitlelerini kur' de — 4 kitleyi ben kurarım

#### 0-C Google Ads Kimlik Dogrulama (ACIL!)
Google Ads Bildirim Merkezi -> Kimlik dogrulama akisi
=> ISG kampanyasi dahil tum reklamlar guvenceye girer

#### 0-D DKIM Kur (~1 saat)
Plesk/cPanel -> markala.com.tr -> DKIM etkinlestir -> TXT al
Cloudflare DNS -> TXT kaydi ekle
=> 'DKIM'i dogrula' de — ben kontrol ederim

#### 0-E Email Obfuscation Kapat (2 dk)
dash.cloudflare.com -> markala.com.tr -> Scrape Shield -> Email Address Obfuscation -> OFF
=> 953 kirik linkli sayfa temizlenir (Ahrefs 29 bulgu)


### ASAMA 1 — ILKAY (Ben Uyguluyorum - Hasan Onay Verirse)

#### 1-A Misafir Checkout — #1 ONCELIK (DONUSUM KATLANIR)
Sorun: Reklamdan gelen kullanici giris duvarinda takiliyor -> 0 satis
Cozum: Uye olmadan devam et (ad + e-posta + telefon yeterli)
Siparis sonrasi 'Hesap olusturmak ister misin?' opt-in
Beklenen etki: Meta 0-satis probleminin %80'ini cozer

#### 1-B SMTP + GA4 Env Kurulumu
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, CONTACT_TO (MDaemon)
NEXT_PUBLIC_GA4_ID=G-XXXXXXXX

#### 1-C WhatsApp Akisi Guclendirme
Urun sayfasinda 'WhatsApp ile Hizli Siparis' one cikart
Konfigurasyon sonrasi direkt WhatsApp linki olustur (siparis ozeti dolu gelsin)

#### 1-D HOSGELDIN Kuponu (ACILIS15 Yerine)
HOSGELDIN15 = ilk sipariste %15 veya 75 TL indirim (250 TL min)

#### 1-E Marka Tonu Duzeltmesi
'81 il kargo' -> '81 ile kargo' (kanonik form — tum sitede)
'panelden' -> 'panelde' (kanonik form)
Bazı butonlarda SATIN AL -> geri don

#### 1-F Indirilebilir Sablon Sayfasi
/rehber/sablonlar sayfasi
Kartvizit/brosur/rollup icin PDF/AI/EPS sablonlar
Rakiplerin tumu var, Markala'da yok

### ASAMA 2 — 2-3. AY

#### 2-A Dosya Yukleme (R2 Entegrasyonu)
FormData -> Cloudflare R2 -> Pre-signed URL
Preflight kontrol listesi (boyut, CMYK, 300 dpi)

#### 2-B Prova/Onay Akisi
Yukleme sonrasi -> 'Grafikerlerimiz incelebecek (1-4 saat)'
WhatsApp/e-posta dijital prova -> Musteri onay -> Uretime gec

#### 2-C Sadakat Puani
Her 10 TL = 1 Markala Puani
500 puan = 50 TL indirim

#### 2-D Urun Yelpazesi (48 -> 100+)
Kase, magnetik kartvizit, dosya/klasor, restoran menu, sticker, ISG genisletme

#### 2-E 4 Haftalık Icerik Takvimi (Her Cuma Planla)
Hafta 1: Urun + Fiyat (kirik beyaz zemin)
Hafta 2: Kampanya/Deger (gece moru)
Hafta 3: Guven & Memnuniyet (mor)
Hafta 4: Kurumsal/B2B (teklif CTA)

### ASAMA 3 — 4-6. AY
- NestJS API canli baglanti (PostgreSQL, gercek auth)
- Bayi/E-Bayi programi (%10-20 indirim, cari hesap)
- Sektorel paketler (Restoran, Ajans, Acilis, ISG)
- TurkPatent 'Markala' tescili


---

## 3. REKLAM STRATEJISI

### Meta (Facebook/Instagram)
Mevcut: 5.614 TL/30g -> 0 satis (kök neden: giris duvari)
Misafir checkout ACILDIKTAN SONRA:

Kitle: Site 180g | Butce: 150 TL/g | Format: Carousel | Mesaj: Fiyat odakli
Kitle: Sepet 14g | Butce: 100 TL/g | Format: Dinamik | Mesaj: Tamamla
Kitle: IG Etkilesim 365g | Butce: 100 TL/g | Format: Story | Mesaj: HOSGELDIN15
Kitle: LAL Yeni | Butce: 150 TL/g | Format: Tek gorsel | Mesaj: KDV dahil

### Google Ads RSA (Hazir Basliklar)
'KDV Dahil Seffaf Fiyat' | '1-2 Is Gunu Uretim' | '81 Ile Kargo'
'Kartvizit 1000 Adet 480 TL' | 'Ucretsiz Tasarim Destegi' | 'Rollup 2.000 TL'

### Instagram Icerik Rotasyonu (Her Hafta)
Hafta 1: Urun + fiyat rozetli gorseller
Hafta 2: Kampanya/deger mesaji (gece moru)
Hafta 3: Musteri referansi/teslimat foto
Hafta 4: Kurumsal/B2B teklif CTA

## 4. SEO ONCELIKLERI
1. kartvizit baski — ana hedef
2. online matbaa — marka konumlandirma
3. rollup baski fiyat
4. brosur baski ucuz
5. acil kartvizit baski — 0 rekabet, yuksek niyet

Blog: Ayda 2 yeni yazi (matbaa terimleri, dosya hazirlama rehberleri)
Sozluk genisletme, Yardim merkezi yeni sorular

---

## 5. ONCELIK SIRASI KONTROL LISTESI

### Bu Hafta (Hasan Manuel — 30 dk)
[ ] Cloudflare AI bot blogu kaldir
[ ] Meta Custom Audience ToS
[ ] Google Ads kimlik dogrulama
[ ] DKIM kur
[ ] Email Obfuscation kapat

### Bu Hafta (Ben Uygularım — Hasan Onay Verirse)
[ ] Misafir checkout implementasyonu
[ ] SMTP + GA4 env konfigurasyon
[ ] HOSGELDIN15 kupon kodu
[ ] WhatsApp siparis akisi guclendirme
[ ] '81 ile' yazim duzeltmeleri tum site

### Gelecek Hafta
[ ] Indirilebilir sablon sayfasi
[ ] 4 haftalik icerik takvimi hazirlama
[ ] Meta 4 kitle kurulumu
[ ] Google Ads RSA baslikları guncelle

### 1. Ay
[ ] Dosya yukleme R2 entegrasyonu
[ ] Urun yelpazesi genisletme (48->80 urun)
[ ] TurkPatent tescil

---
*Belge: Claude Otonom Analiz — 2026-08-03*
*Kaynak: Proje tum .md dosyalari + kod analizi + rakip analizi*

