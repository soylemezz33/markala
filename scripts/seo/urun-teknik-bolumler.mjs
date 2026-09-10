#!/usr/bin/env node
/**
 * ÜRÜN SAYFALARINA TEKNİK BÖLÜMLER (Faz 1 son parça, 2026-09-10).
 *
 * 789 aktif ürüne content.seoBolumler yazar (kategori sayfasıyla aynı yapı: baslik +
 * paragraflar + liste + tablo). Metin KATEGORİ ŞABLONUNDAN üretilir ama ürün adı, ürünün
 * gerçek seçenekleri (ebat, malzeme, baskı tipi, adet kademeleri) ve üretim süresi ürüne
 * göre doldurulur → her sayfa kendi seçeneklerini anlatır, kopya metin olmaz.
 *
 * Kurallar: mevcut content anahtarlarına DOKUNMAZ (faqs/seo/features korunur), yalnız
 * seoBolumler yazar; --force yoksa seoBolumler'i olan ürünü atlar. Fiyat YAZILMAZ
 * (kur/marja bağlı), yalnız fiyatı belirleyen etkenler anlatılır.
 *
 * Kullanım: node scripts/seo/urun-teknik-bolumler.mjs --dry [--kategori slug] [--limit N] [--force]
 *           node scripts/seo/urun-teknik-bolumler.mjs            (yazar)
 * Kimlik: markala-google/.env ADMIN_*.
 */
import { readFileSync } from "node:fs";
try { for (const l of readFileSync("C:/Users/Administrator/Projects/markala-google/.env", "utf8").split(String.fromCharCode(10))) { const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), "")); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); } } catch { /* env dışarıdan */ }

const API = process.env.API_URL || "https://api.markala.com.tr";
const args = process.argv.slice(2);
const DRY = args.includes("--dry"), FORCE = args.includes("--force");
const KAT = args.includes("--kategori") ? args[args.indexOf("--kategori") + 1] : null;
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const getJson = async (p) => { const r = await fetch(`${API}/api${p}`); return r.ok ? r.json() : null; };
const liste = (xs) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " ve " + xs[xs.length - 1];
const opts = (p, g) => (p.options || []).filter((o) => o.groupKey === g).sort((a, b) => a.optionSort - b.optionSort).map((o) => o.optionLabel.trim());
const adetler = (p) => opts(p, "adet");
const uretim = (p) => p.productionTime || "2-3 iş günü";

// ---------------------------------------------------------------- İSG (10 kategori, 728 ürün)
const ISG = {
  "is-guvenligi-uyari-ikaz": { tur: "uyarı (ikaz) levhası", renk: "sarı zemin üzerine siyah üçgen", seri: "ISO 7010 W serisi", ne: "bir tehlikenin varlığını (düşme, sıkışma, sıcak yüzey, kimyasal) önceden bildirir" },
  "is-guvenligi-yasaklayici": { tur: "yasaklayıcı levha", renk: "beyaz zemin üzerine kırmızı çember ve çapraz çizgi", seri: "ISO 7010 P serisi", ne: "tehlikeli bir davranışı (sigara içmek, girmek, dokunmak) yasaklar" },
  "is-guvenligi-emredici-kkd": { tur: "emredici (zorunluluk) levhası", renk: "mavi daire üzerine beyaz piktogram", seri: "ISO 7010 M serisi", ne: "kişisel koruyucu donanım kullanımı gibi zorunlu bir davranışı emreder" },
  "is-guvenligi-acil-ilk-yardim": { tur: "acil çıkış ve ilk yardım levhası", renk: "yeşil zemin üzerine beyaz piktogram", seri: "ISO 7010 E serisi", ne: "kaçış yolunu, toplanma alanını veya ilk yardım noktasını gösterir" },
  "is-guvenligi-yangin": { tur: "yangın güvenliği levhası", renk: "kırmızı zemin üzerine beyaz piktogram", seri: "ISO 7010 F serisi", ne: "yangın söndürücü, hortum, alarm butonu gibi ekipmanın yerini gösterir" },
  "is-guvenligi-elektrik-voltaj": { tur: "elektrik uyarı levhası", renk: "sarı zemin üzerine siyah şimşek üçgeni", seri: "ISO 7010 W012 ve türevleri", ne: "elektrik çarpması, yüksek gerilim ve pano tehlikelerini bildirir" },
  "is-guvenligi-trafik-saha": { tur: "saha ve iç trafik levhası", renk: "sarı veya kırmızı zemin, siyah/beyaz piktogram", seri: "ISO 7010 ve saha içi trafik işaretleri", ne: "forklift, araç ve yaya trafiğini düzenler, hız ve öncelik kurallarını bildirir" },
  "is-guvenligi-kalite-kontrol": { tur: "kalite kontrol etiketi", renk: "yeşil (kabul), kırmızı (red) veya sarı (bekleme) zemin", seri: "ISO 9001 madde 8.5.2 tanımlama ve izlenebilirlik", ne: "ürünün muayene durumunu (kabul, red, karantina, onaylı) gösterir" },
  "is-guvenligi-ges": { tur: "güneş enerjisi santrali (GES) uyarı levhası", renk: "sarı zemin üzerine siyah piktogram", seri: "IEC 62446-1 ve IEC 61730 etiketleme gereklilikleri", ne: "DC gerilim, ters besleme ve izolasyon tehlikelerini bildirir" },
  "is-guvenligi-bilgilendirme-talimat": { tur: "bilgilendirme ve talimat levhası", renk: "mavi veya yeşil zemin, beyaz yazı", seri: "Sağlık ve Güvenlik İşaretleri Yönetmeliği ek-II", ne: "çalışma kuralını, talimatı veya yön bilgisini yazılı olarak verir" },
};
const MALZEME = {
  "Yapışkanlı Etiket (Sticker)": "Kendinden yapışkanlı folyo etiket; cam, metal ve boyalı düz yüzeylere doğrudan yapıştırılır, iç mekân ve korunaklı alanlar için en ekonomik seçenektir.",
  "0,50 mm PVC Levha": "0,50 mm esnek PVC; hafiftir, köşelerinden vidalanır veya çift taraflı bantla monte edilir, kapalı alan ve ofis duvarları için uygundur.",
  "3 mm Dekota / Foreks": "3 mm rijit PVC köpük levha; dış mekân, şantiye ve nemli alanlarda deforme olmaz, vida veya dübelle duvara sabitlenir.",
  "0,50 mm Galvaniz Sac": "Galvaniz sac üzerine UV baskı; darbe, ısı ve hava koşullarına en dayanıklı gövde, saha çiti, direk ve açık alan montajı için tercih edilir.",
};
const BASKI = {
  "UV Baskı": "UV kürlenmeli dijital baskı; solmaya ve suya dayanıklı, standart seçenek.",
  "Reflektif Folyo": "Reflektif (ışık yansıtan) folyo; araç farı ve el feneri altında parlar, gece çalışan saha ve otopark uygulamaları için.",
  "Fosforlu Lümen Folyo": "Fotolüminesan folyo; gün ışığıyla şarj olur, elektrik kesildiğinde karanlıkta parlar. Kaçış yolu ve yangın ekipmanı işaretlerinde ISO 16069 bu özelliği ister.",
};
const EBAT_MESAFE = { "25×35 cm": "yaklaşık 10 m", "35×50 cm": "yaklaşık 15 m", "50×70 cm": "yaklaşık 20 m", "70×100 cm": "yaklaşık 30 m" };

function isgBolumler(p, cat) {
  const k = ISG[cat]; const ad = p.name.replace(/\s+levhası$/i, "");
  const malz = opts(p, "malzeme"), baski = opts(p, "baski"), ebat = opts(p, "ebat"), adet = adetler(p);
  return [
    { baslik: `${ad} levhası hangi malzemede basılır?`,
      paragraflar: [`${p.name}, ${k.ne}; ${k.renk} ile ${k.seri} tasarım kurallarına göre hazırlanır. Katalogda ${malz.length} zemin ve ${baski.length} baskı tipi seçilebilir; hepsi tek adetten üretilir.`],
      liste: [...malz.filter((m) => MALZEME[m]).map((m) => `${m}: ${MALZEME[m]}`), ...baski.filter((b) => BASKI[b]).map((b) => `${b}: ${BASKI[b]}`)] },
    { baslik: "Ebat seçimi ve görüş mesafesi",
      paragraflar: [`Levha boyu, işaretin okunması gereken en uzak noktaya göre seçilir (ISO 3864-1 görüş mesafesi yaklaşımı). ${liste(ebat)} ebatları mevcuttur; kapı, pano ve makine üstü gibi yakın mesafeler için küçük, koridor sonu, saha ve cephe için büyük ebat kullanılır.`],
      tablo: { basliklar: ["Ebat", "Önerilen en uzak okuma mesafesi", "Tipik kullanım"], satirlar: ebat.map((e) => [e, EBAT_MESAFE[e] || "-", e === "25×35 cm" ? "Kapı, pano kapağı, makine gövdesi" : e === "35×50 cm" ? "Koridor, atölye duvarı, depo rafı" : e === "50×70 cm" ? "Saha girişi, üretim hattı, yükleme alanı" : "Cephe, şantiye çiti, açık saha"]), not: "Mesafeler yaklaşık değerdir; ışık koşulu ve piktogram karmaşıklığına göre bir üst ebat seçilebilir." } },
    { baslik: "Montaj, kullanım ve mevzuat",
      paragraflar: [`6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Sağlık ve Güvenlik İşaretleri Yönetmeliği, tehlike bulunan noktalarda uygun işaretin bulunmasını işverenin sorumluluğuna verir. ${p.name} bu kapsamda ${k.seri} biçimine uygun üretilir. Levha, göz hizasında (yerden 150-170 cm) ve tehlikeye yaklaşırken doğrudan görülecek konuma asılır; kapı üstü ve yükseklik gerektiren yerlerde eğim verilmez.`, `Yapışkanlı etiket temiz ve kuru yüzeye tek seferde uygulanır; PVC, dekota ve galvaniz levhalar köşelerden vidalanır veya montaj bandıyla sabitlenir. ${adet.length ? `Adet seçenekleri ${liste(adet)}; ` : ""}üretim süresi ${uretim(p)}, kargo Türkiye genelinde 2-4 iş günüdür. Farklı metin veya logo istenirse sipariş notuna yazılır, tasarım ekibi ücretsiz uyarlar.`] },
  ];
}

// ---------------------------------------------------------------- DİĞER KATEGORİLER
const teslimat = (p, ek = "") => ({ baslik: "Dosya hazırlığı ve teslimat", paragraflar: [`Baskı dosyası CMYK renk uzayında, 300 dpi çözünürlükte ve her kenarda 3 mm taşma payıyla PDF, AI, PSD veya TIFF olarak yüklenir; yazılar vektöre (curves) çevrilir. Dosyanız yoksa sipariş notuna içeriği yazmanız yeterlidir, tasarım ekibi ücretsiz hazırlar ve baskı öncesi onayınıza sunar. ${ek}Üretim süresi ${uretim(p)}, kargo 81 ile 2-4 iş günüdür; 1.500 ₺ üzeri siparişlerde kargo ücretsizdir. Fiyatlar KDV dahildir ve sepette anında hesaplanır.`] });
const adetSec = (p, birim = "adet") => { const a = adetler(p); return a.length ? `Adet kademeleri ${liste(a)}; kademe büyüdükçe ${birim} başına maliyet düşer, çünkü makine hazırlığı sabit bir giderdir.` : ""; };

const DIGER = {
  kartvizit: (p) => [
    { baslik: `${p.name} nasıl üretilir?`, paragraflar: [`Kartvizit 350-800 gr arası kartona ofset veya dijital baskıyla basılır; katalogdaki seçenek ${liste(opts(p, "paket").slice(0, 6))}${opts(p, "paket").length > 6 ? " ve diğerleri" : ""}. Sıvama kartvizit iki kartonun sırt sırta yapıştırılmasıyla 800 gr kalınlığa ulaşır, oval köşe ve özel kesim bıçakla yapılır, yaldız ve kabartma ise baskı sonrası ayrı bir işlemdir.`] },
    { baslik: "Ölçü, adet ve fiyatı belirleyen etkenler", paragraflar: [`Standart kartvizit ölçüsü 85×55 mm'dir (kesim sonrası). ${adetSec(p, "kart")} Fiyatı belirleyen üç şey karton gramajı, selefon veya lak türü ve yaldız/kabartma gibi ek işlemlerdir; tek yüz ve çift yüz baskı fiyatı değiştirir.`] },
    teslimat(p, "Kartvizitte 5 mm güvenli alan bırakın; kenara yakın yazı kesimde gidebilir. "),
  ],
  brosur: (p) => [
    { baslik: `${p.name}: kâğıt, gramaj ve katlama`, paragraflar: [`Broşür kuşe kâğıda tek veya çift yön renkli basılır; katalogdaki ebatlar ${liste(opts(p, "paket"))}. Gramaj arttıkça kâğıt sertleşir ve arkadan görünme (ışık geçirgenliği) azalır; 115 gr günlük dağıtım, 128-170 gr sunum, 200 gr selefonlu ise kalıcı kullanım içindir. Katlama (yarım, üç kırım, z kırım) sipariş notunda belirtilir.`] },
    { baslik: "Adet ve fiyatı belirleyen etkenler", paragraflar: [`${adetSec(p, "broşür")} Ebat, gramaj, tek/çift yön ve selefon fiyatı belirler; A4'ten A5'e inmek aynı adette maliyeti yaklaşık yarıya indirir.`] },
    teslimat(p, "Katlamalı broşürde kırım çizgilerini dosyada ayrı katmanda gösterin. "),
  ],
  afis: (p) => [
    { baslik: `${p.name}: kâğıt ve baskı`, paragraflar: [`Kâğıt afiş 105 gr kuşeye tek yön renkli basılır; ebatlar ${liste(opts(p, "paket"))}. Vitrin içi, ilan panosu ve kapalı alan duyuruları için uygundur; yağmur alan dış cephe için aynı tasarım vinil branda afiş olarak basılmalıdır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "afiş")} Fiyatı ebat ve adet belirler; renk sayısı fiyatı değiştirmez, tam renkli basılır.`] },
    teslimat(p),
  ],
  "emlak-afisi": (p) => [
    { baslik: `${p.name}: ebatlar ve kullanım`, paragraflar: [`Satılık / kiralık ilan afişi ${liste(opts(p, "ebat"))} ebatlarında, adet başına KDV dahil sabit fiyatla üretilir; minimum sipariş ${adetler(p)[0] || "5 adet"}. Vitrin camı, daire kapısı ve ilan panosu için kâğıt afiş yeterlidir; balkon ve cephe için branda önerilir.`] },
    { baslik: "Fiyatlandırma", paragraflar: [`Bu ürün kampanya fiyatıyla satılır; adet arttıkça birim fiyat sabittir ve kupon, havale indirimi gibi ek indirimler uygulanmaz. ${adetSec(p, "afiş")}`] },
    teslimat(p, "Telefon numarası ve ofis logosu için sipariş notu yeterlidir, tasarım ücretsiz hazırlanır. "),
  ],
  zarf: (p) => [
    { baslik: `${p.name}: ölçü ve kâğıt`, paragraflar: [`Diplomat zarf 10,5×24 cm, torba zarf 24×32 cm ölçüsündedir; 90-110 gr 1. hamur kâğıttan üretilir, kapak yapışkanlı veya silikonludur. Tek renk baskı logo ve adres için ekonomik, renkli baskı kurumsal görsel için tercih edilir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "zarf")} Renk sayısı (tek renk / renkli), pencere ve iç astar fiyatı belirler.`] },
    teslimat(p),
  ],
  "antetli-kagit": (p) => [
    { baslik: `${p.name}: kâğıt ve baskı`, paragraflar: [`Antetli kâğıt 90 gr 1. hamur kâğıda basılır; ${liste(opts(p, "paket"))} ebatları mevcuttur. Lazer ve mürekkep püskürtmeli yazıcıdan sorunsuz geçer; logo, adres ve vergi bilgileri üst ve alt banda yerleştirilir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "yaprak")} Tek yön renkli baskı standarttır; arka yüz baskısı ve daha kalın kâğıt fiyatı artırır.`] },
    teslimat(p),
  ],
  bloknot: (p) => [
    { baslik: `${p.name}: yaprak, kapak ve cilt`, paragraflar: [`İç yapraklar 80 gr 1. hamur tek renk basılır; kapak ve cilt türü ürüne göre değişir (${liste(opts(p, "paket").slice(0, 5))}${opts(p, "paket").length > 5 ? " ve diğerleri" : ""}). Amerikan cilt üstten yapışkanla, spiralli bloknot tel spiralle ciltlenir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "bloknot")} Kapak selefonu, sıvama kapak ve ebat fiyatı belirler; 14×20 cm ebatta spiral ücreti otomatik eklenir.`] },
    teslimat(p),
  ],
  "cepli-dosya": (p) => [
    { baslik: `${p.name}: karton ve selefon`, paragraflar: [`Cepli dosya 300-400 gr kartona basılır, kapalı hâli 22,5×31 cm'dir ve A4 evrak alır. Seçenekler ${liste(opts(p, "paket"))}; selefon kapağı çizilmeye karşı korur, kabartma lak logoyu öne çıkarır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "dosya")} Çift yön baskı, selefon türü ve kartvizit yuvası fiyatı belirler.`] },
    teslimat(p),
  ],
  "canta-kese": (p) => [
    { baslik: `${p.name}: karton ve ölçü`, paragraflar: [`Karton çanta 210 gr Amerikan bristol veya kraft kâğıda basılır, ip sap ile teslim edilir. Ölçü kodları ${liste(opts(p, "paket"))} sipariş sayfasında cm karşılıklarıyla listelenir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "çanta")} Ebat, selefon ve sap türü fiyatı belirler.`] },
    teslimat(p),
  ],
  "oto-paspas": (p) => [
    { baslik: `${p.name}: kâğıt ve kullanım`, paragraflar: [`Kâğıt oto paspas 85 gr kraft kâğıda 34×49 cm ölçüde tek renk basılır; servis ve yıkama sonrası araç zeminini korur, tanıtım mesajı taşır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "paspas")} Tek renk baskı standarttır.`] },
    teslimat(p),
  ],
  kase: (p) => [
    { baslik: `${p.name}: mekanizma ve mürekkep`, paragraflar: [`Trodat Printy 4912 otomatik kaşe 47×18 mm baskı alanına sahiptir; mürekkep haznesi gövdededir, ıstampa gerekmez. Mürekkep rengi ${liste(opts(p, "renk"))} olarak seçilir.`] },
    { baslik: "Metin ve teslimat", paragraflar: [`Kaşe metni satır satır sipariş notuna yazılır (unvan, adres, vergi dairesi ve numarası); yerleşim tasarım ekibince hazırlanıp onaya sunulur. ${adetSec(p, "kaşe")} Üretim ${uretim(p)}, kargo 2-4 iş günü.`] },
  ],
  kupa: (p) => [
    { baslik: `${p.name}: baskı tekniği`, paragraflar: [`Seramik kupaya süblimasyon baskı uygulanır: tasarım özel kâğıda basılıp ısı presiyle kupaya aktarılır, bulaşık makinesinde çıkmaz. Fotoğraf ve tam renkli logo basılabilir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "kupa")} Tek kupa da sipariş edilebilir; kutulu teslim edilir.`] },
    teslimat(p, "Kupa sarma alanı yaklaşık 20×9 cm'dir; şablonu sipariş sayfasından indirebilirsiniz. "),
  ],
  madalya: (p) => [
    { baslik: `${p.name}: kaplama ve kurdele`, paragraflar: [`7 cm çaplı metal madalya ${liste(opts(p, "kalite"))} seçenekleriyle üretilir; ön yüze baskılı veya kazımalı logo uygulanır, boyun kurdelesi dahildir.`] },
    { baslik: "Adet ve teslimat", paragraflar: [`${adetSec(p, "madalya")} Üretim ${uretim(p)}, kargo 2-4 iş günü; etkinlik tarihini sipariş notuna yazın.`] },
  ],
  plaket: (p) => [
    { baslik: `${p.name}: kristal ve kazıma`, paragraflar: [`Kristal plaket lazer kazıma ile üretilir; boy seçenekleri ${liste(opts(p, "boy"))}. Kazıma kalıcıdır, kutulu teslim edilir.`] },
    { baslik: "Metin ve teslimat", paragraflar: [`Plaket metni ve logo sipariş notuna eklenir, dizgi onaya sunulur. ${adetSec(p, "plaket")} Üretim ${uretim(p)}.`] },
  ],
  magnet: (p) => [
    { baslik: `${p.name}: malzeme ve baskı`, paragraflar: [`60 mikron mıknatıslı folyo üzerine tam renkli baskı; buzdolabı ve metal yüzeylere yapışır, 46×68 mm standart ölçüdedir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "magnet")} Ölçü ve adet fiyatı belirler.`] },
    teslimat(p),
  ],
  "arac-magneti": (p) => [
    { baslik: `${p.name}: malzeme ve kullanım`, paragraflar: [`Araç magneti 0,8 mm kalın mıknatıslı tabaka üzerine UV baskıdır; kapı ve kaput üzerine yapıştırılır, iz bırakmadan sökülür. Ebatlar ${liste(opts(p, "ebat"))}.`] },
    { baslik: "Kullanım önerisi", liste: ["Yüzey temiz ve kuru olmalı; düz metal yüzeyde tutar, alüminyum ve plastik kaporta tutmaz.", "Yıkamadan önce sökülür, uzun süre aynı noktada bırakılmaz.", "120 km/s üstü hızda ve otoyolda köşeleri kontrol edin."] },
    teslimat(p),
  ],
  "arac-sticker": (p) => [
    { baslik: `${p.name}: folyo türleri`, paragraflar: [`Araç sticker kesim folyodan üretilir; ${liste(opts(p, "malzeme"))} seçenekleri vardır. Laminasyonlu folyo yıkamaya ve güneşe daha dayanıklıdır, reflektif folyo gece görünürlük sağlar. Fiyat m² üzerinden hesaplanır.`] },
    { baslik: "Uygulama", liste: ["Yüzey yağdan arındırılır, folyo ıslak yöntemle uygulanır ve ragle ile hava alınır.", "Kavisli yüzeylerde ısıtarak şekil verilir.", "Söküm sonrası boyada iz kalmaz; kaliteli folyo tercih sebebidir."] },
    teslimat(p, "Ölçüyü cm olarak girin; alan 1 m² altında kalırsa 1 m² üzerinden fiyatlanır. "),
  ],
  rollup: (p) => [
    { baslik: `${p.name}: mekanizma ve baskı`, paragraflar: [`Roll-up 85×200 cm standart ölçüde, alüminyum mekanizma ve taşıma çantasıyla gelir; baskı 440 gr ışık geçirmez brandaya veya polyester filme yapılır. Seçenekler ${liste(opts(p, "i-cindekiler"))}.`] },
    { baslik: "Kullanım ve teslimat", paragraflar: [`Kurulum 1 dakika sürer, fuar ve mağaza girişi için taşınabilir. ${adetSec(p, "stand")} Üretim ${uretim(p)}, kargo 2-4 iş günü.`] },
    teslimat(p, "Alt 15 cm mekanizmada kalır, önemli görseli üst 180 cm'e yerleştirin. "),
  ],
  lightbox: (p) => [
    { baslik: `${p.name}: gövde ve aydınlatma`, paragraflar: [`Lightbox alüminyum profil kasa, LED aydınlatma ve backlit baskıdan oluşur; ebatlar ${liste(opts(p, "ebat"))}. Baskı ışık geçirgen filme yapılır, gece ve gündüz okunur.`] },
    { baslik: "Montaj ve elektrik", liste: ["220 V fişli teslim edilir, duvara vida veya askı ile monte edilir.", "LED ömrü 30.000 saatin üzerindedir.", "Dış mekânda IP korumalı kasa için sipariş notuna yazın."] },
    teslimat(p),
  ],
  "yelken-bayrak": (p) => [
    { baslik: `${p.name}: kumaş ve takım`, paragraflar: [`Yelken bayrak 75×300 cm standart ölçüde, çift taraflı görünen polyester kumaşa süblimasyon baskıyla üretilir. Seçenekler ${liste(opts(p, "i-cindekiler"))}; takım fiber direk, döner başlık ve su dolabilen taban içerir.`] },
    { baslik: "Kullanım", liste: ["Rüzgârda döner, açık alan ve mağaza önü için uygundur.", "Kumaş yıkanabilir, direk katlanarak taşınır.", `${adetSec(p, "bayrak")}`] },
    teslimat(p, "Bayrak şablonu sipariş sayfasından indirilir; yazılar dikey okunacak şekilde yerleştirilir. "),
  ],
  "kirlangic-bayrak": (p) => [
    { baslik: `${p.name}: kumaş ve ölçü`, paragraflar: [`Kırlangıç bayrak 3 m boyunda polyester kumaşa çift taraflı süblimasyon baskıyla üretilir; direk ve tabanla birlikte veya yalnız kumaş olarak sipariş edilir.`] },
    { baslik: "Kullanım", liste: ["Cadde ve mağaza önü tanıtımı için uygundur.", "Rüzgârda döner başlıkla kendini konumlar.", `${adetSec(p, "bayrak")}`] },
    teslimat(p),
  ],
  "masa-bayragi": (p) => [
    { baslik: `${p.name}: kumaş ve direk`, paragraflar: [`Masa bayrağı saten kumaşa dijital baskıyla üretilir; krom direk ve taban dahildir. Toplantı masası, resepsiyon ve makam için tek adetten sipariş edilir.`] },
    { baslik: "Fiyat ve teslimat", paragraflar: [`Fiyat kumaş, direk türü ve adede göre belirlenir. Üretim ${uretim(p)}, kargo 2-4 iş günü.`] },
  ],
  "makam-bayragi": (p) => [
    { baslik: `${p.name}: kumaş ve saçak`, paragraflar: [`Makam bayrağı 100×150 cm saten kumaşa dijital baskı ile üretilir; sarı püskül saçak ve krom veya gold direk seçenekleri vardır. Fiyat, seçilen içerik (yalnız bayrak veya direkli takım) ve saçak türüne göre sepette hesaplanır.`] },
    { baslik: "Kullanım ve teslimat", paragraflar: [`Makam odası, protokol masası ve resmi tören alanları için üretilir. Üretim ${uretim(p)}, kargo 2-4 iş günü; logo ve amblem için sipariş notu yeterlidir.`] },
  ],
  folyo: (p) => [
    { baslik: `${p.name}: malzeme ve baskı`, paragraflar: [`${p.name}, kendinden yapışkanlı folyo üzerine solvent veya UV baskı ya da plotter kesimle üretilir; malzeme seçenekleri ${liste(opts(p, "malzeme").slice(0, 6))}. Fiyat m² üzerinden hesaplanır; toplam alan 1 m² altında kalırsa 1 m² uygulanır.`] },
    { baslik: "Ek işlem ve uygulama", liste: [`Ek işlemler: ${liste(opts(p, "ekislem"))}. Laminasyon elle temas edilen yüzeylerde ömrü uzatır.`, "Cam ve düz yüzeye ıslak yöntemle uygulanır, ragle ile hava alınır.", "Solvent baskı dış mekâna dayanıklıdır; UV baskı kokusuzdur, iç mekânda tercih edilir."] },
    teslimat(p, "En ve boyu cm olarak girin; büyük ölçüler parçalı üretilip ek yeri işaretlenir. "),
  ],
  "vinil-branda-afis": (p) => [
    { baslik: `${p.name}: gramaj ve baskı`, paragraflar: [`${p.name} PVC brandaya solvent veya UV baskı ile üretilir; malzeme seçenekleri ${liste(opts(p, "malzeme").slice(0, 6))}. Gramaj arttıkça branda kalınlaşır ve rüzgâra dayanımı artar; mesh (delikli) branda rüzgârı geçirir, cephe iskelesi için tercih edilir.`] },
    { baslik: "Ek işlem ve montaj", liste: [`Ek işlemler: ${liste(opts(p, "ekislem"))}. Kopça (kuşgözü) her 50 cm'de bir takılır, kolon dikişi direk geçirmek içindir.`, "Halat veya kablo bağıyla gerdirilir; köşelerden başlanıp ortaya doğru gerilir.", "Dış mekânda 1-2 yıl solmadan kalır; UV baskı daha uzun ömürlüdür."] },
    teslimat(p, "Fiyat m² üzerinden ve toplam alana göre hesaplanır; 1 m² altındaki işler 1 m² sayılır. "),
  ],
  "dekota-baski": (p) => [
    { baslik: `${p.name}: levha ve baskı`, paragraflar: [`${p.name}, PVC köpük (dekota/foreks) levha üzerine UV baskıdır; kalınlık ve renk seçenekleri ${liste(opts(p, "malzeme").slice(0, 6))}. Hafif, su geçirmez ve dış mekânda deforme olmaz; tabela, yönlendirme ve sergi panosu için standart malzemedir.`] },
    { baslik: "Kesim ve montaj", liste: [`Ek işlem: ${liste(opts(p, "ekislem"))}. CNC kesim logo ve özel form için kullanılır.`, "Vida, çift taraflı bant veya ayaklı standla monte edilir.", "3 mm iç mekân, 5 mm ve üzeri dış mekân ve büyük ebat için önerilir."] },
    teslimat(p, "Fiyat m² üzerinden hesaplanır; CNC kesimde kontur yolunu dosyada ayrı katmanda verin. "),
  ],
  "fosforlu-folyo": (p) => [
    { baslik: `${p.name}: malzeme ve standart`, paragraflar: [`Fotolüminesan (fosforlu) folyo gün ışığıyla şarj olur, elektrik kesildiğinde karanlıkta parlar; kaçış yolu işaretlerinde ISO 16069 ve yangın yönetmeliği bu özelliği arar. Kendinden yapışkanlıdır, yer ve duvar uygulamasına uygundur.`] },
    { baslik: "Adet ve teslimat", paragraflar: [`${adetSec(p, "adet")} Üretim ${uretim(p)}, kargo 2-4 iş günü.`] },
  ],
  "plastik-reklam-dubasi": (p) => [
    { baslik: `${p.name}: gövde ve baskı`, paragraflar: [`Plastik reklam dubası darbeye dayanıklı polietilen gövdeye sahiptir; üst yüzeye tam renkli baskılı etiket uygulanır. Otopark, mağaza önü ve etkinlik alanında yönlendirme ve tanıtım için kullanılır.`] },
    { baslik: "Kullanım ve teslimat", paragraflar: [`Alt hazne kum veya suyla doldurularak sabitlenir. Üretim ${uretim(p)}, kargo 2-4 iş günü.`] },
  ],
  "amerikan-servis": (p) => [
    { baslik: `${p.name}: kâğıt ve baskı`, paragraflar: [`Amerikan servis 34×49 cm ölçüde kâğıda tek yön renkli basılır; restoran ve kafe masasında tek kullanımlıktır, menü ve kampanya mesajı taşır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "servis")}`] },
    teslimat(p),
  ],
  "kapi-aski-brosur": (p) => [
    { baslik: `${p.name}: karton ve kesim`, paragraflar: [`Kapı askı broşürü 300 gr kartona çift yön renkli basılır, kapı koluna geçecek delik özel bıçakla kesilir. Otel, site ve dağıtım kampanyaları için üretilir.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "broşür")}`] },
    teslimat(p),
  ],
  etiket: (p) => [
    { baslik: `${p.name}: kâğıt ve yapışkan`, paragraflar: [`Etiket 90 gr kuşe kâğıda renkli basılır, arkası yapışkanlı tabakadadır; ürün, ambalaj ve koli etiketi olarak kullanılır. Kesim düz veya özel formda yapılır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "etiket")} Ölçü, kesim formu ve selefon fiyatı belirler.`] },
    teslimat(p),
  ],
  makbuz: (p) => [
    { baslik: `${p.name}: kâğıt ve kopya`, paragraflar: [`Makbuz 54 gr kendinden kopyalı (NCR) kâğıda basılır; 1 asıl + 1 suret olarak ciltlenir, numaralandırma isteğe bağlıdır. Tahsilat, teslim ve irsaliye için kullanılır.`] },
    { baslik: "Adet ve fiyat", paragraflar: [`${adetSec(p, "cilt")} Kopya sayısı ve numaratör fiyatı belirler.`] },
    teslimat(p),
  ],
};
DIGER["arkasi-gri-folyo"] = DIGER.folyo;

// ---------------------------------------------------------------- Çalıştır
const cats = await getJson("/categories");
const prodsRaw = await getJson("/products?list=true&take=2000");
const prods = (Array.isArray(prodsRaw) ? prodsRaw : (prodsRaw?.data || [])).filter((p) => p.isActive !== false);
const catSlug = (p) => p.categorySlug || p.category?.slug || cats.find((c) => c.id === p.categoryId)?.slug;
let yazildi = 0, atlandi = 0, sablonYok = new Set();
let TOKEN = null;
const hedefler = prods.filter((p) => !KAT || catSlug(p) === KAT).slice(0, LIMIT);
for (const p0 of hedefler) {
  const cat = catSlug(p0);
  const p = await getJson(`/products/${p0.slug}`); if (!p) continue;
  if (p.content?.seoBolumler?.length && !FORCE) { atlandi++; continue; }
  const gen = ISG[cat] ? (x) => isgBolumler(x, cat) : DIGER[cat];
  if (!gen) { sablonYok.add(cat); continue; }
  const bolumler = gen(p).map((b) => ({ ...b, liste: b.liste?.filter(Boolean), paragraflar: b.paragraflar?.filter(Boolean) }));
  if (DRY) { if (yazildi < 3) { console.log(`\n## ${p.slug} (${cat})`); for (const b of bolumler) console.log(`  # ${b.baslik}\n    ${(b.paragraflar || []).join("\n    ").slice(0, 500)}${b.liste ? "\n    • " + b.liste.join("\n    • ").slice(0, 400) : ""}${b.tablo ? "\n    [tablo " + b.tablo.satirlar.length + " satır]" : ""}`); } yazildi++; continue; }
  if (!TOKEN) { const lj = await (await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) })).json(); TOKEN = lj.accessToken || lj.access_token || lj.token; }
  const r = await fetch(`${API}/api/products/${p.id}`, { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ content: { ...(p.content || {}), seoBolumler: bolumler } }) });
  if (!r.ok) { console.error("✗", p.slug, r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  yazildi++; if (yazildi % 50 === 0) console.log(`  … ${yazildi} yazıldı`);
}
console.log(`\n${DRY ? "[DRY] üretilecek" : "yazıldı"}: ${yazildi} · atlandı (zaten var): ${atlandi} · şablonsuz kategori: ${[...sablonYok].join(", ") || "yok"}`);
