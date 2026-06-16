# EU AI Act Uyum Checklist — Markala

> Zorunlu uygulama tarihi: **2 Ağustos 2026**
> Son güncelleme: 2026-06-16
> Sorumlu: KVKK Privacy Officer / Hasan Söylemez
> Risk: İhlal halinde €15.000.000 veya küresel cironun %3'ü (yüksek olan)

---

## Kapsam Değerlendirmesi

Markala, EU AI Act kapsamında aşağıdaki sistemleri kullanmaktadır:

| Sistem | Kullanım | Risk Sınıfı |
|---|---|---|
| OpenAI Whisper | Çağrı transkripsiyonu (ses → metin) | Minimal Risk |
| GPT-4o-mini / Claude Haiku | Müşteri hizmetleri chatbot + çağrı analizi | Minimal Risk |
| Ürün açıklaması üretimi | Katalog içerik üretimi | Minimal Risk |

**Sonuç:** Markala, yüksek riskli AI sistemi kategorisine girmemektedir (m.6 kapsamı dışı). Ancak **m.50 şeffaflık zorunluluğu** tüm AI sistemleri için geçerlidir.

---

## Madde Bazlı Uyum Durumu

### m.50 — Şeffaflık Zorunluluğu (KRİTİK — 02.08.2026)

Doğrudan etkileşimde bulunulan gerçek kişilere AI ile etkileşimde olduklarını bildirme zorunluluğu.

| Kanal | Zorunluluk | Durum | Aksiyon |
|---|---|---|---|
| Web chatbot (gelecek) | "Bu mesaj bir yapay zeka asistanı tarafından oluşturulmuştur" bildirimi | 🔴 Henüz implement yok | Frontend geliştirme gerekli |
| Santral inbound (FreeSWITCH) | Aramada sesli AI disclosure | 🟡 Lua script planlandı | Telefoni Operatörü sorumlu |
| Santral outbound | Sesli AI disclosure | 🟡 Lua script planlandı | Telefoni Operatörü sorumlu |
| E-posta AI içeriği | AI üretimi ise imza altında açıklama | 🔴 Kural yok | Pazarlama/İçerik birimi |
| Ürün açıklaması | AI üretimi etiketi veya meta etiketi | 🟡 Teknik altyapı var, etiket yok | Ürün sayfasına badge ekle |

**Aksiyon tarihi: 1 Temmuz 2026 (02 Ağustos öncesi 30 gün tampon)**

---

### m.5 — Yasaklı AI Uygulamaları (Uyumlu)

| Uygulama | Durum |
|---|---|
| Ses biyometriği / duygu analizi | ✅ Kullanmıyoruz |
| Sosyal puanlama sistemleri | ✅ Kullanmıyoruz |
| Hedefleme (çocuklar/savunmasız gruplar) | ✅ Kullanmıyoruz |
| Bilinçaltı manipülasyon teknikleri | ✅ Kullanmıyoruz |

---

### m.6 — Yüksek Riskli AI Sistemi

Markala'nın kullandığı AI sistemleri Ek III listesinde yer almamaktadır. **Yüksek riskli AI sistemi değil.**

---

### m.10 — Veri Kalitesi ve Bias İzleme

| Gereksinim | Durum | Aksiyon |
|---|---|---|
| Eğitim verisi kalite kriterleri | 🟡 OpenAI/Anthropic kontrolünde | Sub-processor DPA'ya ekle |
| Bias monitoring (müşteri çıktıları) | 🔴 İzleme yok | Çağrı analiz raporlarında örnekleme ekle |
| Veri governance politikası | 🟡 Kısmen (KVKK kapsamında) | `docs/kvkk/DATA-GOVERNANCE.md` oluştur |

---

### m.13 — Şeffaflık Yükümlülükleri

| Gereksinim | Durum | Aksiyon |
|---|---|---|
| AI sistemlerinin varlığı açıklanıyor mu? | 🟡 KVKK aydınlatma metninde kısmen | Bölüm 2'yi genişlet |
| Kullanıcı haklarına AI etkisi açıklandı mı? | 🔴 Hayır | Aydınlatma metnine ekle |
| AI karar süreçleri belgelendi mi? | 🔴 Yok | İç doküman oluştur |

---

### m.14 — İnsan Denetimi

| Mekanizma | Durum |
|---|---|
| AI halüsinasyon düzeltme hakkı | ✅ `call_corrections_ext.py` mevcut |
| Çağrı transkript düzeltme arayüzü | ✅ Dashboard'da "düzelt" butonu |
| AI kararlarına itiraz kanalı | 🟡 KVKK başvuru formu kullanılabilir, açık değil |

---

### m.50 — Ses Biyometriği Yasağı (Uyumlu)

Markala ses biyometriği veya duygu tanıma AI kullanmamaktadır. **Uyumlu.**

---

### m.86 — Düzeltme Hakkı

| Hak | Durum |
|---|---|
| AI çıktısına itiraz | ✅ `call_corrections_ext.py` |
| Etkilenen kişiye düzeltme bildirimi | 🟡 Manuel süreç gerekli |

---

## Acil Eylem Planı (Deadline: 02.08.2026)

### Hafta 1-2 (16-30 Haziran 2026)
- [ ] **[KOD]** Web chatbot için AI disclosure banner bileşeni oluştur
- [ ] **[KOD]** Ürün açıklaması sayfalarına "AI ile oluşturuldu" etiketi ekle
- [ ] **[DOC]** KVKK aydınlatma metnini AI kullanımı bölümü ile güncelle
- [ ] **[DOC]** `docs/kvkk/DATA-GOVERNANCE.md` oluştur

### Hafta 3-4 (1-15 Temmuz 2026)
- [ ] **[TELEFONI]** Lua inbound disclosure script (Telefoni Operatörü)
- [ ] **[TELEFONI]** Lua outbound disclosure script (Telefoni Operatörü)
- [ ] **[DOC]** AI sistemleri iç envanteri dokümanı

### Hafta 5-6 (16 Temmuz - 2 Ağustos 2026)
- [ ] **[TEST]** Tüm kanallar disclosure testi
- [ ] **[HUKUK]** Hukuk danışmanı final review
- [ ] **[DOC]** Uyum sertifikası/beyannamesi

---

## AI Disclosure Taslak Metinleri

### Web Chatbot (Türkçe)
```
Bu sohbet, Markala'nın yapay zeka asistanı tarafından yönetilmektedir.
Gerçek bir müşteri temsilcisiyle görüşmek için [İletişim] bağlantısına tıklayın.
```

### Web Chatbot (İngilizce — m.50)
```
You are chatting with an AI assistant powered by Markala.
To speak with a human agent, click [Contact Us].
```

### Santral Inbound (Türkçe sesli)
```
Bu çağrı, Markala'nın yapay zeka sistemleri tarafından işlenmekte ve
kalite güvencesi amacıyla kayıt altına alınmaktadır.
```

### E-posta AI İçeriği
```
[Bu içerik yapay zeka destekli araçlarla oluşturulmuş ve insan editörü tarafından gözden geçirilmiştir.]
```

---

## Risk Matrisi

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| m.50 ihlali (disclosure yok) | Yüksek | €15M / %3 ciro | Acil geliştirme |
| Yanlış AI risk sınıfı | Düşük | Yüksek | Yıllık gözden geçirme |
| Sub-processor uyumsuzluğu | Orta | Orta | DPA güncellemeleri |
| Veri aktarım ihlali | Düşük | Yüksek | SCC/BCR doğrulama |

---

## İlgili Belgeler

- `docs/kvkk/DPA-TEMPLATE.md` — Alt işleyici DPA şablonu
- `docs/kvkk/VERBIS-STATUS.md` — VERBİS başvuru takip
- `packages/mock-data/src/legal.ts` → Aydınlatma metni güncellemesi gerekli
- `apps/web/src/components/cookie-consent.tsx` — Çerez banner

---

## Referanslar

- [EU AI Act Resmi Metin](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689)
- [KVK Kurulu AI Act Rehberi](https://www.kvkk.gov.tr)
- [m.50 Şeffaflık Yükümlülükleri Kılavuzu](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
