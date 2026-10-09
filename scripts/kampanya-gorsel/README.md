# Kampanya paketi kart görselleri

`/kampanyalar` kartlarında kullanılan 1200×900 webp görselleri burada üretilir.
Görseli olmayan paket, kategori bazlı `/api/mockup` yedeğine düşer (her zaman 200 döner,
ama jenerik görünür). Pakete özel görsel varsa kart indirim rozetini BİNDİRMEZ, çünkü
oran görselin içinde zaten yazıyor (bkz. `paketler-client.tsx` → `customArt`).

## Üretim

```bash
cd scripts/kampanya-gorsel
node ciz.mjs     # sablon.html'i Playwright ile 2× ölçekte PNG'ye çeker
node webp.mjs    # PNG'leri 1200×900 webp'e indirir (~50 KB)
cp secim-paketi-*.webp ../../apps/web/public/images/kampanyalar/
```

Sonra yeni slug'ı `apps/web/src/app/api/kampanyalar/route.ts` içindeki `BUNDLE_IMAGES`
haritasına ekle, yoksa dosya durur ama kart yedeğe düşer.

## Görseller

Kartlardaki ürün fotoğrafları UYDURMA ÇİZİM DEĞİL, sitedeki gerçek ürün görselleri
(`products.images` ilk kaydı). `foto/` klasöründe yerel kopyaları duruyor; kaynakları:

| dosya | ürün |
|---|---|
| kartvizit.webp | klasik-kartvizit |
| elilani.webp | el-ilani |
| brosur.webp | brosur |
| branda.webp | avrupa-vinil-branda |
| kirlangic.webp | kirlangic-bayrak-3m |
| masabayragi.webp | masa-bayragi-krom |
| kupa.webp | klasik-beyaz-kupa |
| rollup.webp | rollup-standart |
| aracsticker.webp | arac-sticker-yan |

Ürün görseli değişirse buradaki kopyayı da yenile. Kart başına görsel sayısı pakete göre
artar: az 3, orta 4, fazla 5 (Hasan, 9 Eki). Hepsi kare (1200×1200) olduğu için kartlar da
kare tutuluyor; `object-fit:cover` ile kırpma en aza iniyor.

## Şablon kuralları

- Tuval 1200×900, zemin `#241D56` (sağ üstte `#3A2E78` ışık), marka sarısı `#FFB91C`.
- Yazı tipi Poppins (Google Fonts'tan çekilir, çizim anında internet gerekir).
- `logo-beyaz.svg` = `apps/web/public/markala-logo.svg`'nin koyu dolgusu beyaza çevrilmiş
  kopyası. Logo değişirse bu dosyayı da yenile.
- Sağdaki beyaz kartların içindeki SVG'ler `overflow:hidden` ile kırpılır. Döndürülmüş
  (`rotate`) bir grup kart kenarına yakınsa yazı kesilir; yeni kart eklerken tam ölçekte
  bir kez bakmak şart.
