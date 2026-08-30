#!/usr/bin/env node
/**
 * VİNİL BRANDA MALZEME BÖLME (2026-08-31) — Hasan talebi.
 *
 * Mevcut durum: tek "Vinil Branda Afiş" ürününde 12 malzeme seçeneği var. Kullanıcı önce
 * 12 seçenek arasından malzeme ailesini bulmak zorunda; menüde de tek satır görünüyor.
 *
 * Hedef: malzeme AİLESİ başına ayrı ürün. Kullanıcı "Çin Vinil Branda"ya girince yalnız
 * gramaj (280/440) ve baskı tipi (solvent/UV) seçer — kalabalık yok. Her aile kendi URL'i
 * ve kendi içeriğiyle aramada da ayrı ayrı çıkabilir.
 *
 * FİYAT MEKANİZMASI (doğrulandı): fiyat = cost(dolar) × kur(49) × marj(1,2) × KDV(1,2) = cost × 70,56.
 * Global ayarlar (/api/settings/pricing) tüm ürünlere uygulanır → cost değerleri BİREBİR
 * kopyalanınca fiyatlar da birebir aynı çıkar. Hesaplama/yuvarlama YAPILMAZ.
 *
 * Kaynak ürün DEĞİŞTİRİLMEZ — varyantlar doğrulandıktan sonra ayrı adımda karar verilir.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/branda-bol.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const KAYNAK = "vinil-branda-440gr";

/**
 * Aile tanımları. `malzemeler`: kaynak optionKey → yeni ürün içindeki sade etiket
 * (ürün adı zaten aileyi söylüyor, etiketten tekrar atılır).
 */
const AILELER = [
  {
    slug: "cin-vinil-branda",
    name: "Çin Vinil Branda",
    malzemeler: { "cin-280gr": "280 gr · Solvent Baskı", "cin-440gr": "440 gr · Solvent Baskı" },
    shortDescription: "Ekonomik Çin menşeli vinil branda — 280 ve 440 gr seçenekleriyle m² fiyatlı.",
    description:
      "Çin menşeli vinil branda, kısa ve orta vadeli kampanyalar için en ekonomik çözümdür. 280 gr ince ve hafif dokusuyla iç mekân ile korunaklı dış mekân kullanımına, 440 gr ise daha tok yapısıyla cephe afişi ve pankartlara uygundur. Fiyat metrekare üzerinden hesaplanır; ölçünüzü girdiğinizde KDV dahil tutarı anında görürsünüz.",
    seo: {
      title: "Çin Vinil Branda — 280 gr ve 440 gr Ekonomik Branda Baskı",
      description:
        "Ekonomik Çin vinil branda baskı: 280 gr ve 440 gr solvent seçenekleri, m² fiyatlandırma, kuşgözü ve kolon dikiş opsiyonları. KDV dahil anlık fiyat.",
    },
    faqs: [
      { q: "Çin branda ile Avrupa branda arasındaki fark nedir?", a: "Fark hammadde kalitesi ve UV dayanımındadır. Çin branda ekonomiktir ve kısa-orta vadeli kullanımda beklentiyi karşılar. Avrupa branda daha yüksek UV direnci ve renk kalıcılığı sunar; uzun süre güneş altında kalacak işlerde tercih edilir." },
      { q: "280 gr mı 440 gr mı seçmeliyim?", a: "280 gr iç mekân, kısa süreli kampanya ve korunaklı alanlar için yeterlidir. Dışarıda asılı kalacak, rüzgâr görecek işlerde 440 gr'ın tok dokusu daha güvenlidir; kuşgözü noktalarında yırtılmaya karşı daha dayanıklıdır." },
      { q: "Fiyat nasıl hesaplanıyor?", a: "Metrekare üzerinden: en (cm) × boy (cm) ÷ 10.000 = m². Seçtiğiniz malzemenin m² fiyatı bu alanla çarpılır. 1 m²'nin altındaki işlerde minimum 1 m² uygulanır. Kolon dikiş gibi ek işlemler brandanın çevre uzunluğuna göre ayrıca eklenir." },
      { q: "Kuşgözü ve kolon dikiş dahil mi?", a: "Ek işlem seçeneğinden belirlersiniz. 'Dikiş + kopça' kenar katlama ve kuşgözü takılmasını, 'kolon + dikiş' ise direk geçecek tünel açılmasını kapsar. 'Germe' seçeneği ücretsizdir; hiçbiri istenmiyorsa 'yok' seçilir." },
    ],
  },
  {
    slug: "avrupa-vinil-branda",
    name: "Avrupa Vinil Branda",
    malzemeler: {
      "avrupa-440gr-solvent": "440 gr · Solvent Baskı",
      "avrupa-440gr-uv": "440 gr · UV Baskı",
      "avrupa-510gr": "510 gr Kalın · Solvent Baskı",
      "avrupa-510gr-uv": "510 gr Kalın · UV Baskı",
    },
    shortDescription: "Avrupa menşeli yüksek dayanımlı branda — 440/510 gr, solvent veya UV baskı.",
    description:
      "Avrupa menşeli vinil branda, yüksek UV direnci ve renk kalıcılığıyla uzun ömürlü dış mekân uygulamalarının standardıdır. 440 gr standart cephe işleri için, 510 gr ise rüzgâr yükü yüksek ve uzun süre asılı kalacak uygulamalar içindir. UV baskı seçeneği renk canlılığını ve çizilme direncini artırır. Fiyat metrekare üzerinden hesaplanır.",
    seo: {
      title: "Avrupa Vinil Branda — 440 gr ve 510 gr, Solvent veya UV Baskı",
      description:
        "Avrupa menşeli vinil branda baskı: yüksek UV dayanımı, 440/510 gr gramaj ve solvent/UV baskı seçenekleri. m² fiyatlandırma, KDV dahil anlık hesap.",
    },
    faqs: [
      { q: "Avrupa branda neden daha pahalı?", a: "Avrupa menşeli brandalarda hammadde kalitesi, UV katkı oranı ve kaplama kalınlığı daha yüksektir. Bu, güneş altında renk solmasını geciktirir ve brandanın kırılganlaşmadan daha uzun süre dayanmasını sağlar. Uzun süre asılı kalacak işlerde toplam maliyeti düşürür." },
      { q: "Solvent ile UV baskı arasındaki fark nedir?", a: "Solvent baskıda mürekkep malzemeye nüfuz ederek kurur; ekonomik ve dış mekâna dayanıklıdır. UV baskıda mürekkep ultraviyole ışıkla anında kurutulur; renkler daha canlı, yüzey çizilmeye daha dirençli olur ve koku bırakmaz. Uzun ömür ve yüksek görsel kalite gereken işlerde UV tercih edilir." },
      { q: "440 gr mı 510 gr mı?", a: "440 gr standart dış mekân işlerinin çoğu için yeterlidir. 510 gr belirgin şekilde daha kalın ve toktur; sürekli rüzgâr alan cepheler, büyük ebatlı gergi uygulamaları ve yıllara yayılan kullanımlarda tercih edilir." },
      { q: "Ne kadar dayanır?", a: "Ömür; gramaj, baskı tekniği ve maruz kalınan koşullara göre değişir. UV baskılı yüksek gramaj kombinasyonu en uzun ömrü verir. Sürekli rüzgâr alan noktalarda kuşgözü aralığını sıklaştırmak ve gerginliği doğru ayarlamak ömrü belirgin şekilde uzatır." },
    ],
  },
  {
    slug: "blockout-arkasi-siyah-branda",
    name: "Arkası Siyah (Blockout) Branda",
    malzemeler: { "arkasi-siyah": "Solvent Baskı", "arkasi-siyah-uv": "UV Baskı" },
    shortDescription: "Işık ve görüntü geçirmeyen blockout branda — çift yüz baskı ve gölge sızmasını önler.",
    description:
      "Arkası siyah (blockout) branda, ortasındaki siyah katman sayesinde ışığı ve arkadaki görüntüyü geçirmez. İki yüzü farklı görselle basılacak işlerde arka yüzün öne sızmasını engeller; arkasında ışık kaynağı bulunan uygulamalarda gölge ve leke oluşumunu önler. Solvent ve UV baskı seçenekleriyle m² fiyatlı olarak üretilir.",
    seo: {
      title: "Arkası Siyah (Blockout) Branda — Işık Geçirmez Çift Yön Baskı",
      description:
        "Blockout branda baskı: siyah ara katman sayesinde ışık ve görüntü geçirmez, çift yüz baskıya uygundur. Solvent ve UV seçenekleri, m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Blockout branda ne demek?", a: "Blockout, brandanın iki kumaş katmanı arasına siyah bir katman yerleştirilmesiyle üretilen yapıdır. Bu katman ışığı tamamen keser; arkadan gelen ışık ön yüzdeki görseli soldurmaz, arka yüzdeki baskı ön yüzden görünmez." },
      { q: "Ne zaman blockout kullanmalıyım?", a: "Üç durumda: iki yüzü farklı görselle basılacak asma pankartlarda, arkasında pencere veya ışık kaynağı olan cephe uygulamalarında ve arka planın (duvar rengi, eski afiş) görselin içinden hayal meyal görünmesini istemediğiniz işlerde." },
      { q: "Normal brandadan farkı fiyata nasıl yansır?", a: "Blockout üç katmanlı yapısı nedeniyle standart brandadan daha ağır ve maliyetlidir. Buna karşılık ışık sızması ve çift yüz sorununu tek malzemeyle çözdüğü için, aksi hâlde iki ayrı branda gerektiren işlerde toplam maliyeti düşürür." },
    ],
  },
  {
    slug: "isikli-backlit-branda",
    name: "Işıklı (Backlit) Branda",
    malzemeler: { "isikli-avrupa": "Solvent Baskı", "isikli-avrupa-uv": "UV Baskı" },
    shortDescription: "Arkadan aydınlatmalı ışıklı pano ve kutu harf sistemleri için backlit branda.",
    description:
      "Işıklı (backlit) branda, arkadan aydınlatmalı sistemler için üretilir. Işığı homojen biçimde geçirerek görselin gece de net ve lekesiz görünmesini sağlar; normal branda arkadan aydınlatıldığında lekeli ve sönük görünür. Işıklı tabela kutuları, totem panolar ve fuar ışık kutularının standart malzemesidir.",
    seo: {
      title: "Işıklı (Backlit) Branda — Arkadan Aydınlatmalı Pano Baskısı",
      description:
        "Backlit ışıklı branda baskı: arkadan aydınlatmalı tabela kutusu ve totem panolar için homojen ışık geçirgenliği. Solvent/UV seçenekleri, m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Işıklı branda ile normal branda farkı nedir?", a: "Işıklı branda ışığı kontrollü ve homojen geçirecek şekilde üretilir; arkadan aydınlatıldığında renkler canlı ve eşit dağılımlı görünür. Normal branda ışığı geçirmediği veya düzensiz geçirdiği için ışık kutusunda lekeli, sönük bir görüntü verir." },
      { q: "Hangi sistemlerde kullanılır?", a: "Işıklı tabela kutuları, cephe totemleri, fuar ve mağaza içi ışıklı panolar, menü kutuları ve havalimanı/AVM tipi aydınlatmalı reklam üniteleri. LED veya floresan aydınlatmalı tüm kutu sistemleriyle uyumludur." },
      { q: "Gündüz nasıl görünür?", a: "Işık kapalıyken de normal bir branda gibi görünür; baskı gündüz de okunur. Işıklı brandanın avantajı, aydınlatma açıldığında görselin sönükleşmeden parlamasıdır — yani hem gece hem gündüz kullanılabilir." },
    ],
  },
  {
    slug: "reflektif-vinil-branda",
    name: "Reflektif Vinil Branda",
    malzemeler: { "reflektif-vinil": "Solvent Baskı", "reflektif-vinil-uv": "UV Baskı" },
    shortDescription: "Işığı geri yansıtan reflektif vinil — gece görünürlüğü gereken uyarı ve yönlendirmeler.",
    description:
      "Reflektif vinil, üzerine düşen ışığı kaynağına geri yansıtacak şekilde üretilmiş özel malzemedir. Karanlıkta far ışığıyla parlayarak uzaktan okunur; bu yüzden yol kenarı yönlendirmelerinde, şantiye uyarı panolarında ve araç üzeri uygulamalarda güvenlik amacıyla kullanılır. Solvent ve UV baskı seçenekleriyle m² fiyatlı üretilir.",
    seo: {
      title: "Reflektif Vinil Branda — Işığı Yansıtan Gece Görünürlüklü Baskı",
      description:
        "Reflektif vinil baskı: far ışığını geri yansıtarak gece görünürlük sağlar. Yol, şantiye ve araç uygulamaları için solvent/UV seçenekleri, KDV dahil m² fiyat.",
    },
    faqs: [
      { q: "Reflektif malzeme nasıl çalışır?", a: "Yüzeyindeki mikroskobik cam kürecikler veya prizmatik yapı, üzerine düşen ışığı geldiği yöne geri yansıtır. Bu sayede araç farının ışığı sürücünün gözüne geri döner ve yüzey karanlıkta parlıyormuş gibi okunur." },
      { q: "Nerelerde kullanılır?", a: "Yol kenarı ve otopark yönlendirmeleri, şantiye ve saha uyarı panoları, acil çıkış ve tehlike işaretleri, araç üzeri güvenlik şeritleri ve gece görünürlüğü kritik olan tüm bilgilendirme uygulamaları." },
      { q: "Gündüz de okunur mu?", a: "Evet. Reflektif yüzey gündüz normal bir baskı gibi görünür; asıl farkını karanlıkta ışık aldığında gösterir. Yani tek malzeme hem gündüz hem gece işlevini yerine getirir." },
    ],
  },
];

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  const j = await r.json();
  return j.accessToken || j.access_token || j.token;
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

const kaynak = await fetch(`${API}/api/products/${KAYNAK}`).then((r) => r.json());
if (!kaynak?.id) { console.error("Kaynak ürün okunamadı."); process.exit(1); }
const kOpts = kaynak.options ?? [];
const kPrices = kaynak.prices ?? [];
const ekIslemOpts = kOpts.filter((o) => o.groupKey === "ekislem");
const ekIslemPrices = kPrices.filter((p) => p.groupKey === "ekislem");

// Global fiyat çarpanı — yalnız ÖNİZLEME için (gerçek hesap sunucuda yapılır)
const ayar = await fetch(`${API}/api/settings/pricing`).then((r) => r.json()).catch(() => ({ kur: 49, marj: 1.2, kdv: 0.2 }));
const CARPAN = Number(ayar.kur) * Number(ayar.marj) * (1 + Number(ayar.kdv));
console.log(`Kaynak: ${kaynak.name} · ${kOpts.length} seçenek · çarpan ${CARPAN.toFixed(2)} (kur ${ayar.kur} × marj ${ayar.marj} × KDV)\n`);

let ok = 0, hata = 0;
for (const aile of AILELER) {
  const anahtarlar = Object.keys(aile.malzemeler);
  const malOpts = kOpts.filter((o) => anahtarlar.includes(o.optionKey));
  if (malOpts.length !== anahtarlar.length) {
    console.error(`✗ ${aile.slug}: beklenen ${anahtarlar.length} malzeme, bulunan ${malOpts.length} — DURDURULDU`); hata++; continue;
  }
  // Seçenekler: malzeme (sade etiketle) + ek işlem (aynen). rules KORUNUR (perM2/maxM2 vs).
  const options = [
    ...malOpts.map((o, i) => ({
      groupKey: o.groupKey, groupLabel: "Malzeme / Baskı", groupRole: o.groupRole, groupSort: 0,
      optionKey: o.optionKey, optionLabel: aile.malzemeler[o.optionKey], optionSort: i,
      ...(o.rules ? { rules: o.rules } : {}),
    })),
    ...ekIslemOpts.map((o) => ({
      groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole, groupSort: 1,
      optionKey: o.optionKey, optionLabel: o.optionLabel,
      ...(o.optionSublabel ? { optionSublabel: o.optionSublabel } : {}),
      optionSort: o.optionSort ?? 0, ...(o.rules ? { rules: o.rules } : {}),
    })),
  ];
  // Fiyatlar: cost BİREBİR kopya
  const prices = [
    ...kPrices.filter((p) => anahtarlar.includes(String(p.optionKey))),
    ...ekIslemPrices,
  ].map((p) => ({
    ...(p.groupKey ? { groupKey: p.groupKey } : {}),
    ...(p.optionKey ? { optionKey: p.optionKey } : {}),
    ...(p.dimKey ? { dimKey: p.dimKey } : {}),
    ...(p.cost != null ? { cost: Number(p.cost) } : {}),
    price: Number(p.price ?? 0),
  }));

  console.log(`■ ${aile.name}  (/urun/${aile.slug})`);
  for (const o of malOpts) {
    const pr = kPrices.find((p) => String(p.optionKey) === o.optionKey);
    const m2 = pr?.cost != null ? (Number(pr.cost) * CARPAN).toFixed(2) : "?";
    console.log(`    ${aile.malzemeler[o.optionKey].padEnd(30)} cost $${String(pr?.cost).padEnd(5)} → ${m2} ₺/m²`);
  }
  if (DRY) { console.log(`    [DRY] ${options.length} seçenek · ${prices.length} fiyat satırı hazır\n`); continue; }

  const createRes = await fetch(`${API}/api/products`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      name: aile.name, slug: aile.slug, categoryId: kaynak.categoryId,
      shortDescription: aile.shortDescription, description: aile.description,
      basePrice: 0, productionTime: kaynak.productionTime, sizeLabel: kaynak.sizeLabel,
      images: kaynak.images ?? [], pricingMode: "area", isActive: true,
    }),
  });
  if (!createRes.ok) { console.error(`  ✗ ürün oluşturulamadı: ${createRes.status} ${(await createRes.text()).slice(0, 200)}`); hata++; continue; }
  const yeni = await createRes.json();
  const oRes = await fetch(`${API}/api/products/${yeni.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
  if (!oRes.ok) { console.error(`  ✗ seçenek yazılamadı: ${oRes.status} ${(await oRes.text()).slice(0, 200)}`); hata++; continue; }
  const pRes = await fetch(`${API}/api/products/${yeni.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices }) });
  if (!pRes.ok) { console.error(`  ✗ fiyat yazılamadı: ${pRes.status} ${(await pRes.text()).slice(0, 200)}`); hata++; continue; }
  const kardesler = AILELER.filter((a) => a.slug !== aile.slug).map((a) => a.slug).concat(KAYNAK, "mesh-branda");
  // pricingMode OLUŞTURMA DTO'sunda YOK (yalnız güncellemede var) — POST'ta gönderilse bile
  // sessizce "additive" kalır ve m² fiyatı hesaplanmaz (displayPrice null → kartta "Teklif Al").
  // 2026-08-31'de bu tuzağa düşüldü; PATCH ile birlikte gönderiliyor.
  await fetch(`${API}/api/products/${yeni.id}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ pricingMode: "area", content: { seo: aile.seo, faqs: aile.faqs, relatedSlugs: kardesler, brand: "Markala" } }),
  });
  // DOĞRULAMA: cost değerleri birebir mi?
  const kontrol = await fetch(`${API}/api/products/${aile.slug}`).then((r) => (r.ok ? r.json() : null));
  const yazili = kontrol?.prices ?? [];
  const uyusmaz = prices.filter((p) => {
    const e = yazili.find((x) => String(x.optionKey) === p.optionKey);
    return !e || Number(e.cost ?? 0) !== Number(p.cost ?? 0);
  });
  if (uyusmaz.length || yazili.length !== prices.length) {
    console.error(`  ✗ FİYAT DOĞRULAMASI BAŞARISIZ — beklenen ${prices.length}, yazılan ${yazili.length}, uyuşmayan ${uyusmaz.length}`); hata++; continue;
  }
  console.log(`  ✓ oluşturuldu · ${yazili.length} fiyat satırı DOĞRULANDI · başlangıç ${kontrol.displayPrice} ₺/m²\n`);
  ok++;
}
console.log(`Özet — açılan: ${ok} · hata: ${hata}`);
if (!DRY && ok) console.log("Kaynak ürün (vinil-branda-440gr) DEĞİŞTİRİLMEDİ.");
