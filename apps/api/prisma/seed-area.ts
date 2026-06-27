/**
 * Area (m²) ürün seed'i — vinilturk maliyet listesinden.
 * Idempotent: kategori+ürün upsert; ürünün options/prices'ı silinip yeniden yazılır.
 * Çalıştır: cd apps/api && npx tsx prisma/seed-area.ts
 *
 * Sonda computeAreaPrice ile bir örnek fiyatı doğrular (Çin 440 100×100 → 182,16 ₺).
 */
import { PrismaClient } from "@prisma/client";
import { computeAreaPrice, DEFAULT_PRICING } from "../src/orders/pricing";

const prisma = new PrismaClient();

type Material = { key: string; label: string; cost: number; maxM2?: number; birim?: "dolar" | "tl" };
type ExtraOption = { key: string; label: string; cost: number; effect: "perM2Add" | "perPerimeter" | "conditional" | "perPiece"; birim?: "dolar" | "tl" };
type ExtraGroup = { groupKey: string; groupLabel: string; options: ExtraOption[] };
type AreaProduct = {
  slug: string; name: string;
  category: { slug: string; name: string };
  materials: Material[];
  extras: ExtraGroup[];
};

const PRODUCTS: AreaProduct[] = [
  {
    slug: "branda-afis",
    name: "Branda / Afiş",
    category: { slug: "vinil-branda", name: "Branda & Afiş" },
    materials: [
      { key: "cin-280", label: "Çin 280 Gr. Solvent", cost: 1.75, maxM2: 50 },
      { key: "cin-440", label: "Çin 440 Gr. Solvent", cost: 2.20, maxM2: 50 },
      { key: "avrupa-440-solvent", label: "Avrupa 440 Gr. Solvent", cost: 2.50, maxM2: 50 },
      { key: "avrupa-440-uv", label: "Avrupa 440 Gr. UV", cost: 3.75, maxM2: 20 },
      { key: "avrupa-510-solvent", label: "Avrupa 510 Gr. Solvent", cost: 4.0, maxM2: 20 },
      { key: "mesh", label: "Mesh (Gözenekli)", cost: 3.0, maxM2: 50 },
      { key: "isikli-avrupa", label: "Işıklı Avrupa Solvent", cost: 5.0, maxM2: 20 },
    ],
    extras: [
      {
        groupKey: "kenar",
        groupLabel: "Kenar İşçiliği",
        options: [
          { key: "standart", label: "Dikiş + Kopça (1 m²'den küçük)", cost: 0.2, effect: "conditional" },
          { key: "kolon", label: "Kolon Dikiş (m)", cost: 0.5, effect: "perPerimeter" },
          { key: "germe", label: "Germe (dahil)", cost: 0, effect: "perPiece" },
        ],
      },
    ],
  },
  {
    slug: "dekota-levha",
    name: "Dekota & Levha",
    category: { slug: "dekota", name: "Dekota & Levha" },
    materials: [
      { key: "dekota-3", label: "Dekota 3 mm", cost: 8, maxM2: 20 },
      { key: "dekota-5", label: "Dekota 5 mm", cost: 11, maxM2: 20 },
      { key: "dekota-7", label: "Dekota 7 mm", cost: 18, maxM2: 20 },
      { key: "dekota-3-cift", label: "Dekota 3 mm Çift Yön", cost: 12, maxM2: 20 },
      { key: "dekota-5-cift", label: "Dekota 5 mm Çift Yön", cost: 15, maxM2: 20 },
      { key: "dekota-7-cift", label: "Dekota 7 mm Çift Yön", cost: 22, maxM2: 20 },
      { key: "dekota-10", label: "10 mm Dekota", cost: 23, maxM2: 20 },
      { key: "pleksi-3", label: "Pleksi 3 mm", cost: 45, maxM2: 10 },
      { key: "pleksi-5", label: "Pleksi 5 mm", cost: 60, maxM2: 10 },
    ],
    extras: [
      {
        groupKey: "kesim",
        groupLabel: "Kesim",
        options: [
          { key: "duz", label: "Düz Kesim (dahil)", cost: 0, effect: "perPiece" },
          { key: "cnc", label: "CNC Kesim (+/m²)", cost: 2.5, effect: "perM2Add" },
        ],
      },
    ],
  },
  {
    slug: "bayrak-tekstil",
    name: "Bayrak & Tekstil",
    category: { slug: "bayrak", name: "Bayrak & Tekstil" },
    materials: [
      { key: "saten-kumas", label: "Saten Kumaş (Düz)", cost: 3.5 },
      { key: "rasel-kumas", label: "Raşel Kumaş (Düz)", cost: 2.5 },
      { key: "saten-kirlangic", label: "Saten Kırlangıç", cost: 3.75 },
      { key: "rasel-kirlangic", label: "Raşel Kırlangıç", cost: 2.75 },
    ],
    extras: [
      {
        groupKey: "kusgozu",
        groupLabel: "Kuşgözü",
        options: [
          { key: "yok", label: "Yok (dahil)", cost: 0, effect: "perPiece" },
          { key: "var", label: "Kuşgözü (+/m²)", cost: 0.3, effect: "perM2Add" },
        ],
      },
    ],
  },
];

async function seedProduct(p: AreaProduct) {
  const cat = await prisma.category.upsert({
    where: { slug: p.category.slug },
    update: { name: p.category.name },
    create: {
      slug: p.category.slug, name: p.category.name,
      shortDescription: p.category.name, longDescription: p.category.name,
      imageUrl: "/api/mockup", startingPrice: 0, productionTime: "1-2 iş günü",
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: p.slug },
    update: { name: p.name, pricingMode: "area", categoryId: cat.id, isActive: true },
    create: {
      slug: p.slug, name: p.name, categoryId: cat.id,
      shortDescription: `${p.name} — özel ölçü m² baskı`,
      description: `${p.name} ürününde malzeme + en×boy + adet seçerek anlık fiyat alın.`,
      basePrice: 0, productionTime: "1-2 iş günü", images: [],
      pricingMode: "area",
    },
  });

  // Temiz re-seed: bu ürünün option/price'larını sıfırla
  await prisma.productPrice.deleteMany({ where: { productId: product.id } });
  await prisma.productOption.deleteMany({ where: { productId: product.id } });

  const options: { productId: string; groupKey: string; groupLabel: string; groupRole: string; groupSort: number; optionKey: string; optionLabel: string; optionSort: number; rules: object }[] = [];
  const prices: { productId: string; groupKey: string; optionKey: string; cost: number; price: number }[] = [];

  // Malzeme grubu (perM2, dolar)
  p.materials.forEach((m, i) => {
    options.push({
      productId: product.id, groupKey: "malzeme", groupLabel: "Malzeme", groupRole: "priced", groupSort: 1,
      optionKey: m.key, optionLabel: m.label, optionSort: i,
      rules: { effect: "perM2", birim: m.birim ?? "dolar", ...(m.maxM2 ? { maxM2: m.maxM2 } : {}) },
    });
    prices.push({ productId: product.id, groupKey: "malzeme", optionKey: m.key, cost: m.cost, price: 0 });
  });

  // Ekstra grupları
  p.extras.forEach((g, gi) => {
    g.options.forEach((o, oi) => {
      options.push({
        productId: product.id, groupKey: g.groupKey, groupLabel: g.groupLabel, groupRole: "priced", groupSort: 2 + gi,
        optionKey: o.key, optionLabel: o.label, optionSort: oi,
        rules: { effect: o.effect, birim: o.birim ?? "dolar" },
      });
      prices.push({ productId: product.id, groupKey: g.groupKey, optionKey: o.key, cost: o.cost, price: 0 });
    });
  });

  await prisma.productOption.createMany({ data: options as never });
  await prisma.productPrice.createMany({ data: prices as never });
  return { product, optionCount: options.length };
}

async function main() {
  for (const p of PRODUCTS) {
    const { product, optionCount } = await seedProduct(p);
    console.log(`✔ ${product.slug} (area) — ${optionCount} option`);
  }

  // DOĞRULAMA — Çin 440 100×100 1 adet → 182,16 ₺ (KDV dahil)
  const branda = await prisma.product.findUnique({
    where: { slug: "branda-afis" },
    include: { options: true, prices: true },
  });
  if (branda) {
    const rows = branda.prices.map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: Number(r.price), cost: r.cost == null ? null : Number(r.cost) }));
    const r = computeAreaPrice(branda.options as never, rows, { malzeme: "cin-440", en: "100", boy: "100", adet: "1" }, DEFAULT_PRICING);
    console.log(`\nDOĞRULAMA — Çin 440, 100×100, 1 adet → ${r.dahil} ₺ (beklenen 182.16) ${r.dahil === 182.16 ? "✅" : "❌"}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
