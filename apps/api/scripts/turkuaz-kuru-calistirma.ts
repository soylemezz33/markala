/**
 * Turkuaz KURU ÇALIŞTIRMA — gerçek besleme dosyaları üzerinde eşlemeyi uçtan uca dener,
 * HİÇBİR YERE YAZMAZ. İlk kurulumdan önce ve besleme yapısı şüphesinde çalıştırılır:
 *   pnpm tsx scripts/turkuaz-kuru-calistirma.ts <urunler.xml> <kategoriler.xml>
 */
import { readFileSync } from "node:fs";
import { computeConfiguredPrice } from "../src/orders/pricing";
import { gruplaVeEsle, grupToYuk } from "../src/integrations/turkuaz/turkuaz-esleme";
import { kategorileriAyristir, urunleriAyristir } from "../src/integrations/turkuaz/turkuaz-xml";

const [urunYolu, kategoriYolu] = process.argv.slice(2);
if (!urunYolu || !kategoriYolu) {
  console.error("Kullanım: tsx scripts/turkuaz-kuru-calistirma.ts <urunler.xml> <kategoriler.xml>");
  process.exit(1);
}

const skular = urunleriAyristir(readFileSync(urunYolu, "utf8"));
const kategoriler = kategorileriAyristir(readFileSync(kategoriYolu, "utf8"));
const { gruplar, atlanan } = gruplaVeEsle(skular, kategoriler);

console.log(`SKU: ${skular.length} | grup: ${gruplar.length} | atlanan:`, atlanan);

const slugSayimi = new Map<string, number>();
const kategoriSayimi = new Map<string, number>();
let toplamOpsiyon = 0;
let toplamFiyatSatiri = 0;
let aktifUrun = 0;
let motorHatasi = 0;
const uyarilar: string[] = [];

for (const grup of gruplar) {
  const yuk = grupToYuk(grup, false);
  slugSayimi.set(yuk.slug, (slugSayimi.get(yuk.slug) ?? 0) + 1);
  kategoriSayimi.set(yuk.kategoriSlug, (kategoriSayimi.get(yuk.kategoriSlug) ?? 0) + 1);
  toplamOpsiyon += yuk.options.length;
  toplamFiyatSatiri += yuk.prices.length;
  if (yuk.aktif) aktifUrun++;

  if (yuk.name.length > 90) uyarilar.push(`uzun isim: ${yuk.name}`);
  if (yuk.options.filter((o) => o.groupKey === "renk").length > 40)
    uyarilar.push(`${yuk.slug}: ${yuk.options.length - 6} varyant (dropdown'a düşer)`);

  // Motor doğrulaması: ilk varyant × ilk kademe fiyatı matristen birebir okunmalı.
  const renk = yuk.options.find((o) => o.groupKey === "renk");
  const adet = yuk.options.find((o) => o.groupKey === "adet");
  if (renk && adet) {
    const beklenen = yuk.prices.find(
      (p) => p.optionKey === renk.optionKey && p.dimKey === adet.optionKey,
    )?.price;
    const motor = computeConfiguredPrice(
      yuk.options as never,
      yuk.prices.map((p, i) => ({ ...p, id: String(i), productId: "x" })) as never,
      { renk: renk.optionKey, adet: adet.optionKey },
    );
    if (beklenen !== motor) {
      motorHatasi++;
      if (motorHatasi <= 5)
        uyarilar.push(`MOTOR FARKI ${yuk.slug}: beklenen ${beklenen}, motor ${motor}`);
    }
  }
}

const cakisan = [...slugSayimi.entries()].filter(([, n]) => n > 1);
console.log(`aktif ürün: ${aktifUrun} / ${gruplar.length}`);
console.log(`toplam opsiyon satırı: ${toplamOpsiyon} | fiyat satırı: ${toplamFiyatSatiri}`);
console.log(`slug çakışması: ${cakisan.length}`, cakisan.slice(0, 5));
console.log(`motor farkı: ${motorHatasi}`);
console.log("kategori dağılımı:", Object.fromEntries([...kategoriSayimi.entries()].sort()));
console.log(`uyarı (${uyarilar.length}):`);
for (const u of uyarilar.slice(0, 15)) console.log("  -", u);

// Örnek üç ürün kartı — göz kontrolü için.
for (const g of [gruplar[0], gruplar[Math.floor(gruplar.length / 2)], gruplar[gruplar.length - 1]]) {
  const y = grupToYuk(g, false);
  console.log("\n---", y.slug, "| kategori:", y.kategoriSlug, "| aktif:", y.aktif);
  console.log("  isim:", y.name, "| basePrice:", y.basePrice);
  console.log("  kısa:", y.shortDescription);
  console.log("  varyant:", y.options.filter((o) => o.groupKey === "renk").map((o) => o.optionLabel).slice(0, 8).join(", "));
  console.log("  adet:", y.options.filter((o) => o.groupKey === "adet").map((o) => o.optionLabel).join(", "));
  console.log("  görsel:", y.gorselKaynaklari.length);
}

// SEO örneği: bir ürünün üretilen içeriği (göz kontrolü)
const seoOrnek = grupToYuk(gruplar.find((g) => g.kodgrup === "5322") ?? gruplar[0], false);
console.log("\n=== SEO ÖRNEĞİ ===", seoOrnek.slug);
console.log(JSON.stringify(seoOrnek.content, null, 1).slice(0, 1800));
