#!/usr/bin/env node
/**
 * CADILAR BAYRAMI 2026 kampanya kategorisi + 13 ürün (2026-09-10, Hasan + ortağı karar sayfası:
 * https://claude.ai/code/artifact/3cc0877f-4aa1-4b7b-9405-4ac6aea4bdbe).
 *
 * Kararlar: fiyat = taban ürünle BİREBİR aynı (ek ücret yok, indirimler geçerli), her tasarım kabul
 * (hazır konsept + isteğe bağlı logo/özel tasarım, ücretsiz), paket yok, açılış 15-16 Eylül.
 * Her kampanya ürünü mevcut bir taban ürünün seçenek/fiyat satırlarının KOPYASIDIR (istenirse
 * alt küme); görseller Hasan'ın Claude Design çıktıları gelene kadar taban ürünün görselleri.
 *
 * İdempotent: kategori/ürün varsa günceller (seçenek+fiyat her koşulda taban ile eşitlenir,
 * GÖRSELLERE dokunulmaz — panelden yüklenen kampanya görselleri korunur).
 * Kullanım: node scripts/katalog/cadilar-bayrami.mjs --dry | node scripts/katalog/cadilar-bayrami.mjs
 */
import { readFileSync } from "node:fs";
try { for (const l of readFileSync("C:/Users/Administrator/Projects/markala-google/.env", "utf8").split(String.fromCharCode(10))) { const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), "")); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); } } catch { /* env */ }
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const getJson = async (p) => { const r = await fetch(`${API}/api${p}`); return r.ok ? r.json() : null; };

const CAT_SLUG = "cadilar-bayrami";
const KONSEPT = "Siyah, turuncu ve krem paletinde bal kabağı, yarasa, örümcek ağı, kuru kafa ve asalı cadı motifleri; \"Cadılar Bayramı · 31 Ekim\" başlığı.";
const ORTAK_SSS = [
  { q: "Tasarımı kim yapıyor, ücreti var mı?", a: "Hazır Cadılar Bayramı konseptimizi olduğu gibi kullanabilir, üzerine işletme adınızı ve logonuzu ekletebilir ya da tamamen kendi tasarımınızı yükleyebilirsiniz. Üçü de ücretsizdir; tasarım ekibi baskı öncesi onayınıza sunar." },
  { q: "Fiyat normal üründen farklı mı?", a: "Hayır. Kampanya ürünleri, katalogdaki aynı malzeme ve ölçüdeki ürünle birebir aynı fiyatlanır; kupon, havale indirimi ve MarkaPuan bu üründe de geçerlidir." },
  { q: "31 Ekim'e yetişir mi?", a: "Üretim 1-2 iş günü, kargo Türkiye genelinde 2-4 iş günüdür. 27 Ekim'e kadar verilen siparişler 31 Ekim öncesi teslim edilir; kalabalık dönemde 20 Ekim'den önce sipariş vermenizi öneririz." },
];
const ORTAK_BOLUM = (ad, ek) => ({ baslik: "Cadılar Bayramı konsepti ve kişiselleştirme", paragraflar: [`${ad}, mağaza, kafe, restoran, pastane, okul ve etkinlik alanları için hazırlanan Cadılar Bayramı serisinin parçasıdır. ${KONSEPT} Konsept hazırdır; işletme adı, logo, tarih ve etkinlik bilgisi sipariş notuyla eklenir. ${ek}`] });

const category = {
  slug: CAT_SLUG, name: "Cadılar Bayramı",
  shortDescription: "31 Ekim için vitrin sticker'ı, branda afiş, dekota figür, fosforlu sticker ve daha fazlası — hazır konsept, normal fiyat",
  longDescription: "Kafe, restoran, pastane, mağaza, okul ve etkinlik firmaları için Cadılar Bayramı baskı serisi. Vitrin ve cam için kesim sticker'lar, duvar için branda ve kâğıt afiş, kapı önü için ayaklı bal kabağı figürü, karanlıkta parlayan fosforlu sticker'lar, davetiye, masa servisi, roll-up ve yelken bayrak. Hazır konsept tasarımı ücretsiz uyarlanır; fiyatlar aynı ürünün katalog fiyatıyla birebir aynıdır. 27 Ekim'e kadar verilen siparişler 31 Ekim öncesi teslim edilir.",
  accentColor: "#e8641b",
  startingPrice: 0, // hesaplanır (categories.service), sütun yalnız yedek
  productionTime: "1-2 iş günü",
};
const categoryContent = {
  seo: { title: "Cadılar Bayramı Süsleri ve Baskı Ürünleri 2026 — Vitrin Sticker, Afiş, Figür", description: "İşletmeniz için Cadılar Bayramı dekorasyonu: vitrin sticker seti, branda ve kâğıt afiş, ayaklı bal kabağı figürü, fosforlu sticker, davetiye. Hazır tasarım ücretsiz, normal katalog fiyatı, 2-4 günde kapınızda." },
  seoBolumler: [
    { baslik: "İşletmeler için Cadılar Bayramı dekorasyonu", paragraflar: ["Cadılar Bayramı Türkiye'de kafe, pastane, mağaza ve okulların Ekim ayı etkinliği hâline geldi. Bu seride mekânın her yüzeyi için bir baskı ürünü var: vitrin camına kesim sticker, duvara branda veya kâğıt afiş, kapı önüne ayaklı bal kabağı figürü, masaya temalı servis kâğıdı, misafire davetiye ve kraft çanta. Hepsi aynı görsel aileyi paylaşır, tek tek de alınabilir.", "Ürünler mevcut katalog ürünlerinin kampanya versiyonudur: malzeme, ölçü ve fiyat aynıdır, yalnız tasarım hazırdır. Kendi tasarımınızı yüklemek de mümkündür."] },
    { baslik: "Hangi ürün nerede kullanılır?", tablo: { basliklar: ["Alan", "Ürün", "Not"], satirlar: [["Vitrin ve cam", "Vitrin sticker seti, fosforlu sticker", "İçeriden ve dışarıdan görünür; fosforlu gece parlar"], ["Duvar", "Branda afiş, kâğıt afiş, dekota figür", "Branda kopçalı asılır, dekota vidalanır"], ["Kapı önü, giriş", "Ayaklı bal kabağı figürü, roll-up, yelken bayrak", "Ayaklı figür 7 mm dekota, CNC kesim"], ["Masa", "Amerikan servis", "Restoran ve pastane için"], ["Paket ve hediye", "Etiket, kraft çanta", "Şeker paketi, bardak, poşet"], ["Etkinlik duyurusu", "Davetiye / el ilanı, ışıklı pano", "Parti ve okul etkinliği"]] } },
    { baslik: "Sipariş ve teslimat takvimi", paragraflar: ["Üretim 1-2 iş günü, kargo 81 ile 2-4 iş günüdür. 31 Ekim için son sipariş tarihi 27 Ekim'dir; Ekim'in son haftası yoğun olduğu için 20 Ekim'den önce sipariş vermek teslimatı garantiye alır. 1.500 ₺ üzeri siparişlerde kargo ücretsizdir."] },
  ],
  faqs: [
    ...ORTAK_SSS,
    { q: "Sadece bir ürün alabilir miyim, set zorunlu mu?", a: "Set zorunluluğu yok; her ürün tek başına sipariş edilir. Aynı sepette birden fazla ürün alırsanız hepsi tek kargoyla gönderilir." },
    { q: "Vitrin sticker'ı ile etiket arasındaki fark ne?", a: "Vitrin sticker'ı cam için kesim folyodur, büyük ebatlıdır ve ıslak yöntemle uygulanır. Etiket ise kuşe kâğıt üzerine yapışkanlı küçük çıkartmadır; paket, bardak ve poşet gibi ürünlere yapıştırılır." },
  ],
};

/** Kampanya ürünleri: taban ürün + tutulacak seçenekler + metinler. */
const URUNLER = [
  { slug: "cadilar-bayrami-vitrin-sticker", taban: "baskes-folyo", name: "Cadılar Bayramı Vitrin Sticker Seti — Baskes Folyo",
    short: "Cam ve vitrin için kesimli sticker seti: bal kabağı, yarasa, örümcek ağı, kuru kafa, asalı cadı; m² fiyatlı.",
    desc: "Vitrin camına içeriden veya dışarıdan uygulanan baskılı kesim folyo (baskes). Set; gülen bal kabakları, uçan yarasalar, köşe örümcek ağları, kuru kafa ve asalı cadı motiflerinden oluşur, konturundan kesilmiş ve uygulama bandına alınmış olarak gelir. Toplam ölçüyü (örneğin 200×100 cm vitrin alanı) girin; fiyat m² üzerinden, katalogdaki baskes folyo ile aynı hesaplanır. Şeffaf folyo seçeneği camın arkasını gösterir, kumlama seçeneği buzlu cam etkisi verir.",
    features: ["Konturundan kesilmiş hazır motif seti", "İçeriden ve dışarıdan görünür", "Uygulama bandıyla tek parça yapıştırma", "Söküldüğünde iz bırakmaz"],
    useCases: ["Kafe ve pastane vitrini", "Mağaza camı", "Okul ve kreş girişi", "Ofis cam bölme"],
    ek: "Motif setini (yalnız bal kabağı, karışık, yarasa ağırlıklı) ve yerleşim tercihini sipariş notuna yazın.", sss: [{ q: "Motif seti kaç parça?", a: "1 m²'lik standart sette 6 bal kabağı, 8 yarasa, 2 köşe örümcek ağı, 2 kuru kafa ve 1 asalı cadı bulunur; ölçü büyüdükçe parça sayısı orantılı artar. İstediğiniz motifleri sipariş notunda belirtebilirsiniz." }] },
  { slug: "cadilar-bayrami-branda-afis", taban: "cin-vinil-branda", tut: { malzeme: ["cin-440gr"] }, name: "Cadılar Bayramı Branda Afiş — 440 gr Solvent",
    short: "\"Cadılar Bayramı · 31 Ekim\" duvar afişi; 440 gr vinil branda, ölçüyü siz seçin, fiyat katalogla aynı.",
    desc: "Duvar, cephe ve etkinlik alanı için 440 gr vinil brandaya solvent baskı. Hazır konsept: krem zemin, siyah serif \"CADILAR BAYRAMI\", turuncu bal kabakları ve yarasalar; işletme adı ve etkinlik tarihi eklenir. En ve boyu cm olarak girin; fiyat katalogdaki Çin Vinil Branda 440 gr ile birebir aynıdır. Kopça (kuşgözü) ile asılır, dış mekânda sezon boyunca solmaz.",
    features: ["440 gr dış mekân brandası", "Her 50 cm'de kopça", "Ölçü serbest, 1 m² tabanı", "Solvent baskı, suya dayanıklı"],
    useCases: ["Kafe ve restoran duvarı", "Mağaza cephesi", "Okul etkinlik alanı", "AVM etkinlik köşesi"],
    ek: "En yaygın ölçüler 100×150 ve 150×200 cm'dir; ip veya kablo bağıyla gerilir.", sss: [{ q: "Neden yalnız 440 gr?", a: "280 gr ince branda iç mekân için yeterli olsa da bu seri dış cephe ve vitrin kullanımını da hedeflediği için tek seçenek 440 gr bırakıldı; fiyat katalogdaki 440 gr ile aynıdır." }] },
  { slug: "cadilar-bayrami-kagit-afis", taban: "afis-105gr", name: "Cadılar Bayramı Kâğıt Afiş — 105 gr Kuşe",
    short: "Parti duyurusu ve iç mekân süslemesi için 34×49 / 49×69 cm kuşe afiş, 250 adetten.",
    desc: "İç mekân duvarı, ilan panosu ve vitrin arkası için 105 gr kuşe kâğıda tek yön renkli afiş. Hazır konseptin üzerine parti tarihi, saat, mekân ve program eklenir; okul ve kafe etkinlik duyurusu için en ekonomik üründür. 34×49 ve 49×69 cm ebat, 250 adetten başlar; fiyat katalog afişiyle aynıdır.",
    features: ["105 gr kuşe, tam renkli", "İki ebat", "Etkinlik bilgisi ücretsiz eklenir"],
    useCases: ["Parti ve etkinlik duyurusu", "Okul panosu", "Kafe iç duvarı", "Dağıtım afişi"],
    ek: "Yağmur alan dış cephe için branda afişi seçin.", sss: [] },
  { slug: "cadilar-bayrami-etiket", taban: "etiket", name: "Cadılar Bayramı Etiketi — Kuşe Çıkartma",
    short: "Paket, bardak ve poşet için bal kabağı etiketleri; 1.000 adet, katalog fiyatı.",
    desc: "Şeker paketi, karton bardak, kraft çanta ve poşet üzerine yapıştırılan kuşe kâğıt çıkartma. Yuvarlak bal kabağı, yarasa ve \"31 Ekim\" motifleri hazır; işletme logosu eklenir. Vitrin sticker'ından farkı: kâğıt tabanlı ve küçüktür, cam değil ürün üzerine yapıştırılır. Ebat ve selefon seçenekleri ile fiyat katalog etiketiyle aynıdır.",
    features: ["90 gr kuşe, yapışkanlı", "Tabaka hâlinde teslim", "Selefonlu seçenek"],
    useCases: ["Şeker ve kurabiye paketi", "Karton bardak", "Kraft çanta", "Hediye poşeti"],
    ek: "Yuvarlak kesim için özel kesimli seçeneği tercih edin.", sss: [] },
  { slug: "cadilar-bayrami-kraft-canta", taban: "canta", tut: { paket: ["cnt1-kraft", "cnt3-kraft"] }, name: "Cadılar Bayramı Kraft Çanta",
    short: "Şeker ve hediye için baskılı kraft çanta; 500 adetten, katalog fiyatı.",
    desc: "Kraft kâğıt çanta üzerine tek renk bal kabağı ve \"Cadılar Bayramı\" baskısı; şeker, kurabiye ve küçük hediye için. Pastane ve kafelerde paket servisin sezonluk hâli. İki kraft ebat, 500 adetten; fiyat katalog çantasıyla aynıdır.",
    features: ["Kraft kâğıt, ip sap", "Tek renk turuncu veya siyah baskı", "Logo eklenir"],
    useCases: ["Pastane ve kafe paket servisi", "Okul şeker dağıtımı", "Mağaza hediye paketi"],
    ek: "Ölçü kodlarının cm karşılıkları seçenek açıklamasında yazar.", sss: [] },
  { slug: "cadilar-bayrami-ayakli-figur", taban: "ayakli-dekota-baski", name: "Cadılar Bayramı Ayaklı Bal Kabağı Figürü — 7 mm Dekota",
    short: "Kapı önü ve giriş için CNC kesimli, çift ayaklı bal kabağı / cadı figürü; 7 mm dekota, m² fiyatı.",
    desc: "7 mm dekota levhaya UV baskı, CNC ile konturundan kesim ve çift ayaklı stand. Bal kabağı, cadı, hayalet ve kuru kafa figürleri 60-150 cm boyda hazır; yüz kısmı boş bırakılan fotoğraf panosu versiyonu da aynı üründen sipariş edilir (sipariş notuna \"fotoğraf panosu\" yazın). Ölçüyü cm olarak girin; fiyat katalogdaki Ayaklı Dekota ile aynıdır.",
    features: ["7 mm dekota, dış mekâna uygun", "CNC kontur kesim", "Çift ayaklı stand dahil", "Fotoğraf panosu seçeneği"],
    useCases: ["Kafe ve mağaza kapı önü", "Okul etkinlik girişi", "AVM fotoğraf köşesi", "Parti alanı"],
    ek: "Ayaklı ürün yalnız 7 mm üretilir; duvara asılacak figürler için Dekota Figür ürününü seçin.", sss: [{ q: "Fotoğraf panosu nasıl olur?", a: "Figürün yüz bölgesi CNC ile boş kesilir, misafir arkasına geçip fotoğraf çektirir. Boy 150-180 cm önerilir; tasarım ekibi yüz boşluğunu göz hizasına yerleştirir." }] },
  { slug: "cadilar-bayrami-dekota-figur", taban: "dekota-baski-5mm", name: "Cadılar Bayramı Dekota Figür ve Tabela — CNC Kesim",
    short: "Duvara asılan bal kabağı, yarasa, cadı figürleri ve \"Korku Evi\" yönlendirme tabelaları; dekota, CNC kesim.",
    desc: "3-10 mm dekota levhaya UV baskı ve CNC kesim: duvara vidalanan veya bantla asılan bal kabağı ve cadı figürleri, yarasa sürüsü, \"Korku Evi →\" ve \"Şeker mi Şaka mı?\" yönlendirme tabelaları, masa üstü küçük figürler. Ölçüyü girin, ek işlemde CNC kesimi seçin; fiyat katalog dekota baskısıyla aynıdır.",
    features: ["3 / 5 / 7 / 10 mm seçenekleri", "CNC kontur kesim", "Çift yön baskı seçeneği", "Vida veya bantla montaj"],
    useCases: ["Duvar figürü", "Yönlendirme tabelası", "Masa üstü figür", "Vitrin içi dekor"],
    ek: "Ayaklı stand isteyen figürler için Ayaklı Bal Kabağı Figürü ürününü seçin.", sss: [] },
  { slug: "cadilar-bayrami-rollup", taban: "rollup-standart", name: "Cadılar Bayramı Roll-Up — 85×200 cm",
    short: "Etkinlik girişi ve kafe köşesi için hazır tasarımlı roll-up stand; katalog fiyatı.",
    desc: "85×200 cm alüminyum mekanizmalı roll-up, hazır Cadılar Bayramı tasarımıyla; etkinlik adı, tarih ve program eklenir. Kurulumu bir dakika sürer, sezon sonunda toplanıp gelecek yıl tekrar kullanılır. Yalnız baskı (mevcut mekanizmanız için) veya mekanizma + baskı seçilir.",
    features: ["Alüminyum mekanizma, çanta dahil", "Yalnız baskı seçeneği", "Bir dakikada kurulum"],
    useCases: ["Etkinlik girişi", "Kafe köşesi", "Okul salonu", "AVM aktivite alanı"],
    ek: "Alt 15 cm mekanizmada kalır; önemli görsel üst 180 cm'e yerleştirilir.", sss: [] },
  { slug: "cadilar-bayrami-yelken-bayrak", taban: "yelken-bayrak", name: "Cadılar Bayramı Yelken Bayrak — 75×300 cm",
    short: "Dış mekân ve etkinlik alanı için turuncu-siyah yelken bayrak; kumaş veya takım.",
    desc: "75×300 cm polyester kumaşa çift taraflı görünen süblimasyon baskı; turuncu zemin üzerine siyah bal kabağı ve yarasa motifleri, \"31 Ekim\". Yalnız kumaş (mevcut direğiniz için) veya direk + döner başlık + taban takımı. Fiyat katalog yelken bayrağıyla aynıdır.",
    features: ["Çift taraflı görünür baskı", "Rüzgârda döner", "Takım: direk, başlık, su dolan taban"],
    useCases: ["AVM ve etkinlik alanı", "Mağaza önü", "Okul bahçesi"],
    ek: "", sss: [] },
  { slug: "cadilar-bayrami-amerikan-servis", taban: "amerikan-servis", name: "Cadılar Bayramı Amerikan Servis",
    short: "Restoran ve pastane masası için temalı servis kâğıdı; 2.000 adetten, katalog fiyatı.",
    desc: "Masa üstü tek kullanımlık servis kâğıdı, kenar süslemeli Cadılar Bayramı deseni ve ortada işletme logosu. Üç ebat ve gramaj seçeneği, 2.000 adetten; fiyat katalog Amerikan servisiyle aynıdır.",
    features: ["Tek yön renkli baskı", "Üç ebat", "Logo ve menü alanı"],
    useCases: ["Restoran masası", "Pastane ve kafe", "Okul yemekhanesi etkinliği"],
    ek: "", sss: [] },
  { slug: "cadilar-bayrami-davetiye", taban: "el-ilani", tut: { paket: ["a7", "a5", "a4"] }, name: "Cadılar Bayramı Davetiye ve El İlanı",
    short: "Parti davetiyesi, menü ve etkinlik programı; A7 / A5 / A4, 105 gr kuşe, 2.000 adetten.",
    desc: "Kafe partisi, okul etkinliği ve mağaza kampanyası için davetiye ve el ilanı; 105 gr kuşe kâğıda tek yön renkli. A7 davetiye, A5 program, A4 menü olarak kullanılır; tarih, saat ve mekân bilgisi hazır tasarıma eklenir. Fiyat katalog el ilanıyla aynıdır.",
    features: ["Üç ebat", "105 gr kuşe", "Metin ve program ücretsiz dizilir"],
    useCases: ["Parti davetiyesi", "Etkinlik programı", "Temalı menü", "Kapı kapı dağıtım"],
    ek: "", sss: [] },
  { slug: "cadilar-bayrami-fosforlu-sticker", taban: "lumen-folyo", name: "Cadılar Bayramı Fosforlu Sticker — Karanlıkta Parlayan",
    short: "Gündüz şarj olur, gece parlar: yarasa, hayalet, kuru kafa, göz ve el izi setleri; m² fiyatlı.",
    desc: "Fotolüminesan (fosforlu) kendinden yapışkanlı folyodan kesim sticker: ışıkta şarj olur, ışık kapanınca yeşilimsi parlar. Setler: uçan yarasa sürüsü, hayaletler, kuru kafalar, karanlıkta bakan gözler, kanlı el izleri ve örümcekler; duvar, cam, tavan ve merdiven için. Toplam alanı girin, sipariş notuna set tercihinizi yazın; fiyat katalogdaki lümen folyo ile aynıdır. Laminasyon ek işlemi elle temas edilen yüzeylerde ömrü uzatır.",
    features: ["Karanlıkta 6-8 saat parlar", "Kendinden yapışkanlı, iz bırakmaz", "6 farklı motif seti", "İç mekân ve korunaklı dış alan"],
    useCases: ["Korku evi ve parti alanı", "Kafe tavanı ve merdiven", "Okul etkinlik koridoru", "Vitrin gece efekti"],
    ek: "Setler: yarasa, hayalet, kuru kafa, göz, el izi, örümcek; karışık set de seçilebilir.", sss: [{ q: "Ne kadar süre parlar?", a: "Gün ışığı veya mağaza aydınlatmasında 20-30 dakika şarj olur; ışık kapandıktan sonra ilk saat güçlü, 6-8 saat boyunca azalarak parlar. Her gün yeniden şarj olur, sezon boyunca kullanılır." }] },
  { slug: "cadilar-bayrami-lightbox", taban: "lightbox-led-100cm", name: "Cadılar Bayramı Işıklı Pano — LED Lightbox",
    short: "Kafe girişi için gece parlayan temalı ışıklı pano; 60×40, 100×70, 150×100 cm, teklif alın.",
    desc: "Alüminyum kasa, LED aydınlatma ve backlit baskılı ışıklı pano; siyah zemin üzerine turuncu bal kabağı yüzü ve \"Cadılar Bayramı\" yazısı gece ışıkla öne çıkar. Mevcut lightbox sahipleri için yalnız baskı değişimi de yapılır. Üç ebat; fiyat teklifi 1 iş gününde iletilir.",
    features: ["LED, 220 V fişli", "Backlit ışık geçirgen baskı", "Yalnız baskı değişimi seçeneği"],
    useCases: ["Kafe ve bar girişi", "Mağaza cephesi", "Etkinlik alanı"],
    ek: "Tasarım önerisi: siyah zemin, ortada büyük gülen bal kabağı yüzü, alt bantta krem yazı; gece yalnız gözler ve ağız parlayacak şekilde tasarlanır.", sss: [] },
];

// ---------------------------------------------------------------- Yazma
const yaz = async () => {
  const lj = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) })).json();
  const H = { "content-type": "application/json", authorization: `Bearer ${lj.accessToken || lj.access_token || lj.token}` };
  const fail = async (ad, r) => { console.error(`✗ ${ad}:`, r.status, (await r.text()).slice(0, 300)); process.exit(1); };
  return { H, fail };
};
const temizOpt = ({ id: _i, productId: _p, createdAt: _c, updatedAt: _u, ...o }) => ({ ...o, rules: o.rules ?? undefined, optionSublabel: o.optionSublabel ?? undefined });
const temizRow = (r) => ({ groupKey: r.groupKey ?? undefined, optionKey: r.optionKey ?? undefined, dimKey: r.dimKey ?? undefined, price: Number(r.price), cost: r.cost == null ? undefined : Number(r.cost) });

let cat = await getJson(`/categories/${CAT_SLUG}`);
console.log(`kategori: ${cat?.id ? "mevcut " + cat.id : "OLUŞTURULACAK"} · ${category.name}`);
const plan = [];
for (const u of URUNLER) {
  const t = await getJson(`/products/${u.taban}`);
  if (!t?.id) { console.error("✗ taban yok:", u.taban); process.exit(1); }
  let opts = t.options.map(temizOpt), rows = t.prices.map(temizRow);
  if (u.tut) for (const [g, keys] of Object.entries(u.tut)) { opts = opts.filter((o) => o.groupKey !== g || keys.includes(o.optionKey)); rows = rows.filter((r) => r.groupKey !== g || keys.includes(r.optionKey)); }
  const mevcut = await getJson(`/products/${u.slug}`);
  plan.push({ u, t, opts, rows, mevcut });
  console.log(`  ${mevcut?.id ? "güncelle" : "OLUŞTUR "} ${u.slug.padEnd(36)} ← ${u.taban.padEnd(22)} ${t.pricingMode.padEnd(8)} ${String(opts.length).padStart(2)} seçenek ${String(rows.length).padStart(2)} satır · img ${mevcut?.images?.length ?? t.images.length}`);
}
if (DRY) { console.log("\n[DRY] yazılmadı"); process.exit(0); }

const { H, fail } = await yaz();
if (!cat?.id) {
  const ilkImg = plan[0].t.images[0];
  const r = await fetch(`${API}/api/categories`, { method: "POST", headers: H, body: JSON.stringify({ ...category, imageUrl: ilkImg }) });
  if (!r.ok) await fail("kategori oluşturma", r);
  cat = await r.json(); console.log("✓ kategori oluşturuldu:", cat.id);
}
{ const { slug: _s, ...rest } = category; const r = await fetch(`${API}/api/categories/${cat.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ ...rest, content: categoryContent, isActive: true }) }); if (!r.ok) await fail("kategori içerik", r); }

for (const { u, t, opts, rows, mevcut } of plan) {
  const content = {
    brand: "Markala",
    seo: { title: `${u.name.split(" — ")[0]} | Cadılar Bayramı 2026`, description: u.short.length > 160 ? u.short.slice(0, 157) + "…" : u.short },
    faqs: [...u.sss, ...ORTAK_SSS],
    seoBolumler: [ORTAK_BOLUM(u.name.split(" — ")[0], u.ek), { baslik: "Malzeme, ölçü ve fiyat", paragraflar: [`Bu ürün katalogdaki "${t.name}" ürününün kampanya versiyonudur: aynı malzeme, aynı seçenekler ve birebir aynı fiyat. Üretim ${t.productionTime || "1-2 iş günü"}, kargo 2-4 iş günü; 27 Ekim'e kadar verilen siparişler 31 Ekim öncesi teslim edilir.`] }],
    relatedSlugs: URUNLER.filter((x) => x.slug !== u.slug).slice(0, 4).map((x) => x.slug).concat([u.taban]),
    kampanya: "cadilar-bayrami-2026",
  };
  const govde = { name: u.name, shortDescription: u.short, description: u.desc, productionTime: t.productionTime || "1-2 iş günü", sizeLabel: t.sizeLabel || "", badges: ["Cadılar Bayramı"], bestseller: false, isActive: true, categoryId: cat.id };
  let id = mevcut?.id;
  if (!id) {
    const r = await fetch(`${API}/api/products`, { method: "POST", headers: H, body: JSON.stringify({ slug: u.slug, ...govde, images: t.images, basePrice: 0, startingPrice: 0 }) });
    if (!r.ok) await fail(`ürün ${u.slug}`, r);
    id = (await r.json()).id; console.log("✓ oluşturuldu", u.slug);
  }
  let r = await fetch(`${API}/api/products/${id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options: opts }) }); if (!r.ok) await fail(`seçenek ${u.slug}`, r);
  r = await fetch(`${API}/api/products/${id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices: rows }) }); if (!r.ok) await fail(`fiyat ${u.slug}`, r);
  r = await fetch(`${API}/api/products/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ ...govde, pricingMode: t.pricingMode, content: { ...(mevcut?.content || {}), ...content, features: u.features, useCases: u.useCases } }) }); if (!r.ok) await fail(`patch ${u.slug}`, r);
  const y = await getJson(`/products/${u.slug}`);
  console.log(`  ✓ ${u.slug.padEnd(36)} displayPrice ${y.displayPrice} (taban ${t.displayPrice})${Number(y.displayPrice) === Number(t.displayPrice) || (u.tut && y.displayPrice) ? "" : "  ⚠ farklı"}`);
}
console.log(`\n→ https://markala.com.tr/kategori/${CAT_SLUG}`);
