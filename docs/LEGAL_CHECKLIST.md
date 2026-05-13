# Markala — Yasal Başlatma Checklist

> Son güncelleme: 2026-05-13
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
- `web/src/app/yasal/[slug]/page.tsx` — Sayfa render endpoint'i (kontrol et)
- `web/src/components/footer.tsx` — KEP + ETBİS rozeti eklenecek alan
