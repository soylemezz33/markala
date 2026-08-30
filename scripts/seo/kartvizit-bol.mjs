#!/usr/bin/env node
/**
 * KARTVİZİT VARYANT BÖLME (2026-08-31) — ticari SEO derinliği.
 *
 * Sorun: kartvizit kategorisinde TEK ürün var ve içinde 20 paket gizli. Arama verisi
 * (Google Ads Keyword Planner) bu paketlerin ailelerinin ayrı ayrı arandığını gösteriyor:
 * kabartma kartvizit 320/ay · sıvama 260 · yaldızlı 110+110 · selefon 50. Tek URL bu
 * niyetlerin hiçbirini karşılamıyor (GSC: kartvizit ailesinde ~3 gösterim).
 *
 * Çözüm: paket ailelerini AYRI ÜRÜNE çıkar. Her ürün kendi URL'i, kendi Product şeması,
 * kendi içeriğiyle sıralanır. Ebat/adet ekseni AYRILMAZ (ayrı arama niyeti değil).
 *
 * GÜVENLİK KURALLARI (para riski):
 *  1. Fiyatlar kaynak üründen BİREBİR kopyalanır — hesaplama/yuvarlama YAPILMAZ.
 *  2. Yazma sonrası her ürünün fiyat satırları kaynakla KARŞILAŞTIRILIR; tutmazsa hata verir.
 *  3. Kaynak ürün (klasik-kartvizit) bu adımda DEĞİŞTİRİLMEZ — varyantlar indekslenip
 *     doğrulandıktan sonra ayrı bir adımda sadeleştirilir (geri dönüşü olan sıra).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kartvizit-bol.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const KAYNAK = "klasik-kartvizit";

/** Paket ailesi → yeni ürün tanımı. optionKey'ler kaynak üründeki gerçek anahtarlar. */
const AILELER = [
  {
    slug: "kabartmali-kartvizit",
    name: "Kabartmalı Kartvizit",
    paketler: ["kl", "o-cok", "s-cok", "cyml4"],
    shortDescription: "Kabartma (rölyef) baskılı kartvizit — dokunsal yüzey, oval köşe ve özel kesim seçenekleriyle.",
    description:
      "Kabartmalı kartvizit, yazı ve logoların kâğıt yüzeyinden hafifçe yükseltilmesiyle üretilir. Elle tutulduğunda hissedilen bu doku, kartvizite standart baskıda elde edilemeyen bir kalite algısı katar. Tek yüz kabartma, oval köşe kesim, özel kesim ve 400 gr kalın kâğıt seçenekleriyle üretilir; tüm fiyatlar KDV dahildir.",
    seo: {
      title: "Kabartmalı Kartvizit — Rölyef Baskı, Oval Köşe ve Özel Kesim",
      description:
        "Kabartma baskılı kartvizit: dokunsal rölyef yüzey, oval köşe, özel kesim ve 400 gr kalın seçenekleri. 1.000 adetten üretim, KDV dahil anlık fiyat.",
    },
    features: [
      "Yazı ve logolar kâğıt yüzeyinden yükselir — dokunulduğunda hissedilir",
      "Oval köşe ve özel kesim seçenekleri",
      "400 gr kalın kâğıt alternatifi",
      "1.000 adetten 10.000 adede kademeli fiyatlandırma",
    ],
    faqs: [
      { q: "Kabartmalı kartvizit nasıl üretilir?", a: "Baskı tamamlandıktan sonra kabartma yapılacak alan özel bir kalıpla preslenir ve o bölge kâğıt yüzeyinden yükselir. Sonuç, gözle görülen ve elle hissedilen bir kabartma dokusudur. İşlem baskı sonrası uygulandığı için üretim süresi standart kartvizite göre biraz daha uzundur." },
      { q: "Kabartma hangi tasarımlarda iyi durur?", a: "Sade ve boşluğu bol tasarımlarda etkisi en yüksektir: logo, isim ve unvan gibi az sayıda öğe kabartıldığında fark belirgin olur. Tüm yüzeyi kaplayan yoğun tasarımlarda kabartma detayı kaybolur; bu yüzden kabartılacak alanı sınırlı tutmak önerilir." },
      { q: "Oval köşe ile özel kesim arasındaki fark nedir?", a: "Oval köşe, kartın dört köşesinin standart bir yarıçapla yuvarlatılmasıdır. Özel kesim ise tasarımınıza göre hazırlanan bıçakla farklı bir form verilmesidir; köşe yuvarlatmanın ötesinde şekil değişikliği isteyen işlerde kullanılır." },
      { q: "Kaç adetten sipariş verebilirim?", a: "Kabartmalı kartvizitler 1.000 adetten başlar; 2.000, 3.000, 5.000 ve 10.000 adet kademeleri vardır. Adet arttıkça birim maliyet düşer. Konfigüratörde adedi seçtiğinizde KDV dahil toplam anında hesaplanır." },
      { q: "Kabartma tek yüzde mi yapılır?", a: "Standart uygulama tek yüzdür; kabartma genellikle ön yüzdeki logo ve isim için tercih edilir. Arka yüz normal baskılı olarak üretilir. Farklı bir kurgu isterseniz sipariş notunda belirtebilir veya teklif talebinde bulunabilirsiniz." },
    ],
  },
  {
    slug: "sivama-kartvizit",
    name: "Sıvama Kartvizit",
    paketler: ["eko-sek", "o-sek", "s-sek", "tank"],
    shortDescription: "Sıvama (kaşe) kartvizit — kalın, tok gövdeli premium kartvizit; 800 gr'a kadar seçenek.",
    description:
      "Sıvama kartvizit, iki kâğıdın birbirine yapıştırılmasıyla elde edilen kalın gövdeli premium karttır. Standart kartvizitten belirgin biçimde daha tok durur ve elde ağırlık hissi verir. Ekonomik oval köşe, standart oval köşe, özel kesim ve en kalın (800 gr) seçenekleriyle üretilir; tüm fiyatlar KDV dahildir.",
    seo: {
      title: "Sıvama Kartvizit — Kalın Gövdeli Premium Kartvizit (800 gr'a Kadar)",
      description:
        "Sıvama kartvizit: iki kâğıdın birleştirilmesiyle kalın ve tok gövde. Oval köşe, özel kesim ve 800 gr en kalın seçenek. KDV dahil anlık fiyat, 1.000 adetten.",
    },
    features: [
      "İki kâğıt birleştirilerek elde edilen kalın gövde",
      "Elde belirgin ağırlık ve tokluk hissi",
      "800 gr'a kadar kalınlık seçeneği",
      "Oval köşe ve özel kesim alternatifleri",
    ],
    faqs: [
      { q: "Sıvama kartvizit nedir?", a: "Sıvama, iki (bazen daha fazla) kâğıdın özel yapıştırma ile birleştirilmesiyle elde edilen kalın kart yapısıdır. Sonuçta ortaya çıkan kart standart kartvizitten belirgin şekilde daha kalın ve toktur; bu yüzden premium kurumsal kimlik çalışmalarında tercih edilir." },
      { q: "Sıvama ile normal kalın kâğıt arasındaki fark nedir?", a: "Normal kalın kartvizit tek kat kâğıttan üretilir ve kalınlığı kâğıdın gramajıyla sınırlıdır. Sıvamada iki kat birleştirildiği için çok daha yüksek kalınlıklara çıkılabilir; ayrıca kartın kenarında görünen çift katman, kaliteli bir görsel detay oluşturur." },
      { q: "Ekonomik sıvama ile standart sıvama farkı nedir?", a: "Ekonomik seçenek daha ince katman kombinasyonu kullanır ve maliyeti düşürür; görünüm yine sıvama karakterindedir. Standart seçenek daha kalın gövde ve daha belirgin bir kenar detayı sunar. En kalın (800 gr) seçenek ise maksimum tokluk isteyen işler içindir." },
      { q: "Sıvama kartvizit ne kadar sürede üretilir?", a: "Sıvama işlemi baskı sonrası ek bir üretim adımı olduğu için standart kartvizite göre biraz daha uzun sürer. Sipariş sonrası tasarım onayı verildiğinde üretim başlar; güncel süre ürün sayfasında belirtilir." },
      { q: "Sıvama kartvizite kabartma veya yaldız eklenebilir mi?", a: "Kabartma ve yaldız uygulamaları katalogda ayrı ürün olarak sunulur; sıvama gövde ile birlikte özel kombinasyon isterseniz teklif talebinde bulunmanız yeterlidir. Ekibimiz uygulanabilirliği ve fiyatı size ileter." },
    ],
  },
  {
    slug: "yaldizli-kartvizit",
    name: "Yaldızlı Kartvizit",
    paketler: ["ay", "gy", "vip", "a-sek", "ac-sek"],
    shortDescription: "Altın ve gümüş yaldız (sıcak damga) kartvizit — parlak metalik detaylarla premium görünüm.",
    description:
      "Yaldızlı kartvizit, sıcak damga (foil) tekniğiyle metalik altın veya gümüş yüzey uygulanarak üretilir. Işığı yansıtan parlak detay, logo ve isimlerin öne çıkmasını sağlar; kurumsal kimlikte prestij algısını en çok güçlendiren uygulamalardan biridir. Altın yaldız, gümüş yaldız, özel kesim ve sıvama gövdeli kombinasyonlarla üretilir; tüm fiyatlar KDV dahildir.",
    seo: {
      title: "Yaldızlı Kartvizit — Altın ve Gümüş Sıcak Damga (Foil) Baskı",
      description:
        "Altın ve gümüş yaldızlı kartvizit: sıcak damga tekniğiyle metalik parlak detay. Özel kesim ve sıvama gövde seçenekleri, KDV dahil anlık fiyat.",
    },
    features: [
      "Sıcak damga (foil) ile gerçek metalik yüzey",
      "Altın ve gümüş renk seçenekleri",
      "Sıvama gövde ve özel kesim kombinasyonları",
      "Logo ve isimde en yüksek görünürlük",
    ],
    faqs: [
      { q: "Yaldız baskı nasıl yapılır?", a: "Yaldız, sıcak damga (foil) tekniğiyle uygulanır: metalik folyo, ısı ve basınç altında özel bir kalıpla kâğıda aktarılır. Sonuçta gerçek metalik parlaklığa sahip, ışığı yansıtan bir yüzey elde edilir. Bu, dijital baskıyla üretilen 'altın rengi' görünümden belirgin biçimde farklıdır." },
      { q: "Altın mı gümüş yaldız mı seçmeliyim?", a: "Seçim marka kimliğinize bağlıdır. Altın yaldız sıcak, klasik ve prestijli bir algı yaratır; kuyumculuk, danışmanlık ve hukuk gibi alanlarda yaygındır. Gümüş yaldız daha modern ve teknolojik durur; mimarlık, mühendislik ve tasarım alanlarında tercih edilir." },
      { q: "Yaldız tasarımın hangi bölümüne uygulanır?", a: "Yaldız, kalıpla uygulandığı için belirli alanlara yapılır: genellikle logo, isim veya çerçeve gibi öne çıkması istenen öğeler seçilir. Tüm yüzeye yaldız uygulanmaz. Tasarım dosyanızda yaldız uygulanacak alanı ayrı katman olarak belirtmeniz üretimi hızlandırır." },
      { q: "Yaldız hangi zeminlerde daha iyi durur?", a: "Koyu ve mat zeminlerde metalik parlaklık en çarpıcı sonucu verir; siyah, lacivert ve koyu gri zeminler yaldızla yüksek kontrast oluşturur. Açık renk zeminlerde özellikle gümüş yaldızın görünürlüğü azalabilir." },
      { q: "Yaldızlı kartvizit kaç adetten üretiliyor?", a: "1.000 adetten başlar; 2.000, 3.000, 5.000 ve 10.000 adet kademeleri mevcuttur. Yaldız kalıp maliyeti içerdiği için adet arttıkça birim maliyet standart kartvizite göre daha hızlı düşer." },
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
const kaynakOpts = kaynak.options ?? [];
const kaynakPrices = kaynak.prices ?? [];
const adetEkseni = kaynakOpts.filter((o) => o.groupRole === "dimension");
console.log(`Kaynak: ${kaynak.name} · ${kaynakOpts.length} seçenek · ${kaynakPrices.length} fiyat satırı · adet ekseni ${adetEkseni.length}`);

let ok = 0, hata = 0;
const acilanlar = [];
for (const aile of AILELER) {
  // 1) Bu ailenin paket seçenekleri + adet ekseni
  const paketOpts = kaynakOpts.filter((o) => o.groupRole === "priced" && aile.paketler.includes(o.optionKey));
  if (paketOpts.length !== aile.paketler.length) {
    console.error(`✗ ${aile.slug}: beklenen ${aile.paketler.length} paket, bulunan ${paketOpts.length} — DURDURULDU`);
    hata++; continue;
  }
  const options = [...paketOpts, ...adetEkseni].map((o, i) => ({
    groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole,
    groupSort: o.groupSort ?? 0, optionKey: o.optionKey, optionLabel: o.optionLabel,
    ...(o.optionSublabel ? { optionSublabel: o.optionSublabel } : {}),
    optionSort: o.optionSort ?? i,
  }));
  // 2) Fiyat satırları — BİREBİR kopya (hesaplama yok)
  const prices = kaynakPrices
    .filter((p) => aile.paketler.includes(String(p.optionKey)))
    .map((p) => ({
      ...(p.groupKey ? { groupKey: p.groupKey } : {}),
      ...(p.optionKey ? { optionKey: p.optionKey } : {}),
      ...(p.dimKey ? { dimKey: p.dimKey } : {}),
      ...(p.cost != null ? { cost: Number(p.cost) } : {}),
      price: Number(p.price),
    }));
  console.log(`\n${aile.slug}: ${paketOpts.length} paket · ${prices.length} fiyat satırı kopyalanacak`);
  if (DRY) {
    console.log(`  [DRY] örnek fiyat: ${prices.slice(0, 3).map((p) => `${p.optionKey}/${p.dimKey}=${p.price}`).join(" · ")}`);
    continue;
  }
  // 3) Ürünü oluştur
  const createRes = await fetch(`${API}/api/products`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      name: aile.name, slug: aile.slug, categoryId: kaynak.categoryId,
      shortDescription: aile.shortDescription, description: aile.description,
      basePrice: 0, productionTime: kaynak.productionTime,
      images: kaynak.images ?? [], pricingMode: kaynak.pricingMode ?? "additive",
      isActive: true,
    }),
  });
  if (!createRes.ok) { console.error(`✗ ${aile.slug}: ürün oluşturulamadı ${createRes.status} ${(await createRes.text()).slice(0, 200)}`); hata++; continue; }
  const yeni = await createRes.json();
  // 4) Seçenekler ve fiyatlar
  const oRes = await fetch(`${API}/api/products/${yeni.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
  if (!oRes.ok) { console.error(`✗ ${aile.slug}: seçenek yazılamadı ${oRes.status} ${(await oRes.text()).slice(0, 200)}`); hata++; continue; }
  const pRes = await fetch(`${API}/api/products/${yeni.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices }) });
  if (!pRes.ok) { console.error(`✗ ${aile.slug}: fiyat yazılamadı ${pRes.status} ${(await pRes.text()).slice(0, 200)}`); hata++; continue; }
  // 5) İçerik (SEO/SSS/özellikler) + kardeş ürün bağlantıları
  const kardesler = AILELER.filter((a) => a.slug !== aile.slug).map((a) => a.slug).concat(KAYNAK);
  await fetch(`${API}/api/products/${yeni.id}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ content: { seo: aile.seo, features: aile.features, faqs: aile.faqs, relatedSlugs: kardesler, brand: "Markala" } }),
  });
  // 6) DOĞRULAMA — fiyatlar kaynakla birebir mi?
  const kontrol = await fetch(`${API}/api/products/${aile.slug}`).then((r) => (r.ok ? r.json() : null));
  const yaziliPrices = kontrol?.prices ?? [];
  const uyusmaz = prices.filter((p) => {
    const e = yaziliPrices.find((x) => String(x.optionKey) === p.optionKey && String(x.dimKey ?? "") === String(p.dimKey ?? ""));
    return !e || Number(e.price) !== p.price;
  });
  if (uyusmaz.length > 0 || yaziliPrices.length !== prices.length) {
    console.error(`✗ ${aile.slug}: FİYAT DOĞRULAMASI BAŞARISIZ — beklenen ${prices.length}, yazılan ${yaziliPrices.length}, uyuşmayan ${uyusmaz.length}`);
    hata++; continue;
  }
  console.log(`  ✓ oluşturuldu ve fiyatlar DOĞRULANDI (${yaziliPrices.length} satır) → /urun/${aile.slug}`);
  acilanlar.push(aile.slug);
  ok++;
}
console.log(`\nÖzet — açılan: ${ok} · hata: ${hata}`);
if (acilanlar.length) {
  console.log("Yeni ürünler:", acilanlar.map((s) => `https://markala.com.tr/urun/${s}`).join("\n  "));
  console.log("\nNOT: kaynak ürün (klasik-kartvizit) DEĞİŞTİRİLMEDİ — varyantlar indekslenip");
  console.log("doğrulandıktan sonra ayrı adımda sadeleştirilecek.");
}
