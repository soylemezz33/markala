#!/usr/bin/env node
/**
 * İSG levha kataloğu için içerik üreteci (827 ürün).
 *
 * TASARIM İLKESİ — kopya içerik üretmemek:
 *   specifications  → ürünün GERÇEK option verisinden (ebat/malzeme/baskı/adet).
 *                     Katalogdaki tüm İSG ürünleri aynı seçenek setini paylaşıyor
 *                     (doğrulandı), dolayısıyla teknik özelliklerin ortak olması
 *                     gerçeğe uygundur — uydurma değil.
 *   features        → işaret sınıfı (renk/biçim kodu) + konu + ÜRÜN ADI ile kurulur.
 *   useCases        → ürün adından çıkarılan KONU'ya göre havuzdan seçilir.
 *   faqs            → 1) sınıfın renk/biçim mantığı 2) bu levha nereye asılır
 *                     3) malzeme/ebat seçimi — hepsi ürün adıyla kişiselleştirilir.
 *
 * Havuzdan seçim slug hash'iyle deterministiktir: her ürün farklı kombinasyon alır,
 * aynı ürün her çalıştırmada aynı içeriği üretir (idempotent).
 *
 * Kullanım:
 *   node scripts/isg-icerik/uret.mjs <girdi.json> <cikti.json>
 *   girdi: [{slug, name, cat}, ...]
 */

import fs from "node:fs";

// ─── Teknik özellikler: katalogdaki gerçek seçenekler ────────────────────────
const SPECS = [
  { label: "Ebat seçenekleri", value: "25×35, 35×50, 50×70, 70×100 cm" },
  {
    label: "Malzeme seçenekleri",
    value: "Yapışkanlı etiket (sticker), 0,50 mm PVC levha, 3 mm dekota/foreks, 0,50 mm galvaniz sac",
  },
  { label: "Baskı tipi", value: "UV baskı, reflektif folyo veya fosforlu lümen folyo" },
  { label: "Adet", value: "1 adetten 100 adede kadar; toplu alımda kademeli indirim" },
  {
    label: "Kullanım yeri",
    value: "İç ve dış mekân (dış mekân için PVC, dekota veya galvaniz sac önerilir)",
  },
  { label: "Montaj", value: "Sticker kendinden yapışkanlı; levha tiplerinde köşe delikli montaj talep edilebilir" },
];

// ─── İşaret sınıfları: yönetmelikteki renk/biçim kodları ─────────────────────
const SINIF = {
  "is-guvenligi-yasaklayici": {
    ad: "yasaklayıcı işaret",
    kod: "beyaz zemin üzerinde kırmızı daire ve çapraz bant, siyah piktogram",
    islev: "tehlikeye yol açabilecek bir davranışı yasaklar",
    sss: "Yasaklayıcı işaretler beyaz zemin üzerine kırmızı daire ve çapraz bantla gösterilir; siyah piktogram yasaklanan davranışı anlatır. Bu renk-biçim kodu yönetmelikteki sınıflandırmanın temelidir — farklı renkte bastırılan bir yasak levhası denetimde amacına uygun sayılmayabilir.",
  },
  "is-guvenligi-uyari-ikaz": {
    ad: "uyarı (ikaz) işareti",
    kod: "sarı zemin, siyah kenarlı üçgen, siyah piktogram",
    islev: "bir tehlike kaynağına karşı dikkat çağrısı yapar",
    sss: "Uyarı işaretleri sarı zemin üzerine siyah kenarlı üçgenle gösterilir. Üçgen biçim ve sarı renk, 'burada bir tehlike var, dikkatli ol' mesajının standart kodudur. Uyarı işareti bir davranışı zorunlu kılmaz; zorunluluk gerekiyorsa ayrıca mavi daireli emredici işaret asılır.",
  },
  "is-guvenligi-emredici-kkd": {
    ad: "emredici işaret",
    kod: "mavi daire içinde beyaz piktogram",
    islev: "belirli bir davranışı zorunlu kılar (özellikle kişisel koruyucu donanım kullanımı)",
    sss: "Emredici işaretler mavi daire içinde beyaz piktogramla gösterilir ve bir davranışı ZORUNLU kılar — özellikle kişisel koruyucu donanım (KKD) kullanımında. Sarı üçgen (uyarı) veya kırmızı daire (yasak) bu işlevi karşılamaz.",
  },
  "is-guvenligi-acil-ilk-yardim": {
    ad: "acil çıkış / ilk yardım işareti",
    kod: "yeşil zemin üzerine beyaz piktogram",
    islev: "kaçış yollarını, çıkışları, toplanma alanını ve ilk yardım noktalarını gösterir",
    sss: "Acil çıkış ve ilk yardım işaretleri yeşil zemin üzerine beyaz piktogramla gösterilir. Yeşil renk 'güvenli yön / yardım burada' anlamı taşır. Bu işaretlerin elektrik kesintisinde de okunabilmesi için fosforlu lümen folyo tercih edilmesi yaygın uygulamadır.",
  },
  "is-guvenligi-yangin": {
    ad: "yangınla mücadele işareti",
    kod: "kırmızı zemin üzerine beyaz piktogram",
    islev: "yangın ekipmanının yerini ve türünü gösterir",
    sss: "Yangınla mücadele işaretleri kırmızı zemin üzerine beyaz piktogramla gösterilir ve ekipmanın YERİNİ bildirir. Kırmızı daire + çapraz banttan (yasak işareti) farklıdır. Duman altında da görünürlük için fosforlu lümen folyo önerilir.",
  },
  "is-guvenligi-elektrik-voltaj": {
    ad: "elektrik tehlikesi uyarı işareti",
    kod: "sarı zemin, siyah kenarlı üçgen ve yıldırım piktogramı",
    islev: "elektrik çarpması riskine karşı uyarır",
    sss: "Elektrik tehlikesi, uyarı işaretleri sınıfındandır: sarı zemin, siyah kenarlı üçgen ve yıldırım piktogramı. Pano, trafo ve enerji hattı çevresinde, tehlikeli bölgeye girilmeden önce okunacak konuma asılır.",
  },
  "is-guvenligi-kalite-kontrol": {
    ad: "kalite kontrol / durum etiketi",
    kod: "durum rengine göre kodlanmış etiket (onaylı, ret, karantina)",
    islev: "bir malzemenin veya ekipmanın kontrol durumunu görünür kılar",
    sss: "Kalite kontrol etiketleri, malzemenin hangi aşamada olduğunu (onaylı / ret / karantina / kontrol bekliyor) tek bakışta gösterir. Renk ayrımı kritiktir: karışık stoklarda yanlış parçanın üretime girmesini önler.",
  },
  "is-guvenligi-trafik-saha": {
    ad: "saha trafiği uyarı/yönlendirme işareti",
    kod: "sarı zemin ve siyah üçgen (uyarı) ya da yönlendirme biçimi",
    islev: "araç-yaya ayrımını ve saha içi trafik kurallarını bildirir",
    sss: "Saha trafiği işaretleri forklift, vinç ve iş makinesi hareketinin olduğu alanlarda araç-yaya ayrımını sağlar. Bu alanlarda işaretleme, yer çizgileri ve bariyerlerle birlikte kullanıldığında etkilidir.",
  },
  "is-guvenligi-ges": {
    ad: "GES (güneş enerji santrali) uyarı işareti",
    kod: "elektrik tehlikesi kodu — sarı zemin, siyah üçgen, yıldırım piktogramı",
    islev: "panel, inverter ve DC hatlardaki elektrik riskine karşı uyarır",
    sss: "GES sahalarında panel ve DC hatlar gündüz sürekli gerilim üretir; şalter kapalıyken bile hat canlı olabilir. Bu nedenle inverter, kombiner kutusu ve DC hat güzergâhlarının ayrı ayrı işaretlenmesi gerekir.",
  },
  "is-guvenligi-bilgilendirme-talimat": {
    ad: "bilgilendirme / talimat levhası",
    kod: "okunaklı düz metin ve destekleyici piktogram",
    islev: "işyeri kuralını, talimatı veya bilgilendirmeyi kalıcı biçimde duyurur",
    sss: "Bilgilendirme ve talimat levhaları bir tehlikeyi değil, uyulması gereken kuralı veya süreci anlatır. Metnin uzaktan okunabilmesi için ebat seçimi önemlidir; talimat metinleri genelde 35×50 cm ve üzeri tercih edilir.",
  },
};

// ─── Konu tespiti: ürün adındaki anahtar kelimelerden ────────────────────────
// NOT: Türkçe ek almış hâlleri de yakalamak için kökler kısa tutuldu
// (gözlük → gözlüğü, baret → bareti, maske → maskesi). Sıra ÖNEMLİ: önce daha
// spesifik konu gelir. Örn. "Toz Gözlüğü Kullan" KKD'dir; "toz" kelimesi
// kimyasala çekmesin diye KKD kuralı kimyasaldan önce ve gözlük kökü ek-toleranslı.
const KONULAR = [
  { k: "koruyucu donanım", ad: "koruyucu donanım gerektiren",
    re: /baret|g[öo]zl[üuğ]|eldiven|maske|kulakl|ayakkab|siper|emniyet kemeri|kkd|koruyucu|tulum|yelek|maskes/i,
    kullanim: ["Şantiye ve inşaat sahası girişleri","Üretim hattı ve makine parkuru","Gürültülü bölgeler ve kompresör odaları","Kaynak ve taşlama istasyonları","KKD dolapları ve ekipman noktaları","Yüksekte çalışma platformları","Toz ve talaş çıkaran işlem alanları"] },
  { k: "su", ad: "su ve havuz bulunan",
    re: /y[üu]zme|havuz|su deposu|derin su|bo[ğg]ulma|denize|g[öo]let/i,
    kullanim: ["Havuz ve su deposu çevresi","Arıtma ve su toplama havuzları","Kanal ve rögar açıklıkları","Yangın suyu depoları","İskele ve kıyı çalışma alanları","Soğutma kuleleri"] },
  { k: "elektrik", ad: "elektrik",
    re: /elektrik|gerilim|voltaj|jenerat|trafo|kablo|pano|kv\b|[şs]alter|topraklama|invert/i,
    kullanim: ["Elektrik panoları ve dağıtım kabinleri","Trafo ve jeneratör odaları","Enerji nakil hattı ve saha direkleri","Kompanzasyon odaları","Şantiyede geçici elektrik dağıtım noktaları","Makine üzeri kumanda kabinleri"] },
  { k: "yangın", ad: "yangın riski olan", re: /yang[ıi]n|söndür|sondur|hortum|itfaiye|alev|yan[ıi]c[ıi]|parlay|tüp|tup/i,
    kullanim: ["Yangın söndürücü ve hidrant noktaları","Yangın dolabı ve alarm butonu çevresi","Yanıcı madde depoları","Kazan dairesi ve ısıl işlem alanları","Yakıt ve tüp depolama kabinleri","Kaynak ve kesme işlemi yapılan alanlar"] },
  { k: "saha", ad: "saha trafiği olan", re: /forklift|vin[çc]|ara[çc]|y[üu]kleme|kamyon|operat[öo]r|trafik|istif|palet|transpalet/i,
    kullanim: ["Forklift ve transpalet güzergâhları","Yükleme-boşaltma rampaları","Vinç ve kaldırma ekipmanı çalışma alanları","Depo içi araç-yaya geçişleri","Saha içi araç trafiği olan yollar","İstifleme ve raf alanları"] },
  { k: "kimyasal", ad: "kimyasal madde bulunan", re: /kimyasal|asit|radyoakt|zehir|tahri[şs]|gaz|toz|solvent|boya|tiner|korozif/i,
    kullanim: ["Kimyasal madde depoları ve dolapları","Laboratuvar ve numune alanları","Boyahane ve karışım bölümleri","Atık toplama noktaları","Gaz tüpü ve silindir depoları","Havalandırma gerektiren kapalı alanlar"] },
  { k: "yükseklik", ad: "yüksekte çalışılan", re: /merdiven|y[üu]ksek|d[üu][şs]me|bo[şs]lu|balkon|[çc]at[ıi]|iskele|platform|asans[öo]r/i,
    kullanim: ["İskele ve çalışma platformları","Çatı ve cephe çalışma alanları","Asansör ve merdiven boşlukları","Bodrum ve kat geçişleri","Bakım-onarım için yüksekte çalışılan noktalar","Korkuluksuz kenar ve açıklıklar"] },
  { k: "makine", ad: "makine ve ekipman", re: /makin|pres|torna|testere|ta[şs] motor|kesme|freze|matkap|band|konvey/i,
    kullanim: ["Makine ve pres istasyonları","Bakım-onarım yapılan ekipmanlar","Konveyör ve bant hatları","Torna, freze ve taşlama tezgâhları","Otomatik hareket eden ekipman çevresi","Koruyucu kapak ve siper bölgeleri"] },
  { k: "acil", ad: "acil çıkış", re: /acil|[çc][ıi]k[ıi][şs]|exit|toplanma|ilk yard[ıi]m|revir|sedye|kurtar/i,
    kullanim: ["Acil çıkış kapıları ve kaçış koridorları","Toplanma alanı yönlendirmeleri","İlk yardım dolabı ve revir noktaları","Merdiven ve kat çıkışları","Karanlıkta kalabilecek kaçış güzergâhları","Sedye ve acil ekipman noktaları"] },
  { k: "hijyen", ad: "hijyen gerektiren", re: /hijyen|el y[ıi]ka|sabun|klozet|tuvalet|g[ıi]da|temiz|maskes/i,
    kullanim: ["Gıda üretim ve paketleme alanları","Soyunma odaları ve lavabolar","Tuvalet ve ıslak hacimler","Yemekhane ve mutfak bölümleri","Temiz oda girişleri","Ziyaretçi giriş noktaları"] },
  { k: "sigara", ad: "yanıcı madde bulunan", re: /sigara|a[çc][ıi]k alev|ate[şs]|duman/i,
    kullanim: ["Yanıcı madde bulunan depolar","Yakıt dolum ve tank sahaları","Kapalı üretim alanları","Yemekhane ve dinlenme alanı sınırları","Ofis ve ortak kullanım alanları","Gaz tüpü depoları"] },
  { k: "kamera", ad: "güvenlik", re: /kamera|izlenmekte|g[üu]venlik sistem|ziyaret[çc]i|yetkisiz|giri[şs] yasak/i,
    kullanim: ["Bina ve saha giriş noktaları","Depo ve stok alanları","Ziyaretçi karşılama bölümleri","Otopark ve dış çevre","Yetkili personel bölgeleri","Kasa ve değerli malzeme alanları"] },
  { k: "ges", ad: "GES saha", re: /ges|panel|solar|g[üu]ne[şs] enerji|dc\b|string/i,
    kullanim: ["Panel dizileri ve string hatları","Inverter ve kombiner kutuları","DC kablo güzergâhları","Trafo ve bağlantı noktaları","Saha giriş ve çevre güvenliği","Bakım erişim yolları"] },
];

const GENEL_KULLANIM = [
  "Şantiye ve inşaat sahaları",
  "Fabrika ve üretim tesisleri",
  "Depo ve lojistik alanları",
  "Atölye ve bakım bölümleri",
  "Ofis ve ortak kullanım alanları",
  "Ziyaretçi ve personel giriş noktaları",
];

/** Slug'dan deterministik sayı — havuzdan stabil seçim için. */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/**
 * Havuzdan n adet, slug'a göre stabil seçim.
 * Deterministik Fisher-Yates: tam permütasyon üretip ilk n'i alır — böylece
 * HER ZAMAN tam n farklı öğe döner. (Önceki "stride" yaklaşımı havuz boyutuyla
 * ortak çarpan yakaladığında erken döngüye giriyor ve 4 yerine 2-3 öğe
 * dönebiliyordu; 827 üründen 508'i eksik kullanım alanı almıştı.)
 */
function sec(havuz, n, slug, offset = 0) {
  let seed = hash(slug + offset) || 1;
  const rnd = () => {
    // xorshift32 — deterministik, hızlı
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5;  seed >>>= 0;
    return seed / 0x100000000;
  };
  const arr = havuz.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

function konuBul(ad) {
  return KONULAR.find((k) => k.re.test(ad)) || null;
}

/** Ürün adını cümle içinde kullanılacak biçime indirger ("... Levhası" ekini atar). */
function sadeAd(ad) {
  return ad.replace(/\s*(levhas[ıi]|levha|etiketi|etiket|sticker)\s*$/i, "").trim() || ad;
}

export function icerikUret({ slug, name, cat }) {
  const s = SINIF[cat];
  if (!s) throw new Error(`bilinmeyen kategori: ${cat}`);
  const konu = konuBul(name);
  const kisa = sadeAd(name);

  const features = [
    `"${kisa}" mesajı, ${s.ad} standardına uygun ${s.kod} ile üretilir`,
    `${s.islev.charAt(0).toUpperCase()}${s.islev.slice(1)}`,
    "Dış mekâna dayanıklı UV baskı; solmaya ve hava koşullarına karşı dirençli",
    "Loş alanlar ve elektrik kesintisi için fosforlu lümen folyo seçeneği",
    konu
      ? `${konu.ad.charAt(0).toUpperCase()}${konu.ad.slice(1)} alanlarda kalıcı kullanım için PVC, dekota ve galvaniz sac seçenekleri`
      : "Yapışkanlı etiketten galvaniz saca dört farklı zemin seçeneği",
  ];

  const havuz = konu ? konu.kullanim : GENEL_KULLANIM;
  const useCases = sec(havuz, 4, slug);

  const faqs = [
    {
      question: `${kisa} levhası hangi renk ve biçimde olmalı?`,
      answer: s.sss,
    },
    {
      question: `"${kisa}" levhası nereye asılmalı?`,
      answer:
        `Levha, ilgili duruma maruz kalınmadan ÖNCE görülecek noktaya asılır — alanın içine değil, o alana yaklaşan kişinin ilk göreceği mesafeye. ` +
        (konu
          ? `${havuz[0]} gibi noktalarda giriş yönünden okunabilir olması esastır. `
          : `Birden fazla girişi olan alanlarda her giriş ayrı ayrı işaretlenmelidir. `) +
        `Okuma mesafesi arttıkça ebat da büyütülmelidir.`,
    },
    {
      question: "Hangi malzeme ve ebadı seçmeliyim?",
      answer:
        "Kapalı, kuru ve korunaklı yüzeylerde yapışkanlı etiket yeterlidir. Dış mekân, nemli ortam ve darbe riski olan alanlarda 0,50 mm PVC levha veya 3 mm dekota; ağır sanayi ve yıkama yapılan bölgelerde 0,50 mm galvaniz sac önerilir. Ebat okuma mesafesine göre seçilir: yakın mesafe için 25×35 cm, alan geneline uyarı için 50×70 cm ve üzeri.",
    },
  ];

  // Boşluk normalizasyonu: ürün adı ek temizliğinden ve şablon birleştirmeden
  // arta kalan çift boşlukları temizler.
  const nrm = (t) => t.replace(/\s+/g, " ").trim();
  return {
    specifications: SPECS,
    features: features.map(nrm),
    useCases: useCases.map(nrm),
    faqs: faqs.map((f) => ({ question: nrm(f.question), answer: nrm(f.answer) })),
  };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith("uret.mjs")) {
  const [, , girdi, cikti] = process.argv;
  if (!girdi || !cikti) {
    console.error("kullanım: node uret.mjs <girdi.json> <cikti.json>");
    process.exit(1);
  }
  const list = JSON.parse(fs.readFileSync(girdi, "utf8"));
  const out = list.map((p) => ({ slug: p.slug, name: p.name, cat: p.cat, ...icerikUret(p) }));
  fs.writeFileSync(cikti, JSON.stringify(out, null, 1), "utf8");

  // Kalite kontrolü: benzersizlik ölçümü
  const uniqUse = new Set(out.map((o) => o.useCases.join("|")));
  const uniqFaq = new Set(out.map((o) => o.faqs.map((f) => f.question).join("|")));
  const uniqFeat = new Set(out.map((o) => o.features.join("|")));
  console.log(`Üretildi: ${out.length} ürün`);
  console.log(`  benzersiz kullanım alanı kombinasyonu: ${uniqUse.size}`);
  console.log(`  benzersiz SSS soru seti:               ${uniqFaq.size}`);
  console.log(`  benzersiz özellik seti:                ${uniqFeat.size}`);
}
