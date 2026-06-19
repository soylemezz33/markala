# Aylık KVKK Uyum Denetimi — Haziran 2026

> Denetim tarihi: **2026-06-19**
> Denetimci: KVKK Privacy Officer (Multica Agent)
> Kapsam: Aydınlatma metni · Çerez onayı · Gizlilik politikası · Mesafeli satış/iade metinleri
> Referans: LEGAL_CHECKLIST.md · AI-ACT-UYUM-CHECKLIST-2026-08-02.md · VERBIS-STATUS.md

---

## Özet Durum Tablosu

| Alan | Durum | Değişim |
|---|---|---|
| KVKK Aydınlatma Metni | 🟡 Taslak / Hukuk onayı yok | Son güncelleme: 2026-06-16 |
| Çerez Onay Banner | ✅ Aktif — v1.1 granüler | Değişim yok |
| Google Consent Mode v2 | ✅ Entegre | Değişim yok |
| Gizlilik Politikası | ✅ İçerik tamam | Son güncelleme: 2026-06-16 |
| Mesafeli Satış Sözleşmesi | 🟡 Taslak / Hukuk onayı yok | Son güncelleme: 2026-06-16 |
| İade ve Değişim Politikası | 🟡 Taslak / Hukuk onayı yok | Son güncelleme: 2026-06-16 |
| KVKK Başvuru Formu (UI) | ✅ Aktif | Değişim yok |
| KVKK Başvuru API | 🟡 Alındı e-postası eksik | Kritik boşluk |
| VERBİS Kaydı | 🔴 Yapılmadı | Deadline: 2026-07-01 |
| ETBİS Kaydı | 🔴 Yapılmadı | Yayın öncesi zorunlu |
| KEP Adresi | 🔴 Alınmadı | Deadline: 2026-07-01 |
| Hukuk Danışmanı Onayı | 🔴 Alınmadı | Yayın bloker |
| EU AI Act m.50 Disclosure | 🔴 Eksik kanallar | Deadline: 2026-08-02 |
| Sub-processor DPA | 🔴 İmzalanmadı | P1 |
| Lisan Fen DPA | 🔴 İmzalanmadı | Deadline: 2026-07-15 |

---

## 1. KVKK Aydınlatma Metni (`packages/mock-data/src/legal.ts` → slug: `kvkk`)

**Durum:** TASLAK — `noindex` aktif, hukuk müşaviri onayı bekleniyor.

### Olumlu Bulgular

- KVKK m.10 uyumlu 9 bölüm yapısı tam
- Bölüm 4.A yurt dışı aktarım ve alt işleyiciler listelenmiş (SCC dayanağı)
- Bölüm 7: KVKK m.11 haklarının tamamı (9 hak) sayılmış
- Bölüm 8: Başvuru yöntemi — online form (önerilen), e-posta, yazılı başvuru, KEP
- KVKK m.13 kapsamında 30 günlük yanıt süresi vurgusu mevcut
- Son güncelleme: 2026-06-16

### Eksiklikler / Riskler

| # | Eksiklik | Risk | Öneri |
|---|---|---|---|
| 1 | `VERBIS_NO` → `[BAŞVURU BEKLEMEDE]` placeholder | Hukuki risk — yayındayken hukuk sorunu | VERBİS kaydı tamamlanınca doldurul |
| 2 | `KEP` → `[BAŞVURU BEKLEMEDE]` placeholder | Tebligat kanalı eksik | PTT'den KEP alınca doldurul |
| 3 | AI sistemleri hakkında açıklama yok | EU AI Act m.13 uyumsuzluğu | Bölüm 2'ye AI işleme açıklaması ekle |
| 4 | Hukuk danışmanı imzası yok | Geçersiz aydınlatma | Toplantı planla (Mersin KVKK uzmanı) |

### Acil Aksiyon (AI Act m.13 için öneri metin)

Bölüm 2 `<ul>` içine eklenmeli:

```html
<li><strong>Yapay zeka işleme:</strong> Siparişlerinize ilişkin müşteri hizmetleri süreçlerinde yapay zeka destekli sistemler (OpenAI GPT-4o-mini) kullanılmaktadır. Bu sistemler PII temizleme (kişisel veri maskeleme) sonrası çalışır. EU AI Act m.50 kapsamında bu bilgilendirmeyi yapıyoruz.</li>
```

---

## 2. Çerez Onay Banner (`apps/web/src/components/cookie-consent.tsx`)

**Durum:** ✅ Aktif ve işlevsel — v1.1

### Olumlu Bulgular

- 4 granüler kategori: Zorunlu / Analitik (GA4) / Kişiselleştirme (Clarity) / Pazarlama
- `CONSENT_VERSION` sürüm yönetimi: şema değiştiğinde banner yeniden gösteriliyor
- "Sadece zorunlu" / "Tümünü kabul et" / "Tercihler" üç seçenek
- Google Consent Mode v2 entegrasyonu (`gtag consent update`)
- `SameSite=lax; Secure` çerez yapılandırması
- `aria-modal`, `role="dialog"`, `aria-labelledby` erişilebilirlik
- Event-driven re-open (`markala:open-cookie-settings`)

### Ufak Riskler / İyileştirmeler

| # | Konu | Seviye | Öneri |
|---|---|---|---|
| 1 | Rıza geri çekme timestamp'i kaydedilmiyor | Düşük | `writeConsent`'e `withdrawnAt` eklenebilir |
| 2 | Çerez politikası versiyon değişikliği logu yok | Düşük | `docs/kvkk/COOKIE-POLICY-CHANGELOG.md` oluştur |
| 3 | Footer'dan "Çerez Tercihleri" linki — entegrasyon kontrolü | Orta | `REOPEN_EVENT` tetikleyen link/button mevcut mu? |
| 4 | `preferences` kategorisi adı UI'da "Kişiselleştirme" — cookie_name "preferences" | Düşük | Tutarlılık iyidir, belgele |

**Değerlendirme:** Çerez onayı bileşeni KVKK ve GDPR uyum gerekliliklerini karşılıyor. Kritik eksiklik yok.

---

## 3. Gizlilik Politikası (`packages/mock-data/src/legal.ts` → slug: `gizlilik`)

**Durum:** ✅ İçerik yeterli — son güncelleme: 2026-06-16

### Olumlu Bulgular

- "Satmaz, kiralamaz, ticari amaçla aktarmaz" ifadesi mevcut
- PCI-DSS uyumlu ödeme (iyzico) açıkça belirtilmiş
- Cloudflare R2'de şifreli depolama belirtilmiş
- Güvenlik önlemleri (HTTPS, Argon2, rate limiting, 2FA, 3D Secure) listelenmiş
- 18 yaş altı kullanıcılara hizmet verilmediği belirtilmiş

### Eksiklikler

| # | Eksiklik | Risk | Öneri |
|---|---|---|---|
| 1 | AI sistemleri kullanımı açıklanmamış | EU AI Act m.13 | "Yapay Zeka Kullanımı" bölümü ekle |
| 2 | İYS kapsamındaki SMS/e-posta pazarlama geri çekme akışı yok | TEİK Yönetmeliği | Faz 4 öncesi ekle |

---

## 4. Mesafeli Satış Sözleşmesi (`packages/mock-data/src/legal.ts` → slug: `mesafeli-satis`)

**Durum:** TASLAK — `noindex` aktif, hukuk müşaviri onayı bekleniyor.

### Olumlu Bulgular

- 6502 sayılı TKHK + Mesafeli Sözleşmeler Yönetmeliği dayanağı belirtilmiş
- Madde 5: Cayma hakkının kullanılamayacağı durumlar (kişiye özel üretim) açıkça yazılmış
- Madde 7.A: Üretim toleransı (%1-5 fire) sektör standardı ile belgelenmiş — TSE/ISO referansı
- Madde 9: Yetkili mahkeme ve Tüketici Hakem Heyeti bilgisi
- Madde 10: Elektronik ortamda kurulma ve sipariş onayında yürürlük

### Eksiklikler

| # | Eksiklik | Risk | Öneri |
|---|---|---|---|
| 1 | Hukuk danışmanı onayı yok | Geçersiz sözleşme riski | Toplantı önce |
| 2 | Sipariş sonrası sözleşme e-posta gönderimi implement edilmiş mi? | MSY zorunluluğu | SendGrid entegrasyonu ile doğrula |
| 3 | Ödeme akışında "Ön Bilgilendirme Formunu okudum" checkbox eksik | Yönetmelik m.5 | Frontend geliştirme gerekli |

---

## 5. İade ve Değişim Politikası (`packages/mock-data/src/legal.ts` → slug: `iade`)

**Durum:** TASLAK — hukuk müşaviri onayı bekleniyor.

### Olumlu Bulgular

- 7 günlük bildirim süresi açık
- Fotoğraflı bildirim zorunluluğu
- 10 iş günü para iadesi süresi belirtilmiş
- Müşteri sorumluluğu kapsamı net çizilmiş (RGB/CMYK, çözünürlük vb.)
- Tutanak zorunluluğu (kargo hasarında)

### Eksiklikler

| # | Eksiklik | Risk | Öneri |
|---|---|---|---|
| 1 | Hukuk danışmanı onayı yok | Tüketici şikayeti riski | Toplantı önce |
| 2 | Cayma hakkı istisnasının tüketiciyle ön bilgilendirme akışına entegrasyonu eksik | Tüketici mahkemesi riski | AJA-165 zaten var, akış tamamlandı mı kontrol et |

---

## 6. KVKK Başvuru API (`apps/web/src/app/api/kvkk-basvuru/route.ts`)

**Durum:** 🟡 Kısmi — veri sorumlusuna e-posta gidiyor, başvuru sahibine gitmüyor.

### Olumlu Bulgular

- TC Kimlik checksum doğrulama (backend + frontend, çift katman)
- Honeypot bot koruması
- Yasal 30 gün vade hesabı + vade e-postaya ekleniyor
- PII loglanmıyor (sadece ticketId + tür + vade)
- TC Kimlik maskeleniyor (X*****XX formatı)
- SMTP olmayan ortamda mock davranışı (geliştirme bloğu yok)

### Kritik Eksiklik

**Başvuru sahibine alındı e-postası gönderilmiyor.**
- `sendMail` sadece `KVKK_TO` (veri sorumlusu inbox) adresine gönderiyor
- Kullanıcı `ticketId`'yi UI'da görüyor ama e-posta almıyor
- KVKK m.13 kapsamında takip kolaylığı için başvuru sahibine de alındı e-postası gönderilmeli

**Aksiyon:** `sendMail` sonrası ayrı bir `sendMail` çağrısıyla başvuru sahibine alındı e-postası gönder.

---

## 7. EU AI Act Hazırlık Durumu (Deadline: 2026-08-02)

Son güncelleme: AI-ACT-UYUM-CHECKLIST-2026-08-02.md (2026-06-16)

### m.50 Şeffaflık — Kritik (44 gün kaldı)

| Kanal | Durum | Aksiyon |
|---|---|---|
| Web chatbot | 🔴 Implement yok | Hafta 1-2 (16-30 Haziran) acil |
| Santral inbound Lua | 🟡 Planlandı | Telefoni Operatörü |
| Santral outbound Lua | 🟡 Planlandı | Telefoni Operatörü |
| E-posta AI içeriği | 🔴 Kural yok | Pazarlama birimi |
| Ürün sayfası AI etiketi | 🟡 Altyapı var, etiket yok | Badge ekle |

**Kalan gün: 44 — Kırmızı hat geçildi.** Hafta 1-2 görevleri 2026-06-16'dan beri başlatılmış olmalıydı.

### m.13 Şeffaflık Yükümlülükleri

- Kullanıcı haklarına AI etkisi açıklanmamış → KVKK aydınlatma metni güncellemesi gerekli
- AI karar süreçleri iç dokümanı yok → `docs/kvkk/DATA-GOVERNANCE.md` oluşturulmalı

---

## 8. VERBİS / ETBİS / KEP Durumu

> Kaynak: VERBIS-STATUS.md (2026-06-16)

| Başvuru | Durum | Deadline |
|---|---|---|
| VERBİS (324 Ajans) | 🔴 Henüz başvurulmadı | 2026-07-01 |
| ETBİS (markala.com.tr) | 🔴 Henüz başvurulmadı | Yayın öncesi |
| KEP (PTT) | 🔴 Başvurulmadı | 2026-07-01 |
| Lisan Fen DPA imzası | 🔴 İmzalanmadı | 2026-07-15 |
| Hukuk danışmanı toplantısı | 🔴 Yapılmadı | 2026-07-01 |

---

## 9. Mevzuat Değişikliği Takibi — Haziran 2026

### KVKK Kapsamında İzlenen Gelişmeler

| Konu | Durum |
|---|---|
| KVKK 2. Revizyon (taslak) | Kamuoyuyla paylaşılmadı; izleniyor |
| AB-Türkiye Yeterlilik Kararı | Beklemede — SCC kullanımına devam |
| KVK Kurulu AI Kılavuzu | Henüz yayınlanmadı |
| EU AI Act m.50 uygulaması | **2026-08-02 zorunlu** |
| İYS 2. faz (SMS) | Aktif — NetGSM entegrasyonu öncesi zorunlu |

### Son KVK Kurulu Kararları (İzlenecek)

- AI destekli profil oluşturma kararları — Markala açısından etki değerlendirmesi yapılmalı
- Çerez denetimleri (Kurul sektörel denetimlere başladı) — Çerez banner mevcut, risk düşük

---

## 10. Öncelikli Aksiyon Listesi

### P0 — Bu Hafta (19-26 Haziran)

| # | Görev | Sorumlu | Deadline |
|---|---|---|---|
| 1 | Hukuk danışmanı ile toplantı randevusu al | Hasan | 2026-06-23 |
| 2 | VERBİS başvuru hazırlığı başlat (belge topla) | Hasan + Hukuk | 2026-06-30 |
| 3 | KVKK aydınlatma metnine AI açıklaması ekle (m.13) | KVKK Sorumlusu | 2026-06-23 |
| 4 | Web chatbot AI disclosure banner bileşeni (m.50) | Frontend Dev | 2026-06-30 |
| 5 | Ürün sayfalarına AI üretimi badge'i (m.50) | Frontend Dev | 2026-06-30 |

### P1 — Bu Ay (Temmuz 2026)

| # | Görev | Sorumlu | Deadline |
|---|---|---|---|
| 6 | KVKK başvuru API — başvuru sahibine alındı e-postası | Backend Dev | 2026-07-07 |
| 7 | Ödeme akışına Ön Bilgilendirme Formu checkbox | Frontend Dev | 2026-07-07 |
| 8 | OpenAI/Anthropic SCC/DPA belgeleri al | KVKK Sorumlusu | 2026-07-15 |
| 9 | Lisan Fen DPA imzası (Mehmet Erdoğan koordinasyonu) | Hasan | 2026-07-15 |
| 10 | `docs/kvkk/DATA-GOVERNANCE.md` oluştur | KVKK Sorumlusu | 2026-07-15 |
| 11 | `docs/kvkk/COOKIE-POLICY-CHANGELOG.md` oluştur | KVKK Sorumlusu | 2026-07-15 |
| 12 | Santral Lua inbound/outbound disclosure script | Telefoni Operatörü | 2026-07-15 |

### P2 — Ağustos Öncesi

| # | Görev | Sorumlu | Deadline |
|---|---|---|---|
| 13 | EU AI Act disclosure tüm kanallar testi | Tüm ekip | 2026-07-31 |
| 14 | Hukuk danışmanı final AI Act review | Hukuk + Hasan | 2026-07-31 |
| 15 | İYS SMS kanalı sorgu mekanizması (Faz 4 öncesi) | Backend Dev | Faz 4 öncesi |
| 16 | Pazarlama izni geri çekme zinciri (DB+İYS+SendGrid) | Backend Dev | Faz 4 öncesi |

---

## Sonraki Denetim

**Tarih:** 2026-07-19 (aylık döngü)
**Odak:** VERBİS/ETBİS/KEP başvuru sonuçları + AI Act m.50 implementation durumu + hukuk danışmanı geri bildirimleri

---

*Bu rapor KVKK Privacy Officer Ajanı tarafından otomatik olarak oluşturulmuştur.*
*Referans dosyalar: `docs/kvkk/`, `packages/mock-data/src/legal.ts`, `apps/web/src/components/cookie-consent.tsx`, `apps/web/src/app/api/kvkk-basvuru/route.ts`*
