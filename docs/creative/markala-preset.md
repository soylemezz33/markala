# Markala Ürün-Görsel Preseti

> Tüm pilot çıktılar **tek presetten** geçer — katalogda seri/tutarlı görünüm için (bkz.
> `docs/grafik-tasarim-brief.md` §3: "TÜM ürünlerde aynı arka plan → profesyonel katalog").

## ⚠️ Marka çelişkisi — okumadan preset seçme

Issue AJA-387 preseti "**Markala cinematic** — charcoal→siyah gradyan, krem aksan, amber
**#F5B800**, cyan **#00D9FF** neon rim-light, dark/cinematic" olarak tarif etti.

Repo'nun **kilitli ALTIN KURAL** marka kimliği (`docs/marka-kimligi.md`, 2026-07-16) ise:
mor **#4B3AA0** + gece moru **#241C54** + sarı **#FFB91C**; **açık zemin çekirdek**; **cyan yok**;
"sarı asla zemin kaplamaz"; koyu zeminde vurgu = **açık mor #6A55D8 / amber #F0A400**. Golden-rule:
"Sapma gerektiren her durum önce bu dokümana kural olarak işlenir." Mevcut katalogdaki ~900 görsel
de **açık gri stüdyo** tonunda; 250 cinematic-dark kare seriyi bozar.

**Karar Hasan'a ait.** Aşağıda iki preset tanımı var:

- **Preset A — "Markala Studio" (marka-uyumlu, ÖNERİLEN default):** golden-rule'a ve mevcut katalog
  seriliğine uyar. Onay beklemeden güvenle uygulanabilir.
- **Preset B — "Markala Cinematic" (issue'nun istediği, SAPMA — Hasan onayı şart):** koyu zemin;
  golden-rule'un izin verdiği **gece moru #241C54** gradyan + **cam kart yalnız koyu zemin** kuralına
  yaslanır. **Cyan #00D9FF ve amber #F5B800 marka paletinde YOK** → sırasıyla **açık mor #6A55D8**
  rim-light ve marka sarısı **#FFB91C** ile ikame edildi. Saf cyan/charcoal isteniyorsa golden-rule'a
  kural olarak işlenmesi gerekir.

---

## Preset A — "Markala Studio" (default, marka-uyumlu)

| Katman | Değer | Adobe MCP karşılığı |
|---|---|---|
| Zemin | Saf beyaz `#FFFFFF` → çok hafif krem `#FBF7EC` yumuşak vinyet | InDesign şablon zemini (`document_merge_data_layout`) |
| Işık | Tek yön softbox, sol-üst 45°, yumuşak gölge (ürün ortada, havada) | Şablonda sabit gölge; `image_apply_auto_tone` ile denge |
| Marka aksanı | Sarı `#FFB91C` **yalnız** rozet/çerçeve/anahtar-kelime (zemin DEĞİL) | Şablon overlay (frame + `markala.com.tr` logo) |
| Doku/ton | Nötr, sRGB, kontrast düşük-orta; ürün rengi sadık | `image_apply_adjustments` (sıcaklık nötr, doygunluk +5) |
| Rim-light | Yok/çok hafif — açık zemin studio | — |

## Preset B — "Markala Cinematic" (SAPMA — Hasan onayı)

| Katman | Değer | Adobe MCP karşılığı |
|---|---|---|
| Zemin | **Gece moru `#241C54`** → siyah `#0C0A1A` dikey gradyan | InDesign şablon zemini |
| Işım (key) | Amber-sarı `#FFB91C` sıcak vurgu ışığı, sol-üst | Şablon ışık katmanı |
| Rim-light | **Açık mor `#6A55D8`** (cyan #00D9FF ikamesi — palet dışı) | Şablon rim katmanı |
| Aksan | Krem `#F2F1F6` metin/çip; sarı rozet | Şablon overlay |
| Doku | Hafif grain, koyu ton; cam kart (glassmorphism) yalnız koyu zeminde | `image_add_grain` (opsiyonel) |
| Ürün ışığı | Ürün gövdesine hafif sıcak/soğuk çift ışık | `image_apply_adjustments` |

> Cyan `#00D9FF` bilinçli olarak **kullanılmadı** (golden-rule paletinde yok). Onaylanırsa preset ve
> `docs/marka-kimligi.md` birlikte güncellenir.

---

## Değişmez yönetişim (her iki preset için)

- **AI yalnız sahne/zemin/ışık/renk.** Ürünün kendisi, müşteri logosu/metni/baskısı **ASLA** AI ile
  üretilmez/uydurulmaz — baskı önizlemesi birebir gerçek dosya (tüketici hukuku + güven).
- **İSG istisnası:** güvenlik levhaları ISO 7010 renginde kalır, marka rengine boyanmaz
  (`docs/marka-kimligi.md` §9). Preset çerçeveyi kurar, levhanın kendisi mevzuat renginde.
- Firefly/stok kullanımı ticari-güvenli olmalı; web'den görsel alınmaz. Lisanslı stok/ücretli
  harcama → **Hasan onayı**. Marka renkleri serbest.

## Teknik teslim hedefi (`docs/grafik-tasarim-brief.md` ile uyumlu)

- **1500×1500 px** kare, **sRGB**, **WebP** (q~80), **< 250 KB**.
- Güvenli alan: ürün kenardan %10 (~150 px) içeride (kartta hover %4 büyütür).
- Çıktı `.webp`; R2 anahtarı `products/<slug>-<n>.webp` (bkz. `production-recipe.md`).
