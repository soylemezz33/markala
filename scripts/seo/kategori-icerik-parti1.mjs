#!/usr/bin/env node
/**
 * TİCARİ SEO — kategori içerikleri, PARTİ 1 (2026-09-04, Yetişme Planı Faz 1).
 *
 * Kapsam: kartvizit, brosur, afis, rollup, etiket — arama hacmi en yüksek beş konu.
 * Rakip kelime analizi (DataForSEO, 4 Eyl): bu konularda liderler "nedir / ölçü / örnekleri"
 * sorularıyla trafik alıyor; kategori sayfamızda tek cümlelik açıklama vardı.
 *
 * Yapı ve kurallar scripts/seo/kategori-icerik.mjs ile aynı:
 *  - seo.title / seo.description → <title> ve meta description
 *  - faqs (8 soru) → sayfa altı SSS + FAQPage şeması
 *  - seoBolumler (5-6 bölüm, isteğe bağlı tablo) → ürün kartlarının altında
 *  - FİYAT POLİTİKASI: içeriğe SABİT TL RAKAMI yazılmaz (kur/gramaj değişince yalan olur);
 *    hesaplama mantığı + konfigüratöre yönlendirme. Rakamlar yalnız ölçü/gramaj/adet.
 *  - Ürün gerçekleri canlı katalogdan alındı (ebatlar, gramajlar, adet kademeleri, süreler).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kategori-icerik-parti1.mjs [--dry]
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

const ICERIK = {
  kartvizit: {
    seo: {
      title: "Kartvizit Baskı Fiyatları 2026 — 1.000 Adet, Online Sipariş",
      description:
        "Kartvizit baskı: 82×52 mm tek ebat, mat/parlak selefon, kabartmalı, sıvama ve altın yaldız seçenekleri. 1.000-10.000 adet, KDV dahil anlık fiyat, 2-3 iş günü üretim.",
    },
    faqs: [
      { q: "Kartvizit ölçüsü kaç cm olmalı?", a: "Türkiye'de en yaygın kartvizit ölçüsü 85×55 mm'dir; Markala'da klasik kartvizit tek ebat 82×52 mm üretilir. Bu ölçü standart kartvizitliklere ve cüzdan bölmelerine sorunsuz sığar. Tasarım dosyanızı 82×52 mm net alan artı her kenardan 3 mm taşma payı ile, yani 88×58 mm olarak hazırlayın." },
      { q: "1.000 adet kartvizit fiyatı neye göre değişir?", a: "Fiyatı üç şey belirler: seri (EKO, LAK, VIP), yüzey işlemi (selefonsuz, mat veya parlak selefon, tek ya da çift yüz) ve adet kademesi. 1.000 adet başlangıç kademesidir; 2.000, 3.000, 5.000 ve 10.000 adette birim fiyat belirgin düşer. Ürün sayfasındaki konfigüratörde paket ve adedi seçtiğinizde KDV dahil tutar anında hesaplanır." },
      { q: "Mat selefon mu parlak selefon mu seçmeliyim?", a: "Mat selefon parmak izi tutmaz, yazılar daha sakin ve kurumsal görünür; hukuk, danışmanlık ve sağlık gibi sektörlerde tercih edilir. Parlak selefon renkleri canlandırır ve fotoğraf ağırlıklı tasarımlarda öne çıkar. İkisi de kartı yıpranmaya karşı korur; selefonsuz kart en ekonomik seçenektir ama daha çabuk kirlenir." },
      { q: "Kabartmalı, sıvama ve yaldızlı kartvizit arasındaki fark nedir?", a: "Kabartmalı (rölyef) kartvizitte logo veya yazı yüzeyden dışarı çıkar; dokunulduğunda hissedilir. Sıvama kartvizit iki kâğıdın birbirine yapıştırılmasıyla üretilir; 800 gr'a kadar kalın, tok bir gövde verir. Yaldızlı kartvizitte sıcak damga tekniğiyle altın veya gümüş metalik detay uygulanır. Üçü de klasik karta göre daha premium bir izlenim bırakır; kabartma ve yaldız aynı kartta birleştirilebilir." },
      { q: "Tek yüz mü çift yüz mü baskı yaptırmalıyım?", a: "Ön yüzde isim ve iletişim, arka yüzde logo, hizmet listesi veya QR kod kullanacaksanız çift yüz seçin. Yalnızca iletişim bilgisi taşıyan sade kartlarda tek yüz baskı yeterlidir ve daha ekonomiktir. Çift yüz baskıda arka yüzü boş bırakmak yerine markanızı güçlendiren tek bir öğe koymak kartın hatırlanma oranını artırır." },
      { q: "Kartvizit için hangi dosya formatını göndermeliyim?", a: "En güvenli format, yazıları eğriye (outline) çevrilmiş PDF'dir. Renk uzayı CMYK olmalı, çözünürlük 300 dpi'dan düşük olmamalıdır. Dosyayı 82×52 mm net ölçüde ve 3 mm taşma payıyla hazırlayın; önemli yazıları kenardan en az 3 mm içeride tutun. Tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği isteyebilirsiniz." },
      { q: "Kartvizit kaç günde teslim edilir?", a: "Klasik kartvizit dosya onayından sonra 2-3 iş gününde üretilir, ardından 2-4 iş günü içinde DHL ile 81 ile teslim edilir. Kabartma, sıvama ve yaldız gibi ek işlemler üretim süresine bir iki gün ekleyebilir. Sipariş durumunuzu hesabınızdan ve sipariş takip sayfasından izleyebilirsiniz." },
      { q: "Az adetli kartvizit sipariş edebilir miyim?", a: "Klasik kartvizitte en düşük kademe 1.000 adettir; ofset baskıda kalıp ve hazırlık maliyeti sabit olduğu için daha düşük adetler birim fiyatı çok yükseltir. Birden fazla kişi için kartvizit gerekiyorsa her isim ayrı bir sipariş satırı olarak eklenir; aynı tasarımda yalnızca isim değişen kartlar için sipariş notuna bilgi bırakmanız yeterlidir." },
    ],
    seoBolumler: [
      {
        baslik: "Kartvizit Baskı Fiyatı Neye Göre Belirlenir?",
        paragraflar: [
          "Kartvizit fiyatı adet başına değil, paket başına hesaplanır. Üç değişken tutarı belirler: seçtiğiniz seri (EKO, LAK, VIP), yüzey işlemi (selefonsuz, mat selefon, parlak selefon; tek veya çift yüz) ve adet kademesi. Ofset baskıda kalıp ve makine hazırlığı sabit bir maliyet olduğu için 1.000 adetten 5.000 adede çıktığınızda birim fiyat belirgin biçimde düşer.",
          "Kabartma, sıvama ve yaldız gibi ek işlemler ayrı paketler olarak sunulur; her biri farklı bir üretim adımı gerektirdiği için fiyatı klasik karta göre yükseltir. Ürün sayfasındaki konfigüratörde paket ve adedi seçtiğinizde KDV dahil toplam tutarı anında görürsünüz; sepette ek ücret çıkmaz.",
        ],
      },
      {
        baslik: "Kartvizit Çeşitleri: Hangisi Size Uygun?",
        paragraflar: [
          "Doğru kartvizit, sektörünüze ve kartı ne kadar sık dağıttığınıza göre değişir. Aşağıdaki tablo katalogdaki dört ana aileyi karşılaştırır.",
        ],
        tablo: {
          basliklar: ["Kartvizit tipi", "Öne çıkan özellik", "Kime uygun"],
          satirlar: [
            ["Klasik (EKO / LAK / VIP)", "82×52 mm, 21 paket varyantı, mat veya parlak selefon", "Sık dağıtılan, ekonomik ve hızlı kart isteyenler"],
            ["Kabartmalı", "Rölyef baskı, oval köşe ve özel kesim seçenekleri", "Dokunsal, hatırlanır bir kart isteyen profesyoneller"],
            ["Sıvama", "İki kâğıt yapıştırma, 800 gr'a kadar kalınlık", "Premium markalar, butik ve tasarım ofisleri"],
            ["Yaldızlı", "Altın veya gümüş sıcak damga detay", "Kuyumcu, otel, hukuk ve finans gibi prestij sektörleri"],
          ],
        },
      },
      {
        baslik: "Selefon, Gramaj ve Yüzey: Kartın Elde Duruşunu Belirleyen Üç Karar",
        paragraflar: [
          "Selefon, baskının üzerine uygulanan koruyucu ince filmdir. Mat selefon parmak izi tutmaz ve yazıların okunurluğunu artırır; parlak selefon renkleri canlandırır ve görselleri öne çıkarır. Selefonsuz kart en ekonomik seçenektir ancak daha çabuk yıpranır.",
          "Klasik kartvizit 250 gr kuşe kâğıda basılır; bu, elde tutulduğunda tok ama cüzdanda esneyen dengeli bir gramajdır. Daha kalın bir kart isteyenler için sıvama seri 800 gr'a kadar çıkar. Kalınlık arttıkça kart daha prestijli hissedilir, ancak kartvizitlik ve cüzdan bölmelerine daha az kart sığar.",
        ],
      },
      {
        baslik: "Tasarım Dosyası Nasıl Hazırlanır?",
        paragraflar: [
          "Net ölçü 82×52 mm'dir; her kenara 3 mm taşma payı ekleyerek dosyayı 88×58 mm olarak hazırlayın. İsim, telefon ve logo gibi önemli öğeleri kenardan en az 3 mm içeride tutun; kesim sırasında yarım milimetrelik kaymalar normaldir. Renk uzayı CMYK, çözünürlük en az 300 dpi olmalı, yazılar eğriye (outline) çevrilmelidir.",
          "Koyu zeminli tasarımlarda kenarlarda beyaz çizgi görünmemesi için zemin taşma payına kadar uzatılmalıdır. Yaldız veya kabartma istediğiniz alanları ayrı bir katmanda ve %100 siyah olarak işaretleyin. Hazır tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği seçeneğini işaretlemeniz yeterlidir; tasarımcımız onayınızı almadan baskıya geçmez.",
        ],
      },
      {
        baslik: "Üretim ve Teslimat",
        paragraflar: [
          "Klasik kartvizit dosya onayından sonra 2-3 iş gününde üretilir; kabartma, sıvama ve yaldız gibi ek işlemler bir iki gün ekleyebilir. Üretim tamamlandığında sipariş DHL ile kargoya verilir ve 81 ile 2-4 iş günü içinde ulaşır. Siparişinizin her aşamasını hesabınızdan ve sipariş takip sayfasından izleyebilirsiniz.",
        ],
      },
    ],
  },

  brosur: {
    seo: {
      title: "Broşür ve El İlanı Baskı Fiyatları 2026 — A7'den A3'e Online Sipariş",
      description:
        "Broşür baskı: 105 gr el ilanı, 115 gr çift yön, 128 gr Pro ve 200 gr selefonlu. A7, A5, A4, A3 ebat; 1.000-12.000 adet. KDV dahil anlık fiyat, 2-3 iş günü üretim.",
    },
    faqs: [
      { q: "Broşür ile el ilanı arasındaki fark nedir?", a: "El ilanı tek yön basılır (4+0), daha ince kâğıt kullanır ve elden ele dağıtım için üretilir; kampanya ve açılış duyurularının en ekonomik yoludur. Broşür çift yön basılır (4+4), daha kalın kâğıda gelir ve gerektiğinde katlanarak menü, hizmet listesi ya da tanıtım kitapçığı olarak kullanılır. Bir günlük dağıtım için el ilanı, elde tutulacak bir tanıtım için broşür seçin." },
      { q: "Matbaa A4 ölçüsü neden 21×29,7 cm değil?", a: "Matbaacılıkta A4 ebat, standart ISO A4'ten (21×29,7 cm) biraz küçük olan 20×28 cm'dir; A5 14×20 cm, A3 28×40 cm, A7 ise 9,5×20 cm olarak üretilir. Bu ölçüler tabakadan en az fireyle çıkacak şekilde belirlenmiştir ve fiyatı düşürür. Tasarımınızı bu net ölçülere göre hazırlayın; ISO ölçüsünde gelen dosyalar oran bozulmadan küçültülür." },
      { q: "105, 115, 128 ve 200 gr kâğıt arasında nasıl seçim yaparım?", a: "105 gr en ince ve en ekonomik seçenektir, tek yön el ilanı için yeterlidir. 115 gr çift yön broşürün standart kâğıdıdır; iki yüz baskıda arka yüz öne çok geçmez. 128 gr Pro seri daha tok bir his verir ve kurumsal tanıtımlar için önerilir. 200 gr selefonlu seri en kalın ve dayanıklı olandır; yağa ve sıvıya dirençli olduğu için restoran menüsü ve uzun süre kullanılacak hizmet listeleri için idealdir." },
      { q: "Broşür fiyatı adet arttıkça neden düşer?", a: "Ofset baskıda kalıp hazırlığı ve makine ayarı sabit maliyettir; 1.000 adet de 10.000 adet de aynı hazırlığı gerektirir. Bu yüzden adet arttıkça birim fiyat belirgin düşer. Katalogdaki kademeler 1.000, 2.000, 5.000 ve 10.000 adettir; el ilanında 2.000 adetten 12.000 adede kadar çıkar. Konfigüratörde ebat ve adedi seçtiğinizde KDV dahil tutar anında hesaplanır." },
      { q: "Broşür katlama seçenekleri nelerdir?", a: "En yaygın üç biçim tek kırım (A4'ten A5'e ikiye katlama), iki kırım pencere (üç sayfa, Z veya C biçiminde) ve çift kırım paralel katlamadır. Katlama, sayfa düzenini belirler: iki kırım C katlamada kapak, iç sayfa ve arka kapak akışı vardır. Tasarımı yapmadan önce katlama biçimini belirleyin; sipariş notuna yazdığınız katlama talebi üretimde uygulanır." },
      { q: "Broşür için dosyamı nasıl hazırlamalıyım?", a: "Dosyayı seçtiğiniz matbaa ebadında (örneğin A4 için 20×28 cm) ve her kenardan 3 mm taşma payıyla PDF olarak gönderin. Renkler CMYK, çözünürlük 300 dpi olmalı; yazılar eğriye çevrilmelidir. Katlamalı broşürlerde kırım çizgisine denk gelen yazı veya logo bırakmayın. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz." },
      { q: "Pro Broşür serisi neden ayrı bir ürün?", a: "Sektörde 'A4 broşür' adıyla küçültülmüş ebat ve düşürülmüş gramajla üretim yaygındır. Pro Broşür bu uygulamanın tersine tam ebat ve tam 128 gr kuşe gramaj garantisiyle üretilir; ürün açıklamasında ne yazıyorsa o teslim edilir. Kurumsal kimliğe önem veren, karşılaştırma yapan ve teslim aldığı ürünü ölçen müşteriler için tasarlandı." },
      { q: "Broşür kaç günde teslim edilir?", a: "Dosya onayından sonra üretim 2-3 iş günü sürer; selefonlu seride selefon uygulaması bu süreye bir gün ekleyebilir. Üretim bitince sipariş DHL ile kargoya verilir ve 81 ile 2-4 iş gününde ulaşır. Etkinlik tarihine yetişmesi gereken siparişlerde tarihi sipariş notuna yazın, üretim planı buna göre yapılır." },
    ],
    seoBolumler: [
      {
        baslik: "Broşür Baskı Fiyatı Neye Göre Hesaplanır?",
        paragraflar: [
          "Broşür fiyatı üç değişkenle belirlenir: ebat (A7, A5, A4, A3), kâğıt gramajı ve yüzey işlemi (105 gr tek yön, 115 gr çift yön, 128 gr Pro, 200 gr selefonlu) ve adet kademesi. Ofset baskıda kalıp ve makine hazırlığı sabit bir maliyet olduğu için 1.000 adetten 5.000 veya 10.000 adede çıktığınızda birim fiyat belirgin biçimde düşer.",
          "Ürün sayfasındaki konfigüratörde ebat ve adedi seçtiğinizde KDV dahil toplam tutarı anında görürsünüz. Katlama gibi bitirme işlemleri sipariş notuyla iletilir; içeriğe sabit fiyat yazmak yerine canlı hesaplamayı kullanmamızın nedeni kâğıt maliyetinin dönem dönem değişmesidir.",
        ],
      },
      {
        baslik: "Matbaa Ebatları: A4 Neden 20×28 cm?",
        paragraflar: [
          "Matbaacılıkta kullanılan A ebatları, ofis kâğıdının ISO ölçülerinden biraz küçüktür. Bunun nedeni baskı tabakasından en az fireyle en çok ürünün çıkmasıdır; bu tasarruf doğrudan fiyata yansır. Katalogdaki net ölçüler aşağıdaki gibidir; tasarımınızı bu ölçülere göre hazırlayın.",
        ],
        tablo: {
          basliklar: ["Ebat", "Matbaa ölçüsü (net)", "Tipik kullanım"],
          satirlar: [
            ["A7", "9,5 × 20 cm", "Kupon, menü eki, sayaç üstü kartı"],
            ["A5", "14 × 20 cm", "El ilanı, kampanya broşürü, sipariş menüsü"],
            ["A4", "20 × 28 cm", "Kurumsal tanıtım, tek veya iki kırım katlamalı broşür"],
            ["A3", "28 × 40 cm", "Katlanınca A4 olan dört sayfalı broşür, küçük afiş"],
          ],
        },
      },
      {
        baslik: "Hangi Kâğıt, Hangi İş İçin?",
        paragraflar: [
          "Kâğıt seçimi broşürün ömrünü ve elde bıraktığı izlenimi belirler. Katalogdaki dört seri farklı ihtiyaçlara karşılık gelir.",
        ],
        tablo: {
          basliklar: ["Seri", "Kâğıt ve baskı", "En uygun kullanım"],
          satirlar: [
            ["El İlanı", "105 gr kuşe, tek yön renkli (4+0)", "Açılış, indirim, seçim ve etkinlik dağıtımı; 2.000-12.000 adet"],
            ["Broşür", "115 gr kuşe, çift yön renkli (4+4)", "Restoran menüsü, klinik ve emlak tanıtımı; 1.000-10.000 adet"],
            ["Pro Broşür", "128 gr kuşe, çift yön, tam ebat ve tam gramaj garantili", "Kurumsal tanıtım, karşılaştırma yapan kurumsal alıcılar"],
            ["Selefonlu Broşür", "200 gr kuşe, çift yön, parlak selefon", "Yağa ve sıvıya dayanması gereken menüler, spa ve otel hizmet listeleri"],
          ],
        },
      },
      {
        baslik: "Katlama Biçimleri ve Sayfa Düzeni",
        paragraflar: [
          "Katlama, broşürün nasıl okunacağını belirler. Tek kırım A4 broşürü ikiye katlayarak dört sayfalık bir düzen verir; iki kırım C katlama kapak, iç sayfalar ve arka kapaktan oluşan klasik üç bölümlü broşürü oluşturur; Z katlama ise her panelin bağımsız okunmasını sağlar ve harita ya da program akışı için uygundur.",
          "Tasarıma başlamadan katlama biçimini belirleyin ve kırım çizgilerine yazı ya da logo denk getirmeyin. Katlama talebinizi sipariş notuna yazmanız yeterlidir; üretimde uygulanır.",
        ],
      },
      {
        baslik: "Dosya Hazırlığı ve Teslimat",
        paragraflar: [
          "Dosyayı seçtiğiniz matbaa ebadında, her kenardan 3 mm taşma payıyla ve CMYK renk uzayında PDF olarak gönderin; çözünürlük 300 dpi, yazılar eğriye çevrilmiş olmalıdır. Hazır tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği seçeneğini işaretleyin.",
          "Üretim dosya onayından sonra 2-3 iş günü sürer; selefonlu seride bir gün eklenebilir. Sipariş DHL ile 81 ile 2-4 iş gününde teslim edilir ve her aşaması sipariş takip sayfasından izlenir.",
        ],
      },
    ],
  },

  afis: {
    seo: {
      title: "Afiş Baskı Fiyatları 2026 — 34×49 ve 49×69 cm Kâğıt Afiş, Online Sipariş",
      description:
        "Kâğıt afiş baskı: 105 gr kuşe tek yön renkli, 34×49 cm ve 49×69 cm ebat, 250-1.000 adet. Konser, etkinlik ve vitrin afişi için KDV dahil anlık fiyat, 2-3 iş günü üretim.",
    },
    faqs: [
      { q: "Afiş ölçüleri nelerdir, hangisini seçmeliyim?", a: "Katalogda iki ebat vardır: 34×49 cm orta boy ve 49×69 cm büyük boy. Orta boy vitrin camı, pano ve kapı arkası gibi yakından okunan yüzeyler için yeterlidir; büyük boy sokaktan ve uzaktan görülmesi gereken konser, festival ve etkinlik duyuruları için tercih edilir. Aynı tasarımı iki ebatta bastırıp farklı noktalarda kullanmak yaygın bir yöntemdir." },
      { q: "Afiş ile poster arasında fark var mı?", a: "Kullanımda iki kelime çoğu zaman aynı ürünü anlatır. Afiş, bir duyuru veya reklam amacıyla toplu basılan kâğıt ilandır; poster daha çok tek başına dekoratif olarak asılan görsel için kullanılır. Baskı açısından ikisi de kuşe kâğıda tek yön renkli basılır; fark adet ve tasarım amacındadır." },
      { q: "Kâğıt afiş dış mekânda kullanılabilir mi?", a: "105 gr kuşe afiş iç mekân ve korunaklı vitrin arkası için üretilir; yağmur ve güneşe doğrudan maruz kalan yüzeylerde kısa sürede solar ve dağılır. Dış mekân için aynı tasarımı vinil branda üzerine bastırmanız gerekir; branda afiş m² fiyatıyla hesaplanır ve kuşgözüyle asılır. Vinil branda kategorisinden ölçünüzü girerek fiyatını görebilirsiniz." },
      { q: "Afiş baskı fiyatı neye göre belirlenir?", a: "Fiyatı ebat (34×49 veya 49×69 cm) ve adet kademesi (250, 500, 1.000) belirler. Kâğıt ve baskı tekniği sabittir: 105 gr kuşe, tek yön renkli. Ofset baskıda hazırlık maliyeti sabit olduğu için 250 adetten 1.000 adede çıkıldığında birim fiyat belirgin düşer; konfigüratörde ebat ve adedi seçtiğinizde KDV dahil tutar anında görünür." },
      { q: "En az kaç adet afiş sipariş edebilirim?", a: "En düşük kademe 250 adettir. Ofset baskıda kalıp ve hazırlık sabit olduğundan daha düşük adetler birim fiyatı çok yükseltir. Tek veya birkaç adet büyük boy görsel gerekiyorsa dijital baskıyla üretilen vinil branda ya da folyo ürünlerine bakmanız daha ekonomik olur." },
      { q: "Afiş tasarımı için dosyamı nasıl hazırlamalıyım?", a: "Dosyayı seçtiğiniz ebatta (34×49 veya 49×69 cm) ve her kenardan 3 mm taşma payıyla, CMYK renk uzayında, 300 dpi çözünürlükte PDF olarak gönderin. Başlığı afişin üst üçte birine yerleştirin; tarih, yer ve iletişim gibi bilgiler uzaktan okunacak büyüklükte olmalıdır. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz." },
      { q: "Afişte hangi yazı büyüklüğü uzaktan okunur?", a: "Kaba bir kural: 1 metre okuma mesafesi için en az 1 cm harf yüksekliği. Sokaktan 5 metre mesafeden okunacak bir başlık en az 5 cm yüksekliğinde olmalıdır. 49×69 cm afişte ana başlık genellikle 6-8 cm, alt bilgiler 1,5-2 cm harf yüksekliğiyle tasarlanır." },
      { q: "Afiş kaç günde teslim edilir?", a: "Dosya onayından sonra üretim 2-3 iş günü sürer; ardından sipariş DHL ile kargoya verilir ve 81 ile 2-4 iş gününde teslim edilir. Afişler kırışmaması için rulo veya düz paket halinde gönderilir. Etkinlik tarihi yakınsa sipariş notuna yazın, planlama ona göre yapılır." },
    ],
    seoBolumler: [
      {
        baslik: "Afiş Baskı Fiyatı Nasıl Hesaplanır?",
        paragraflar: [
          "Kâğıt afiş fiyatını iki değişken belirler: ebat ve adet. Katalogda 34×49 cm orta boy ve 49×69 cm büyük boy olmak üzere iki ebat, 250, 500 ve 1.000 adetlik üç kademe vardır. Kâğıt ve baskı tekniği sabittir: 105 gr kuşe, tek yön renkli ofset baskı.",
          "Ofset baskıda kalıp ve makine hazırlığı sabit bir maliyet olduğu için 250 adetten 1.000 adede çıkıldığında birim fiyat belirgin biçimde düşer. Ürün sayfasındaki konfigüratörde ebat ve adedi seçtiğinizde KDV dahil toplam tutarı anında görürsünüz.",
        ],
      },
      {
        baslik: "Kâğıt Afiş mi Branda Afiş mi?",
        paragraflar: [
          "Afiş kelimesi iki farklı ürünü kapsar; doğru seçim afişin nerede asılacağına bağlıdır. Aşağıdaki karşılaştırma kararı kolaylaştırır.",
        ],
        tablo: {
          basliklar: ["Özellik", "Kâğıt afiş (105 gr kuşe)", "Branda afiş (vinil)"],
          satirlar: [
            ["Kullanım yeri", "İç mekân, vitrin arkası, pano, kapı", "Dış mekân, cephe, iskele, açık alan"],
            ["Dayanım", "Kısa süreli; neme ve güneşe dayanmaz", "Aylarca; UV ve yağmura dayanıklı"],
            ["Adet mantığı", "Toplu baskı, en az 250 adet", "Tek parça da olur, m² ile fiyatlanır"],
            ["Ebat", "34×49 ve 49×69 cm", "İstenen ölçü, tek parçada 50 m²'ye kadar"],
            ["Asma", "Bant, raptiye, çerçeve", "Kuşgözü, ip, kelepçe"],
          ],
        },
      },
      {
        baslik: "Afiş Tasarımında Okunurluk: Mesafe ve Harf Yüksekliği",
        paragraflar: [
          "Afiş, izleyicinin durup okumadığı bir üründür; mesaj birkaç saniyede algılanmalıdır. Kaba kural her 1 metre okuma mesafesi için en az 1 cm harf yüksekliğidir. Vitrin önünden geçen biri için 3-5 cm'lik başlık yeterlidir; sokağın karşısından okunacak bir duyuruda başlık 6-8 cm'ye çıkmalıdır.",
          "Başlığı afişin üst üçte birine yerleştirin, tarih ve yer bilgisini tek satırda toplayın, iletişim ve QR kodu alt bölüme alın. Beyaz alan bırakmaktan çekinmeyin; kalabalık afiş uzaktan gri bir leke gibi görünür.",
        ],
      },
      {
        baslik: "Kullanım Alanları",
        paragraflar: [
          "Konser ve festival duyuruları, tiyatro ve sergi afişleri, mağaza vitrin kampanyaları, okul ve belediye etkinlikleri, seçim çalışmaları ve emlak ofisi portföy panoları kâğıt afişin en yaygın kullanım alanlarıdır. Aynı tasarımı orta boy ve büyük boy iki ebatta bastırıp iç ve dış noktalara ayrı ayrı dağıtmak, tek siparişle bütün kampanyayı kapatmanın pratik yoludur.",
        ],
      },
      {
        baslik: "Dosya Hazırlığı ve Teslimat",
        paragraflar: [
          "Dosyayı seçtiğiniz ebatta, her kenardan 3 mm taşma payıyla, CMYK renk uzayında ve 300 dpi çözünürlükte PDF olarak gönderin; yazılar eğriye çevrilmiş olmalıdır. Hazır tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği isteyebilirsiniz.",
          "Üretim dosya onayından sonra 2-3 iş günü sürer. Afişler kırışmaması için rulo ya da düz paket halinde DHL ile gönderilir ve 81 ile 2-4 iş gününde ulaşır.",
        ],
      },
    ],
  },

  rollup: {
    seo: {
      title: "Roll-Up Banner Fiyatları 2026 — 85×200 cm Alüminyum Stand, Online Sipariş",
      description:
        "Roll-up banner: 85×200 cm, alüminyum gövde, otomatik geri sarma ve taşıma çantası. Yalnız mekanizma veya baskılı komple stand; 1-10 adet, 2 iş günü üretim.",
    },
    faqs: [
      { q: "Roll-up banner ölçüsü kaç cm?", a: "Standart roll-up 85×200 cm'dir; görsel alanının genişliği 85 cm, kaset yerleştirildiğinde toplam yükseklik yaklaşık 2 metredir. Bu ölçü fuar standı, kongre girişi ve mağaza içi tanıtım için en yaygın tercihtir; kapıdan geçer, araç bagajına sığar ve tek kişi tarafından kurulur. Tasarım dosyanızı 85×200 cm net alan olarak hazırlayın." },
      { q: "Sadece mekanizma ile mekanizma + baskı arasındaki fark nedir?", a: "Sadece mekanizma seçeneğinde alüminyum kaset, ayak ve taşıma çantası gelir; baskıyı kendiniz yaptırıp takarsınız. Mekanizma + baskı seçeneğinde görseliniz roll-up malzemesine basılır, kasete monte edilmiş ve kullanıma hazır halde teslim edilir. Elinizde eski bir kaset yoksa komple ürünü seçmek daha pratiktir." },
      { q: "Roll-up baskısı sonradan değiştirilebilir mi?", a: "Evet. Kaset ve ayak yıllarca kullanılır; kampanya değiştiğinde yalnızca baskılı görsel yenilenir. Yeni görselin eski kasete montajı için ölçünün 85×200 cm olması yeterlidir. Sık kampanya değiştiren markalar tek kaset ve birkaç görselle çalışır." },
      { q: "Roll-up dış mekânda kullanılabilir mi?", a: "Roll-up iç mekân ürünüdür. Hafif rüzgârda bile devrilebilir ve baskı malzemesi doğrudan güneş ve yağmura uzun süre dayanmaz. Dış mekân için yelken bayrak veya kuşgözlü vinil branda daha uygundur; her ikisi de katalogda yer alır." },
      { q: "Roll-up tasarımı nasıl hazırlanmalı?", a: "Dosyayı 85×200 cm ölçüsünde, CMYK renk uzayında ve en az 100-150 dpi çözünürlükte PDF olarak hazırlayın. Logo ve ana mesajı üst üçte birlik alana yerleştirin; alt 20-25 cm kasete yakın kaldığı için burada önemli bilgi olmasın. Yazı büyüklüğü 2-3 metre mesafeden okunacak şekilde en az 3 cm olmalıdır." },
      { q: "Kaç adet roll-up sipariş edebilirim?", a: "Adet kademeleri 1, 2, 5 ve 10'dur. Fuar için tek adet yeterli olabilir; birden fazla şube veya etkinlik noktası varsa 5 ve 10 adet kademeleri birim fiyatı düşürür. Farklı görseller için her tasarım ayrı sipariş satırı olarak eklenir." },
      { q: "Roll-up nasıl kurulur, taşınması zor mu?", a: "Kaset yere konur, arka destek çubuğu takılır ve görsel yukarı çekilerek çubuğa asılır; kurulum bir dakika sürer. Görsel kullanımdan sonra kasete geri sarılır. Kaset ve çubuk yumuşak taşıma çantasına sığar; toplam ağırlık tek elle taşınacak kadar hafiftir." },
      { q: "Roll-up kaç günde teslim edilir?", a: "Baskılı roll-up dosya onayından sonra 2 iş gününde hazırlanır, ardından DHL ile kargoya verilir ve 81 ile 2-4 iş gününde ulaşır. Sadece mekanizma siparişlerinde baskı süresi olmadığı için gönderim daha hızlıdır. Fuar tarihi yakınsa sipariş notuna yazın." },
    ],
    seoBolumler: [
      {
        baslik: "Roll-Up Fiyatı Neye Göre Belirlenir?",
        paragraflar: [
          "Roll-up fiyatını iki karar belirler: sadece mekanizma mı yoksa mekanizma + baskı mı istediğiniz ve adet kademesi (1, 2, 5, 10). Ebat standarttır: 85×200 cm. Alüminyum kaset, ayak ve yumuşak taşıma çantası her iki seçenekte de dahildir.",
          "Baskılı seçenekte görseliniz roll-up malzemesine basılır ve kasete monte edilmiş halde teslim edilir. Ürün sayfasındaki konfigüratörde seçeneği ve adedi işaretlediğinizde KDV dahil tutar anında hesaplanır.",
        ],
      },
      {
        baslik: "Roll-Up mı, X-Banner mı, Yelken Bayrak mı?",
        paragraflar: [
          "Taşınabilir tanıtım standları arasında doğru seçim, nerede kullanacağınıza bağlıdır. Aşağıdaki tablo üç yaygın seçeneği karşılaştırır.",
        ],
        tablo: {
          basliklar: ["Ürün", "Güçlü yanı", "Sınırı", "En uygun yer"],
          satirlar: [
            ["Roll-up 85×200", "Bir dakikada kurulum, görsel değiştirilebilir, çantasıyla taşınır", "İç mekân; rüzgârda devrilir", "Fuar, kongre, mağaza içi, resepsiyon"],
            ["X-banner", "Hafif ve ucuz", "Görsel gergin durmaz, kaset yok", "Kısa süreli iç mekân duyurusu"],
            ["Yelken bayrak", "Dış mekânda rüzgârla dalgalanır, uzaktan görünür", "Kapalı alanda hantal", "Mağaza önü, açık hava etkinliği, otopark"],
          ],
        },
      },
      {
        baslik: "Tasarımda Dikkat Edilecekler",
        paragraflar: [
          "Roll-up ayakta duran bir insan gibi okunur: göz hizası 140-170 cm bandındadır. Logoyu ve ana mesajı en üst 60 cm'lik alana, destekleyici görseli ortaya, iletişim ve QR kodu 60-100 cm bandına yerleştirin. Alt 20-25 cm kasete yakın kaldığından ve çoğu zaman masa ya da insanlarla kapandığından oraya önemli bilgi koymayın.",
          "Dosyayı 85×200 cm ölçüsünde, CMYK renk uzayında ve 100-150 dpi çözünürlükte PDF olarak hazırlayın. Ana başlık 2-3 metre mesafeden okunacak şekilde en az 3 cm harf yüksekliğinde olmalıdır. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz.",
        ],
      },
      {
        baslik: "Kullanım Alanları",
        paragraflar: [
          "Fuar ve kongre standları, seminer ve lansman sahneleri, mağaza girişleri, otel ve klinik resepsiyonları, okul ve belediye etkinlikleri, ürün tanıtım köşeleri roll-up'ın en sık kullanıldığı yerlerdir. Kaset yıllarca kullanıldığı için her kampanyada yalnızca görseli yenilemek, baştan stand almaktan çok daha ekonomiktir.",
        ],
      },
      {
        baslik: "Üretim ve Teslimat",
        paragraflar: [
          "Baskılı roll-up dosya onayından sonra 2 iş gününde hazırlanır ve kasete monte edilmiş, çantasına yerleştirilmiş halde DHL ile gönderilir; 81 ile 2-4 iş gününde ulaşır. Sadece mekanizma siparişleri baskı beklemeden kargoya verilir.",
        ],
      },
    ],
  },

  etiket: {
    seo: {
      title: "Etiket ve Sticker Baskı Fiyatları 2026 — Kuşe Çıkartma, Online Sipariş",
      description:
        "Etiket baskı: 90 gr kuşe yapışkanlı çıkartma, kartvizit boydan 25,5×33 cm'ye. Parlak selefon, özel kesim ve altın yaldız seçenekleri; 1.000 adet, 2-3 iş günü üretim.",
    },
    faqs: [
      { q: "Etiket ile sticker arasındaki fark nedir?", a: "İkisi de yapışkanlı baskı ürünüdür. Etiket genellikle ürün ambalajına, kavanoza, şişeye veya kargo paketine bilgi taşımak için yapıştırılır ve dikdörtgen kesilir. Sticker daha çok tanıtım ve süsleme amacıyla kullanılır, logo veya şekle göre özel kesilir. Katalogdaki 90 gr kuşe çıkartma her iki amaçla da kullanılır; özel kesim seçeneğiyle şekilli sticker üretilir." },
      { q: "Etiket ebatları nelerdir?", a: "Katalogda üç boy vardır: 53×83 mm veya 52×82 mm kartvizit boy, 15,5×25,5 cm orta boy ve 25,5×33 cm büyük boy. Kartvizit boy ürün ve kavanoz etiketi için, orta boy kutu ve koli için, büyük boy ise kargo paketi, dosya ve tabaka etiketi için tercih edilir. Tasarımınızı seçtiğiniz boyun net ölçüsünde hazırlayın." },
      { q: "Parlak selefonlu ve selefonsuz etiket arasındaki fark nedir?", a: "Parlak selefon, baskının üzerine uygulanan koruyucu filmdir; etiketi neme, sürtünmeye ve solmaya karşı korur, renkleri canlandırır. Kavanoz, şişe ve sık elle tutulan ürünler için selefonlu etiket önerilir. Selefonsuz etiket daha ekonomiktir ve üzerine kalemle yazılabilir; kargo paketi ve iç kullanım etiketleri için yeterlidir." },
      { q: "Özel kesim (şekilli) etiket nasıl sipariş edilir?", a: "Özel kesim selefon seçeneğini işaretleyin ve tasarım dosyanızda kesim çizgisini ayrı bir katmanda, ince bir vektör hat olarak gönderin. Logo, daire, oval ve yuvarlatılmış köşe en yaygın kesim biçimleridir. Kesim çizgisiyle tasarımın önemli öğeleri arasında en az 2 mm boşluk bırakın." },
      { q: "Altın yaldızlı etiket ne için kullanılır?", a: "Altın yaldız seçeneğinde sıcak damga tekniğiyle metalik altın detay uygulanır. Zeytinyağı, bal, kozmetik, çikolata ve butik ürün etiketlerinde premium bir görünüm verir. Yaldız uygulanacak alanı tasarımda ayrı bir katmanda ve %100 siyah olarak işaretlemeniz yeterlidir." },
      { q: "Etiket fiyatı neye göre belirlenir?", a: "Fiyatı ebat ve yüzey işlemi belirler: selefonsuz, parlak selefonlu, özel kesim veya altın yaldız. Standart adet kademesi 1.000'dir; kartvizit boy en ekonomik seçenek, altın yaldız ve büyük boy en yüksek maliyetli seçeneklerdir. Ürün sayfasındaki konfigüratörde varyantı seçtiğinizde KDV dahil tutar anında hesaplanır." },
      { q: "Etiket dosyasını nasıl hazırlamalıyım?", a: "Dosyayı seçtiğiniz boyun net ölçüsünde, her kenardan 2-3 mm taşma payıyla, CMYK renk uzayında ve 300 dpi çözünürlükte PDF olarak gönderin. Barkod ve içindekiler gibi küçük yazılar için en az 6 punto kullanın; barkodu siyah ve düz zemin üzerine yerleştirin. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz." },
      { q: "Etiket kaç günde teslim edilir?", a: "Dosya onayından sonra üretim 2-3 iş günü sürer; özel kesim ve yaldız bir gün ekleyebilir. Ardından sipariş DHL ile kargoya verilir ve 81 ile 2-4 iş gününde ulaşır. Etiketler tabaka halinde, kırışmayacak şekilde paketlenir." },
    ],
    seoBolumler: [
      {
        baslik: "Etiket Baskı Fiyatı Nasıl Hesaplanır?",
        paragraflar: [
          "Etiket fiyatını iki değişken belirler: ebat (kartvizit boy, 15,5×25,5 cm orta boy, 25,5×33 cm büyük boy) ve yüzey işlemi (selefonsuz, parlak selefonlu, özel kesim selefon, altın yaldız). Kâğıt sabittir: 90 gr kuşe yapışkanlı çıkartma. Standart adet kademesi 1.000'dir.",
          "Ürün sayfasındaki konfigüratörde varyantı seçtiğinizde KDV dahil toplam tutarı anında görürsünüz. Seri numaralı numaratör etiketleri, kalite kontrol ve uyarı etiketleri gibi hazır içerikli ürünler ise iş güvenliği kategorilerinde ayrı ürün olarak listelenir.",
        ],
      },
      {
        baslik: "Hangi Etiket, Hangi İş İçin?",
        paragraflar: [
          "Ebat ve yüzey seçimi etiketin nereye yapıştırılacağına bağlıdır. Aşağıdaki tablo katalogdaki altı varyantı kullanım yerine göre eşleştirir.",
        ],
        tablo: {
          basliklar: ["Varyant", "Özellik", "En uygun kullanım"],
          satirlar: [
            ["Kartvizit boy · selefonsuz", "53×83 mm, üzerine yazılabilir, en ekonomik", "Kargo paketi, iç kullanım, fiyat etiketi"],
            ["Kartvizit boy · parlak selefonlu", "Neme ve sürtünmeye dayanıklı, canlı renk", "Kavanoz, şişe, kozmetik ve gıda ambalajı"],
            ["Özel kesim selefon", "Logo veya şekle göre kesim", "Sticker, marka çıkartması, promosyon"],
            ["Altın yaldız", "Sıcak damga metalik detay", "Zeytinyağı, bal, çikolata, butik ürün"],
            ["Orta boy 15,5×25,5 cm", "Geniş bilgi alanı", "Kutu, koli, ürün içerik etiketi"],
            ["Büyük boy 25,5×33 cm", "Tabaka boyutunda", "Kargo etiketi, dosya sırtı, pano"],
          ],
        },
      },
      {
        baslik: "Kavanoz ve Şişe Etiketinde Dikkat Edilecekler",
        paragraflar: [
          "Gıda ve kozmetik etiketleri nemle, yağla ve buzdolabı soğuğuyla karşılaşır; bu ürünlerde parlak selefonlu varyant seçin. Yuvarlak yüzeye yapıştırılacak etiketlerde uzun kenarı şişenin çevresine paralel tutun ve etiketi çevrenin yaklaşık üçte ikisini saracak genişlikte planlayın; uçların üst üste binmesi kabarma yapar.",
          "Zorunlu bilgiler (içindekiler, net miktar, üretici, son kullanma tarihi, barkod) için en az 6 punto yazı kullanın; barkodu siyah ve düz açık zemin üzerine yerleştirin. Son kullanma tarihi elle yazılacaksa o alan selefonsuz bırakılmalıdır; bunu sipariş notuna yazın.",
        ],
      },
      {
        baslik: "Dosya Hazırlığı",
        paragraflar: [
          "Dosyayı seçtiğiniz boyun net ölçüsünde, her kenardan 2-3 mm taşma payıyla, CMYK renk uzayında ve 300 dpi çözünürlükte PDF olarak gönderin; yazıları eğriye çevirin. Özel kesimde kesim çizgisini ayrı katmanda ince vektör hat olarak, yaldız alanını ise %100 siyah ayrı katmanda işaretleyin. Tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği isteyebilirsiniz.",
        ],
      },
      {
        baslik: "Üretim ve Teslimat",
        paragraflar: [
          "Üretim dosya onayından sonra 2-3 iş günü sürer; özel kesim ve yaldız bir gün ekleyebilir. Etiketler tabaka halinde paketlenir, DHL ile kargoya verilir ve 81 ile 2-4 iş gününde ulaşır. Siparişin her aşaması sipariş takip sayfasından izlenir.",
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

// İçerik tutarlılık denetimi: sabit TL rakamı yok, her kategoride 8 SSS, her bölümde paragraf var.
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const metin = JSON.stringify(icerik);
  if (/\d\s?(₺|TL)\b/.test(metin)) { console.error(`✗ ${slug}: içerikte sabit TL rakamı var — fiyat politikasına aykırı`); process.exit(1); }
  if (icerik.faqs.length !== 8) { console.error(`✗ ${slug}: SSS sayısı 8 olmalı (${icerik.faqs.length})`); process.exit(1); }
  for (const b of icerik.seoBolumler) if (!b.baslik || !b.paragraflar?.length) { console.error(`✗ ${slug}: boş bölüm`); process.exit(1); }
  if (icerik.seo.title.length > 75 || icerik.seo.description.length > 175) console.warn(`! ${slug}: title ${icerik.seo.title.length} / description ${icerik.seo.description.length} karakter`);
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
  const ozet = `seoBölüm:${icerik.seoBolumler.length} sss:${icerik.faqs.length} title:${icerik.seo.title.length}k desc:${icerik.seo.description.length}k`;
  if (DRY) { console.log(`[DRY] ${slug} → ${ozet}`); continue; }
  const res = await fetch(`${API}/api/categories/${cat.id}`, {
    method: "PATCH", headers: H, body: JSON.stringify({ content: yeniContent }),
  });
  if (!res.ok) { console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  const kontrol = await fetch(`${API}/api/categories`).then((r) => r.json())
    .then((j) => (Array.isArray(j) ? j : j.items ?? []).find((c) => c.slug === slug));
  const yazildi = Boolean(kontrol?.content?.seoBolumler?.length);
  if (!yazildi) { console.error(`✗ ${slug}: PATCH 200 döndü ama içerik YAZILMADI`); hata++; continue; }
  console.log(`✓ ${slug} güncellendi ve doğrulandı — ${ozet}`);
  ok++;
}
console.log(`\nÖzet — güncellenen: ${ok} · hata: ${hata}`);
