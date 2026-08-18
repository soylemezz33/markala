#!/usr/bin/env node
/**
 * Bir siparişin REKLAMDAN gelip gelmediğini kesin olarak söyler.
 *
 * Neden gerekli: GA4 ve Google Ads dönüşüm ölçümü çerez onayına bağlı; onay
 * verilmeyen siparişler her iki sistemde de görünmez (2026-08 denetimi). Ancak
 * sipariş kaydına, checkout sırasında Google Ads tıklama kimliği (gclid) yazılıyor
 * — _gcl_aw çerezinden, o yoksa geldiği sayfanın ?gclid= parametresinden. Bu alan
 * çerez onayından BAĞIMSIZ olduğu için gerçeği söyleyen tek kaynak.
 *
 * Kullanım:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/siparis/kaynak.mjs MK-XXXX-XXXX
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const no = process.argv[2];
if (!no) { console.error("kullanım: node scripts/siparis/kaynak.mjs <SIPARIS-NO>"); process.exit(1); }

const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
if (!process.env.ADMIN_TOKEN && (!email || !password)) {
  console.error("ADMIN_EMAIL + ADMIN_PASSWORD (veya ADMIN_TOKEN) gerekli.");
  process.exit(1);
}
let token = process.env.ADMIN_TOKEN;
if (!token) {
  const r = await fetch(`${API}/api/auth/login`, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status} ${await r.text()}`); process.exit(1); }
  const j = await r.json();
  token = j.accessToken || j.access_token || j.token;
  if (!token) { console.error("Yanıtta token yok:", Object.keys(j)); process.exit(1); }
}

// Admin listesi tüm alanları döndürür; sipariş numarasına göre ara (son 200 sipariş)
const res = await fetch(`${API}/api/orders?take=200`, { headers: { authorization: `Bearer ${token}` } });
if (!res.ok) { console.error(`Sipariş listesi alınamadı: ${res.status}`); process.exit(1); }
const list = await res.json();
const arr = Array.isArray(list) ? list : (list.data || list.items || []);
const o = arr.find((x) => (x.orderNumber || "").toUpperCase() === no.toUpperCase());
if (!o) { console.error(`Sipariş bulunamadı: ${no} (son ${arr.length} sipariş tarandı)`); process.exit(1); }

const g = o.gclid, fbc = o.fbc;
console.log(`\n═══ ${o.orderNumber} ═══`);
console.log(`  Tarih        : ${o.createdAt}`);
console.log(`  Tutar        : ${o.total} TL`);
console.log(`  Ödeme durumu : ${o.paymentStatus} (${o.paymentMethod})`);
console.log(`  Sipariş durumu: ${o.status}`);
console.log(`  Pazarlama onayı: ${o.marketingConsent}`);
console.log(`\n─── ATIF (kaynak) ───`);
console.log(`  Google Ads gclid : ${g || "(YOK)"}`);
console.log(`  Meta fbc         : ${fbc || "(yok)"}`);
console.log();
if (g) {
  console.log("  ✅ SONUÇ: Bu sipariş GOOGLE ADS REKLAMINDAN geldi.");
  console.log("     gclid dolu = müşteri bir reklama tıklayarak siteye girmiş.");
} else if (fbc) {
  console.log("  ✅ SONUÇ: Bu sipariş META (Facebook/Instagram) reklamından geldi.");
} else {
  console.log("  ❌ SONUÇ: Reklam tıklaması kaydı YOK.");
  console.log("     Sipariş organik arama, doğrudan giriş, AI asistan veya");
  console.log("     telefon/WhatsApp gibi reklam dışı bir kanaldan gelmiş.");
}
process.exit(0);
