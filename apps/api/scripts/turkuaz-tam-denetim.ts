/**
 * TAM DENETİM (17 Eyl, Hasan: "tek tek tüm ürünlerin kontrolü... hata var mı raporla").
 *
 * Sunucudaki TedarikciUrun hash'lerinden (kod:stok:liste) her ürünün BEKLENEN fiyat
 * matrisini bağımsız yeniden hesaplar ve CANLI API'deki satırlarla kuruş kuruş karşılaştırır.
 * Ek olarak SEO alanlarını (title/desc/faqs/features) ürün başına doğrular. YAZMAZ.
 *
 * Kullanım: pnpm tsx scripts/turkuaz-tam-denetim.ts <canli-hashler.txt>
 */
import { readFileSync } from "node:fs";
import { baskiUcreti } from "../src/integrations/turkuaz/turkuaz-baski-tarifesi";

const API = "https://api.markala.com.tr";
const hashDosya = process.argv[2]!;

interface Sku { kod: string; stok: number; liste: number }
const kayitlar = readFileSync(hashDosya, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.includes("|") || l.includes("v2:"))
  .map((l) => {
    const [kodgrup, productId, ...rest] = l.split("|").join("|").split("|");
    // satır: kodgrup|productId|v2:H:KOD:STOK:FIYAT|KOD:STOK:FIYAT|...
    const parcalar = l.split("|");
    const hashParcalar = [parcalar[2].replace(/^v2:[HD]:/, ""), ...parcalar.slice(3)];
    const skular: Sku[] = hashParcalar.map((p) => {
      const [kod, stok, liste] = p.split(":");
      return { kod, stok: Number(stok), liste: Number(liste) };
    });
    return { kodgrup: parcalar[0], productId: parcalar[1], skular };
  });

const y2 = (n: number) => Math.round(n * 100) / 100;

async function main() {
  // slug haritası
  const listRes = await fetch(`${API}/api/products?list=true&take=3000`);
  const tumListe = (await listRes.json()) as Array<{ id: string; slug: string }>;
  const slugById = new Map(tumListe.map((p) => [p.id, p.slug]));

  const hatalar: string[] = [];
  const uyarilar: string[] = [];
  const marjlar: number[] = [];
  let ok = 0, incelenen = 0, satirToplam = 0;
  let stokYetersiz = 0, seoEksik = 0, dupTitle = 0;
  const titleSet = new Map<string, string>();

  for (const kay of kayitlar) {
    const slug = slugById.get(kay.productId);
    if (!slug) {
      hatalar.push(`${kay.kodgrup}: productId listede yok (silinmiş ürün?)`);
      continue;
    }
    const res = await fetch(`${API}/api/products/${slug}`);
    if (!res.ok) {
      hatalar.push(`${kay.kodgrup} ${slug}: detay ${res.status}`);
      continue;
    }
    const p = (await res.json()) as {
      name: string; isActive?: boolean; basePrice: string | number;
      category?: { slug: string };
      options: Array<{ groupKey: string; optionKey: string }>;
      prices: Array<{ optionKey: string | null; dimKey: string | null; price: string | number; cost?: string | number | null }>;
      description?: string;
      content?: { seo?: { title?: string; description?: string }; faqs?: unknown[]; features?: unknown[]; specifications?: Array<{ label: string; value: string }> };
    };
    incelenen++;

    const kat = p.category?.slug ?? "";
    const teknik = p.content?.specifications?.find((s) => s.label === "Baskı tekniği")?.value;
    const isim = p.name.replace(/\s+\S+$/, ""); // sondaki kodgrup'u at
    const baskiDahil = /bask[ıi]\s+dahil|dahil.{0,20}bask[ıi]|bask[ıi]l[ıi] fiyat/i.test(p.description ?? "");
    const skuByKod = new Map(kay.skular.map((s) => [s.kod, s]));

    const renkler = p.options.filter((o) => o.groupKey === "renk").map((o) => o.optionKey);
    const adetler = p.options.filter((o) => o.groupKey === "adet").map((o) => Number(o.optionKey));

    // KDV çarpanını ilk satırdan çıkar (1.2 mi 1.1 mi)
    let kdvC = 1.2;
    {
      const r0 = p.prices[0];
      const sku0 = skuByKod.get(String(r0?.optionKey));
      if (r0 && sku0) {
        const adet0 = Number(r0.dimKey);
        const pay0 = baskiDahil ? 0 : baskiUcreti(kat, teknik, isim, adet0)?.toplam ?? 0;
        const taban = sku0.liste * adet0 + pay0;
        const oran = Number(r0.price) / taban;
        kdvC = Math.abs(oran - 1.1) < Math.abs(oran - 1.2) ? 1.1 : 1.2;
      }
    }

    let urunHata = 0;
    for (const renk of renkler) {
      const sku = skuByKod.get(renk);
      if (!sku) {
        hatalar.push(`${slug}: seçenek ${renk} hash'te yok (stok düşmüş olabilir)`);
        urunHata++;
        continue;
      }
      for (const adet of adetler) {
        satirToplam++;
        const satir = p.prices.find((r) => r.optionKey === renk && Number(r.dimKey) === adet);
        if (!satir) {
          hatalar.push(`${slug}: EKSİK SATIR ${renk}×${adet} (motor 0 üretir!)`);
          urunHata++;
          continue;
        }
        const pay = baskiDahil ? 0 : baskiUcreti(kat, teknik, isim, adet)?.toplam ?? 0;
        const beklenenFiyat = y2((sku.liste * adet + pay) * kdvC);
        const beklenenMaliyet = y2(sku.liste * 0.6 * adet + pay);
        const f = Number(satir.price);
        const c = satir.cost == null ? null : Number(satir.cost);
        if (Math.abs(f - beklenenFiyat) > 0.011) {
          hatalar.push(`${slug} ${renk}×${adet}: fiyat ${f} ≠ beklenen ${beklenenFiyat} (liste ${sku.liste}, pay ${pay}, kdv ${kdvC})`);
          urunHata++;
        }
        if (c == null || Math.abs(c - beklenenMaliyet) > 0.011) {
          hatalar.push(`${slug} ${renk}×${adet}: maliyet ${c} ≠ beklenen ${beklenenMaliyet}`);
          urunHata++;
        } else {
          const net = f / kdvC;
          if (net - c < -0.01) hatalar.push(`${slug} ${renk}×${adet}: ZARAR satırı (net ${y2(net)} < maliyet ${c})`);
          else marjlar.push((net - c) / net);
        }
      }
    }

    // stok yeterliliği: toplam stok ilk kademenin altındaysa müşteri minimumu bile alamayabilir
    const toplamStok = kay.skular.reduce((a, s) => a + s.stok, 0);
    if (p.isActive !== false && adetler.length && toplamStok < adetler[0]) {
      stokYetersiz++;
      if (stokYetersiz <= 8) uyarilar.push(`stok<min: ${slug} (stok ${toplamStok} < ilk kademe ${adetler[0]})`);
    }

    // SEO alanları
    const seo = p.content?.seo;
    if (!seo?.title || !seo?.description || (p.content?.faqs?.length ?? 0) < 3 || (p.content?.features?.length ?? 0) < 1) {
      seoEksik++;
      if (seoEksik <= 8) uyarilar.push(`seo eksik: ${slug} (title:${!!seo?.title} desc:${!!seo?.description} faq:${p.content?.faqs?.length ?? 0} feat:${p.content?.features?.length ?? 0})`);
    }
    if (seo?.title) {
      const onceki = titleSet.get(seo.title);
      if (onceki) { dupTitle++; if (dupTitle <= 5) uyarilar.push(`çift title: "${seo.title}" → ${onceki} & ${slug}`); }
      else titleSet.set(seo.title, slug);
    }

    if (urunHata === 0) ok++;
  }

  marjlar.sort((a, b) => a - b);
  const pct = (q: number) => (marjlar[Math.floor(marjlar.length * q)] * 100).toFixed(1);
  console.log(`\n=== FİYAT DENETİMİ ===`);
  console.log(`incelenen ürün: ${incelenen}/${kayitlar.length} | satır: ${satirToplam} | hatasız ürün: ${ok}`);
  console.log(`HATA sayısı: ${hatalar.length}`);
  hatalar.slice(0, 25).forEach((h) => console.log("  ✗", h));
  console.log(`\nNet kâr marjı dağılımı (satır bazında): min %${pct(0)} | %10 %${pct(0.1)} | medyan %${pct(0.5)} | max %${(marjlar[marjlar.length - 1] * 100).toFixed(1)}`);
  console.log(`\n=== UYARILAR ===`);
  console.log(`aktif ama stok<ilk kademe: ${stokYetersiz} ürün | SEO alanı eksik: ${seoEksik} | çift SEO title: ${dupTitle}`);
  uyarilar.forEach((u) => console.log("  ⚠", u));
}
main();
