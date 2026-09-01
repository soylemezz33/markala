#!/usr/bin/env node
/**
 * DEKOTA'YA CNC KESİM EK İŞLEMİ (2026-09-01, Hasan onaylı).
 *
 * Neden: Hasan'ın fiyat Excel'inde dekota için CNC Kesim satırı var (3,60 $ → 176,40 ₺/m²)
 * ama üründe böyle bir seçenek yoktu — fiyatlanmış ama müşteri seçemiyordu.
 * Pleksi ve kompozitteki tanım birebir kopyalanır.
 *
 * ⚠️ groupSort KRİTİK: ek işlem grubu ANA gruptan (malzeme, gs=1) BÜYÜK olmalı.
 * areaStartingPrice yalnız en küçük groupSort'lu grubu tarar; ek işlem oraya girerse
 * başlangıç fiyatı 176 ₺'ye çöker (pleksi'de yaşanan hata — bkz. display-price.ts notu).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/katalog/dekota-cnc-kesim-ekle.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const SLUG = "dekota-baski-5mm";
const EK_GS = 5;              // pleksi/kompozit ile aynı
const CNC_COST = 3.6;         // Excel: YAYINLANACAK SATIS FİYATI (KDV dahil son satış, USD)

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  return (await r.json()).accessToken;
}
const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };
const oku = () => fetch(`${API}/api/products/${SLUG}`).then((r) => (r.ok ? r.json() : null));

const u = await oku();
if (!u?.id) { console.error("dekota okunamadı"); process.exit(1); }
if ((u.options ?? []).some((o) => o.optionKey === "cnc-kesim")) { console.log("CNC kesim zaten var — dokunulmadı."); process.exit(0); }

const anaGs = Math.min(...(u.options ?? []).map((o) => o.groupSort ?? 0));
if (EK_GS <= anaGs) { console.error(`✗ groupSort çakışması: ek işlem ${EK_GS} ≤ ana grup ${anaGs} — DURDURULDU`); process.exit(1); }

const oncekiDisplay = Number(u.displayPrice);
const options = [
  ...(u.options ?? []).map((o) => ({
    groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole, groupSort: o.groupSort,
    optionKey: o.optionKey, optionLabel: o.optionLabel,
    ...(o.optionSublabel ? { optionSublabel: o.optionSublabel } : {}),
    optionSort: o.optionSort ?? 0, ...(o.rules ? { rules: o.rules } : {}),
  })),
  { groupKey: "ekislem", groupLabel: "Ek İşlem", groupRole: "priced", groupSort: EK_GS,
    optionKey: "yok", optionLabel: "Yok", optionSort: 0 },
  { groupKey: "ekislem", groupLabel: "Ek İşlem", groupRole: "priced", groupSort: EK_GS,
    optionKey: "cnc-kesim", optionLabel: "CNC Kesim", optionSort: 1,
    rules: { birim: "dolar", effect: "perM2" } },
];
const prices = [
  ...(u.prices ?? []).map((p) => ({
    ...(p.groupKey ? { groupKey: p.groupKey } : {}),
    ...(p.optionKey ? { optionKey: p.optionKey } : {}),
    ...(p.dimKey ? { dimKey: p.dimKey } : {}),
    ...(p.cost != null ? { cost: Number(p.cost) } : {}),
    price: Number(p.price ?? 0),
  })),
  // "yok" için fiyat satırı YOK (pleksi ile aynı) → motor satırı bulamaz, ücret eklemez.
  { groupKey: "ekislem", optionKey: "cnc-kesim", cost: CNC_COST, price: 0 },
];

console.log(`${SLUG}: ana grup gs=${anaGs} · ek işlem gs=${EK_GS} · başlangıç fiyatı şu an ${oncekiDisplay} ₺/m²`);
console.log(`  + ekislem/yok        (ücretsiz)`);
console.log(`  + ekislem/cnc-kesim  ${CNC_COST} $ → ${(CNC_COST * 49).toFixed(2)} ₺/m²`);
if (DRY) { console.log("\n[DRY] yazılmadı."); process.exit(0); }

const oR = await fetch(`${API}/api/products/${u.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
if (!oR.ok) { console.error(`✗ seçenek yazılamadı: ${oR.status} ${(await oR.text()).slice(0, 200)}`); process.exit(1); }
const pR = await fetch(`${API}/api/products/${u.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices } ) });
if (!pR.ok) { console.error(`✗ fiyat yazılamadı: ${pR.status} ${(await pR.text()).slice(0, 200)}`); process.exit(1); }

const k = await oku();
let hata = 0;
const cnc = (k.options ?? []).find((o) => o.optionKey === "cnc-kesim");
const cncFiyat = (k.prices ?? []).find((p) => p.optionKey === "cnc-kesim");
if (!cnc || cnc.groupSort !== EK_GS) { console.error("✗ cnc-kesim seçeneği yazılmadı/yanlış groupSort"); hata++; }
if (!cncFiyat || Number(cncFiyat.cost) !== CNC_COST) { console.error("✗ cnc-kesim fiyatı yazılmadı"); hata++; }
if ((k.options ?? []).length !== options.length) { console.error(`✗ seçenek sayısı ${k.options?.length}/${options.length}`); hata++; }
if ((k.prices ?? []).length !== prices.length) { console.error(`✗ fiyat satırı ${k.prices?.length}/${prices.length}`); hata++; }
// EN KRİTİK: başlangıç fiyatı ek işleme düşmemeli
if (Number(k.displayPrice) !== oncekiDisplay) {
  console.error(`✗ BAŞLANGIÇ FİYATI DEĞİŞTİ: ${oncekiDisplay} → ${k.displayPrice} — ek işlem ana gruba karışmış olabilir!`);
  hata++;
}
console.log(hata === 0
  ? `\n✓ Doğrulandı — ${k.options.length} seçenek, ${k.prices.length} fiyat satırı, başlangıç fiyatı ${k.displayPrice} ₺/m² (değişmedi).`
  : `\n✗ ${hata} sorun.`);
process.exit(hata === 0 ? 0 : 1);
