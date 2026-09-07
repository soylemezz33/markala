#!/usr/bin/env node
/**
 * Kategori görsellerini lider ürünün GÜNCEL ilk görseliyle eşitler (2026-09-07, Hasan: "anasayfa
 * kutularından açılan sayfalarda eski görseller"). Kategori görseli bir snapshot; ürün görseli
 * yenilenince kendiliğinden değişmez. Kural: kategori görseli, kategorideki AKTİF bir ürünün ilk
 * görseli değilse → lider ürünün (çok satan > slug eşleşen > yeni yüklenmiş görselli > ilk) ilk
 * görseli yazılır. İSG kategorileri (levha görselleri) atlanır. 7 Eyl: 16 kategori güncellendi.
 * Kullanım: node scripts/katalog/kategori-gorsel-esitle.mjs [--dry]   (kimlik: markala-google/.env ADMIN_*)
 */
import { readFileSync } from "node:fs";
const DRY = process.argv.includes("--dry");
const API = "https://api.markala.com.tr";
const env = {}; for (const l of readFileSync("C:/Users/Administrator/Projects/markala-google/.env", "utf8").split(String.fromCharCode(10))) { const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD)=(.*)$/.exec(l.replace(String.fromCharCode(13), "")); if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); }
const cats = await (await fetch(`${API}/api/categories`)).json();
const prodsRaw = await (await fetch(`${API}/api/products?list=true&take=2000`)).json();
const prods = (Array.isArray(prodsRaw) ? prodsRaw : (prodsRaw.data || [])).filter((p) => p.isActive !== false);
const abs = (u) => (u.startsWith("/") ? API + u : u);
const norm = (u) => abs(u || "").split("?")[0];
const plan = [];
for (const c of cats.filter((c) => c.isActive !== false)) {
  const ps = prods.filter((p) => (p.categorySlug || p.category?.slug) === c.slug && (p.images || []).length);
  if (!ps.length) { console.log(`- ${c.slug}: görselli ürün yok, dokunulmuyor`); continue; }
  const gecerli = ps.some((p) => norm(p.images[0]) === norm(c.imageUrl));
  const isg = c.slug.startsWith("is-guvenligi");
  if (gecerli) { console.log(`= ${c.slug.padEnd(30)} güncel (bir ürünün ilk görseli)`); continue; }
  if (isg) { console.log(`= ${c.slug.padEnd(30)} İSG, levha görseli (ürün görseli değil ama tabela) → dokunulmuyor`); continue; }
  // Lider ürün: çok satan > slug'ı kategoriyle aynı/başlayan > YENİ yüklenmiş görseli olan (/uploads/<uuid>) > ilk.
  const yeniMi = (p) => new RegExp("/uploads/[0-9a-f-]{36}[.]webp", "i").test(abs(p.images[0]));
  const puan = (p) => (p.bestseller ? 8 : 0) + (p.slug === c.slug ? 4 : p.slug.startsWith(c.slug) ? 2 : 0) + (yeniMi(p) ? 1 : 0);
  const lider = [...ps].sort((a, b) => puan(b) - puan(a))[0];
  const yeni = abs(lider.images[0]);
  plan.push({ id: c.id, slug: c.slug, eski: c.imageUrl, yeni, lider: lider.slug });
  console.log(`→ ${c.slug.padEnd(30)} ${String(c.imageUrl).replace(API, "").slice(0, 60)}  ⇒  ${lider.slug}: ${yeni.replace(API + "/uploads/", "")}`);
}
console.log(`\ndeğişecek: ${plan.length}`);
if (DRY) process.exit(0);
const lj = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) })).json();
const H = { "content-type": "application/json", authorization: `Bearer ${lj.accessToken || lj.access_token || lj.token}` };
for (const p of plan) { const r = await fetch(`${API}/api/categories/${p.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ imageUrl: p.yeni }) }); console.log(r.ok ? "✓" : "✗", p.slug, r.status); }
