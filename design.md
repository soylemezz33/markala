# Design — Markala (markala.com.tr)

Kilitli tasarım sistemi. Hallmark ve tüm tasarım araçları önce bu dosyayı okur;
sayfalar bu sisteme uyar — birbirinden farklılaşmaz (diversifikasyon TERS çevrildi).
**Ayrıntılı ve bağlayıcı kaynak: `docs/marka-kimligi.md` (ALTIN KURAL).** Bu dosya
onun makine-okur Hallmark özetidir; çelişkide marka-kimligi.md kazanır.

## System
- Genre · modern-minimal (esnaf segmentinde sıcak/samimi ton, B2B'de kurumsal)
- Macrostructure · mevcut site yapısı korunur (e-ticaret: hero → kategori → ürün ızgarası)
- Theme · custom (marka: "Markala moru + sarı hap CTA, matbaa e-ticaret")
- Axes · light paper / geometric-sans (Poppins) / warm-amber accent + mor ailesi

## Tokens (kanonik hex = marka; OKLCH eşdeğerleri bilgi amaçlı)
```css
:root {
  --color-paper:      #F2F1F6; /* oklch(96.0% 0.007 295)  kırık beyaz zemin */
  --color-ink:        #191722; /* oklch(21.2% 0.022 293)  açık zeminde metin */
  --color-primary:    #4B3AA0; /* oklch(42.8% 0.158 285)  Markala moru — zemin/başlık vurgusu */
  --color-primary-2:  #241C54; /* oklch(27.3% 0.098 284)  Gece moru — kampanya/değer zeminleri */
  --color-accent:     #FFB91C; /* oklch(83.0% 0.167 80)   Markala sarısı — CTA/fiyat rozeti/vurgu */
  --color-accent-ink: #191722; /* sarı üstünde daima mürekkep */
  --color-primary-lt: #6A55D8; /* oklch(54.3% 0.192 285)  koyu zeminde desen/ikon */
  --color-lavender:   #B7ABEA; /* oklch(77.4% 0.090 293)  nokta grid */
  --color-amber:      #F0A400; /* oklch(77.3% 0.163 76)   sarı zemin üstü halkalar */
  --color-campaign:   #FF8A1E; /* oklch(74.8% 0.176 56)   YALNIZ kampanya/indirim */

  --font-display: "Poppins", sans-serif;  /* 800 · 56–96px · %-2.5 espas */
  --font-body:    "Poppins", sans-serif;  /* 400 · 16–18px · 1.6 satır */
  --font-script:  "Caveat", cursive;      /* 700 · YALNIZ slogan */

  --radius-badge: 14px;  --radius-card: 26px; /* cam kart yalnız koyu zemin */
}
```

## Kurallar (bağlayıcı)
- Oran: %60 mor ailesi · %25 açık zemin · %15 sarı. **Sarı asla zemin kaplamaz.**
- Çekirdek zeminler: kırık beyaz · mor · gece moru. Turuncu zemin = yalnız kampanya.
- Başlıkta tek renk vurgusu: açık zeminde mor, koyu zeminde sarı.
- Slogan: "Baskı Çözümlerinde **Yeni Nesil Deneyim**" — vurgu kısmı daima Caveat.
- Söylem sözlüğü: "81 ile kargo" · "Tek panelde 30+ ürün" · "1–2 iş günü" ·
  "Ücretsiz tasarım" · "rollup" (tek kelime). Ad-hoc değer ifadesi üretilmez.
- Fiyat: `480₺ · 2.000₺ · 34,90₺` (nokta binlik, virgül ondalık, ",00" atılır, ₺ bitişik).
  Kart fiyatı canlı siteyle senkron; area ürünlerde üste yuvarlanır, asla altında gösterilmez.
- İSG istisnası: levha görselleri ISO 7010 renklerinde kalır — marka rengine boyanmaz.

## CTA voice
- Primary · sarı hap (#FFB91C dolgu, mürekkep yazı) · BÜYÜK HARF + "→" · yüzeyde TEK birincil CTA
- Secondary · zemine göre beyaz ya da mor outline · **mor dolgulu buton yasak** · gölge/degrade yok

## Motion stance
- Sakin: ScrollReveal girişleri + hafif hover; transform/opacity dışı animasyon yok.
- Reduced-motion fallback · ≤150ms opacity crossfade.

## Provenance
- Elle tohumlandı: `docs/marka-kimligi.md` (2026-07-16 sürümü) → design.md, 2026-07-18.
- Rakip DNA'sı İÇERMEZ — rakip study çıktıları yalnız teşhis raporudur, sisteme işlenmez.
