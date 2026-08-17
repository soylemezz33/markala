#!/usr/bin/env node
/**
 * İSG ürün içeriklerini canlı API'ye uygular (specifications / features / useCases / faqs).
 *
 * Ürün içeriği veritabanında `content` JSON alanında tutulur ve PATCH /api/products/:id
 * admin yetkisi ister. Bu script admin token'ıyla çalışır — token'ı ASLA repoya yazma.
 *
 * Kullanım:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/isg-icerik/uygula.mjs --dry
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/isg-icerik/uygula.mjs
 *
 * veya elde hazır token varsa:
 *   ADMIN_TOKEN=eyJ... node scripts/isg-icerik/uygula.mjs
 *
 * --dry  : hiçbir şey yazmaz, ne değişeceğini gösterir (ÖNCE BUNU ÇALIŞTIR)
 * --only=<slug> : yalnız tek ürünü uygula
 *
 * Güvenlik: mevcut `content` alanı KORUNUR — yalnız bu dosyadaki anahtarlar eklenir/güncellenir
 * (seo, sku, brand gibi mevcut alanlar silinmez).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.API_URL || "https://api.markala.com.tr";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];

const BULK = process.argv.includes("--toplu");

/**
 * İki kaynak var:
 *   icerik.json        — 10 öncelikli ürün için ELLE yazılmış içerik (daha nitelikli)
 *   icerik-toplu.json  — 827 ürün için uret.mjs ile üretilmiş içerik
 * --toplu modunda elle yazılanlar HARİÇ tutulur; onların üzerine yazılmaz.
 */
const elle = JSON.parse(fs.readFileSync(path.join(DIR, "icerik.json"), "utf8"));
const ORTAK_SPECS = elle._ortakSpecs;
let urunler;

if (BULK) {
  const toplu = JSON.parse(fs.readFileSync(path.join(DIR, "icerik-toplu.json"), "utf8"));
  const elleSluglar = new Set(elle.urunler.map((u) => u.slug));
  urunler = toplu
    .filter((u) => !elleSluglar.has(u.slug))
    .map((u) => ({
      slug: u.slug,
      sinif: u.cat.replace("is-guvenligi-", ""),
      specifications: u.specifications,
      features: u.features,
      useCases: u.useCases,
      faqs: u.faqs,
    }));
  console.log(
    `Toplu mod: ${toplu.length} üretilmiş ürün, ${elleSluglar.size} elle yazılmış hariç → ${urunler.length} uygulanacak\n`,
  );
} else {
  urunler = elle.urunler;
}

if (ONLY) urunler = urunler.filter((u) => u.slug === ONLY);
if (urunler.length === 0) {
  console.error(ONLY ? `Ürün bulunamadı: ${ONLY}` : "icerik.json boş.");
  process.exit(1);
}

async function girisYap() {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("ADMIN_EMAIL + ADMIN_PASSWORD (veya ADMIN_TOKEN) gerekli.");
    process.exit(1);
  }
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error(`Giriş başarısız: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const j = await res.json();
  const token = j.accessToken || j.access_token || j.token;
  if (!token) {
    console.error("Yanıtta token bulunamadı:", Object.keys(j));
    process.exit(1);
  }
  return token;
}

async function urunGetir(slug) {
  const res = await fetch(`${API}/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`${slug}: ürün alınamadı (${res.status})`);
  return res.json();
}

async function main() {
  const token = DRY ? null : await girisYap();
  let ok = 0;
  let atlandi = 0;
  let hata = 0;

  for (const u of urunler) {
    let p;
    try {
      p = await urunGetir(u.slug);
    } catch (e) {
      console.error(`✗ ${u.slug}: ${e.message}`);
      hata++;
      continue;
    }

    const mevcut = p.content && typeof p.content === "object" ? p.content : {};
    // Mevcut içerik KORUNUR; yalnız eksik/yeni alanlar yazılır.
    const yeniContent = {
      ...mevcut,
      // Toplu modda specs ürünün kendi kaydından gelir; elle modda ortak sabit kullanılır.
      specifications: u.specifications ?? ORTAK_SPECS,
      features: u.features,
      useCases: u.useCases,
      faqs: u.faqs,
    };

    const doluydu = Boolean(mevcut.specifications);
    if (doluydu) {
      console.log(`- ${u.slug}: specifications ZATEN VAR → üzerine yazılıyor (${u.sinif})`);
    }

    if (DRY) {
      console.log(
        `[DRY] ${u.slug} (${u.sinif}) → spec:${ORTAK_SPECS.length} feat:${u.features.length} kullanım:${u.useCases.length} sss:${u.faqs.length}`,
      );
      atlandi++;
      continue;
    }

    const res = await fetch(`${API}/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: yeniContent }),
    });
    if (!res.ok) {
      console.error(`✗ ${u.slug}: PATCH ${res.status} ${await res.text()}`);
      hata++;
      continue;
    }

    // YAZMA DOĞRULAMASI — kritik: API'nin ValidationPipe'ı whitelist:true ile çalışıyor.
    // `content` alanı UpdateProductDto'ya eklenmeden ÖNCEKİ sürüm çalışıyorsa PATCH 200
    // döner ama gönderdiğimiz content SESSİZCE atılır. Geri okuyup gerçekten yazıldığını
    // doğrulamazsak "✓ güncellendi" yazıp hiçbir şey yapmamış oluruz.
    const kontrol = await urunGetir(u.slug).catch(() => null);
    const yazildi = Boolean(
      kontrol && kontrol.content && typeof kontrol.content === "object" && kontrol.content.specifications,
    );
    if (!yazildi) {
      console.error(
        `✗ ${u.slug}: PATCH 200 döndü ama içerik YAZILMADI.\n` +
          `   Sebep: canlı API'de 'content' alanı henüz desteklenmiyor olabilir.\n` +
          `   Ürün content API desteği bu commit'le geldi — deploy uygulanmadıysa eski sürüm çalışıyordur.\n` +
          `   Çözüm: deploy'un gerçekten uygulandığını doğrula (konteyner yeniden başlamalı), sonra tekrar dene.`,
      );
      hata++;
      continue;
    }
    console.log(`✓ ${u.slug} güncellendi ve doğrulandı`);
    ok++;
  }

  console.log(
    `\nÖzet — güncellenen: ${ok} · dry-run: ${atlandi} · hata: ${hata} · toplam: ${urunler.length}`,
  );
  if (!DRY && ok > 0) {
    console.log(
      "Not: storefront ISR 300sn. Anında görmek için admin panelden ilgili ürünü kaydet ya da /api/revalidate tetikle.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
