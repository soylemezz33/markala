# Markala — Veri İhlali Olay Yanıt Planı

> **Versiyon:** 1.0 — Taslak  
> **Tarih:** 2026-06-15  
> **Hazırlayan:** KVKK Privacy Officer Ajanı  
> **Onay Bekleniyor:** Hasan Söylemez + Hukuk Müşaviri  
> **Yasal Dayanak:** KVKK m.12/5, Kişisel Veri İhlali Bildirim Tebliği (KVK Kurulu 2019/10)

---

## 1. Kapsam

Bu plan, `markala.com.tr` platformunda işlenen kişisel verileri etkileyen tüm güvenlik olaylarını kapsar:
- DB sızıntısı / yetkisiz erişim
- Kargo/teslimat bilgisi ifşası  
- Ödeme bilgisi açığı (iyzico tarafında iyzico kendi planıyla yönetir; tarafımızdaki sipariş meta verileri dahil)
- E-posta listesi sızıntısı
- Admin hesap ele geçirilmesi
- Cloudflare R2 dosya ifşası (tasarım dosyaları)

---

## 2. Roller ve İletişim

| Rol | Kişi | İletişim | Görev |
|---|---|---|---|
| **Olay Koordinatörü** | Hasan Söylemez | hasan.soylemez@galagoai.com | Karar mercii, KVK bildirimi imzalayan |
| **Teknik Yanıt** | Geliştirici (atanacak) | — | Tecrit, analiz, yama |
| **Hukuk Müşaviri** | Mersin'de KVKK uzmanı (atanacak) | — | KVK bildirimi içeriği onayı |
| **Müşteri İletişimi** | Hasan Söylemez | merhaba@markala.com.tr | Etkilenen kişilere bildirim |

---

## 3. Olay Farkındalık Kriterleri

Aşağıdaki durumlardan herhangi biri veri ihlali olarak değerlendirilir:

- Yetkisiz kişi müşteri verisine erişti veya erişebildi
- Şifreler, e-postalar veya sipariş bilgileri ifşa oldu  
- Admin paneline yetkisiz giriş tespit edildi
- Tasarım dosyaları veya faturalandırma verileri dışarı sızdı
- Kargo firmasından (DHL) müşteri verileri ifşa bildirim alındı
- İyzico'dan güvenlik bildirimi alındı

---

## 4. Olay Yanıt Adımları

### Faz 1 — Tespit ve İlk Yanıt (0–4 saat)

**Adım 1: Olay bildir**
- Sentry alarm veya manuel fark edilme → Hasan'a anlık bildirim
- Olay günlüğü aç: `docs/kvkk/incidents/YYYY-MM-DD-olay.md`

**Adım 2: Tecrit et**
```bash
# Gerekirse API erişimini geçici durdur
systemctl stop aisantral-api  # (GalagoAI yapısı — Markala için uyarla)

# Şüpheli hesabı dondur
# admin panel → kullanıcı → devre dışı bırak

# Cloudflare'de şüpheli IP'yi engelle
# Cloudflare Dashboard → Güvenlik → IP Erişim Kuralları
```

**Adım 3: Değerlendir — Aşağıdaki soruları cevapla**
- [ ] Kaç kişi etkilendi?
- [ ] Hangi veri kategorileri etkilendi? (kimlik / iletişim / ödeme meta / tasarım / şifre)
- [ ] İhlal ne zaman başladı? (log analizi)
- [ ] İhlal aktif mi devam ediyor mu?
- [ ] Yurt dışına veri çıkışı var mı?

---

### Faz 2 — Bildirim Kararı (0–24 saat)

**Kişisel veri etkilendiyse → KVK Kurulu bildirimi zorunlu (72 saat)**

| Soru | Evet | Hayır |
|---|---|---|
| Kişisel veri etkilendi mi? | → Bildirim zorunlu | → Yalnızca iç kayıt |
| 10.000+ kişi mi? | → Yüksek öncelikli | → Standart süreç |
| Hassas veri mi? (sağlık, mali, biyometrik) | → Anında bildirim | → 72 saat |
| Şifreler etkilendi mi? | → Tüm kullanıcı şifre sıfırlama | — |

**Hasan + Hukuk Müşaviri toplantısı** (video veya yüz yüze) — karar: bildir / bildirim gerekmiyor

---

### Faz 3 — KVK Kurulu Bildirimi (24–72 saat)

**Portal:** https://kvkk.gov.tr → Veri İhlali Bildirimi

**Bildirimde yer alması gerekenler (KVK Kurulu Tebliği m.4):**

```
1. Veri sorumlusu bilgileri
   - 324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Tic. Ltd. Şti.
   - VERBİS No: [alındıktan sonra]
   - Sorumlu temsilci: Hasan Söylemez

2. İhlal tarihi ve tespit tarihi

3. İhlalden etkilenen kişisel veri kategorileri
   (ad/soyad, e-posta, telefon, teslimat adresi, vb.)

4. Etkilenen kişi sayısı (tahmini)

5. İhlalin olası sonuçları
   (kimlik hırsızlığı riski, mali zarar, itibar kaybı)

6. Alınan veya alınacak önlemler
   (yamalama, şifre sıfırlama, sistem güçlendirme)

7. İletişim kişisi ve koordinatör
```

---

### Faz 4 — Etkilenen Kişilere Bildirim (72 saat içinde — gerekirse)

**Ne zaman bireysel bildirim gerekir:**
- Yüksek risk → kişilere bildir
- Şifreler ifşa → tüm etkilenenlere bildir + zorunlu sıfırlama
- Ödeme bilgisi → kişiye + iyzico'ya bildir

**Bildirim e-posta şablonu:**

```
Konu: Güvenlik Bildirimi — markala.com.tr Hesabınız Hakkında

Sayın [Ad Soyad],

[Tarih] tarihinde, platformumuzdaki bir güvenlik açığı nedeniyle kişisel
verilerinizin etkilenmiş olabileceğini tespit ettik.

ETKİLENEN VERİLER:
[Spesifik liste]

ALDIĞIMIZ ÖNLEMLER:
[Spesifik liste]

SİZDEN İSTEDİKLERİMİZ:
[Şifre sıfırlama / banka kontrolü vb.]

SORULARINIZ İÇİN:
merhaba@markala.com.tr | 0324 433 33 51

KVKK m.11 kapsamında tüm haklarınızı markala.com.tr/kvkk-basvuru
adresinden kullanabilirsiniz.

Saygılarımızla,
Hasan Söylemez
324 Ajans Bilgi Teknolojileri
```

---

### Faz 5 — İyileştirme (Olay sonrası)

- [ ] Güvenlik açığını yama ile kapat
- [ ] Penetrasyon testi yaptır
- [ ] `docs/kvkk/incidents/` klasörüne olay raporu ekle
- [ ] KVKK Kurulu'na kapanış bildirimi (gerekiyorsa)
- [ ] Teknik önlemler listesini güncelle
- [ ] Hasan + ekip post-mortem toplantısı

---

## 5. İhmal Durumunda Cezalar (Referans)

| İhlal | KVKK Cezası |
|---|---|
| Aydınlatma yükümlülüğü ihlali | 50.000 - 1.000.000 TL |
| Veri güvenliği ihlali | 100.000 - 2.000.000 TL |
| KVK Kurulu bildirim yapılmaması | 100.000 - 1.000.000 TL |
| Veri sorumlusu tescil ihlali (VERBİS) | 100.000 - 1.000.000 TL |
| ETBİS kaydı yaptırmayanlar | 50.000 TL (6563 m.13) |
| İYS entegrasyonu olmadan SMS/mail | 5.000 - 500.000 TL (TEİK) |

---

## 6. Olay Kayıt Şablonu

Her olay için `docs/kvkk/incidents/YYYY-MM-DD-[kisa-aciklama].md` oluştur:

```markdown
# Olay: [Başlık]

**Tarih:** YYYY-MM-DD  
**Tespit:** Kim tarafından nasıl tespit edildi  
**Durum:** Aktif / Kapalı  

## Zaman Çizelgesi
- HH:MM — İlk tespit
- HH:MM — Tecrit adımı
- HH:MM — Hasan bilgilendirildi
- HH:MM — KVK bildirimi (varsa)
- HH:MM — Kapatma

## Etki
- Etkilenen kişi sayısı:
- Etkilenen veri kategorileri:
- İhlal süresi:

## Kök Neden
[Teknik analiz]

## Alınan Önlemler
[Liste]

## Açık Aksiyonlar
[Liste]
```

---

*Taslak — Hasan Söylemez + Hukuk Müşaviri onayı bekleniyor*  
*markala.com.tr | 2026-06-15*
