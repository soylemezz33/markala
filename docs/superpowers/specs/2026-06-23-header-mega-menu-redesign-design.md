# Header & Mega-Menü Yeniden Tasarımı — Tasarım Dokümanı

**Tarih:** 2026-06-23
**Kapsam:** Yalnızca storefront header + mega-menü (`apps/web`). Backend/şema değişikliği YOK.
**Görsel yön:** Mevcut `paper/ink` + marka sarısı (`brand`) paletini koru/rafine et.
**Seçilen düzen:** **Varyant B — Kategori-Index Rail** (HTML maketinde Hasan onayladı).
**Referans tetik:** Hasan, bidolubaski.com mega-menü ekran görüntüsünü gönderdi; "aynısı olmasın, daha kurumsal/profesyonel/kaliteli, işlevsellik bozulmadan" istedi.

---

## 1. Amaç ve Başarı Ölçütü

- Header'ı bidolubaski'yi **kopyalamadan** daha kurumsal/profesyonel hale getir.
- Mega-menüyü dar metin listesinden **tam-genişlik, görselli, keşfedilebilir** bir panele çıkar.
- **Hiçbir mevcut işlevsellik bozulmayacak** (en önemli kısıt).

**Başarı:** Masaüstünde herhangi bir kategori sekmesine hover → tek tam-genişlik panel açılır; solda tüm kategoriler dikey rail, sağda aktif kategorinin alt-grupları + öne çıkan ürün kartları, altta "Tümünü gör" + güven rozetleri. Tüm linkler gerçek ürün/kategori sayfalarına gider. Type-check yeşil, klavye/erişilebilirlik korunur.

## 2. Mevcut Durum (değişecek dosya)

- `apps/web/src/components/site-header.tsx` (~1066 satır, `"use client"`). 3 katlı header:
  1. Utility bar (`ink-900`) — telefon/WhatsApp/teslimat + Kargo Takip/Yardım/İletişim.
  2. Ana bar — logo + ⌘K arama + hesap + favori + sepet.
  3. Kategori navigasyonu — `MAIN_NAV` (elle kodlanmış) + **sekme-başına dar dropdown** (`NavItem`, ~280px, görselsiz metin).
- Görsel kaynağı: `/api/mockup?slug=<slug>&w=&h=` her ürün için marka tonunda SVG üretir (gerçek fotoğrafa gerek yok).
- Tasarım token'ları: `packages/config/tailwind-preset.js` (`brand-500=#F5B800`, `paper/ink` ailesi).

## 3. Korunacak İşlevsellik (regresyon yasağı)

Aşağıdakiler **birebir korunur**, sadece üçüncü katın açılır davranışı/sunumu değişir:

- ⌘K / `/` ile arama modalı, Escape ile kapanma, focus-trap, return-focus (WCAG 2.4.3).
- Mobil çekmece (accordion mega-menü), route değişince kapanma, body scroll kilidi.
- Utility bar'ın 80px scroll sonrası gizlenmesi (AnimatePresence).
- UserBlock (giriş/çıkış, dropdown), WishlistHeaderButton (localStorage sayacı + event), CartButton (store).
- Skip-to-content linki, tüm `href`'ler (slug'lar aynı kalır), `aria-*`.
- Backend, API, Prisma, fiyat mantığı: **dokunulmaz**.

## 4. Yedekleme (Hasan'ın açık isteği)

Düzenlemeden ÖNCE:
- `apps/web/src/components/site-header.tsx` → `apps/web/src/components/site-header.backup-20260623.tsx.bak` olarak kopyalanır (`.bak` uzantısı Tailwind/TS glob'una takılmaz, derlenmez).
- Ek güvence: değişiklik tek commit'te, sadece bu dosya + spec/plan dosyaları `git add` edilir (paralel oturum çakışmasına karşı — `git add -A` YOK).

## 5. Tasarım — Varyant B (Kategori-Index Rail)

### 5.1 Veri modeli (genişletme)
`MAIN_NAV` her kategoriye opsiyonel `featured` eklenir (mevcut `groups` aynı kalır):

```ts
type FeaturedItem = { slug: string; label: string; theme?: "brand" | "paper" | "ink" };
// nav.featured?: FeaturedItem[]   (kategori başına 2 adet)
```

Öne çıkan ürünler (hepsi katalogda doğrulandı, gerçek `/urun/<slug>`):
| Kategori | featured #1 | featured #2 |
|---|---|---|
| Kartvizit & Kırtasiye | klasik-kartvizit | antetli-kagit |
| Broşür & El İlanı | selefonlu-brosur | el-ilani |
| Bayrak & Branda | yelken-bayrak-damla | vinil-branda-440gr |
| Promosyon & Hediye | klasik-beyaz-kupa | magnet-promosyon |
| Reklam Tabela | lightbox-led-100cm | dekota-baski-5mm |
| Restoran & Otel | amerikan-servis | trodat-printy-4912 |

Kart görseli: `/api/mockup?slug=<slug>&w=320&h=240`.

**Fiyat kararı (doğruluk):** Öne çıkan kartlarda **sabit fiyat YAZILMAZ** (canlıda birçok ürün "Teklif Al"/fiyatsız — yanlış fiyat göstermemek için). Kart = mockup görsel + ürün adı + "İncele →". (İleride canlı `startingPrice` ile fiyat eklemek Yaklaşım B yükseltmesi olarak ayrı iş.)

### 5.2 Masaüstü etkileşim
- Üçüncü kat sekmeleri kalır. Sekme-başına ayrı dropdown yerine **tek paylaşılan panel** (`MegaPanel`) açılır.
- `activeIndex` state: hangi kategori aktif. Sekmeye hover VEYA rail satırına hover → `activeIndex` değişir.
- Panel `position:absolute`, `.catnav`'a (tam genişlik, ortalanmış `max-width:1280px`) tutturulur — **navitem'e DEĞİL** (CSS positioning tuzağı; navitem `static`).
- Panel düzeni: `grid [248px rail | içerik]`.
  - **Rail (sol):** 6 kategori dikey liste, aktif olan vurgulu (`brand-700` + `shadow-sm`), sağda chevron.
  - **İçerik (sağ):** aktif kategorinin `groups`'u (2 sütun) + `featured` kartları (sağ blok, `paper-100` zemin).
  - **Alt şerit:** "Tüm <kategori> ürünlerini gör →" (sol) + güven rozetleri "1-2 iş günü üretim · Ücretsiz tasarım desteği" (sağ).
- Üstte ince `brand-500` aksan çizgisi; `paper-50` zemin, `paper-200` ayraçlar, `shadow-lg`.
- Açılış/kapanış: hover + küçük kapanma gecikmesi (~120ms, yanlışlıkla kapanmayı önler). `framer-motion` ile mevcut paterne uygun fade/translate.

### 5.3 Erişilebilirlik
- Sekme `<button/Link>`'lerine `aria-haspopup="true"` + `aria-expanded`.
- Panel `role="region"`, klavye: Tab ile rail'e girilebilir, Escape ile kapanır, `focus-within` ile açık kalır.
- Hover-only tuzağına düşmemek için klavye odağıyla da açılır (focus-within).

### 5.4 Mobil
- Mevcut accordion çekmece **korunur** (en düşük risk). 
- Opsiyonel (Faz 2, bu işte ZORUNLU değil): her kategori grubunun altına yatay "öne çıkanlar" kart şeridi.

### 5.5 Utility bar kurumsal dokunuş
- Sağ tarafa **"Kurumsal / Teklif Al"** linki (sarı pill) eklenir — kurumsal sinyal. Mevcut `TOP_LINKS` korunur. Hedef: `/kurumsal` (rota mevcut, doğrulandı).

## 6. Bileşen Sınırları (izolasyon)

Tek dosya içinde net alt-bileşenler:
- `MegaPanel({ items, activeIndex, onActiveChange, open })` — sunum + rail etkileşimi. Saf, state'i parent tutar.
- `FeaturedCard({ item })` — mockup thumbnail + ad + "İncele". Bağımsız test edilebilir.
- `MAIN_NAV` veri yapısı + `featured` — sunumdan ayrı veri.
- Mevcut `UserBlock`, `CartButton`, `WishlistHeaderButton`, `SearchModal`, mobil `MobileNavGroup` **dokunulmadan** korunur.

## 7. Doğrulama Planı

1. `pnpm -F @markala/web type-check` (veya repo'daki eşdeğer) yeşil.
2. `pnpm -F @markala/web dev` → tarayıcı: her sekmeye hover, rail swap, featured linkler, klavye (Tab/Escape), mobil çekmece.
3. Arama (⌘K), sepet, favori, giriş/çıkış regresyon kontrolü.
4. Lighthouse/a11y hızlı bakış (kontrast, focus).
5. Deploy: Hasan'ın yöntemi (`pwsh C:\tmp\markala_deploy.ps1`) + nginx reload; sonra canlı duman testi. Deploy onayı Hasan'da.

## 8. Kapsam Dışı (YAGNI)

- Canlı-veri mega-menü (Yaklaşım B yükseltmesi) — sonra.
- Koyu premium panel (Varyant C) — sonra tema anahtarı olarak eklenebilir.
- Anasayfa/ürün/kategori sayfaları — bu işin dışında (ayrı faz).
- Mega-menüde fiyat gösterimi — doğruluk gereği şimdilik yok.

## 9. Riskler

| Risk | Önlem |
|---|---|
| 1066 satırlık kritik bileşende regresyon | Yedek + sadece 3. kat sunumunu değiştir; diğer alt-bileşenlere dokunma |
| CSS positioning (panel daralması) | Panel `.catnav`'a tutturulur, navitem `static` (makette doğrulandı) |
| Hover ile yanlışlıkla kapanma | Kapanma gecikmesi + focus-within |
| Paralel oturum git çakışması | `git add -A` yok; sadece ilgili dosyalar |
| Yanlış fiyat gösterimi | Featured kartlarda fiyat yok (doğruluk) |
