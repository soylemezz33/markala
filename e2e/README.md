# Uçtan uca testler (Playwright)

Bu klasör **bilerek monorepo workspace'inin dışında** tutuldu: pnpm-lock.yaml'a
dokunmadan bağımsız kurulup koşabilsin diye. Kendi `package.json`'ı ve kendi
`node_modules`'ı vardır.

```bash
cd e2e
npm install
npx playwright install chromium
npm test                      # canlı siteye karşı
BASE_URL=https://staging... npm test
```

## Seçiciler hakkında

Testler `data-testid` kullanmaz; sitenin erişilebilirlik etiketleri sağlam olduğu için
`getByRole` / `getByLabel` tercih edildi. Seçiciler 2026-09-05'te **canlı site
gezilerek** doğrulandı, tahminle yazılmadı.

Doğrulanan davranışlar:
- Arama, placeholder'lı input değil: `button "Ne bastıracaksın?"` → dialog → `searchbox "Site içi arama"`
- m² ürünlerinde `spinbutton "En (cm)" / "Boy (cm)" / "Adet"`
- Fiyat alanında "KDV dahil" ve "3 taksitle" metinleri
- Her sayfada çerez dialogu çıkıyor → `beforeEach` içinde kapatılıyor

## Kapsam dışı bırakılanlar

- **"Önceden gezdiklerim"**: sitede böyle bir bölüm bulunamadı, test yazılmadı.
- **m² maksimum limiti**: sitede maksimum değil, **minimum 1 m²** kuralı var.
  Test gerçek davranışı doğruluyor.
