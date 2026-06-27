# Faz 4 — Konsolidasyon + 301 + Fiyat Planı (ONAY BEKLİYOR)

**Tarih:** 2026-06-26 · Canlı DB'den çıkarıldı (41 İSG-hariç ürün) · **Hasan onayı sonrası deploy.**

Kural: **hiçbir şey silinmez** (arşiv=`isActive=false` + 301). Fiyat değişen ürünlerde önce **değişim raporu** → onay.

---

## A) GERÇEK m² ÜRÜNLER → konsolide + area (yerinde dönüştür)

Her grubun **ana ürünü yerinde area'ya çevrilir** (URL/SEO korunur), kardeşler arşiv+301.

| Yeni ana ürün (area) | Kaynak (yerinde dönüşen) | Birleşen kardeşler → 301 |
|---|---|---|
| **Branda / Afiş** | `vinil-branda-440gr` (30 fiyat satırı, en gelişmiş) | `mesh-branda` → `/urun/vinil-branda-440gr` |
| **Dekota & Levha** | `dekota-baski-5mm` (8 satır) | — (tek) |
| **Folyo / Sticker** | `cam-folyosu-kesimli` | `arac-sticker-yan` (pasif) → 301 ; `fosforlu-cikis-folyo` (pasif) → 301 |
| **Bayrak & Tekstil (kumaş)** | `kirlangic-bayrak-3m` (28 satır) | — (yelken/makam/masa B grubunda, ayrı) |

> Ana ürünün **slug'ı korunur**, sadece adı "Branda/Afiş" vb. olur + area moduna alınır + vinilturk malzemeleri eklenir. Böylece ana üründe 301 GEREKMEZ (Google sıralaması korunur); 301 sadece kardeş birleştirmede.

**A grubuna eklenecek malzemeler (vinilturk):**
- Branda: 24 vinil (Çin/Avrupa 280-680, ışıklı, mesh, arkası siyah, reflektif, blackout, fibermark) + dikiş/kolon dikiş ekstraları
- Dekota: Dekota 3-10mm (tek/çift), Pleksi 3/5mm, Kompozit + CNC kesim ekstrası
- Folyo: normal/mat/şeffaf/gri/kumlama/baskes/laminasyonlu/one-way + iç-mekan/laminasyon/UV ekstraları
- Bayrak: Saten/Raşel kumaş + kırlangıç + gönder + kuşgözü ekstrası

---

## B) TAKIM / SABİT ÜRÜNLER → ayrı kalsın, SADECE fiyat güncelle

Fiziksel sabit ürün (en×boy anlamsız). Area YOK, konsolidasyon YOK, URL'e dokunulmaz — sadece fiyat vinilturk'ten güncellenir.

| Ürün | Durum | vinilturk referansı |
|---|---|---|
| `rollup-standart` | aktif | Roll-Up Takım 30 $/adet |
| `yelken-bayrak-damla` | aktif | Yelken Takım 550 ₺ / kumaş |
| `makam-bayragi-puskullu` | aktif | Makam Gold/Krom 55/50 $ |
| `masa-bayragi-krom` | aktif | Masa Bayrağı Takım 200-240 ₺ |
| `arac-magneti-30x40` | aktif (fiyat 800) | Magnet/Araç magneti |
| `lightbox-led-100cm` | **pasif** | Kasalı Lightbox (teklif) |
| `plastik-duba-baskili` | **pasif** | Kompozit Duba 26 $/m² |

> Pasif olanlara (lightbox, duba) dokunmak opsiyonel — zaten canlıda görünmüyor.

---

## C) DOKUNULMAYANLAR → additive aynen kalır (28 ürün)

kartvizit · antetli · broşür×3 · el-ilani · bloknot×5 · cepli-dosya · zarf×3 · çanta · amerikan-servis · makbuz · kapı-aski-brosur · etiket · oto-paspas · kupa · madalya · plaket · kaşe · magnet-promosyon · afis-105gr · araç magneti hariç hepsi.

Bunların fiyat motoru (hücre-bazlı) ve URL'leri **hiç değişmez.**

---

## 301 Yönlendirme Haritası (kesin)

```
/urun/mesh-branda          → /urun/vinil-branda-440gr   (Branda/Afiş)
/urun/arac-sticker-yan     → /urun/cam-folyosu-kesimli  (Folyo/Sticker)  [zaten pasif]
/urun/fosforlu-cikis-folyo → /urun/cam-folyosu-kesimli  (Folyo/Sticker)  [zaten pasif]
```

Sadece **1 aktif** kardeş birleşmesi var (mesh-branda) → tek kritik 301. Diğer ikisi zaten pasif.

---

## Fiyat değişim politikası (KARAR)

Area'ya geçen ürünlerde **vinilturk maliyeti × marj** baz alınır → tutarlı. Deploy ÖNCESİ **eski fiyat vs yeni fiyat** karşılaştırma raporu çıkarılır; %X üstü değişenler işaretlenir; **Hasan onaylar**, sonra uygulanır.

---

## Deploy sırası (onay sonrası)
1. Prod DB taze yedek
2. `migrate deploy` (pricing_mode kolonu)
3. Seed: A ana ürünlerini area'ya çevir + malzeme/maliyet + ekstralar; B ürünlerini re-price; kardeşleri arşivle
4. 301 haritası (nginx/Next config)
5. Health + nginx reload
6. Hasan canlı doğrulama

## Açık riskler
- **mesh-branda 301'i** tek kritik nokta — doğru hedefe gitmeli.
- B ürünlerinde marj ×1.8 takım fiyatını yükseltebilir → fiyat raporunda görülecek.
- Konsolide ana üründe eski malzeme-özel fiyat satırları (vinil-branda 30 satır) area yapısına dönüşürken temizlenecek (seed replace-all).
