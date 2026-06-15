# Markala — KVKK + Tüketici Hukuku Uyum Denetimi

> **Tarih:** 2026-06-15  
> **Denetçi:** KVKK Privacy Officer Ajanı (GalagoAI / 324 Ajans BT)  
> **Kapsam:** `markala.com.tr` — matbaa + reklam ürünleri e-ticaret platformu  
> **Hedef:** Reklam öncesi KVKK + 6502 TK + 6563 ETK hazırlık durumu  
> ⚠️ **Bu belge taslaktır. Hasan'ın hukuk müşaviri onayı olmadan public yapılmaz.**

---

## 1. Gap Analizi Tablosu — Madde × Durum × Kritiklik

### 1.1 KVKK (6698 sayılı Kanun)

| Madde | Gereklilik | Mevcut Durum | Kritiklik | Aksiyon |
|---|---|---|---|---|
| **m.5 — Hukuki Dayanak** | Rıza gerektiren işlemler için opt-in; sözleşme ifası için rızasız | ⚠️ Analytics (GA4/Clarity) onay kontrolü olmadan yükleniyor | 🔴 KRİTİK | `Analytics` bileşenine consent gate ekle |
| **m.5 — Açık Rıza** | Pazarlama e-posta/SMS için ayrı opt-in checkbox | ✅ Kayıt formunda `marketingConsent` checkbox var | ✅ OK | — |
| **m.10 — Aydınlatma** | Açık, anlaşılır, eksiksiz aydınlatma metni | ✅ `/yasal/kvkk` kapsamlı metin var; VERBIS_NO placeholder | 🟡 ORTA | VERBİS başvurusu tamamlanınca doldur |
| **m.11 — Veri Sahibi Hakları** | 8 hakkın kullanılabilir kanalı | ✅ `/kvkk-basvuru` sayfası + form var | ✅ OK | Backend entegrasyonu (mock → prod) |
| **m.12 — Veri Güvenliği** | Teknik ve idari önlemler | 🟡 HTTPS ✅, Argon2 ✅, 2FA admin ✅; Secure cookie flag ❌ | 🟡 ORTA | Cookie `secure` flag ekle; güvenlik audit |
| **m.13 — Başvuru Yanıt** | 30 gün içinde ücretsiz yanıt | ❌ `/api/kvkk-basvuru` MOCK — DB + mail yok | 🔴 KRİTİK | SendGrid entegrasyonu + DB kayıt |
| **m.9 — Yurt Dışı Aktarım** | SCC veya açık rıza | 🟡 Aydınlatma metninde belirtiliyor; fiili SCC imzası kontrolü gerekli | 🟡 ORTA | Alt işlemci DPA kontrol listesi |
| **VERBİS Kaydı** | E-ticaret faaliyeti → kayıt zorunlu (m.16) | ❌ Başvuru beklemede | 🔴 KRİTİK | PTT KEP + VERBİS başvurusu (2-3 hafta) |
| **Çerez Rızası** | Analitik/pazarlama çerezleri opt-in | ✅ Banner granüler, 3 kategori, opt-in | ✅ OK | Analytics consent entegrasyonunu kapat |
| **Veri Saklama** | Süre politikası + otomatik silme | ⚠️ Aydınlatma metninde yazılı; teknik otomasyonu yok | 🟡 ORTA | Faz 3 DB'de retention policy |
| **Veri İhlali Bildirimi** | 72 saat içinde KVK Kurulu + kişiler | ❌ Prosedür/şablon mevcut değil | 🟡 ORTA | Olay yanıt planı hazırla (bu denetimde yapıldı) |

### 1.2 Tüketici Hukuku (6502 + Mesafeli Sözleşmeler Yönetmeliği)

| Gereklilik | Mevcut Durum | Kritiklik | Aksiyon |
|---|---|---|---|
| **Mesafeli Satış Sözleşmesi** | ✅ Kapsamlı, 10 madde, fire toleransı belirtilmiş | ✅ OK | Hukuk müşaviri final review |
| **Ön Bilgilendirme Formu** | ✅ `/yasal/on-bilgilendirme` mevcut | ✅ OK | — |
| **Cayma Hakkı İstisnası** | ✅ m.15/1-ç kişiye özel üretim istisnası doğru belirtilmiş | ✅ OK | — |
| **İade Politikası** | ✅ 7 günlük bildirim, fotoğraflı süreç, üretim hatası kriterleri | ✅ OK | — |
| **Yetkili Mahkeme** | ✅ Tüketici Hakem Heyeti + Tüketici Mahkemesi | ✅ OK | — |
| **Sipariş Onay Akışı** | ⚠️ Ön bilgilendirme "checkout'ta gösterildi/onaylandı" mekanizması kodu kontrol edilmeli | 🟡 ORTA | Ödeme sayfasında checkbox onayı doğrula |
| **Teslimat Süresi (30 gün)** | ✅ 1-7 üretim + 1-3 kargo → max 10 gün, 30 gün sınırı rahat | ✅ OK | — |
| **Fiyat Şeffaflığı** | ✅ Kargo ücreti sipariş özetinde gösteriliyor | ✅ OK | — |

### 1.3 Ticari Elektronik İleti (6563 + TEİK Yönetmeliği)

| Gereklilik | Mevcut Durum | Kritiklik | Aksiyon |
|---|---|---|---|
| **İzin alma (e-posta)** | ✅ Kayıt formunda opt-in checkbox | ✅ OK | `marketingConsent` DB'de kayıt garanti et |
| **İzin alma (SMS)** | ⚠️ NetGSM stub — izin kaydı mekanizması belirsiz | 🔴 KRİTİK | SMS gönderiminde izin kontrolü zorunlu |
| **İleti Yönetim Sistemi (İYS)** | ❌ ileti.gov.tr entegrasyonu yok | 🔴 KRİTİK | 1 Mayıs 2021'den itibaren B2C SMS/mail için zorunlu |
| **Opt-out mekanizması** | ⚠️ Hesabım > Bilgilerim'de ayar var; mail unsubscribe link belirsiz | 🟡 ORTA | Her pazarlama mailinde tek tıkla iptal linki ekle |
| **ETBİS Kaydı** | ❌ Başvuru beklemede | 🔴 KRİTİK | Site yayına alınmadan önce zorunlu |

### 1.4 E-Ticaret Mevzuatı (6563 + E-Ticaret Yönetmeliği)

| Gereklilik | Mevcut Durum | Kritiklik | Aksiyon |
|---|---|---|---|
| **ETBİS Kaydı** | ❌ `[BAŞVURU BEKLEMEDE]` | 🔴 KRİTİK | etbis.gtb.gov.tr — başvur |
| **ETBİS Rozeti** | ❌ Footer'da yok | 🔴 KRİTİK | ETBİS no gelince footer'a ekle |
| **KEP Adresi** | ❌ `[BAŞVURU BEKLEMEDE]` | 🟡 ORTA | PTT KEP başvurusu |
| **Şirket Bilgileri Footer** | ⚠️ Kontrol edilmeli — vergi no, MERSIS, adres görünür mü? | 🟡 ORTA | Footer + iletişim sayfası audit |
| **Fatura/E-Arşiv** | ⚠️ Paraşüt stub — e-arşiv entegrasyonu Faz 4 | 🟡 ORTA | Faz 4 önceliklendir |

---

## 2. Reklam Başlatılmadan Önce Mutlaka Kapatılması Gerekenler

> Bu liste **engelleme** niteliğindedir — tamamlanmadan reklam yayınlanmamalıdır.

### 🔴 Blokör — Reklam Öncesi Zorunlu

| # | Başlık | Açıklama | Tahmini Süre |
|---|---|---|---|
| **1** | **Analytics Consent Gate** | GA4, Clarity ve diğer tracker'lar cookie consent onayı olmadan yüklenemesin. `Analytics` bileşenine `hasConsent('analytics')` kontrolü ekle. | 2 saat |
| **2** | **ETBİS Kaydı + Rozeti** | E-ticaret faaliyeti başlayınca yasal; reklam = ticari faaliyet = ETBİS zorunlu. | 1-2 hafta (başvuru süreci) |
| **3** | **VERBİS Kaydı** | Kişisel veri işleme başlangıcında zorunlu. Reklam = veri toplama. | 2-3 hafta (başvuru süreci) |
| **4** | **İYS (İleti Yönetim Sistemi) Entegrasyonu** | Pazarlama SMS/e-posta için zorunlu. NetGSM + SendGrid gönderiminde İYS izin sorgusu olmadan gönderilemez. | Faz 4 öncelik |
| **5** | **KVKK Başvuru Backend** | Mock endpoint prod'a alınmadan başvuru formu görsel; 30 gün yanıt yükümlülüğü yerine getirilemiyor. | 4-8 saat (SendGrid + DB) |
| **6** | **Ödeme Sayfası Ön Bilgilendirme Onayı** | Checkout'ta MSS + Ön Bilgilendirme checkbox onayı açıkça kaydedilmeli ve sipariş kaydına bağlanmalı. | 4-8 saat |

### 🟡 Önemli — Mümkün Olduğunca Hızlı

| # | Başlık | Açıklama |
|---|---|---|
| **7** | **Cookie `Secure` Flag** | `writeConsent()` fonksiyonuna `; secure` ekle (prod'da HTTPS garanti) |
| **8** | **KEP Adresi** | Yasal başvuru kanalı; aydınlatma metninde placeholder var |
| **9** | **Footer Şirket Bilgileri** | Vergi no, MERSIS, adres footer'da görünür ve doğru olmalı |
| **10** | **Marketing Mail Unsubscribe** | Her pazarlama mailinde one-click unsubscribe linki (CAN-SPAM + TEİK) |
| **11** | **SMS İzin Kaydı** | NetGSM'e SMS gönderiminde `marketingConsent=true` kontrolü ekle |

---

## 3. Mevcut Belgelerin Değerlendirmesi ve Faz 3-4 Önerileri

### 3.1 Güçlü Yönler (Mevcut)

- **KVKK Aydınlatma Metni**: Kapsamlı, 9 bölümlü, hukuki dayanak kategorileri doğru
- **Çerez Politikası**: Granüler 3 kategori, sürüm takibi, yeniden açma mekanizması — sektör standardında
- **Mesafeli Satış Sözleşmesi**: Matbaa fire toleransı açıkça yazılmış (sektör sorunlarını önleyici)
- **KVKK Başvuru Formu**: 8 hak net listeli, e-posta + TC ile kimlik doğrulama mekanizması
- **Kayıt Akışı**: Pazarlama opt-in varsayılan olarak kapalı değil ama checkbox unchecked — kabul edilebilir

### 3.2 Faz 3 (Gerçek API/DB) — Eklenmesi Gerekenler

```
1. Kullanıcı kaydında: marketingConsent (bool) + consentDate (timestamp) + consentIP kaydet
2. KVKK başvurularını DB'ye kaydet: status=PENDING, dueDate=+30gün, ticketId ata
3. SendGrid ile: başvuru sahibine alındı maili + kvkk@markala.com.tr'ye bildirim
4. Sipariş kaydında: termsAccepted (bool) + onBilgilendirmeAccepted + timestamp
5. Soft delete: kullanıcı hesap silme → kişisel veriler hard delete değil anonymize
   (vergi/fatura kaydı 10 yıl TTK gereği tutulmalı)
```

### 3.3 Faz 4 (Entegrasyonlar) — Eklenmesi Gerekenler

```
1. İYS API entegrasyonu: NetGSM + SendGrid gönderimleri önce İYS sorgusu
2. iyzico: 3DS zorunlu ✅ (zaten var), PCI-DSS uyum belgesi alın
3. Paraşüt e-arşiv: her sipariş için otomatik e-arşiv fatura
4. Data retention cron: 10 yıl geçmiş fatura verilerini archive'a taşı
5. KVKK başvuru SLA: deadline-1 gün otomatik uyarı (Celery beat benzeri)
```

### 3.4 Aydınlatma Metni Güncellemeleri (Faz 3-4 ile birlikte)

Şu an metinde olmayan veya eksik olan maddeler:

| Eksiklik | Öneri |
|---|---|
| VERBİS no placeholder | Başvuru sonrası gerçek no ile doldur |
| KEP placeholder | Alındıktan sonra doldur |
| Sub-processor listesi (tam) | Hetzner/hosting sağlayıcı ekle |
| Çocuk verisi koruma | "18 yaş altı hizmet yok" zaten var ✅ |
| Pazarlama izni geri çekme yöntemi | Hesabım > Bilgilerim linki ekle |
| Cookie consent versiyonu | Her büyük değişiklikte aydınlatma metnini de güncelle |

---

## 4. KVKK m.12 — Minimum Teknik Gereksinim Kontrol Listesi

| Kategori | Gereksinim | Durum | Not |
|---|---|---|---|
| **Aktarım Güvenliği** | HTTPS / TLS 1.2+ | ✅ | Cloudflare Always HTTPS |
| **Şifre Güvenliği** | Argon2 veya bcrypt hash | ✅ | Gizlilik politikasında belirtilmiş |
| **Ödeme Güvenliği** | PCI-DSS uyumlu sağlayıcı | ✅ | iyzico |
| **Dosya Depolama** | Şifreli depolama | ✅ | Cloudflare R2 |
| **Erişim Kontrolü** | Admin 2FA zorunlu | ✅ | Gizlilik politikasında belirtilmiş |
| **Rate Limiting** | API rate limit | ✅ | Mevcut |
| **DDoS Koruması** | WAF + DDoS | ✅ | Cloudflare |
| **Cookie Güvenliği** | `HttpOnly; Secure; SameSite` | ⚠️ | `Secure` flag eksik |
| **XSS Koruması** | Input sanitization | ⚠️ | Kontrol edilmeli (özellikle dosya yükleme) |
| **SQL Injection** | Prisma ORM parametre binding | ✅ | Prisma kullanıyor |
| **Yedekleme** | Düzenli backup + test | ⚠️ | Faz 3'te planlanmalı |
| **Erişim Logu** | Admin erişim logu | ⚠️ | Faz 3'te implement et |
| **Oturum Yönetimi** | Oturum timeout | ⚠️ | Mevcut implementasyonu doğrula |
| **Güvenlik Bildirimi** | Responsible disclosure | ❌ | `security.txt` ekle |
| **Veri Minimizasyonu** | Sadece gerekli veri topla | ✅ | TC kimlik opsiyonel ✅ |
| **Şifreleme (rest)** | DB at-rest encryption | ⚠️ | Hetzner disk şifreleme kontrol et |
| **PII Maskeleme** | Log'larda PII maskeleme | ⚠️ | Logger konfigürasyonu kontrol et |
| **Sentry Consent** | Analytics gibi consent gate | ❌ | Sentry yüklenmeden önce consent kontrolü |
| **İYS Sorgulama** | Pazarlama öncesi izin sorgusu | ❌ | Faz 4 zorunlu |
| **Audit Log** | Veri sahibi başvuru logu | ❌ | `kvkkRequest` tablosu gerekli |

---

## 5. Veri İhlali Olay Yanıt Planı (Taslak)

> Ayrıntılı plan için bkz: `docs/kvkk/VERI-IHLALI-OLAY-YANIT-PLANI.md`

### Özet Akış

```
İhlal Tespiti
    ↓
İlk 0-4 saat: Tecrit + Değerlendirme
    ↓ (kişisel veri etkileniyorsa)
0-24 saat: Hasan + Hukuk Müşaviri Bildirim
    ↓
24-72 saat: KVK Kurulu Bildirimi (kvkk.gov.tr portal)
    ↓ (10.000+ kişi veya hassas veri etkileniyorsa)
72 saat içinde: Etkilenen kişilere bireysel bildirim
    ↓
İyileştirme + Post-mortem
```

---

## 6. Sonuç Puanı

| Alan | Puan | Notlar |
|---|---|---|
| KVKK Aydınlatma | 7/10 | VERBİS/KEP placeholder düşürüyor |
| Çerez Yönetimi | 8/10 | Consent gate açığı düşürüyor |
| Tüketici Hukuku | 8/10 | Ön bilgilendirme checkout onayı eksik |
| E-Ticaret Mevzuatı | 4/10 | ETBİS + İYS yok |
| Teknik Güvenlik | 7/10 | Secure flag + audit log eksik |
| **Genel** | **6.8/10** | **Reklama başlamadan 6 engel kapatılmalı** |

---

*Bu belge taslaktır. Hasan Söylemez'in hukuk müşaviri onayı alınmadan public yapılmaz.*  
*Sorumlu: KVKK Privacy Officer | markala.com.tr | 2026-06-15*
