#!/usr/bin/env node
/**
 * FOLYO MALZEME BÖLME (2026-08-31) — branda bölmesiyle aynı desen.
 *
 * Arama verisi (Keyword Planner, TR): kumlama folyo / buzlu cam folyosu 880/ay ·
 * şeffaf folyo 590 · reflektif folyo 390 · laminasyon folyo 390 · kesim folyo 390.
 * Tek üründe gizli 10 malzeme bu niyetlerin hiçbirini karşılamıyor.
 *
 * DÜRÜSTLÜK NOTU: "yapışkanlı folyo" 6.600/ay görünüyor ama aramaların büyük kısmı
 * DIY/perakende (dc-fix, mutfak dolabı kaplama, tezgah folyosu) — bizim ticari baskı
 * hizmetimiz değil. Bu yüzden hacim beklentisi o rakama göre kurulmamalı.
 *
 * FİYAT: cost(dolar) × 70,56 (kur×marj×KDV). cost BİREBİR kopyalanır, hesaplama yapılmaz.
 * pricingMode oluşturma DTO'sunda YOK → PATCH ile "area" set edilir (branda bölmesindeki tuzak).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/folyo-bol.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const KAYNAK = "folyo-cesitleri";

const AILELER = [
  {
    slug: "kesim-folyo",
    name: "Kesim Folyo (Yapışkanlı Folyo)",
    malzemeler: {
      "normal-folyo": "Normal Folyo", "mat-folyo": "Mat Folyo",
      "arkasi-gri-folyo": "Arkası Gri Folyo", "arkasi-gri-mat-folyo": "Arkası Gri Mat Folyo",
    },
    shortDescription: "Kendinden yapışkanlı kesim folyosu — vitrin yazısı, logo ve yönlendirme uygulamaları.",
    description:
      "Kesim folyo, plotter ile harf ve logo formunda kesilerek cam, duvar, araç ve tabela yüzeylerine uygulanan kendinden yapışkanlı folyodur. Zemin rengi yüzeyin kendisi olduğu için sonuç sade ve kurumsal görünür. Normal, mat, arkası gri ve arkası gri mat seçenekleriyle m² fiyatlı üretilir.",
    seo: {
      title: "Kesim Folyo — Yapışkanlı Vitrin ve Logo Folyosu (m² Fiyat)",
      description:
        "Kendinden yapışkanlı kesim folyo: vitrin yazısı, logo ve yönlendirme için normal, mat ve arkası gri seçenekleri. Plotter kesim, m² fiyatlandırma, KDV dahil.",
    },
    faqs: [
      { q: "Kesim folyo ile baskılı folyo arasındaki fark nedir?", a: "Kesim folyoda folyonun kendi rengi kullanılır; harfler ve logo tek renk olarak plotterla kesilip yüzeye aktarılır, zemin görünmez kalır. Baskılı folyoda ise beyaz folyo üzerine dijital baskı yapılır ve fotoğraf dahil sınırsız renk kullanılabilir. Sade, kurumsal ve tek renk işlerde kesim folyo daha temiz durur." },
      { q: "Arkası gri folyo ne işe yarar?", a: "Arkası gri folyonun sırtındaki gri katman, alttaki yüzeyin veya eski yazının folyodan geçerek görünmesini engeller. Koyu ya da desenli zeminlere açık renk uygulama yapılacağında ve eski folyonun üzerine kaplama yapılacak durumlarda tercih edilir." },
      { q: "Mat folyo mu parlak folyo mu?", a: "Mat folyo ışığı dağıtır, yansıma yapmaz; vitrin ve cam uygulamalarında yazının her açıdan okunmasını sağlar. Normal (parlak) folyo renkleri daha canlı gösterir ve dış mekânda daha uzun süre temiz kalır. İç mekân ve cam işlerinde mat, dış cephe ve araç uygulamalarında parlak yaygındır." },
      { q: "Fiyat nasıl hesaplanıyor?", a: "Metrekare üzerinden: en (cm) × boy (cm) ÷ 10.000 = m². Seçilen folyonun m² fiyatı bu alanla çarpılır; 1 m² altındaki işlerde minimum 1 m² uygulanır. Kesim ve uygulama detayları ek işlem seçeneğinden belirlenir." },
    ],
  },
  {
    slug: "kumlama-buzlu-cam-folyosu",
    name: "Kumlama (Buzlu) Cam Folyosu",
    malzemeler: { "kumlama-folyo": "Kumlama (Buzlu) Folyo" },
    shortDescription: "Buzlu cam görünümü veren kumlama folyosu — mahremiyet sağlar, ışığı geçirir.",
    description:
      "Kumlama folyosu, cama uygulandığında buzlu cam görünümü verir: içerideki ışığı geçirmeye devam ederken görüşü engeller. Gerçek kumlama işleminin aksine cama kalıcı zarar vermez, gerektiğinde sökülebilir. Ofis bölmeleri, toplantı odaları, banyo ve vitrin camlarında mahremiyet için en yaygın çözümdür; istenirse logo veya desen formunda kesilerek uygulanır.",
    seo: {
      title: "Kumlama (Buzlu) Cam Folyosu — Mahremiyet Folyosu, m² Fiyat",
      description:
        "Kumlama folyosu ile buzlu cam görünümü: ışığı geçirir, görüşü engeller. Ofis bölmesi, toplantı odası ve banyo camları için m² fiyatlı, KDV dahil.",
    },
    faqs: [
      { q: "Kumlama folyosu gerçek kumlama gibi mi görünür?", a: "Evet, uygulandığında camda buzlu/mat bir yüzey oluşur ve gözle ayırt edilmesi çok zordur. Farkı kalıcılıktadır: gerçek kumlama camı fiziksel olarak aşındırır ve geri döndürülemez; folyo ise gerektiğinde sökülebilir, cam ilk hâline döner." },
      { q: "İçeriden dışarısı görünür mü?", a: "Hayır, kumlama folyosu iki yönden de görüşü engeller; ışığı geçirir ama şekilleri belirsizleştirir. Dışarıdan içerinin görünmemesini ama içeriden dışarının net görünmesini istiyorsanız one way vision (tek yön görüş) folyosu doğru üründür." },
      { q: "Nerelerde kullanılır?", a: "Ofis cam bölmeleri ve toplantı odaları, banyo ve duşakabin camları, klinik ve muayenehane bekleme alanları, vitrin alt bantları, merdiven korkuluk camları ve mahremiyet gereken tüm cam yüzeyler." },
      { q: "Logo veya desen şeklinde uygulanabilir mi?", a: "Evet. Kumlama folyosu plotterla kesilerek logo, yazı, şerit veya desen formunda uygulanabilir; camın tamamını kaplamak zorunlu değildir. Kurumsal cam bölmelerde şirket logosunun kumlama görünümünde uygulanması yaygın bir tercihtir." },
    ],
  },
  {
    slug: "seffaf-folyo",
    name: "Şeffaf Folyo",
    malzemeler: { "seffaf-folyo": "Şeffaf Folyo" },
    shortDescription: "Zemini görünmeyen şeffaf folyo — cam üzerine baskı ve etiket uygulamaları.",
    description:
      "Şeffaf folyo, üzerine yapılan baskının cam veya açık renkli yüzeyde zemin görünmeden durmasını sağlar. Yazı ve logolar sanki doğrudan camın üzerine basılmış gibi görünür. Vitrin bilgilendirmeleri, cam kapı uyarıları, şeffaf etiket ve ambalaj uygulamalarında kullanılır.",
    seo: {
      title: "Şeffaf Folyo Baskı — Zeminsiz Cam Uygulaması (m² Fiyat)",
      description:
        "Şeffaf folyo baskı: cam ve açık yüzeylerde zemin görünmeden yazı ve logo uygulaması. Vitrin, cam kapı ve etiket işleri için m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Şeffaf folyoda beyaz renk basılabilir mi?", a: "Standart dijital baskıda beyaz mürekkep kullanılmadığı için şeffaf folyoda beyaz alanlar zemin rengiyle (camın arkası) karışır. Beyaz vurgu gerektiren tasarımlarda ya beyaz baskı destekli özel üretim ya da arkası beyaz/gri folyo tercih edilmelidir; sipariş öncesi tasarımı birlikte değerlendirmenizi öneririz." },
      { q: "Cam kapı uyarı bantlarında kullanılır mı?", a: "Evet, cam kapı ve bölmelerde güvenlik amaçlı göz hizası bantları sıklıkla şeffaf folyo üzerine baskıyla veya kumlama folyosuyla yapılır. Şeffaf folyo, logolu ve renkli uyarı bandı isteyen uygulamalar için uygundur." },
      { q: "Ne kadar dayanır?", a: "İç mekânda uzun süre sorunsuz kalır. Dış cephede sürekli güneş alan yüzeylerde zamanla renk solması görülebilir; bu tür işlerde laminasyonlu uygulama ömrü belirgin şekilde uzatır." },
    ],
  },
  {
    slug: "reflektif-folyo",
    name: "Reflektif Folyo",
    malzemeler: { "reflektif-folyo": "Solvent Baskı", "reflektif-folyo-uv": "UV Baskı" },
    shortDescription: "Işığı geri yansıtan reflektif folyo — gece görünürlüğü gereken uygulamalar.",
    description:
      "Reflektif folyo, üzerine düşen ışığı kaynağına geri yansıtacak şekilde üretilir; karanlıkta far ışığıyla parlayarak uzaktan okunur. Araç üzeri uygulamalar, yol ve otopark yönlendirmeleri, şantiye uyarı panoları ve güvenlik işaretlerinde kullanılır. Solvent ve UV baskı seçenekleriyle m² fiyatlı üretilir.",
    seo: {
      title: "Reflektif Folyo — Işığı Yansıtan Gece Görünürlüklü Folyo",
      description:
        "Reflektif folyo baskı: far ışığını geri yansıtır, karanlıkta okunur. Araç, yol ve şantiye uygulamaları için solvent/UV seçenekleri, m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Reflektif folyo nasıl çalışır?", a: "Yüzeyindeki mikroskobik cam kürecikler veya prizmatik yapı, üzerine düşen ışığı geldiği yöne geri yansıtır. Aracın farından çıkan ışık sürücünün gözüne geri döndüğü için yüzey karanlıkta parlıyormuş gibi görünür ve çok uzaktan fark edilir." },
      { q: "Araç üzerine uygulanabilir mi?", a: "Evet, araç güvenlik şeritleri ve gece görünürlüğü gereken araç yazılarında yaygın olarak kullanılır. Uygulama öncesi yüzeyin temiz ve yağdan arındırılmış olması, folyonun ömrü açısından önemlidir." },
      { q: "Solvent ile UV baskı farkı nedir?", a: "UV baskıda mürekkep ultraviyole ışıkla anında kurutulur; renkler daha canlı, yüzey çizilmeye daha dirençlidir ve dış koşullara dayanımı yüksektir. Sürekli güneş ve yıkama gören uygulamalarda UV baskı tercih edilir." },
    ],
  },
  {
    slug: "laminasyonlu-folyo",
    name: "Laminasyonlu Folyo",
    malzemeler: { "laminasyonlu-folyo": "Laminasyonlu Folyo" },
    shortDescription: "Baskı üzeri koruyucu laminasyon — çizilme, UV ve nem koruması.",
    description:
      "Laminasyonlu folyo, baskının üzerine şeffaf koruyucu bir film kaplanarak üretilir. Bu katman baskıyı çizilmeye, UV kaynaklı renk solmasına, neme ve temizlik sırasındaki aşınmaya karşı korur. Yoğun temas gören yüzeylerde ve dış mekânda folyonun ömrünü belirgin şekilde uzatır.",
    seo: {
      title: "Laminasyonlu Folyo — Çizilme ve UV Korumalı Baskı (m² Fiyat)",
      description:
        "Laminasyonlu folyo baskı: koruyucu film ile çizilme, UV ve nem koruması. Yoğun temas gören ve dış mekân uygulamaları için m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Laminasyon ne kadar fark yaratır?", a: "Laminasyon, baskı yüzeyini fiziksel ve kimyasal etkilerden ayıran bir bariyer oluşturur. Çizilme, silme sırasında aşınma ve güneşe bağlı renk solması belirgin şekilde yavaşlar; özellikle sık temizlenen ve dış mekânda kalan uygulamalarda toplam ömrü uzatır." },
      { q: "Hangi işlerde laminasyon önerilir?", a: "Araç üzeri uygulamalar, zemin ve merdiven grafikleri, sık silinen vitrin ve tezgah yüzeyleri, dış cephede uzun süre kalacak baskılar ve yoğun insan teması olan alanlardaki tüm folyo uygulamaları." },
      { q: "Mat mı parlak mı laminasyon?", a: "Mat laminasyon yansımayı azaltır ve parmak izini gizler; okunabilirliğin önemli olduğu yüzeylerde tercih edilir. Parlak laminasyon renkleri daha canlı gösterir. Tercihinizi sipariş notunda belirtebilirsiniz." },
    ],
  },
  {
    slug: "lumen-folyo",
    name: "Lümen (Fotolüminesan) Folyo",
    malzemeler: { "lumen-folyo": "Lümen Folyo" },
    shortDescription: "Karanlıkta parlayan fotolüminesan folyo — acil çıkış ve güvenlik işaretleri.",
    description:
      "Lümen (fotolüminesan) folyo, gün ışığını veya yapay ışığı depolayarak karanlıkta parlar. Elektrik kesintisi ve duman gibi acil durumlarda kaçış yollarının ve güvenlik işaretlerinin görünür kalmasını sağlar. Acil çıkış yönlendirmeleri, yangın ekipmanı işaretleri ve merdiven güvenlik şeritlerinde kullanılır.",
    seo: {
      title: "Lümen (Fotolüminesan) Folyo — Karanlıkta Parlayan Güvenlik Folyosu",
      description:
        "Fotolüminesan lümen folyo: ışığı depolayıp karanlıkta parlar. Acil çıkış, yangın ekipmanı ve kaçış yolu işaretleri için m² fiyat, KDV dahil.",
    },
    faqs: [
      { q: "Fotolüminesan folyo nasıl çalışır?", a: "Yapısındaki pigmentler gün ışığını veya ortam aydınlatmasını depolar; ışık kesildiğinde depoladığı enerjiyi görünür ışık olarak salar. Şarj olması için gündüz veya aydınlatma açıkken ışık alması gerekir; pil veya elektrik bağlantısı gerektirmez." },
      { q: "Ne kadar süre parlar?", a: "Parlama süresi ve şiddeti, folyonun aldığı ışık miktarına ve kalitesine bağlıdır. Yeterince şarj olmuş folyo, karanlığın ilk dakikalarında en parlak hâldedir ve zamanla kademeli olarak zayıflar — bu, tahliye için kritik olan ilk süreyi kapsayacak şekilde tasarlanmıştır." },
      { q: "Nerelerde zorunludur?", a: "Acil çıkış yönlendirmeleri, kaçış yolu işaretleri, yangın söndürücü ve yangın dolabı işaretleri gibi uygulamalarda karanlıkta görünürlük beklenir. İşyeri tipine göre hangi işaretlerin gerektiğini İSG uyarı levhaları rehberimizde bulabilirsiniz." },
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
const kOpts = kaynak.options ?? [], kPrices = kaynak.prices ?? [];
const ekOpts = kOpts.filter((o) => o.groupKey === "ekislem");
const ekPrices = kPrices.filter((p) => p.groupKey === "ekislem");
const ayar = await fetch(`${API}/api/settings/pricing`).then((r) => r.json()).catch(() => ({ kur: 49, marj: 1.2, kdv: 0.2 }));
const CARPAN = Number(ayar.kur) * Number(ayar.marj) * (1 + Number(ayar.kdv));
console.log(`Kaynak: ${kaynak.name} · çarpan ${CARPAN.toFixed(2)}\n`);

let ok = 0, hata = 0;
for (const aile of AILELER) {
  const anahtarlar = Object.keys(aile.malzemeler);
  const malOpts = kOpts.filter((o) => anahtarlar.includes(o.optionKey));
  if (malOpts.length !== anahtarlar.length) { console.error(`✗ ${aile.slug}: malzeme eşleşmedi (${malOpts.length}/${anahtarlar.length}) — DURDURULDU`); hata++; continue; }
  const options = [
    ...malOpts.map((o, i) => ({
      groupKey: o.groupKey, groupLabel: "Malzeme / Baskı", groupRole: o.groupRole, groupSort: 0,
      optionKey: o.optionKey, optionLabel: aile.malzemeler[o.optionKey], optionSort: i,
      ...(o.rules ? { rules: o.rules } : {}),
    })),
    ...ekOpts.map((o) => ({
      groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole, groupSort: 1,
      optionKey: o.optionKey, optionLabel: o.optionLabel,
      ...(o.optionSublabel ? { optionSublabel: o.optionSublabel } : {}),
      optionSort: o.optionSort ?? 0, ...(o.rules ? { rules: o.rules } : {}),
    })),
  ];
  const prices = [...kPrices.filter((p) => anahtarlar.includes(String(p.optionKey))), ...ekPrices].map((p) => ({
    ...(p.groupKey ? { groupKey: p.groupKey } : {}),
    ...(p.optionKey ? { optionKey: p.optionKey } : {}),
    ...(p.dimKey ? { dimKey: p.dimKey } : {}),
    ...(p.cost != null ? { cost: Number(p.cost) } : {}),
    price: Number(p.price ?? 0),
  }));
  console.log(`■ ${aile.name}  (/urun/${aile.slug})`);
  for (const o of malOpts) {
    const pr = kPrices.find((p) => String(p.optionKey) === o.optionKey);
    console.log(`    ${aile.malzemeler[o.optionKey].padEnd(24)} cost $${String(pr?.cost).padEnd(4)} → ${(Number(pr?.cost) * CARPAN).toFixed(2)} ₺/m²`);
  }
  if (DRY) { console.log(`    [DRY] ${options.length} seçenek · ${prices.length} fiyat satırı\n`); continue; }

  const cr = await fetch(`${API}/api/products`, { method: "POST", headers: H, body: JSON.stringify({
    name: aile.name, slug: aile.slug, categoryId: kaynak.categoryId,
    shortDescription: aile.shortDescription, description: aile.description,
    basePrice: 0, productionTime: kaynak.productionTime, sizeLabel: kaynak.sizeLabel,
    images: kaynak.images ?? [], isActive: true }) });
  if (!cr.ok) { console.error(`  ✗ oluşturulamadı: ${cr.status} ${(await cr.text()).slice(0, 160)}`); hata++; continue; }
  const yeni = await cr.json();
  const oR = await fetch(`${API}/api/products/${yeni.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
  if (!oR.ok) { console.error(`  ✗ seçenek: ${oR.status}`); hata++; continue; }
  const pR = await fetch(`${API}/api/products/${yeni.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices }) });
  if (!pR.ok) { console.error(`  ✗ fiyat: ${pR.status}`); hata++; continue; }
  const kardes = AILELER.filter((a) => a.slug !== aile.slug).map((a) => a.slug);
  // pricingMode POST'ta yok sayılıyor → PATCH şart (yoksa displayPrice null, kartta "Teklif Al")
  await fetch(`${API}/api/products/${yeni.id}`, { method: "PATCH", headers: H, body: JSON.stringify({
    pricingMode: "area", content: { seo: aile.seo, faqs: aile.faqs, relatedSlugs: kardes, brand: "Markala" } }) });
  const k = await fetch(`${API}/api/products/${aile.slug}`).then((r) => (r.ok ? r.json() : null));
  const yazili = k?.prices ?? [];
  const uyusmaz = prices.filter((p) => {
    const e = yazili.find((x) => String(x.optionKey) === p.optionKey);
    return !e || Number(e.cost ?? 0) !== Number(p.cost ?? 0);
  });
  if (uyusmaz.length || yazili.length !== prices.length || k?.pricingMode !== "area") {
    console.error(`  ✗ DOĞRULAMA BAŞARISIZ — satır ${yazili.length}/${prices.length}, uyuşmaz ${uyusmaz.length}, mode ${k?.pricingMode}`); hata++; continue;
  }
  console.log(`  ✓ oluşturuldu · ${yazili.length} satır doğrulandı · başlangıç ${k.displayPrice} ₺/m²\n`);
  ok++;
}
console.log(`Özet — açılan: ${ok} · hata: ${hata}`);
