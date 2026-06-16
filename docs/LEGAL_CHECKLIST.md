# Markala — Yasal Başlatma Checklist

> Son güncelleme: 2026-06-16
> Sorumlu: Hasan Söylemez (324 Ajans Bilgi Teknolojileri Ltd. Şti.)
> Kapsam: `markala.com.tr` yayına almadan önce tamamlanması gereken yasal başvurular ve placeholder doldurma görevleri.

---

## Yapması Gerekenler (Hasan)

### Acil (Sprint 1)
- [ ] **ETBİS başvurusu** — [etbis.gtb.gov.tr](https://etbis.ticaret.gov.tr) üzerinden online; 1-2 hafta içinde sonuç. Başvuru için MERSIS no + vergi no + alan adı bilgisi gerekli.
- [ ] **VERBİS başvurusu** — [verbis.kvkk.gov.tr](https://verbis.kvkk.gov.tr); 2-3 hafta + Mersin'deki KVKK uzmanı hukuk danışman ile koordineli yapılmalı. Çalışan sayısı 50'nin altında olsa da e-ticaret faaliyeti nedeniyle kayıt zorunluluğu doğabilir; danışmana teyit ettir.
- [ ] **KEP adresi al** — PTT şubesine git, kurumsal KEP başvurusu yap. Yıllık ücret ~500 TL. Önerilen format: `324ajans@hs01.kep.tr`.
- [ ] **Mersin'de KVKK uzmanı hukuk danışmanı toplantı** — Önerilen brief süresi 2 saat. Konular: VERBİS başvuru, aydınlatma metni final review, açık rıza form akışı, çerez banner uyumluluğu.

### Bilgi Toplama (legal.ts placeholder'larını doldurmak için)
- [ ] **Vergi dairesi adı** netleştir (örn. "Yenişehir Vergi Dairesi")
- [ ] **Vergi numarası** (10 haneli) hazır mı?
- [ ] **MERSIS kayıt numarası** (16 haneli)
- [ ] **324 Ajans Bilgi Teknolojileri Ltd. Şti.** resmi ticaret sicil unvanı + adres
- [ ] **Atölye fiziksel adresi** (showroom + üretim) — Yenişehir/Mersin posta kodu dahil

### legal.ts placeholder'larını doldurma
Aşağıdaki dosyada `[HASAN: ...]` ile işaretli tüm sabitleri gerçek bilgilerle değiştir:

**Dosya:** `packages/mock-data/src/legal.ts`

| Sabit | Açıklama | Kaynak |
|---|---|---|
| `ADDRESS` | Atölye fiziksel adresi | Mersin Ticaret Sicil |
| `TAX_OFFICE` | Bağlı vergi dairesi adı | Vergi levhası |
| `TAX_NUMBER` | 10 haneli vergi no | Vergi levhası |
| `MERSIS` | MERSIS kayıt no (16 hane) | mersis.gtb.gov.tr |
| `KEP` | KEP elektronik tebligat adresi | PTT KEP başvurusu sonrası |
| `VERBIS_NO` | VERBİS sicil numarası | VERBİS onay sonrası |
| `ETBIS_NO` | ETBİS kayıt numarası | ETBİS onay sonrası |

### Yayına Almadan Önce Son Kontrol
- [ ] `legal.ts` içinde `[HASAN:` arayıp 0 sonuç döndüğünden emin ol (grep / VS Code search)
- [ ] Hukuk danışman tüm 7 yasal sayfayı (KVKK, mesafeli satış, çerez, gizlilik, kullanım koşulları, ön bilgilendirme, iade, kargo) imzalı şekilde onaylasın
- [ ] Footer'da ETBİS rozeti + KEP adresi gözüksün
- [ ] Çerez consent banner'ı zorunlu/analitik/pazarlama ayrımı ile aktif

---

## Yasal Risk Skoru

| Durum | Skor | Açıklama |
|---|---|---|
| **Şu an** | **6.5/10** | Metinler sektör standartlarına uygun, ancak tüzel kişilik kimlik bilgileri ve resmi başvuru numaraları placeholder seviyesinde. Yayına alındığı an "geçersiz mesafeli satış sözleşmesi" riski. |
| **ETBİS + VERBİS + KEP tamamlanınca** | **9/10** | E-ticaret yasal altyapısı tam; geriye yalnızca KVKK uzmanı son review kalır. |

---

## İlgili Dosyalar

- `packages/mock-data/src/legal.ts` — 7 yasal sayfa metni + placeholder sabitleri
- `apps/web/src/app/yasal/[slug]/page.tsx` — Sayfa render endpoint'i (kontrol et)
- `apps/web/src/app/(legal)/kvkk-aydinlatma/page.tsx` — KVKK taslak sayfası (noindex, TASLAK)
- `apps/web/src/app/(legal)/mesafeli-satis/page.tsx` — MSS taslak sayfası (noindex, TASLAK)
- `apps/web/src/components/cookie-consent.tsx` — Çerez consent banner (zorunlu/analitik/pazarlama)
- `apps/web/src/components/analytics.tsx` — GA4 + Consent Mode v2 (analytics.tsx)
- `web/src/components/site-footer.tsx` — KEP + ETBİS rozeti eklenecek alan

---

## Gap Analizi — 2026-06-15

> KVKK Privacy Officer değerlendirmesi. Yayına girilmeden önce kapatılması gereken boşluklar.

### Durum Özeti

| Alan | Durum | Risk | Öncelik |
|---|---|---|---|
| KVKK Aydınlatma Metni | 🟡 Taslak mevcut, hukuk onayı yok | Yüksek | P0 |
| Mesafeli Satış Sözleşmesi | 🟡 Taslak mevcut, hukuk onayı yok | Yüksek | P0 |
| Çerez Consent Banner | ✅ Zorunlu/Analitik/Pazarlama ayrımı var | Düşük | Tamamlandı |
| Google Consent Mode v2 | ✅ PR #13 ile eklendi | Düşük | Tamamlandı |
| VERBİS Kaydı | ❌ Henüz yapılmadı | Yüksek | P0 |
| ETBİS Kaydı | ❌ Henüz yapılmadı | Yüksek | P0 |
| KEP Adresi | ❌ Başvuru beklemede | Orta | P1 |
| legal.ts Placeholder'ları | ❌ `[BAŞVURU BEKLEMEDE]` dolu | Yüksek | P0 |
| Çerez Politikası Sayfası | ✅ `/yasal/cerez` mevcut | Düşük | — |
| Ön Bilgilendirme Formu | 🟡 Taslak var, ödeme akışında link yok | Orta | P1 |
| İade ve İptal Politikası | 🟡 Taslak var, hukuk onayı yok | Orta | P1 |
| Sub-processor DPA | ❌ OpenAI/Cloudflare/SendGrid DPA belgesi yok | Yüksek | P1 |
| Hukuk Danışmanı Review | ❌ Randevu alınmadı | Kritik | P0 |
| Footer ETBİS Rozeti | 🟡 Kod hazır (yorum satırı), ETBİS onayı bekleniyor | Orta | P1 |
| KVKK Başvuru Formu | ✅ `/kvkk-basvuru` sayfası aktif | Düşük | Tamamlandı |
| Cayma Hakkı İstisnası Bildirimi | ✅ Checkout "onay" adımında amber uyarı kutusu eklendi (AJA-165) | Düşük | Tamamlandı |
| security.txt | ✅ `/.well-known/security.txt` oluşturuldu | Düşük | Tamamlandı |
| İYS SMS Kanalı Sorgulama | ❌ NetGSM için ayrı İYS sorgusu tasarlanmadı | Yüksek | P0 (Faz 4) |
| Pazarlama İzni Geri Çekme Akışı | ❌ DB güncelleme + İYS senkron + SendGrid unsubscribe zinciri yok | Yüksek | P1 (Faz 4) |
| e-Fatura/e-Arşiv Zorunluluğu | ❌ GİB eşiği değerlendirmesi yapılmadı (2025: 3M TL ciro) | Orta | P1 (Faz 3) |

---

### P0 — Yayın Bloker (yayına girmeden mutlaka kapatılmalı)

#### 1. Hukuk Danışmanı Toplantısı (KRİTİK)
- **Konu:** 7 yasal sayfa (KVKK, MSS, çerez, gizlilik, kullanım koşulları, ön bilgilendirme, iade)
- **Süre:** ~2 saat
- **Önce:** `legal.ts` placeholder'larını gercek bilgilerle doldur
- **Beklenen çıktı:** Imzalı onay + gerekirse metin revizyonu
- **Risk:** İmzasız / eksik metin → "geçersiz mesafeli satış sözleşmesi" iddiası, BTK şikayeti

#### 2. VERBİS Kaydı
- Portal: [verbis.kvkk.gov.tr](https://verbis.kvkk.gov.tr)
- Süre: 2-3 hafta (hukuk danışman eşliğinde)
- 324 Ajans e-ticaret faaliyeti yürüttüğü için kayıt zorunlu (50 çalışan eşiği e-ticarette uygulanmaz)
- Kayıt sonrası `VERBIS_NO` → `packages/mock-data/src/legal.ts` sabitine yaz

#### 3. ETBİS Kaydı
- Portal: [etbis.ticaret.gov.tr](https://etbis.ticaret.gov.tr)
- Süre: 1-2 hafta
- Gerekli: MERSIS + vergi no + alan adı `markala.com.tr`
- Kayıt sonrası `ETBIS_NO` → `legal.ts`; footer ETBİS rozeti görsel linke eklenecek

#### 4. legal.ts Placeholder'larını Doldurma
```bash
# Kontrol: placeholder kaldı mı?
grep -r "\[BAŞVURU BEKLEMEDE\]" packages/mock-data/src/legal.ts
```
Hedef: 0 sonuç döndürmeli. Doldurulacaklar:
- `KEP` — PTT KEP başvurusu sonrası
- `VERBIS_NO` — VERBİS onay sonrası
- `ETBIS_NO` — ETBİS onay sonrası

---

### P1 — Yayın Öncesi İyileştirme

#### 5. Ön Bilgilendirme Formu Ödeme Akışına Bağlanması
- `/yasal/on-bilgilendirme` mevcut ama sipariş/ödeme akışında referans yok
- Ödeme sayfasında "Ön Bilgilendirme Formunu okudum" checkbox + link olmalı (Mesafeli Sözleşmeler Yönetmeliği zorunluluğu)
- Sorumlu: Frontend Dev

#### 6. Footer ETBİS Rozeti + KEP Adresi
- ETBİS kayıt sonrası footer'a resmi rozet eklenmeli
- KEP adresi footer'da `merhaba@markala.com.tr` yanında görünmeli
- Dosya: `apps/web/src/components/site-footer.tsx`

#### 7. Sub-processor DPA Belgesi
Aşağıdaki işlemciler için yazılı DPA veya uyum belgesi gerekmektedir:

| İşlemci | Amaç | KVKK m.9 Dayanağı | Durum |
|---|---|---|---|
| iyzico | Ödeme | SCC | ✅ İyzico KVKK uyumlu |
| Paraşüt | E-fatura | Türkiye yerli | ✅ Yerli, sorunsuz |
| Cloudflare R2 | Dosya depolama | SCC (AB uyumlu) | 🟡 DPA belgesi al |
| SendGrid (Twilio) | E-posta | SCC | 🟡 DPA belgesi al |
| Google (GA4) | Analitik | SCC | 🟡 Consent Mode v2 aktif |
| Meta Pixel | Pazarlama | Açık rıza + SCC | 🟡 Consent zorunlu |
| DHL Türkiye | Kargo | Türkiye yerli | ✅ Yerli, sorunsuz |

#### 8. KEP Adresi Alınması
- PTT şubesinden kurumsal KEP: `324ajans@hs01.kep.tr`
- Yıllık ~500 TL
- KVKK başvuruları için yasal tebligat kanalı

#### 9. İYS SMS Kanalı (P0 — Faz 4 Öncesi)
- NetGSM entegrasyonu kurulmadan önce İYS SMS kanalı için ayrı sorgulama zorunlu
- `POST /api/iys/check?channel=SMS&recipient=<msisdn>` çağrısı yapılmalı
- Telefon bazlı opt-in yoksa **hiç SMS gönderilmemeli** (TEİK Yönetmeliği m.7)
- İYS mail + SMS kanalı ayrı ayrı kontrol ediliyor — tek onay her ikisini kapsamıyor
- Sorumlu: Faz 4 backend geliştirici + DPO review

#### 10. Pazarlama İzni Geri Çekme Akışı (P1 — Faz 4)
- Kullanıcı hesabından marketing iznini kaldırdığında 3 adımlı zincir çalışmalı:
  1. DB: `users.marketing_consent = false` + timestamp
  2. İYS API: `DELETE /brands/{brandCode}/merchants/default/receivers/INDIVIDUAL`
  3. SendGrid: List Unsubscribe header + suppression list güncellemesi
- Bu zincir tasarlanmadan Faz 4 SMS/mail pazarlama başlatılmamalı
- Sorumlu: Faz 4 backend + frontend geliştirici, DPO onay

#### 11. e-Fatura/e-Arşiv Zorunluluğu Değerlendirmesi (P1 — Faz 3 Öncesi)
- GİB 509 Sıra No'lu Tebliğ: 2025 yılı ciro eşiği ≥ 3M TL ise e-fatura zorunlu
- Paraşüt entegrasyonu kurulmadan önce 324 Ajans'ın tahmini yıllık cirosunu hesapla
- Eşik aşılıyorsa: GİB portalına başvuru + Paraşüt e-fatura paketi aktivasyonu
- Eşik altında: e-Arşiv fatura yeterlı (Paraşüt zaten destekliyor)
- Sorumlu: Hasan (mali veri) + Muhasebe müşavir

---

### Consent Mode v2 — Tamamlanan İş (2026-06-15)

Önceki durum: `analytics.tsx` GA4'ü consent beklemeden başlatıyordu — KVKK m.5 açık rıza ihlali.

Yapılanlar (PR #13):
- `analytics.tsx`: `gtag('consent', 'default', {all: 'denied'})` ile GA4 başlıyor
- `cookie-consent.tsx`: kullanıcı tercihine göre `gtag('consent', 'update', {...})` gönderiliyor
- `ads_data_redaction: true` ve `url_passthrough: true` aktif

---

### Sonraki Sprint İçin 5 Öneri

1. **Ödeme akışında açık rıza kaydı** — kullanıcının MSS + ön bilgilendirme formunu kabul ettiğine dair timestamp+version DB'ye yazılmalı (itiraz durumunda kanıt)
2. **KVKK başvuru otomatik bildirim** — `api/kvkk-basvuru` route'u e-posta göndermiyor; 30 günlük yasal süre takibi için SendGrid entegrasyonu + cron reminder
3. **Çerez politikası versiyon yönetimi** — `CONSENT_VERSION` artırıldığında eski kullanıcılar banner'ı yeniden görüyor; versiyon geçmişini `docs/kvkk/COOKIE-POLICY-CHANGELOG.md`'de tut
4. **Hukuki sayfalar print CSS** — `@media print` stili; avukata PDF göndermek için önemli
5. **Otomatik placeholder lint kuralı** — CI'a `grep -r "BAŞVURU BEKLEMEDE" packages/` adımı ekle; placeholder kaldıysa build uyarı versin (yayın öncesi güvenlik ağı)
