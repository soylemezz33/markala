#!/usr/bin/env node
/**
 * TİCARİ SEO — kategori sayfası içerikleri (2026-08-30).
 *
 * Neden: GSC analizi, para kazandıran ürünlerde (branda, dekota, yelken, folyo) organik
 * görünürlüğümüzün sıfıra yakın olduğunu gösterdi; kategori sayfalarında tek cümlelik
 * açıklama dışında içerik yoktu. Rakip SERP analizi (2026-08-30) kazanan sayfalarda ortak
 * olan yapıyı verdi: teknik karşılaştırma tabloları + hesaplama mantığı + 8-10 SSS.
 *
 * FİYAT POLİTİKASI: içeriğe SABİT TL RAKAMI yazılmaz — fiyatlar m² bazlı ve değişken;
 * sabit rakam birkaç ayda yanlış bilgiye dönüşür (rakiplerin yaygın hatası). Bunun yerine
 * hesaplama mantığı + oransal karşılaştırma + canlı konfigüratöre yönlendirme kullanılır.
 * Gerçek fiyatı sayfadaki ürün kartları ve konfigüratör zaten gösterir.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kategori-icerik.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

const ICERIK = {
  "vinil-branda-afis": {
    seo: {
      title: "Branda Afiş Baskı Fiyatları 2026 — m² Hesapla, Online Sipariş",
      description:
        "Vinil branda, mesh (delikli) ve ışıklı branda baskı: m² fiyat hesabı, gramaj farkları (280/440/510 gr), kuşgözü ve montaj seçenekleri. KDV dahil anlık fiyat.",
    },
    faqs: [
      { q: "Branda baskı m² fiyatı nasıl hesaplanır?", a: "Alan hesabı basittir: en (cm) × boy (cm) ÷ 10.000 = m². Örneğin 200 × 300 cm branda 6 m² eder. Seçtiğiniz malzemenin m² fiyatı bu alanla çarpılır; kuşgözü, kolon veya dikiş gibi ek işlemler çevre uzunluğuna göre eklenir. Ürün sayfasındaki konfigüratöre ölçüyü girdiğinizde KDV dahil net tutar anında hesaplanır. 1 m²'nin altındaki işlerde minimum 1 m² üzerinden fiyatlandırma uygulanır." },
      { q: "Çin 280 gr, Avrupa 440 gr ve 510 gr branda arasındaki fark nedir?", a: "Gramaj, brandanın metrekare başına ağırlığıdır ve doğrudan dayanıma etki eder. Çin 280 gr en ekonomik seçenektir; kısa süreli iç mekân ve kampanya afişleri için yeterlidir. Avrupa 440 gr standart dış mekân tercihidir: daha tok dokusu ve UV dayanımıyla mevsim boyu asılı kalabilir. Avrupa 510 gr en kalın seçenektir; sürekli rüzgâr alan cepheler ve uzun ömürlü kullanım için idealdir." },
      { q: "Mesh (delikli) branda ne zaman gerekir?", a: "Mesh branda gözenekli dokusu sayesinde rüzgârı içinden geçirir. Yüksek katlı bina cepheleri, iskele giydirmeleri ve rüzgâra açık geniş yüzeylerde tercih edilir; yırtılma ve bağlantı noktası kopması riskini belirgin biçimde azaltır. Buna karşılık deliklerden ışık geçtiği için renkler tam kapalı brandaya göre bir miktar daha soluk görünür." },
      { q: "Solvent baskı ile UV baskı arasındaki fark nedir?", a: "Solvent baskı dış mekân dayanımı yüksek, ekonomik ve en yaygın yöntemdir. UV baskı ise mürekkebin ultraviyole ışıkla anında kurutulmasıyla yapılır; renk canlılığı ve çizilme direnci daha yüksektir, kokusuz olduğu için iç mekân uygulamalarında da rahatça kullanılır. Uzun süre güneş altında kalacak işlerde UV baskı daha uzun ömür sağlar." },
      { q: "Kuşgözü (rekor) ne işe yarar, kaç cm aralıkla takılır?", a: "Kuşgözü, brandanın kenarlarına çakılan metal halkalardır; ip veya plastik kelepçe buradan geçirilerek branda gerdirilir. Standart uygulamada kenar boyunca yaklaşık 50 cm aralıkla takılır. Rüzgâra açık noktalarda aralığın sıklaştırılması gerginliği artırır ve yırtılmayı önler. Kuşgözü ve kenar katlama, konfigüratörde ek işlem olarak seçilir." },
      { q: "Branda afiş dış mekânda ne kadar dayanır?", a: "Ömür; malzeme gramajı, baskı tekniği ve maruz kalınan koşullara göre değişir. Ekonomik gramajlar kısa süreli kampanyalar için uygundur; Avrupa 440 gr ve üzeri malzemeler UV baskıyla birlikte yıllara yayılan kullanımlarda tercih edilir. Sürekli rüzgâr alan cephelerde mesh branda veya daha yüksek gramaj seçmek ömrü uzatır." },
      { q: "Işıklı (backlit) branda ile normal branda farkı nedir?", a: "Işıklı branda, arkadan aydınlatmalı kutu harf ve ışıklı pano sistemleri için üretilir; ışığı homojen geçirerek görselin gece de net okunmasını sağlar. Normal branda ışığı geçirmez, arkadan aydınlatmada lekeli görünür. Arkası siyah (blockout) branda ise iki yüzü ayrı görselle basılacak işlerde arkadaki görüntünün sızmasını engeller." },
      { q: "Tasarım dosyamı hangi ölçüde ve çözünürlükte göndermeliyim?", a: "Dosyayı gerçek ölçüsünde (1:1) veya oranı bozulmayacak şekilde 1:10 ölçekte hazırlayın. Renk uzayı CMYK olmalıdır; RGB gönderilen dosyalarda baskı renkleri farklı çıkar. Büyük ebat brandalarda 72-150 dpi yeterlidir çünkü uzaktan izlenir. Kenarlardan 5-10 cm katlama/gergi payı bırakmak montajı kolaylaştırır. Tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği talep edebilirsiniz." },
    ],
    seoBolumler: [
      {
        baslik: "Branda Baskı m² Fiyatı Nasıl Hesaplanır?",
        paragraflar: [
          "Branda fiyatlandırması metrekare üzerinden yapılır. Formül basittir: en (cm) × boy (cm) ÷ 10.000 = alan (m²). Örneğin 300 × 200 cm ölçüsünde bir branda 6 m² eder; seçilen malzemenin metrekare fiyatı bu alanla çarpılarak baskı bedeli bulunur.",
          "Kuşgözü, kenar katlama, kolon ve dikiş gibi ek işlemler alan üzerinden değil, brandanın çevre uzunluğuna göre fiyatlanır. Bu yüzden aynı metrekaredeki iki brandadan uzun-ince olanın montaj işçiliği daha yüksek çıkabilir. 1 m²'nin altındaki işlerde minimum 1 m² üzerinden fiyatlandırma uygulanır.",
          "Ürün sayfasındaki konfigüratöre kendi ölçünüzü girdiğinizde malzeme, ek işlem ve alan hesabı birlikte işlenir; KDV dahil net tutarı anında görürsünüz. Sepette sürpriz fark çıkmaz.",
        ],
      },
      {
        baslik: "Branda Çeşitleri ve Hangisini Seçmeliyim?",
        paragraflar: [
          "Doğru malzeme seçimi, brandanın nerede ve ne kadar süre asılı kalacağına bağlıdır. Aşağıdaki tablo katalogdaki ana malzeme ailelerini karşılaştırır.",
        ],
        tablo: {
          basliklar: ["Malzeme", "Öne çıkan özellik", "En uygun kullanım"],
          satirlar: [
            ["Çin 280 gr", "En ekonomik, ince doku", "Kısa süreli kampanya, iç mekân afiş"],
            ["Çin / Avrupa 440 gr", "Standart dış mekân dayanımı", "Cephe afişi, pankart, tabela zemini"],
            ["Avrupa 510 gr (kalın)", "En yüksek gramaj, tok doku", "Uzun ömürlü, rüzgâr alan cepheler"],
            ["Mesh (delikli)", "Rüzgârı geçirir, yük bindirmez", "İskele giydirme, yüksek kat cephesi"],
            ["Işıklı (backlit)", "Işığı homojen geçirir", "Arkadan aydınlatmalı ışıklı pano"],
            ["Arkası siyah (blockout)", "Arkadaki görüntüyü geçirmez", "Çift yüz baskı, ışık sızması istenmeyen işler"],
            ["Reflektif vinil", "Işığı geri yansıtır", "Gece görünürlüğü gereken uyarı ve yönlendirme"],
          ],
          not: "Tüm malzemelerde solvent veya UV baskı seçilebilir; UV baskı renk canlılığı ve çizilme direncinde öne çıkar.",
        },
      },
      {
        baslik: "Montaj ve Ek İşlem Seçenekleri",
        paragraflar: [
          "Brandanın asılacağı yer, kenar işçiliğini belirler. Konfigüratörde bu seçenekleri ölçüyle birlikte seçebilirsiniz.",
        ],
        liste: [
          "Dikiş + kopça (kuşgözü): en yaygın uygulama; kenar katlanıp dikilir, metal halkalar takılır ve iple gerdirilir.",
          "Kolon + dikiş: brandanın kenarına boru/direk geçecek tünel açılır; totem ve germe sistemlerinde kullanılır.",
          "Germe: alüminyum çerçeveye gerilen uygulamalar için hazırlanır.",
          "İşlem yok: yalnız baskı; kesim ve montajı kendiniz yapacaksanız en ekonomik seçenektir.",
        ],
      },
      {
        baslik: "Kullanım Alanları",
        liste: [
          "Mağaza ve işletme cephesi kampanya afişleri",
          "İnşaat ve şantiye alanı tanıtım brandaları, iskele giydirme",
          "Etkinlik, fuar ve kongre arka fon (backdrop) uygulamaları",
          "Restoran ve cafe dış cephe menü/duyuru panoları",
          "Yol kenarı pankart ve billboard giydirmeleri",
          "Spor sahası ve tribün reklam brandaları",
        ],
      },
      {
        baslik: "Üretim ve Teslimat",
        paragraflar: [
          "Baskı ve kenar işçiliği tamamlandıktan sonra branda katlanarak ya da büyük ebatlarda rulo hâlinde paketlenir. Üretim süresi ölçü ve ek işleme göre değişir; sipariş sonrası tasarım onayı verildiğinde üretim başlar ve tamamlanınca kargoya teslim edilir. Türkiye'nin 81 iline gönderim yapılır, Mersin içinde aynı gün motor kurye seçeneği vardır.",
        ],
      },
    ],
  },

  "dekota-baski": {
    seo: {
      title: "Dekota Baskı Fiyatları 2026 — Foreks Levha Üzerine UV Baskı",
      description:
        "Dekota (foreks) baskı: kalınlık seçimi (3/5/10 mm), foreks farkı, CNC kesim, pleksi ve kompozit karşılaştırması. Ölçüye özel üretim, KDV dahil anlık fiyat.",
    },
    faqs: [
      { q: "Dekota nedir, neden tercih edilir?", a: "Dekota, sert PVC köpükten üretilen hafif ve düz yüzeyli bir levhadır. Yüzeyi baskıya çok uygun olduğu için tabela, pano ve yönlendirme işlerinde standart malzemedir. Ahşap ve metale göre çok daha hafif olması montajı kolaylaştırır; neme dayanıklıdır, çürümez ve paslanmaz." },
      { q: "Dekota ile foreks arasında fark var mı?", a: "Pratikte yoktur. Dekota ve foreks, aynı sert PVC köpük levha ailesinin piyasada yerleşmiş iki marka adıdır; sektörde çoğu zaman birbirinin yerine kullanılır. Sipariş verirken önemli olan isim değil, kalınlık ve yüzey kalitesidir." },
      { q: "Kaç mm dekota seçmeliyim?", a: "İç mekânda duvara yapıştırılacak veya çerçeveye oturtulacak panolarda 3 mm çoğu iş için yeterlidir ve en yaygın tercih budur. Serbest duran, kendini taşıması gereken veya büyük ebatlı panolarda 5 mm ile 10 mm arası kalınlıklar eğilmeyi önler. Kalınlık arttıkça malzeme maliyeti ve ağırlık da artar." },
      { q: "Dekota baskı dış mekânda kullanılabilir mi?", a: "Kullanılabilir ancak dekota esas olarak iç mekân ve korunaklı dış mekân malzemesidir. Sürekli güneş ve yağmura maruz kalan yüzeylerde uzun vadede renk solması ve hafif eğilme görülebilir. Kalıcı dış mekân tabelalarında alüminyum kompozit levha daha uygun bir alternatiftir." },
      { q: "Özel şekilli kesim yapılıyor mu?", a: "Evet. Dekota levhalar CNC ile istenen şekilde kesilebilir; logo formu, harf kesimi, oval ve köşeli özel formlar üretilebilir. Kesim, dosyanızdaki vektörel kesim yoluna göre yapılır. Standart dikdörtgen kesim dışındaki formlar konfigüratörde ek işlem olarak seçilir." },
      { q: "Dekota, pleksi ve kompozit arasındaki fark nedir?", a: "Dekota hafif ve ekonomiktir, iç mekân panolarında öne çıkar. Pleksi (akrilik) parlak ve şeffaf seçenekleriyle daha prestijli bir görünüm sunar; resepsiyon logoları ve vitrin uygulamalarında tercih edilir. Alüminyum kompozit ise en dayanıklı olanıdır ve kalıcı dış mekân tabelalarının standardıdır. Üçü de katalogda mevcuttur; kullanım yerine göre seçim yapılır." },
      { q: "Baskı doğrudan levhaya mı yapılıyor?", a: "Evet, UV baskı doğrudan levha yüzeyine uygulanır; mürekkep ultraviyole ışıkla anında kurutulduğu için canlı ve çizilmeye dirençli bir yüzey elde edilir. Alternatif olarak baskılı folyo kaplama yöntemi de kullanılabilir. Hangi yöntemin uygun olduğunu ürün seçenekleri belirler." },
      { q: "Tek levhalık sipariş verebilir miyim?", a: "Evet, minimum adet şartı yoktur; tek parça pano da üretilir. Ölçüyü konfigüratöre girdiğinizde KDV dahil fiyat anında hesaplanır. Çok sayıda aynı ölçüde pano gerektiren projelerde toplu fiyat için teklif talebinde bulunabilirsiniz." },
    ],
    seoBolumler: [
      {
        baslik: "Dekota (Foreks) Levha Nedir?",
        paragraflar: [
          "Dekota, sert PVC köpükten üretilen, hafif ve pürüzsüz yüzeyli bir levhadır. Sektörde foreks adıyla da anılır; ikisi aynı malzeme ailesinin farklı marka adlarıdır. Yüzeyinin düzgünlüğü sayesinde üzerine yapılan baskı net ve keskin çıkar.",
          "Ahşap ve metal levhalara göre belirgin şekilde hafif olması, büyük ebatlı panoların montajını kolaylaştırır. Neme dayanıklıdır, çürümez ve paslanmaz; bu yüzden iç mekân tabelalarının, yönlendirme panolarının ve fuar standlarının standart malzemesidir.",
        ],
      },
      {
        baslik: "Kalınlık Seçimi: Hangi İş İçin Kaç mm?",
        paragraflar: [
          "Kalınlık seçimi panonun nasıl monte edileceğine ve boyutuna bağlıdır. Aşağıdaki tablo yaygın kullanım kalıplarını özetler.",
        ],
        tablo: {
          basliklar: ["Kalınlık", "Davranış", "Uygun kullanım"],
          satirlar: [
            ["3 mm", "Hafif, kolay kesilir; en yaygın tercih", "Duvara yapıştırma, çerçeveli pano, yönlendirme"],
            ["5 mm", "Daha rijit, orta boy panolarda eğilmez", "Serbest duran pano, fuar standı, menü panosu"],
            ["8-10 mm", "Kendini taşır, kalın kenar görünümü", "Büyük ebat pano, harf kesim, resepsiyon logosu"],
          ],
          not: "Aynı ölçüde iki panodan kalın olanı daha ağırdır; montaj yöntemi (yapıştırma, vidalama, ayaklı) buna göre seçilmelidir.",
        },
      },
      {
        baslik: "Dekota, Pleksi ve Kompozit Karşılaştırması",
        paragraflar: [
          "Kataloğumuzda üç sert levha ailesi de bulunur. Doğru seçim, panonun nerede duracağına göre değişir.",
        ],
        tablo: {
          basliklar: ["Malzeme", "Öne çıkan yönü", "Nerede tercih edilir"],
          satirlar: [
            ["Dekota / Foreks", "Hafif ve ekonomik", "İç mekân pano, yönlendirme, fuar"],
            ["Pleksi (akrilik)", "Parlak, şeffaf seçenekli, prestijli", "Resepsiyon logosu, vitrin, iç mekân tabela"],
            ["Alüminyum kompozit", "En dayanıklı, dış mekân standardı", "Kalıcı cephe tabelası, dış yönlendirme"],
          ],
        },
      },
      {
        baslik: "Kesim ve Uygulama Seçenekleri",
        liste: [
          "Standart dikdörtgen kesim: en yaygın ve en ekonomik seçenek.",
          "CNC özel kesim: logo formu, harf kesimi, oval veya özel geometrik formlar.",
          "Delik açma: askı veya vidalı montaj için köşe delikleri.",
          "Folyo kaplama: parlak veya mat yüzey tercihine göre baskı üzerine uygulanır.",
        ],
      },
      {
        baslik: "Kullanım Alanları",
        liste: [
          "İç mekân tabela ve kurumsal yönlendirme panoları",
          "Fuar standı, tanıtım panosu ve backdrop uygulamaları",
          "Mağaza içi kampanya ve fiyat panoları",
          "Okul, hastane ve kamu binalarında bilgilendirme levhaları",
          "Restoran ve cafe menü panoları",
          "Resepsiyon ve ofis logo uygulamaları",
        ],
      },
      {
        baslik: "Dosya Hazırlama ve Üretim",
        paragraflar: [
          "Baskı dosyasını gerçek ölçüsünde ve CMYK renk uzayında hazırlayın. Özel kesim isteniyorsa kesim yolunu vektörel olarak ayrı katmanda belirtin. Kenarlardan birkaç milimetre taşma payı bırakmak kesimde beyaz şerit oluşmasını önler.",
          "Ölçüyü konfigüratöre girdiğinizde KDV dahil fiyat anında hesaplanır. Tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği talep edebilir, ekibimizin hazırladığı görseli onayladıktan sonra üretime geçebilirsiniz.",
        ],
      },
    ],
  },
};

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  const j = await r.json();
  return j.accessToken || j.access_token || j.token;
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

const kategoriler = await fetch(`${API}/api/categories`).then((r) => r.json())
  .then((j) => (Array.isArray(j) ? j : j.items ?? []));

let ok = 0, hata = 0;
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const cat = kategoriler.find((c) => c.slug === slug);
  if (!cat) { console.error(`✗ kategori bulunamadı: ${slug}`); hata++; continue; }
  const mevcut = cat.content && typeof cat.content === "object" ? cat.content : {};
  const yeniContent = { ...mevcut, ...icerik };
  const ozet = `seoBölüm:${icerik.seoBolumler.length} sss:${icerik.faqs.length}`;
  if (DRY) { console.log(`[DRY] ${slug} → ${ozet}`); continue; }
  const res = await fetch(`${API}/api/categories/${cat.id}`, {
    method: "PATCH", headers: H, body: JSON.stringify({ content: yeniContent }),
  });
  if (!res.ok) { console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  // Yazma doğrulaması (ürün içeriğinde yaşadığımız sessiz whitelist tuzağı)
  const kontrol = await fetch(`${API}/api/categories`).then((r) => r.json())
    .then((j) => (Array.isArray(j) ? j : j.items ?? []).find((c) => c.slug === slug));
  const yazildi = Boolean(kontrol?.content?.seoBolumler?.length);
  if (!yazildi) { console.error(`✗ ${slug}: PATCH 200 döndü ama içerik YAZILMADI (API content alanını kabul etmiyor olabilir)`); hata++; continue; }
  console.log(`✓ ${slug} güncellendi ve doğrulandı — ${ozet}`);
  ok++;
}
console.log(`\nÖzet — güncellenen: ${ok} · hata: ${hata}`);
