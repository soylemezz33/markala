#!/usr/bin/env node
/**
 * Son siparişleri KAYNAĞIYLA birlikte listeler — "reklamlar satış getiriyor mu?"
 * sorusunun GA4/Ads'ten bağımsız, kesin cevabı.
 *
 * Neden: GA4 ve Ads dönüşüm ölçümü çerez onayına bağlı. Onay vermeyen müşterinin
 * siparişi hiçbirinde görünmüyor. Sipariş kaydındaki gclid/fbc ise onaydan bağımsız
 * yakalanıyor (çerez yoksa URL'den) — tek güvenilir atıf kaynağı.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/siparis/son-siparisler.mjs [adet]
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const N = Number(process.argv[2] || 20);
let token = process.env.ADMIN_TOKEN;
if (!token) {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  const j = await r.json(); token = j.accessToken || j.access_token || j.token;
}
const res = await fetch(`${API}/api/orders?take=${Math.max(N, 50)}`, { headers: { authorization: `Bearer ${token}` } });
if (!res.ok) { console.error(`Liste alınamadı: ${res.status}`); process.exit(1); }
const raw = await res.json();
const arr = (Array.isArray(raw) ? raw : raw.data || raw.items || []).slice(0, N);

const kaynak = (o) => o.gclid ? "GOOGLE ADS" : o.fbc ? "META" : "reklam değil";
console.log(`\n${"TARİH".padEnd(17)} ${"SİPARİŞ NO".padEnd(20)} ${"TUTAR".padStart(9)}  ${"ÖDEME".padEnd(10)} ${"DURUM".padEnd(16)} ${"ONAY".padEnd(5)} KAYNAK`);
console.log("─".repeat(104));
let ciro = 0, reklamli = 0, iptal = 0;
for (const o of arr) {
  const t = Number(o.total) || 0;
  const iptalMi = String(o.status).includes("iptal");
  if (!iptalMi && o.paymentStatus === "basarili") ciro += t;
  if (iptalMi) iptal++;
  if (o.gclid || o.fbc) reklamli++;
  console.log(
    `${String(o.createdAt).slice(0,16).replace("T"," ").padEnd(17)} ${String(o.orderNumber).padEnd(20)} ${t.toFixed(0).padStart(7)} TL  ${String(o.paymentStatus).padEnd(10)} ${String(o.status).padEnd(16)} ${String(o.marketingConsent).padEnd(5)} ${kaynak(o)}`
  );
}
console.log("─".repeat(104));
console.log(`  ${arr.length} sipariş · iptal: ${iptal} · geçerli ciro: ${ciro.toFixed(0)} TL`);
console.log(`  REKLAMDAN gelen: ${reklamli} / ${arr.length}`);
const onaysiz = arr.filter(o => !o.marketingConsent).length;
console.log(`  Pazarlama onayı VERMEYEN: ${onaysiz} / ${arr.length}  → bu siparişler GA4 ve Ads'te GÖRÜNMEZ`);
process.exit(0);
