# Veri İşleme Sözleşmesi (DPA) Şablonu

> **Sürüm:** 1.0
> **Oluşturulma:** 2026-06-16
> **Dayanak:** KVKK m.12, EU GDPR Art.28, EU AI Act m.10

---

## KISIM A — TENANT DPA (Veri Sorumlusu ↔ Markala/324 Ajans)

### Örnek: Lisan Fen Eğitim Kurumları ↔ 324 Ajans

---

**VERİ İŞLEME SÖZLEŞMESİ**

Bu Veri İşleme Sözleşmesi ("DPA"), aşağıdaki taraflar arasında akdedilmiştir:

**VERİ SORUMLUSU:**
- Unvan: Lisan Fen Eğitim Kurumları
- Adres: [Lisan Fen adresi]
- Yetkili Temsilci: Mehmet Erdoğan (Kurucu)
- ("Veri Sorumlusu" veya "Kurum")

**VERİ İŞLEYEN:**
- Unvan: 324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Tic. Ltd. Şti.
- Adres: Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir/Mersin
- Vergi No: 0012655788 / İstiklal Vergi Dairesi
- Yetkili Temsilci: Hasan Söylemez
- ("Veri İşleyen" veya "Markala")

---

### Madde 1 — Konu ve Kapsam

1.1. Veri İşleyen, Veri Sorumlusu adına **santral.lisanfen.com** Markala Bulut Santral hizmeti kapsamında aşağıdaki kişisel verileri işleyecektir:

| Veri Türü | Konu Kişi | İşleme Amacı |
|---|---|---|
| Ses kaydı | Öğrenci velileri, personel, aranılan kişiler | Çağrı kalite güvencesi |
| Çağrı transkripti | Konuşmada yer alanlar | Yapay zeka çağrı analizi |
| İletişim bilgisi (tel no) | Öğrenci, veli, personel | Çağrı yönetimi, raporlama |
| Çağrı meta verisi | Tüm arama tarafları | İstatistik ve raporlama |

1.2. İşleme yalnızca bu DPA'da belirtilen amaçlar için yapılacaktır.

---

### Madde 2 — Veri Sorumlusunun Talimatları

2.1. Veri İşleyen, Veri Sorumlusunun belgelenmiş talimatlarına uygun olarak hareket eder.

2.2. Veri İşleyen, Veri Sorumlusunu aşağıdaki durumlarda derhal bilgilendirir:
- Talimatın KVKK veya EU AI Act'a aykırı olduğunu düşündüğünde
- Herhangi bir veri ihlalinde (72 saat içinde)
- Yetkili makamların veri talep etmesi durumunda

---

### Madde 3 — Gizlilik

3.1. Veri İşleyen, kişisel verilere erişen personelinin gizlilik taahhüdü verdiğini teyit eder.

3.2. Kişisel verilere erişim "görevle ilgili olma zorunluluğu" (need-to-know) prensibine göre kısıtlanır.

---

### Madde 4 — Güvenlik Önlemleri

Veri İşleyen aşağıdaki teknik ve idari önlemleri uygular:

**Teknik:**
- Veriler yalnızca Türkiye'deki sunucularda işlenir (185.121.126.19, Mersin Turhost colo)
- Ses kayıtları disk seviyesinde şifreleme ile korunur
- OpenAI/Anthropic'e gönderimden önce PII scrubbing (`services/pii_scrubber.py`)
- Erişim logları her işlem için audit trail tutulur
- Ses kayıtları 90 gün sonra otomatik olarak silinir (configurable)

**İdari:**
- Yıllık güvenlik eğitimi
- Erişim yetki gözden geçirmesi (her 6 ayda bir)
- Veri ihlali müdahale planı (72 saat bildirim)

---

### Madde 5 — Alt İşleyiciler

5.1. Veri İşleyen, Veri Sorumlusunun ön yazılı onayı olmaksızın alt işleyici atayamaz.

5.2. Onaylı alt işleyiciler:

| Alt İşleyici | Konum | İşleme | Dayanak |
|---|---|---|---|
| OpenAI Inc. | ABD | Ses transkripsiyon (PII scrubbing sonrası) | SCC |
| Anthropic PBC | ABD | Metin analizi (PII scrubbing sonrası) | SCC |
| Turhost (colocation) | TR | Fiziksel sunucu barındırma | TR hukuku |

5.3. Veri İşleyen, alt işleyicileri bu DPA ile eşdeğer yükümlülüklerle bağlar.

---

### Madde 6 — Veri Sahibi Hakları

6.1. Veri İşleyen, Veri Sorumlusuna veri sahiplerinin KVKK m.11 kapsamındaki haklarını kullanmasına yardımcı olur.

6.2. Bir veri sahibinin talebi Veri İşleyene ulaşırsa, 3 iş günü içinde Veri Sorumlusuna yönlendirilir.

6.3. Ses kaydı silme talepleri KVKK m.11/e kapsamında 30 gün içinde yerine getirilir.

---

### Madde 7 — Veri İhlali Bildirim

7.1. Olası bir veri ihlali tespitinde Veri İşleyen:
- 24 saat içinde Veri Sorumlusunu e-posta ile bilgilendirir
- 48 saat içinde ayrıntılı ihlal raporu sunar
- Veri Sorumlusunun KVK Kurulu bildirimi yapmasına yardımcı olur (72 saat yasal süre)

---

### Madde 8 — Saklama ve Silme

8.1. Varsayılan saklama süreleri:

| Veri Türü | Süre | Silme Yöntemi |
|---|---|---|
| Ses kaydı | 90 gün | Otomatik (Celery beat) |
| Transkript | 90 gün | Otomatik (Celery beat) |
| Çağrı meta | 2 yıl | Yıllık temizlik |
| İletişim bilgisi | Hizmet süresi + 30 gün | Manuel (iptal sonrası) |

8.2. Hukuki gereklilik (dava vb.) durumunda Veri Sorumlusunun yazılı talebiyle saklama süresi uzatılabilir.

8.3. Hizmet sona erdiğinde Veri İşleyen, tüm verileri 30 gün içinde siler veya iade eder.

---

### Madde 9 — AI Act Yükümlülükleri

9.1. Ses analizi AI sistemleri minimal risk kategorisindedir (m.6 kapsamı dışı).

9.2. Veri İşleyen, EU AI Act m.50 kapsamında:
- Inbound aramada AI disclosure yapar (sesli bildirim)
- Outbound aramada AI disclosure yapar
- Yapay zeka çıktılarına itiraz mekanizması sağlar (m.86)

9.3. Ses biyometriği veya duygu tanıma AI sistemi kullanılmaz (m.5 yasağı).

---

### Madde 10 — Denetim

10.1. Veri Sorumlusu, 30 gün önceden yazılı bildirimle yılda bir kez denetim yapabilir veya akredite denetçi atayabilir.

10.2. Veri İşleyen, denetimde gerekli bilgi ve erişimi sağlar.

---

### Madde 11 — İmzalar

**Veri Sorumlusu adına:**

Ad Soyad: ___________________________
Unvan: ___________________________
Tarih: ___________________________
İmza: ___________________________

**Veri İşleyen adına:**

Ad Soyad: Hasan Söylemez
Unvan: Bilgi İşlem ve Sistem Sorumlusu
Tarih: ___________________________
İmza: ___________________________

---

---

## KISIM B — SUB-PROCESSOR SCC ÖZET TABLOSU

Yurt dışı aktarım için Standart Sözleşme Maddelerinin (SCC) durumu:

| İşleyici | Madde | SCC Versiyonu | Durum |
|---|---|---|---|
| OpenAI Inc. | İşlemci-alt işlemci | 2021/914 (Modül 3) | 🔴 İmzalanmalı |
| Anthropic PBC | İşlemci-alt işlemci | 2021/914 (Modül 3) | 🔴 İmzalanmalı |
| Cloudflare R2 | İşlemci-alt işlemci | 2021/914 (Modül 3) | 🔴 İmzalanmalı |
| SendGrid/Twilio | İşlemci-alt işlemci | 2021/914 (Modül 3) | 🔴 İmzalanmalı |
| Google Analytics | Denetleyici-denetleyici | 2021/914 (Modül 1) | 🟡 Google DPA |
| Meta Pixel | Denetleyici-denetleyici | 2021/914 (Modül 1) | 🟡 Meta DPA |

> **Not:** KVKK m.9 kapsamında yurt dışı aktarım için ya (a) KVK Kurulu yeterlilik kararı, ya (b) veri sahibinin açık rızası, ya da (c) yeterli koruma güvencesi (SCC eşdeğeri taahhütname) gereklidir. SCC, KVKK kapsamında "yeterli koruma taahhütnamesi" olarak kullanılabilir.

---

## Şablonu Kullanma Rehberi

1. KISIM A'yı her tenant için ayrı doldurun
2. Tenant adı, adresi ve yetkili bilgilerini güncelleyin
3. Alt işleyici listesini tenanta özgü yapın (örn. santral tenantı için K12NET eklenebilir)
4. İmza bölümünü kağıt veya elektronik imza ile tamamlayın (KEP ile gönderin)
5. İmzalı kopyayı `docs/kvkk/signed/DPA-{TENANT-ADI}-{YILI}.pdf` olarak saklayın
