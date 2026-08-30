#!/usr/bin/env node
/**
 * TİCARİ SEO — folyo kategori içeriği (2026-08-31).
 * kategori-icerik.mjs ile aynı desen; folyo bölme işleminden sonra kategori sayfası
 * 6 yeni ürünü toparlayan hub olarak çalışsın diye eklendi.
 *
 * FİYAT POLİTİKASI: içeriğe sabit TL rakamı yazılmaz (kategori-icerik.mjs'deki gerekçe).
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kategori-icerik-folyo.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

const ICERIK = {
  folyo: {
    seo: {
      title: "Folyo Baskı ve Kesim Folyo — Cam, Araç ve Duvar Uygulamaları",
      description:
        "Kesim folyo, kumlama (buzlu cam) folyosu, şeffaf, reflektif ve laminasyonlu folyo: m² fiyat hesabı, malzeme farkları ve uygulama alanları. KDV dahil anlık fiyat.",
    },
    faqs: [
      { q: "Folyo m² fiyatı nasıl hesaplanır?", a: "Alan hesabı basittir: en (cm) × boy (cm) ÷ 10.000 = m². Örneğin 120 × 80 cm bir cam uygulaması 0,96 m² eder ve minimum 1 m² üzerinden fiyatlanır. Seçtiğiniz folyonun m² fiyatı bu alanla çarpılır; kesim ve laminasyon gibi ek işlemler seçeneklerden eklenir. Ürün sayfasındaki konfigüratöre ölçüyü girdiğinizde KDV dahil net tutar anında görünür." },
      { q: "Kesim folyo ile baskılı folyo arasındaki fark nedir?", a: "Kesim folyoda folyonun kendi rengi kullanılır: harf, logo ve şekiller plotterla kesilip yüzeye aktarılır, arka zemin görünmez kalır. Baskılı folyoda ise beyaz veya şeffaf folyo üzerine dijital baskı yapılır; fotoğraf ve degrade dahil sınırsız renk kullanılabilir. Tek renk, sade ve kurumsal işlerde kesim folyo daha temiz; görselli işlerde baskılı folyo tek seçenektir." },
      { q: "Hangi folyoyu seçmeliyim?", a: "Uygulamanın amacına göre değişir. Vitrin yazısı ve logo için kesim folyo; cam bölmede mahremiyet için kumlama (buzlu) folyo; cam üzerinde zeminsiz görsel için şeffaf folyo; gece görünürlüğü için reflektif folyo; yoğun temas ve dış mekân için laminasyonlu folyo; acil çıkış ve güvenlik işaretleri için lümen (fotolüminesan) folyo doğru seçimdir." },
      { q: "Folyo uygulamasını kendim yapabilir miyim?", a: "Küçük ve düz yüzeyli uygulamalar (cam kapı yazısı, tek parça logo) sabırla yapılabilir; folyolar transfer kâğıdıyla, uygulama sırasını koruyacak şekilde gönderilir. Geniş yüzeyler, araç kaportası gibi kavisli alanlar ve baloncuksuz sonuç beklenen işlerde profesyonel uygulama önerilir. Mersin ve çevresinde yerinde uygulama desteği verebiliyoruz." },
      { q: "Folyo uygulandığı yüzeye zarar verir mi?", a: "Cam, boyalı düz yüzey ve kaporta gibi sağlam zeminlerde folyo sökülebilir ve genellikle iz bırakmaz; kalan yapışkan uygun temizleyiciyle alınır. Taze boya, alçı, tozlu duvar ve yıpranmış yüzeylerde ise sökme sırasında yüzeyden parça kalkabilir. Uzun süre güneşte kalmış folyolar daha zor sökülür." },
      { q: "Folyo ne kadar dayanır?", a: "İç mekânda folyolar uzun süre sorunsuz kalır. Dış mekânda ömür; malzemeye, baskı tekniğine ve güneş/yağmur maruziyetine bağlıdır. UV baskı ve laminasyon uygulaması dayanımı belirgin şekilde artırır; sürekli güneş alan cephelerde ve araç uygulamalarında ikisinin birlikte tercih edilmesi ömrü en çok uzatan seçimdir." },
      { q: "Tasarım dosyamı nasıl göndermeliyim?", a: "Kesim folyo işlerinde dosyanın vektörel (AI, EPS, PDF veya SVG) olması gerekir; plotter kesim yolu ancak vektörden çıkarılır. JPG veya PNG gönderilen tasarımlar kesim için yeniden çizilmelidir. Baskılı folyoda dosya CMYK renk uzayında, gerçek ölçüsünde (1:1) veya 1:10 ölçekte hazırlanmalıdır. Tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği talep edebilirsiniz." },
      { q: "Kumlama folyosu gerçekten mahremiyet sağlar mı?", a: "Evet. Kumlama folyosu cama buzlu görünüm verir; ışığı geçirmeye devam ederken içeriyi ve dışarıyı belirsizleştirir, iki yönde de görüşü engeller. Ofis bölmeleri, toplantı odaları, klinik bekleme alanları ve banyo camlarında en yaygın çözümdür. Dışarıdan içerinin görünmemesi ama içeriden dışarının net görünmesi isteniyorsa one way vision folyosu tercih edilmelidir." },
    ],
    seoBolumler: [
      {
        baslik: "Folyo m² Fiyatı Nasıl Hesaplanır?",
        paragraflar: [
          "Folyo fiyatları parça başına değil, metrekare üzerinden belirlenir. Uygulanacak alanın eni ve boyu santimetre cinsinden çarpılır, 10.000'e bölünerek metrekare bulunur; seçilen malzemenin m² fiyatı bu alanla çarpılır. 1 m² altındaki işlerde minimum 1 m² uygulanır, çünkü küçük işlerde de rulo açma, kesim ve transfer kâğıdı hazırlığı aynı emeği gerektirir.",
          "Toplam maliyeti belirleyen ikinci etken malzeme seçimidir. Normal kesim folyo en ekonomik seçenektir; kumlama ve şeffaf folyo orta segmentte yer alır; reflektif ve lümen folyo özel üretim yapıları nedeniyle en üst seviyededir. Laminasyon ise baskının üzerine ek bir koruyucu film kaplandığı için maliyeti artırır ama dış mekânda ömrü uzatarak toplamda daha ekonomik olabilir.",
        ],
        liste: [
          "Alan: en (cm) × boy (cm) ÷ 10.000 = m² — 150 × 100 cm bir uygulama 1,5 m² eder",
          "Malzeme: normal kesim folyo en ekonomik, reflektif ve lümen en üst segment",
          "Baskı tekniği: solvent ekonomik ve dış mekâna uygun, UV daha canlı ve çizilmeye dirençli",
          "Ek işlem: kesim (plotter yolu), laminasyon ve transfer kâğıdı hazırlığı",
          "Minimum: 1 m² altındaki işler 1 m² üzerinden fiyatlanır",
        ],
      },
      {
        baslik: "Folyo Çeşitleri ve Kullanım Alanları",
        paragraflar: [
          "Folyo tek bir ürün değil, farklı işleri çözen bir malzeme ailesidir. Yanlış folyo seçimi, doğru uygulanmış bir işin bile birkaç ay içinde sökülmesine yol açar; bu yüzden seçim, uygulamanın amacıyla (görünürlük, mahremiyet, dayanım, güvenlik) başlar.",
        ],
        tablo: {
          basliklar: ["Folyo", "Ne İşe Yarar", "Tipik Kullanım"],
          satirlar: [
            ["Kesim folyo", "Folyonun kendi rengiyle zeminsiz yazı ve logo", "Vitrin yazısı, kapı camı, yönlendirme"],
            ["Kumlama (buzlu)", "Işığı geçirir, görüşü engeller", "Ofis bölmesi, toplantı odası, banyo camı"],
            ["Şeffaf folyo", "Baskı zemin görünmeden durur", "Cam üzeri bilgilendirme, şeffaf etiket"],
            ["Reflektif folyo", "Işığı kaynağına geri yansıtır", "Araç güvenlik şeridi, yol ve şantiye uyarısı"],
            ["Laminasyonlu", "Baskıyı çizilme, UV ve nemden korur", "Araç giydirme, zemin grafiği, dış cephe"],
            ["Lümen (fotolüminesan)", "Karanlıkta parlar", "Acil çıkış, yangın ekipmanı işaretleri"],
          ],
          not: "Arkası gri folyo, alttaki yüzeyin veya eski yazının folyodan geçmesini engellemek için tercih edilir.",
        },
      },
      {
        baslik: "Uygulama Öncesi Yüzey Hazırlığı",
        paragraflar: [
          "Folyo uygulamasında sonucun kalıcılığını belirleyen en önemli aşama, folyonun kendisi değil yüzeyin hazırlanmasıdır. Yapışkan yüzeydeki toza, yağa veya nem filmine tutunur; bu katman kaldırılmazsa folyo ilk günlerde sorunsuz görünse bile kenarlardan kalkmaya başlar.",
          "Cam yüzeylerde önce deterjanlı suyla genel temizlik, ardından alkol bazlı bir temizleyiciyle yağ alma yapılır ve yüzey tamamen kurutulur. Kaporta ve boyalı yüzeylerde cila ve wax kalıntısı yapışmayı doğrudan engeller; bu kalıntının temizlenmesi şarttır. Uygulama sıcaklığı da önemlidir: çok soğuk yüzeylerde yapışkan aktive olmaz, çok sıcak yüzeylerde folyo gerilerek yerleşir ve sonradan büzüşür.",
        ],
        liste: [
          "Yüzey tozdan, yağdan ve silikon/cila kalıntısından tamamen arındırılmalı",
          "Temizlik sonrası yüzey kurumadan uygulama yapılmamalı",
          "Çok soğuk veya kızgın yüzeylerde uygulama ertelenmeli",
          "Taze boyalı yüzeylerde boyanın tam kürlenmesi beklenmeli",
          "Kavisli yüzeylerde ısı tabancasıyla kontrollü şekillendirme gerekir",
        ],
      },
      {
        baslik: "Solvent Baskı mı, UV Baskı mı?",
        paragraflar: [
          "Baskılı folyo işlerinde iki teknik kullanılır. Solvent baskıda mürekkep folyonun yüzeyine işleyerek kurur; dış mekân dayanımı yüksektir ve maliyeti daha uygundur, bu nedenle geniş yüzeyli uygulamalarda yaygın tercihtir. UV baskıda mürekkep ultraviyole ışıkla anında kurutulur; renkler daha canlı, yüzey çizilmeye ve kimyasala daha dirençlidir, ayrıca kokusuz olduğu için iç mekânda hemen kullanıma verilebilir.",
          "Pratikte seçim, işin nerede duracağıyla belirlenir: sürekli güneş gören, yıkanan veya temas edilen yüzeylerde UV baskı; geniş alanlı, maliyet duyarlı ve orta vadeli uygulamalarda solvent baskı öne çıkar. Her iki teknikte de laminasyon eklenmesi ömrü uzatır.",
        ],
      },
    ],
  },
};

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
const kategoriler = await fetch(`${API}/api/categories`).then((r) => r.json()).then((j) => (Array.isArray(j) ? j : j.items ?? []));

let ok = 0, hata = 0;
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const cat = kategoriler.find((c) => c.slug === slug);
  if (!cat) { console.error(`✗ kategori bulunamadı: ${slug}`); hata++; continue; }
  const mevcut = cat.content && typeof cat.content === "object" ? cat.content : {};
  const ozet = `seoBölüm:${icerik.seoBolumler.length} sss:${icerik.faqs.length}`;
  if (DRY) { console.log(`[DRY] ${slug} → ${ozet}`); continue; }
  const res = await fetch(`${API}/api/categories/${cat.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ content: { ...mevcut, ...icerik } }) });
  if (!res.ok) { console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  const kontrol = await fetch(`${API}/api/categories`).then((r) => r.json()).then((j) => (Array.isArray(j) ? j : j.items ?? []).find((c) => c.slug === slug));
  if (!kontrol?.content?.seoBolumler?.length) { console.error(`✗ ${slug}: PATCH 200 döndü ama içerik YAZILMADI`); hata++; continue; }
  console.log(`✓ ${slug} güncellendi ve doğrulandı — ${ozet}`);
  ok++;
}
console.log(`\nÖzet — güncellenen: ${ok} · hata: ${hata}`);
