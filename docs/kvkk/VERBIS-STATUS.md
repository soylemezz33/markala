# VERBİS Başvuru Durumu — Markala / 324 Ajans

> Son güncelleme: 2026-06-16
> Sorumlu: Hasan Söylemez
> KVK Kurulu portal: [verbis.kvkk.gov.tr](https://verbis.kvkk.gov.tr)

---

## Veri Sorumluları

### 1. Ana Veri Sorumlusu: 324 Ajans Bilgi Teknolojileri Ltd. Şti.

| Alan | Değer | Durum |
|---|---|---|
| Unvan | 324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Tic. Ltd. Şti. | ✅ |
| Vergi No | 0012655788 | ✅ |
| MERSİS | 0001265578800001 | ✅ |
| Ticaret Sicil | Mersin Ticaret Sicil 66377 | ✅ |
| Adres | Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir/Mersin | ✅ |
| VERBİS Kayıt No | **[BAŞVURU BEKLENİYOR]** | 🔴 |
| Başvuru Tarihi | — | 🔴 |
| Onay Tarihi | — | 🔴 |

**VERBİS Başvuru Yükümlülüğü:** 324 Ajans, Kişisel Verileri Koruma Kurulunun 2018/87 sayılı kararı kapsamında VERBİS'e kayıt yükümlüsüdür. E-ticaret platformu (markala.com.tr) işletmesi nedeniyle yıllık işlenen kişisel veri hacmi ve verilen hizmetin niteliği kayıt zorunluluğu doğurur.

### 2. Tenant Veri Sorumlusu: Lisan Fen Eğitim Kurumları

| Alan | Değer | Durum |
|---|---|---|
| Unvan | Lisan Fen Eğitim Kurumları | Doğrulanmalı |
| Veri İşleyen | 324 Ajans / Markala (santral.lisanfen.com tenant) | ✅ |
| DPA İmzası | **[İMZA BEKLENİYOR]** | 🔴 |

> **Not:** Lisan Fen, kendi VERBİS kaydından sorumludur (veri sorumlusu). 324 Ajans bu tenant için veri işleyen konumundadır. DPA imzasının tamamlanması gereklidir.

---

## Başvuru İçin Gerekli Belgeler

- [ ] Ticaret sicil gazetesi (kuruluş + son durum)
- [ ] İmza sirküleri
- [ ] Veri sorumlusu temsilcisi atama kararı
- [ ] Kişisel veri işleme envanteri (aşağıda)

---

## Kişisel Veri Envanteri (VERBİS için)

### markala.com.tr

| Veri Kategorisi | İşleme Amacı | Hukuki Dayanak | Saklama Süresi | Alıcı Grubu |
|---|---|---|---|---|
| Kimlik (ad, soyad, TC) | Sipariş, e-fatura | KVKK m.5/2-ç (hukuki yükümlülük) | 10 yıl (TTK) | İç, Paraşüt, Vergi Dairesi |
| İletişim (e-posta, tel, adres) | Sipariş teslimat, bildirim | KVKK m.5/2-c (sözleşme) | 10 yıl | İç, DHL, SendGrid |
| Ödeme meta | Sipariş kaydı | KVKK m.5/2-ç | 10 yıl | İç (kart bilgisi iyzico'da) |
| Tasarım dosyaları | Baskı üretimi | KVKK m.5/2-c | Hesap süresi + 30 gün | İç, Cloudflare R2 |
| Analitik (IP, cihaz) | Hizmet geliştirme | KVKK m.5/1 (açık rıza) | 12 ay | Google, Microsoft |
| Pazarlama tercihleri | Hedefli reklam | KVKK m.5/1 (açık rıza) | Rıza geri çekilene kadar | Meta |

### santral.lisanfen.com (Markala Santral — Lisan Fen Tenant)

| Veri Kategorisi | İşleme Amacı | Hukuki Dayanak | Saklama Süresi | Alıcı Grubu |
|---|---|---|---|---|
| Ses kaydı | Kalite güvencesi, transkripsiyon | KVKK m.5/2-f (meşru menfaat) + rıza | 90 gün | İç, OpenAI (transkripsiyon) |
| Transkript | Çağrı analizi | KVKK m.5/2-f | 90 gün | İç, Anthropic (analiz) |
| Öğrenci iletişim bilgisi | Veli arama yönetimi | KVKK m.5/2-c + K12NET entegrasyonu | Öğrencilik süresi | İç |
| Çağrı meta (süre, saat) | Raporlama | KVKK m.5/2-f | 2 yıl | İç |

---

## Alt İşleyiciler (Sub-processor Listesi)

| İşleyici | Konum | İşleme Konusu | DPA Durumu |
|---|---|---|---|
| OpenAI Inc. | ABD | Ses transkripsiyon, metin analizi | 🟡 OpenAI DPA imzalanmalı |
| Anthropic PBC | ABD | Claude Haiku çağrı analizi | 🟡 Anthropic DPA imzalanmalı |
| Cloudflare Inc. (R2) | ABD/AB | Tasarım dosyası depolama | 🟡 Cloudflare DPA imzalanmalı |
| iyzico Ödeme Hizmetleri A.Ş. | TR | Ödeme işlemleri | 🟡 iyzico DPA kontrolü gerekli |
| Paraşüt Yazılım A.Ş. | TR | E-fatura/e-arşiv | 🟡 Paraşüt DPA kontrolü |
| Twilio (SendGrid) | ABD | İşlemsel e-posta | 🟡 SendGrid DPA imzalanmalı |
| Meta Platforms | ABD | Pazarlama (açık rıza ile) | 🟡 Meta DPA/SCC |
| Google LLC | ABD | Analytics, reklam (rıza ile) | 🟡 Google DPA/SCC |
| Microsoft (Clarity) | ABD | UX analizi (rıza ile) | 🟡 Microsoft DPA/SCC |
| DHL Türkiye | TR | Kargo teslimat | 🟡 DHL DPA gerekli |

> **Yurt dışı aktarım dayanağı:** KVKK m.9 — AB Komisyonu yeterlilik kararı (henüz TR için yok) veya Standart Sözleşme Maddeleri (SCC). Her sub-processor için SCC veya işlemcinin BCR'ı doğrulanmalıdır.

---

## Aksiyon Listesi

| Öncelik | Görev | Sorumlu | Deadline |
|---|---|---|---|
| P0 | VERBİS başvurusu yap | Hasan Söylemez | 2026-07-01 |
| P0 | Hukuk danışmanı randevu (KVKK uzmanı, Mersin) | Hasan Söylemez | 2026-07-01 |
| P0 | Lisan Fen DPA imzası | Hasan + Mehmet Erdoğan (Lisan Fen) | 2026-07-15 |
| P1 | OpenAI / Anthropic SCC/DPA doğrulama | KVKK Sorumlusu | 2026-07-15 |
| P1 | Cloudflare / SendGrid / Google DPA | KVKK Sorumlusu | 2026-07-15 |
| P1 | KEP adresi al (PTT) | Hasan Söylemez | 2026-07-01 |
| P2 | ETBİS başvurusu | Hasan Söylemez | 2026-07-15 |

---

## Sonraki Güncelleme

VERBİS kayıt numarası alındığında:
1. Bu dokümanı güncelle
2. `packages/mock-data/src/legal.ts` → `VERBIS_NO` sabitini güncelle
3. KVKK aydınlatma metnindeki VERBİS placeholder'ını temizle
4. CI grep kontrolü: `grep "BAŞVURU BEKLEMEDE" packages/mock-data/src/legal.ts` → 0 sonuç
