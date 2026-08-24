#!/usr/bin/env node
/**
 * TEK SEFERLİK backfill — eski sipariş kalemlerine maliyet snapshot'ı yazar (2026-08-24).
 *
 * cost_total kolonu eklendi; yeni siparişler sipariş anında dolduruyor. Bu script
 * ESKİ (cost_total IS NULL) kalemlere BUGÜNKÜ maliyeti tek seferlik yazar — geçmiş
 * için elde daha iyi veri yok; bundan sonra maliyet güncellemeleri geçmişi etkilemez.
 * Maliyeti bilinemeyen kalemler (İSG, kampanya paketi) NULL bırakılır — rapor bunları
 * "maliyeti girilmemiş" olarak göstermeye devam eder.
 *
 * Çalıştırma (API konteynerinde — @prisma/client + DATABASE_URL oradadır):
 *   sudo docker cp scripts/siparis/backfill-maliyet.cjs markala-api:/app/backfill-maliyet.cjs
 *   sudo docker exec markala-api node /app/backfill-maliyet.cjs --dry   # önce dene
 *   sudo docker exec markala-api node /app/backfill-maliyet.cjs        # yaz
 *
 * Mantık apps/api/src/orders/costing.ts + pricing.ts ile BİREBİR aynıdır (CJS'e
 * kopyalandı — konteynerdeki dist derlemesine path bağımlılığı olmasın diye).
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const DRY = process.argv.includes("--dry");

function req(name) {
  for (const base of ["/app/apps/api/node_modules/", "/app/node_modules/", ""]) {
    try {
      return require(base + name);
    } catch {
      /* sıradakini dene */
    }
  }
  throw new Error(`${name} bulunamadı — script API konteynerinde mi çalışıyor?`);
}
const { PrismaClient } = req("@prisma/client");

// ── pricing.ts kopyası (satış motoru; cost beslenerek maliyet motoru olur) ──
const num = (v) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};
function volumeDiscountRate(qty) {
  if (qty >= 250) return 0.35;
  if (qty >= 100) return 0.28;
  if (qty >= 50) return 0.22;
  if (qty >= 25) return 0.15;
  if (qty >= 10) return 0.08;
  return 0;
}
function computeConfiguredPrice(options, prices, selections) {
  const sels = selections && typeof selections === "object" ? selections : {};
  const opts = Array.isArray(options) ? options : [];
  const rows = Array.isArray(prices) ? prices : [];
  const groupMap = new Map();
  for (const o of opts) {
    if (!groupMap.has(o.groupKey)) groupMap.set(o.groupKey, { key: o.groupKey, role: o.groupRole, sort: o.groupSort });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.sort - b.sort);
  if (groups.length === 0) {
    const row = rows.find((p) => p.groupKey == null && p.optionKey == null);
    return row ? Math.max(0, num(row.price)) : 0;
  }
  const dims = groups.filter((g) => g.role === "dimension");
  const priceDimKey = dims.length ? (dims.find((g) => g.key !== "adet") ?? dims[0]).key : null;
  const dimSel = priceDimKey ? sels[priceDimKey] : undefined;
  let unit = 0;
  for (const g of groups) {
    if (g.role !== "priced") continue;
    const sel = sels[g.key];
    if (!sel) continue;
    const row = rows.find((p) => p.groupKey === g.key && p.optionKey === sel && (dimSel ? p.dimKey === dimSel : p.dimKey == null));
    if (row) unit += num(row.price);
  }
  let qty = 1;
  const adet = groups.find((g) => g.role === "dimension" && g.key === "adet" && g.key !== priceDimKey);
  if (adet) {
    const n = Number(sels[adet.key]);
    if (Number.isFinite(n) && n > 0) qty = n;
  }
  const gross = unit * qty * (1 - volumeDiscountRate(qty));
  return Math.round(Math.max(0, gross) * 100) / 100;
}
function extractSelections(config) {
  if (config && typeof config === "object" && "selections" in config) {
    const s = config.selections;
    if (s && typeof s === "object") return s;
  }
  return {};
}
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// ── costing.ts kopyası ──
function computeItemCostTotal(product, configuration, quantity, satisHaricLine, marj) {
  if (!product) return null;
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  if (product.pricingMode === "area") {
    if (!(marj > 0)) return null;
    return round2(satisHaricLine / marj);
  }
  const rows = product.prices ?? [];
  if (rows.length === 0) return null;
  if (!rows.some((r) => r.cost !== null && r.cost !== undefined)) return null;
  const optRows = product.options ?? [];
  if (optRows.length === 0) {
    const base = rows.find((r) => r.groupKey == null && r.optionKey == null);
    const c = base?.cost;
    if (c === null || c === undefined) return null;
    return round2(Number(c) * qty);
  }
  const selections = extractSelections(configuration);
  if (!selections || Object.keys(selections).length === 0) return null;
  let eksikCost = false;
  const costRows = rows.map((r) => {
    const c = r.cost;
    if (c === null || c === undefined) eksikCost = true;
    return { ...r, price: c ?? 0 };
  });
  const unitCost = computeConfiguredPrice(optRows, costRows, selections);
  if (unitCost <= 0) return eksikCost ? null : 0;
  return round2(unitCost * qty);
}

// ── ana akış ──
(async () => {
  const prisma = new PrismaClient();
  try {
    const settingRows = await prisma.siteSetting.findMany({ where: { group: "pricing" } });
    const marjRaw = Number(Object.fromEntries(settingRows.map((r) => [r.key, r.value]))["pricing.marj"]);
    const marj = Number.isFinite(marjRaw) && marjRaw > 0 ? marjRaw : 1.2;

    const items = await prisma.orderItem.findMany({
      where: { costTotal: null },
      select: {
        id: true,
        productSlug: true,
        quantity: true,
        lineTotal: true,
        configuration: true,
        product: { select: { pricingMode: true, options: true, prices: true } },
      },
    });
    console.log(`${items.length} snapshot'sız kalem bulundu (marj=${marj}, dry=${DRY})`);

    let yazilan = 0;
    let bilinmeyen = 0;
    for (const it of items) {
      const satisHaric = Number(it.lineTotal) / 1.2; // KDV hariç — profit.service ile aynı
      const cost = computeItemCostTotal(it.product, it.configuration, it.quantity ?? 1, satisHaric, marj);
      if (cost === null) {
        bilinmeyen++;
        continue;
      }
      if (!DRY) {
        await prisma.orderItem.update({ where: { id: it.id }, data: { costTotal: cost } });
      }
      console.log(`  ${it.productSlug}: maliyet=${cost} (satis_haric=${round2(satisHaric)})`);
      yazilan++;
    }
    console.log(`\n${DRY ? "[DRY] yazılacak" : "yazıldı"}: ${yazilan} · bilinmeyen (NULL kaldı): ${bilinmeyen}`);
  } finally {
    await prisma.$disconnect();
  }
})();
