# Markala — Reklam Öncesi Test Planı

> Amaç: Google Ads + sosyal medya reklamı öncesi siteyi personele baştan sona test ettirmek; hata ve görsel bozukluğu sıfırlamak.
> Reklam amacı: **satış + bilinirlik**.

---

## 0. Reklam öncesi DEPLOY edilmesi gereken kod düzeltmeleri

Aşağıdakiler kodda yapıldı ama **canlıya (markala.com.tr) deploy edilince** geçerli olur. Test, deploy SONRASI yapılmalı:

| Konu | Durum |
|------|-------|
| Sahte kart ödemesi kaldırıldı → **WhatsApp/telefon sipariş** akışı | ✅ kodda |
| Yanıltıcı "iyzico / 3D Secure / SSL / VISA-Mastercard" rozetleri kaldırıldı | ✅ kodda |
| İletişim + newsletter formu **gerçek e-posta** gönderiyor | ✅ kodda — **SMTP env girilmeli** |
| GA4 + dönüşüm event'leri (sepete ekle, sipariş, WhatsApp, form) | ✅ kodda — **`NEXT_PUBLIC_GA4_ID` girilmeli** |
| Mobil yatay taşma (ürün detay, ürünler) düzeltildi | ✅ kodda |

**Hasan'ın deploy öncesi gireceği env değişkenleri (web container):**
`SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, CONTACT_TO` (MDaemon) + `NEXT_PUBLIC_GA4_ID` (G-XXXX).

---

## 1. Test ortamı / cihaz matrisi

Reklam trafiğinin **%70+'ı mobil** gelir. Önce mobil test edilir. Tarayıcı **gizli sekmede** açılır.

| Öncelik | Cihaz | Tarayıcı |
|---------|-------|----------|
| 1 | Android telefon | Chrome |
| 2 | iPhone | Safari |
| 3 | Masaüstü | Chrome |
| 4 | Masaüstü | Edge / Firefox |

Telefonlar hem **WiFi** hem **mobil veri** ile denenir.

---

## 2. Smoke Test — reklamın vuracağı kritik yollar (biri kırıksa reklam durur)

1. **Ana sayfa** açılıyor mu? Logo, menü, hero, "çok satanlar" yükleniyor mu? Boş/bozuk görsel var mı?
2. **Ürün bul → ürün detay**: menü/kategori → ürün → fiyat, görsel, açıklama, "sepete ekle" görünüyor mu?
3. **Sepete ekle → sepet**: adet değiştir, sil → toplam doğru mu? (KDV %20, 1500₺ üstü kargo bedava)
4. **Sipariş akışı**: Sepet → "Siparişe Devam Et" → İletişim → Fatura → Teslimat → **Onay** → "WhatsApp ile Siparişi Tamamla" → WhatsApp açılıp sipariş özeti **dolu** geliyor mu?
5. **İletişim formu**: doldur, gönder → "iletildi" diyor mu? *(SMTP girildiyse mesaj `CONTACT_TO`'ya düşmeli — kontrol et)*
6. **Telefon / WhatsApp butonları** (sağ alt + footer + iletişim): tıkla → gerçekten arama/WhatsApp açıyor mu?

---

## 3. Görsel kalite kontrol listesi (her sayfada)

- [ ] Bozuk/yüklenmeyen görsel yok (boş gri kutu, kırık ikon)
- [ ] Yazı taşması yok (başlık kutudan/butondan taşmıyor)
- [ ] Placeholder / "lorem" / "TODO" / "undefined" / "NaN" görünmüyor
- [ ] Hizalama düzgün — kartlar eşit, boşluklar simetrik
- [ ] Sarı zemin üstü yazı okunuyor (kontrast)
- [ ] Türkçe karakterler (ş, ğ, ı, İ, ç, ö, ü) düzgün
- [ ] **Yatay kaydırma yok** (mobilde sağa-sola kayma) — parmakla sağa it, sayfa kaymamalı
- [ ] Boş durum ekranları düzgün (boş sepet, sonuç yok, boş favori)
- [ ] Tüm buton/linkler bir işe yarıyor (ölü link yok)
- [ ] Mobil hamburger menü açılıp kapanıyor

---

## 4. Sayfa sayfa gezilecek liste (hepsi mobil + masaüstü)

**Ana akış:** Ana sayfa · `/urunler` · bir Kategori · bir Ürün detay · Sepet · Sipariş (`/odeme`)
**İçerik:** Hakkımızda · Hizmetler · Kurumsal · Referanslar · Blog · Yardım/SSS · Sözlük · Fiyat Listesi · Kampanyalar
**Dönüşüm:** İletişim · Kurumsal Başvuru · Kargo Takip · Fiyat Hesapla
**Hesap:** Giriş · Kayıt · Hesabım (giriş yapıp dene)
**Yasal:** Mesafeli Satış · KVKK · Gizlilik (footer linklerinden)

---

## 5. Form & dönüşüm noktaları (gerçekten çalışmalı)

- **Kayıt ol:** yeni e-posta ile → çalışıyor mu? Hata mesajları Türkçe mi?
- **Giriş yap:** kayıt olunan hesapla → oturum açılıyor mu?
- **İletişim formu:** boş gönder → uyarı; geçerli gönder → onay + (SMTP'liyse) mail düşüyor mu?
- **Hata senaryoları:** yanlış e-posta, eksik alan → düzgün uyarı mı, çirkin hata mı?

---

## 6. SEO & sosyal paylaşım (sosyal reklam için)

- **Link önizleme:** site linkini WhatsApp/Facebook'a yapıştır → kart görseli + başlık düzgün çıkıyor mu?
- Sayfa başlıkları (tarayıcı sekmesi) anlamlı mı?

---

## 7. Hız

- Ana sayfa mobil veride **3 sn altı** açılıyor mu?
- Sayfa açılırken içerik zıplıyor mu (layout kayması)?

---

## 8. Hata bildirim şablonu (her personel her hatayı böyle yazsın)

```
1. Cihaz/Tarayıcı : Android Chrome / iPhone Safari / PC Chrome
2. Sayfa (URL)    : markala.com.tr/...
3. Ne yaptım      : "ürünü sepete ekleyip siparişe geçtim"
4. Ne bekliyordum : "toplam 250₺ olmalıydı"
5. Ne oldu        : "toplam 0₺ göründü"
6. Ekran görüntüsü: [ekle]
7. Önem           : KIRMIZI / SARI / YEŞIL
```

**Önem kodları:**
- 🔴 **KIRMIZI** — akış kırık, sipariş/iletişim yapılamıyor → reklam başlamaz
- 🟡 **SARI** — çalışıyor ama çirkin / yazım hatası → reklam sonrası düzeltilir
- 🟢 **YEŞIL** — ufak kozmetik

---

## 9. Önemli not — mock/placeholder içerik

- **Ürün kataloğu şu an örnek (mock) veridir.** Gösterilen ürün adları/fiyatları/görselleri gerçek katalogla birebir değildir. Reklamda belirli bir ürün/fiyat vaat edilecekse, o ürünün canlıdaki hali tek tek doğrulanmalı.
- Ürün görselleri jenerik (marka renginde) placeholder'dır; gerçek ürün fotoğrafları eklenince güncellenecek.
