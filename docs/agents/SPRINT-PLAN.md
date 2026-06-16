# Markala — Kurumsal Profesyonelleşme · Sprint Planı & Koordinasyon Kuralları

> Sahip: Proje Yöneticisi ajanı · Koordinasyon issue: AJA-195
> Son güncelleme: 2026-06-16
> Önce oku: [SPRINT-BAGIMLIK-GRAFI.md](./SPRINT-BAGIMLIK-GRAFI.md)

---

## 1. Sprint Hedefi (1 cümle)

markala.com.tr matbaa e-ticaret platformunu **kurumsal/profesyonel** kaliteye çıkarmak: çekirdek akış (keşif → sepet → ödeme → sipariş → hesabım) hatasız, premium UX, KVKK uyumlu, ölçülebilir ve test kapsamı yüksek.

---

## 2. Takvim (2 haftalık sprintler)

> ⚠️ Sprint A, SPRINT-BAGIMLIK-GRAFI §0'daki B-1 ve B-2 blocker'ları çözülünce başlar. Tarihler onay sonrası kayar.

| Sprint | Tarih | Tema | Ana akışlar |
|---|---|---|---|
| **A** | 16–29 Haziran | Temel sağlamlaştırma | WS-6 CI strict · WS-1 API audit · WS-5 KVKK akışları · çekirdek akış bug-fix |
| **B** | 30 Haz – 13 Tem | Premium UX + entegrasyon doğrulama | WS-2 UX pass · WS-3 ödeme uçtan uca · iyzico/SendGrid/R2 prod-ready · WS-4 SEO |
| **C** | 14–27 Temmuz | Doğrulama + lansman hazırlığı | WS-7 QA · WS-8 E2E · WS-9 analitik · WS-11 docs · WS-10 REKLAM-ONCESI-TEST-PLANI |

---

## 3. Daily Standup ritmi

Her ajan günde 1 kez ilgili alt-issue'ya şu formatta yorum bırakır:

```
[Ajan Adı] — YYYY-MM-DD
DÜN: <bitirdiği iş>
BUGÜN: <planlanan iş>
ENGEL: <varsa, yoksa "yok">
```

Proje Yöneticisi her gün 17:00'de AJA-195 altında konsolide rapor üretir:

```markdown
# Markala Daily — YYYY-MM-DD
## ✅ Tamamlanan (PR merged)
## 🔄 Devam eden (PR open)
## 🚧 Bloke (görev / atanan / engel / çözüm önerisi)
## 📊 Sprint ilerleme: X/Y görev (%XX)
## 🎯 Yarın öncelik
```

Raporlama kadansı: **Daily** 17:00 · **Weekly** Pazartesi 09:00 · **Sprint Review** sprint sonu Cuma 15:00.

---

## 4. Çakışma Çözüm Kuralları

İki ajan aynı dosyayı değiştirmek isterse Proje Yöneticisi karar verir:

1. **Sıralı bağımlılık varsa** → önce mantık sahibi, sonra görsel/tüketici (örn. WS-3 ödeme mantığı → WS-2 UX; WS-1 tip → WS-2 frontend).
2. **Ortak yarar varsa** → tek PR'da birleştir, iki ajan co-author.
3. **Yapısal karmaşa varsa** → önce refactor (3. ajan), sonra iki taraf.
4. **Tek-sahip alanlar** (bkz. graf §4): `.github/*` → DevOps; `prisma` şema → Backend; legal metin → KVKK. Başka ajan sadece PR'da etiketleyerek talep eder.

Her PR `Code Reviewer` (`98d6bb32`) onayından geçer; kritik PR'lar (ödeme, KVKK, migration, güvenlik) ayrıca Hasan'a.

---

## 5. Definition of Done

- [ ] CI yeşil (type-check + build + Vitest)
- [ ] Code Reviewer onayı
- [ ] Conventional commit + küçük, izole PR
- [ ] Migration varsa rollback adımı (`-- ROLLBACK:`)
- [ ] UI değişikliğinde before/after ekran
- [ ] Çekirdek akışı bozan P0 bug yok
- [ ] İlgili docs güncel

---

## 6. Risk Register

| # | Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| R-1 | Ajan bağlamı yanlış proje (B-1/B-2) | Yüksek | Yüksek | Sprint başlamadan CLAUDE.md + ajan profilleri düzelt |
| R-2 | Ödeme akışı (iyzico) prod'da hata | Orta | Yüksek | WS-3 uçtan uca test + sandbox doğrulama, lansman öncesi zorunlu |
| R-3 | API strict değil → tip hataları gizli | Yüksek | Orta | WS-1 ile API type-check `continue-on-error` kaldırma hedefi |
| R-4 | E2E kapsamı düşük → regresyon kaçar | Orta | Orta | WS-8 golden path Sprint C'de zorunlu |
| R-5 | KVKK eksikliği (veri-export/sil) lansmanda yasal risk | Orta | Yüksek | WS-5 checklist + LEGAL_CHECKLIST.md doğrulama |
| R-6 | Dış bağımlılık (Cloudflare/Turhost/iyzico) kesintisi | Düşük | Yüksek | RUNBOOK + DISASTER_RECOVERY tatbikatı (mevcut docs) |
| R-7 | Paralel ajan çakışması (ortak dosya) | Orta | Orta | §4 çakışma kuralları + tek-sahip alanlar |

---

## 7. Alt-issue Önerisi (Hasan onayı sonrası oluşturulacak)

AJA-195 altında, her iş akışı için bir alt-issue. Bağımlılığa göre **paralel başlayanlar `todo`**, **sonrakiler `backlog`** (sırayla `todo`'ya çekilir):

| Alt-issue | Sahip | Sprint | Başlangıç durumu |
|---|---|---|---|
| WS-6 DevOps/CI strict + Sentry | DevOps & Güvenlik | A | `todo` |
| WS-1 API/Backend sertleştirme | Backend Mühendisi | A | `todo` |
| WS-5 KVKK akış & endpoint | KVKK Privacy Officer | A | `todo` |
| WS-2 Premium UX pass | Frontend Mühendisi | B | `backlog` (API sonrası) |
| WS-3 Ödeme & Fatura uçtan uca | Finans Muhasebe | B | `backlog` (API sonrası) |
| WS-4 SEO & İçerik | Pazarlama & SEO | B | `backlog` (UX sonrası) |
| WS-7 QA & Audit | QA & Audit | C | `backlog` |
| WS-8 E2E Playwright | E2E User Test | C | `backlog` |
| WS-9 Analitik / funnel | DataOps Analitik | C | `backlog` |
| WS-10 Reklam/CRO | Reklam Stratejisti | C | `backlog` |
| WS-11 Dokümantasyon | Teknik Yazar | C | `backlog` |
| WS-12 SSL/DNS/e-posta auth | Sertifika DNS İzleyici | A→sürekli | `todo` |

> Bu tablo, onay gelince doğrudan `multica issue create --parent AJA-195` komutlarına dönüşecek. Kapsam dışı ajanlara (Telefoni/AI ML/İzleyici) alt-issue açılmaz.
