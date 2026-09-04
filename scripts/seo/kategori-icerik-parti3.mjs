#!/usr/bin/env node
/**
 * TİCARİ SEO — kategori içerikleri, PARTİ 3 (2026-09-04, Yetişme Planı Faz 1, son parti).
 *
 * Kapsam: bayrak grubu (kırlangıç, yelken, masa, makam), kaşe, antetli, zarf, magnet, araç
 * magneti, araç sticker, fosforlu folyo, plaket, madalya, kupa, lightbox, plastik duba, bloknot,
 * amerikan servis, kapı askı broşür, cepli dosya, makbuz, oto paspas, çanta — 23 kategori.
 * Bu partiyle 41 kategorinin tamamında SEO bölümü + SSS olur.
 *
 * Kurallar önceki partilerle aynı: ürün gerçekleri canlı katalogdan (ebat, gramaj, adet
 * kademesi, üretim süresi), sabit TL rakamı yok, 4-5 bölüm + 6-8 SSS + title/description.
 * Tek ürünlü küçük kategorilerde bölümler daha kısa tutuldu; boş laf yerine seçim kriteri.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/kategori-icerik-parti3.mjs [--dry]
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

const TESLIM = (uretim) => `Üretim sipariş onayından sonra ${uretim} sürer; ardından DHL ile kargoya verilir ve 81 ile 2-4 iş gününde teslim edilir. Sipariş durumu hesabınızdan ve sipariş takip sayfasından izlenir.`;
const DOSYA = "Dosyayı CMYK renk uzayında, 300 dpi çözünürlükte ve yazıları eğriye çevrilmiş PDF olarak gönderin. Hazır tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği seçeneğini işaretleyin; tasarımcımız onayınızı almadan üretime geçmez.";
const FIYAT = "Ürün sayfasındaki konfigüratörde seçenekleri işaretlediğinizde KDV dahil toplam tutar anında hesaplanır; sepette ek ücret çıkmaz. 1.500 ₺ üzeri siparişlerde kargo ücretsizdir.";

const ICERIK = {
  "kirlangic-bayrak": {
    seo: { title: "Kırlangıç Bayrak Fiyatları 2026 — Raşel ve Saten, Ölçüye Göre Online Sipariş", description: "Kırlangıç bayrak: raşel veya saten kumaş, düz, kırlangıç ve üçgen kesim, istediğiniz ölçüde m² ile fiyatlanır. Açılış, düğün ve kampanya için 2-3 iş günü üretim." },
    faqs: [
      { q: "Kırlangıç bayrak nedir?", a: "Ucu iki sivri kuyruk şeklinde kesilen, ipe dizilerek asılan renkli kumaş bayraktır; adını kuyruğunun kırlangıç kuşuna benzemesinden alır. Açılış, düğün, festival, okul ve site etkinliklerinde alanı ekonomik biçimde renklendirmek için kullanılır. Katalogda düz, kırlangıç ve üçgen olmak üzere üç kesim vardır." },
      { q: "Raşel mi saten mi seçmeliyim?", a: "Raşel, dış mekân bayrağının standart kumaşıdır: hafif, gözenekli ve rüzgârda dalgalanır, ekonomiktir. Saten daha sık dokulu ve parlaktır; renkleri daha canlı gösterir, iç mekân ve kısa süreli prestijli etkinliklerde tercih edilir. Uzun süre dışarıda kalacaksa raşel, fotoğraflanacak bir etkinlikse saten." },
      { q: "Kırlangıç bayrak fiyatı nasıl hesaplanır?", a: "Metrekare üzerinden: en × boy ÷ 10.000 = m², seçilen kumaşın m² fiyatıyla çarpılır. Kumaşa özel minimum alan uygulanır; birden fazla bayrak sipariş ettiğinizde toplam alan üzerinden hesaplanır, yani minimum her parçaya ayrı ayrı yansımaz. Ürün sayfasında ölçüyü ve adedi girdiğinizde KDV dahil tutar anında görünür." },
      { q: "Kırlangıç bayrak hangi ölçülerde yapılır?", a: "Standart bir ölçü zorunluluğu yoktur; en ve boyu siz girersiniz. En yaygın kullanım 60×150 ve 70×150 cm'dir; direk arasına ipe dizilecek küçük flamalar için 30×45 cm gibi ölçüler de üretilir. Ölçü büyüdükçe uzaktan görünürlük artar, kumaş miktarı ve fiyat doğrusal olarak yükselir." },
      { q: "Bayraklar ipe dizili mi gelir?", a: "Kırlangıç bayraklar ipe dizili ya da sopalı olarak teslim edilebilir; katalogdaki ürün sopalı kırlangıç bayrak olarak listelenir. Dizili teslimat istiyorsanız sipariş notuna bayrak aralığını ve toplam ip uzunluğunu yazın." },
      { q: "Tasarım dosyası nasıl olmalı?", a: "Bayrağın gerçek ölçüsünde veya oranı bozulmadan 1:10 ölçekte, CMYK ve en az 150 dpi hazırlayın. Kuyruk kesimine denk gelen alana yazı koymayın; logo ve yazıyı bayrağın üst yarısına yerleştirin. Tasarımınız yoksa ücretsiz tasarım desteği isteyebilirsiniz." },
    ],
    seoBolumler: [
      { baslik: "Kırlangıç Bayrak Nedir, Nerede Kullanılır?", paragraflar: ["Kırlangıç bayrak, ucu çatal biçiminde kesilmiş renkli kumaş bayraktır; ipe dizilerek direkler arasına, cephe boyunca veya alan çevresine asılır. Açılış, düğün, festival, okul şenliği, site ve AVM etkinlikleri ile kampanya dönemlerinde alanı düşük maliyetle renklendirmenin en yaygın yoludur.", "Katalogda üç kesim vardır: klasik kırlangıç (çatal kuyruk), düz (dikdörtgen) ve üçgen. Kumaş olarak dış mekân dayanımlı raşel ve parlak saten seçilebilir; her ikisi de çift yüz görünecek şekilde basılır."] },
      { baslik: "Kumaş Seçimi: Raşel mi Saten mi?", paragraflar: ["Kumaş, bayrağın nerede ve ne kadar süre asılı kalacağına göre seçilir."], tablo: { basliklar: ["Kumaş", "Özellik", "En uygun kullanım"], satirlar: [["Raşel", "Hafif, gözenekli, rüzgârda dalgalanır, ekonomik", "Dış mekân, uzun süreli asma, toplu sipariş"], ["Saten", "Sık dokulu, parlak yüzey, canlı renk", "İç mekân, sahne, fotoğraflanacak etkinlik"]] } },
      { baslik: "Fiyat Nasıl Hesaplanır?", paragraflar: ["Kırlangıç bayrak metrekare ile fiyatlanır: en × boy ÷ 10.000 = m², kumaşın m² fiyatıyla çarpılır. Kumaşa özel bir minimum alan vardır; birden fazla bayrakta minimum toplam alana uygulanır, her parçaya ayrı yansımaz. Bu sayede 60×150 cm'lik on bayrak, tek tek değil toplam alanı üzerinden hesaplanır.", FIYAT] },
      { baslik: "Ölçü, Tasarım ve Teslimat", paragraflar: ["En yaygın ölçüler 60×150 ve 70×150 cm'dir; ipe dizilecek küçük flamalarda 30×45 cm tercih edilir. Tasarımı gerçek ölçüde veya 1:10 ölçekte, CMYK ve en az 150 dpi hazırlayın; kuyruk kesimine denk gelen alanda yazı olmasın.", TESLIM("2-3 iş günü")] },
    ],
  },

  "yelken-bayrak": {
    seo: { title: "Yelken Bayrak Fiyatları 2026 — 75×300 cm Damla Form, Standlı Online Sipariş", description: "Yelken bayrak: 75×300 cm damla form, sadece kumaş veya kumaş + takım (direk ve taban). Mağaza önü, fuar ve açık hava etkinliği için 3-4 iş günü üretim, 1-10 adet." },
    faqs: [
      { q: "Yelken bayrak ölçüsü kaç cm?", a: "Katalogdaki standart ölçü 75×300 cm damla formdur; direğe takıldığında toplam yükseklik yaklaşık 3,4 metreye ulaşır. Damla form, çapraz kesimi sayesinde rüzgârsız havada da gergin durur ve görsel her zaman okunur. Mağaza önü, fuar girişi ve otopark gibi açık alanlar için en dengeli boydur." },
      { q: "Sadece kumaş ile kumaş + takım arasındaki fark nedir?", a: "Sadece kumaş seçeneğinde yalnızca baskılı bayrak gelir; elinizde direk ve taban varsa görseli yenilemek için yeterlidir. Kumaş + takım seçeneğinde bayrak, esnek direk ve taban birlikte gelir, kutudan çıkıp kurulur. İlk kez alıyorsanız takımı seçin; sonraki kampanyalarda yalnız kumaşı yenileyin." },
      { q: "Yelken bayrak rüzgârda devrilir mi?", a: "Takım, rüzgârı esnek direğiyle karşılayacak şekilde tasarlanmıştır; bayrak dalgalanır, direk esner. Sert rüzgârlı noktalarda taban su veya kumla doldurularak ağırlaştırılır ya da zemin kazığı kullanılır. Fırtına uyarısında bayrağı toplamak ömrünü uzatır." },
      { q: "Çift taraflı baskı yapılır mı?", a: "Standart üretimde görsel kumaşın bir yüzüne basılır ve arka yüzden ayna görüntüsü olarak görünür; logo ve yazı okunurluğu için tasarımı buna göre planlayın. Her iki yüzde de düz okunması gereken işlerde sipariş notuna çift taraflı talebinizi yazın; ayrıca fiyatlanır." },
      { q: "Yelken bayrak tasarımı nasıl hazırlanır?", a: "Dosyayı 75×300 cm ölçüde, CMYK ve en az 100-150 dpi hazırlayın. Damla formda alt uç daralır; logo ve ana mesajı üst üçte ikilik alana, en geniş bölüme yerleştirin. Kenarlardan 5 cm dikiş payı bırakın." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 3-4 iş günü sürer; takım seçildiğinde direk ve taban aynı pakette gelir. Ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Yelken Bayrak Nedir, Nerede Kullanılır?", paragraflar: ["Yelken bayrak (beach flag), esnek bir direğe geçirilen ve tabanla ayakta duran uzun, dikey dış mekân bayrağıdır. Rüzgârla dalgalanarak dikkat çeker, tek kişi tarafından dakikalar içinde kurulur ve sökülür. Mağaza ve restoran önü, araç galerisi, fuar ve festival girişi, otopark ve plaj etkinlikleri en yaygın kullanım yerleridir.", "Katalogdaki ürün 75×300 cm damla formdur; çapraz kesim sayesinde rüzgârsız havada da görsel gergin durur. Sadece kumaş veya kumaş + takım (direk ve taban) olarak sipariş edilir."] },
      { baslik: "Sadece Kumaş mı, Takım mı?", paragraflar: ["İlk siparişte takım, sonraki kampanyalarda yalnız kumaş yenilemek en ekonomik yoldur."], tablo: { basliklar: ["Seçenek", "İçerik", "Kime uygun"], satirlar: [["Sadece kumaş", "Baskılı 75×300 cm damla bayrak", "Elinde direk ve taban olan, görselini yenileyen"], ["Kumaş + takım", "Bayrak, esnek direk, taban", "İlk kez alan, kutudan çıkıp kuracak"]] } },
      { baslik: "Kurulum ve Rüzgâr", paragraflar: ["Direk parçaları birbirine geçirilir, bayrak direğin kılıfına takılır ve taban zemine yerleştirilir. Rüzgârlı noktalarda taban su veya kumla ağırlaştırılır; toprak zeminde kazık kullanılır. Bayrak dalgalanır, esnek direk rüzgârı taşır; fırtına uyarısında toplamak kumaşın ömrünü uzatır."] },
      { baslik: "Tasarım, Fiyat ve Teslimat", paragraflar: ["Dosyayı 75×300 cm ölçüde, CMYK ve 100-150 dpi hazırlayın; logo ve ana mesajı en geniş üst bölüme yerleştirin, alt uç daralır. Adet kademeleri 1, 2, 5 ve 10'dur; birden fazla şube için 5 ve 10 adet kademeleri birim fiyatı düşürür.", FIYAT, TESLIM("3-4 iş günü")] },
    ],
  },

  "masa-bayragi": {
    seo: { title: "Masa Bayrağı — Krom Direkli Saten Masa Bayrağı, Kurum Logolu Online Sipariş", description: "Masa bayrağı: 15×22,5 cm saten kumaş, krom direk ve ahşap taban. Sadece bayrak veya 1'li, 2'li, 3'lü takım. Toplantı masası, makam ve fuar standı için 3 iş günü üretim." },
    faqs: [
      { q: "Masa bayrağı ölçüsü nedir?", a: "Katalogdaki masa bayrağı 15×22,5 cm saten kumaştır; krom direk ve ahşap tabanla birlikte masa üstünde yaklaşık 30 cm yükseklik oluşturur. Toplantı masası, resepsiyon ve fuar standı için standart ölçüdür." },
      { q: "1'li, 2'li ve 3'lü takım ne demek?", a: "Takım, tabanın kaç bayrak direği taşıdığını belirtir. 1'li takım tek bayrak, 2'li takım iki bayrak (örneğin Türk bayrağı ve kurum bayrağı), 3'lü takım üç bayrak (ülke, kurum ve ortaklık ya da şube bayrağı) için kullanılır. Sadece bayrak seçeneği, elinde takım olanlar için kumaş yenilemedir." },
      { q: "Masa bayrağına logo bastırılır mı?", a: "Evet, saten kumaşa kurum logosu, amblem veya kısa slogan basılır. Logo çift yüz görünecek şekilde uygulanır; tasarım dosyanızı vektör veya yüksek çözünürlüklü olarak gönderin. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz." },
      { q: "Kurumsal protokolde masa bayrağı nasıl dizilir?", a: "Protokolde Türk bayrağı her zaman ilk sırada, oturana göre sağda yer alır; kurum bayrağı onun yanına konur. 3'lü takımda ülke bayrağı ortada, kurum ve ortak bayrakları iki yanda dizilir. Masada bayraklar aynı yükseklikte ve aynı takımda olmalıdır." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 3 iş günü sürer; direk ve taban bayrakla birlikte paketlenir. Ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
      { q: "Bayrak temizlenebilir mi?", a: "Saten masa bayrağı hafif nemli bezle silinir; yıkama ve ütü baskıyı bozabilir. Toz için yumuşak fırça yeterlidir. Uzun süre kullanımda kumaşı yenilemek için sadece bayrak seçeneği kullanılır." },
    ],
    seoBolumler: [
      { baslik: "Masa Bayrağı Nedir, Nerede Kullanılır?", paragraflar: ["Masa bayrağı, toplantı ve makam masalarında kurum kimliğini temsil eden küçük kumaş bayraktır. Yönetici odaları, toplantı salonları, resepsiyon bankoları, fuar standları ve protokol masalarında kullanılır; Türk bayrağıyla birlikte dizilerek kurumsal ciddiyet verir.", "Katalogdaki ürün 15×22,5 cm saten kumaş, krom direk ve ahşap tabandan oluşur. Tabanın taşıdığı direk sayısına göre 1'li, 2'li ve 3'lü takım seçilir; elinde takım olanlar için sadece bayrak seçeneği vardır."] },
      { baslik: "Hangi Takım, Hangi Masa?", paragraflar: ["Takım seçimi masada kaç bayrak duracağına göre yapılır."], tablo: { basliklar: ["Seçenek", "İçerik", "Tipik kullanım"], satirlar: [["Sadece bayrak", "15×22,5 cm saten bayrak", "Mevcut takımda kumaş yenileme"], ["1'li takım", "1 bayrak, krom direk, ahşap taban", "Yönetici masası, resepsiyon"], ["2'li takım", "2 bayrak, 2 direk, ortak taban", "Türk bayrağı + kurum bayrağı"], ["3'lü takım", "3 bayrak, 3 direk, ortak taban", "Ülke + kurum + şube/ortaklık bayrağı"]] } },
      { baslik: "Protokol Dizilimi", paragraflar: ["Protokolde Türk bayrağı ilk sıradadır ve oturan kişiye göre sağda durur; kurum bayrağı yanına yerleştirilir. Üçlü takımda ülke bayrağı ortada, kurum ve ortak bayrakları iki yanda olur. Bayraklar aynı takımda ve aynı yükseklikte olmalı, kumaş masaya değmemelidir."] },
      { baslik: "Tasarım, Fiyat ve Teslimat", paragraflar: ["Logo ve amblem vektör ya da yüksek çözünürlüklü dosya olarak gönderilir; kumaşa çift yüz görünecek şekilde basılır. " + DOSYA, FIYAT, TESLIM("3 iş günü")] },
    ],
  },

  "makam-bayragi": {
    seo: { title: "Makam Bayrağı — Püsküllü, Krom veya Gold Direkli Kurum Bayrağı, Online Sipariş", description: "Makam bayrağı: sırma püsküllü saten bayrak, gold veya gümüş saçak, krom ya da gold direk ve üçayak taban. Makam odası ve protokol için 4-5 iş günü üretim." },
    faqs: [
      { q: "Makam bayrağı nedir?", a: "Makam odalarında, ayaklı direk üzerinde duran, saçak ve püsküllerle süslenmiş kurum bayrağıdır. Türk bayrağıyla birlikte makam masasının arkasında yer alır; belediye, kamu kurumu, oda ve borsa, şirket yönetim odaları ve protokol salonlarında kullanılır." },
      { q: "Gold saçak, gümüş saçak ve saçaksız arasındaki fark nedir?", a: "Saçak, bayrağın üç kenarını çevreleyen sırma püsküldür. Gold saçak en yaygın protokol tercihidir; gümüş saçak krom direkle uyumlu daha sade bir görünüm verir; saçaksız seçenek modern ofisler ve sade kurumsal kimlikler için kullanılır. Saçak seçimi direk rengiyle eşleştirilir." },
      { q: "Sadece bayrak mı, direkli mi almalıyım?", a: "Elinizde direk ve taban varsa sadece bayrak seçeneğiyle kumaşı yenilersiniz. İlk kez alıyorsanız bayrak + krom direk ya da bayrak + gold direk seçeneklerinden birini seçin; üçayak taban dahildir. Direk rengi saçakla uyumlu seçilir: gold saçağa gold direk, gümüş saçağa krom direk." },
      { q: "Makam bayrağı nasıl yerleştirilir?", a: "Makam masasının arkasında, oturan kişinin sağında Türk bayrağı, solunda kurum bayrağı durur. Direkler eşit yükseklikte, bayraklar aynı ölçü ve kumaşta olmalıdır. Bayrak yere değmemeli, direk duvara yaslanmadan üçayak taban üzerinde dik durmalıdır." },
      { q: "Kaç günde teslim edilir?", a: "Sırma saçak ve püskül işçiliği nedeniyle üretim 4-5 iş günü sürer; direk ve taban bayrakla birlikte gönderilir. DHL ile 81 ile 2-4 iş gününde teslim edilir." },
      { q: "Tasarım dosyası nasıl olmalı?", a: "Kurum amblemi vektör olarak gönderilmelidir; saten kumaşa çift yüz görünecek şekilde basılır. Amblemi bayrağın merkezine, saçak payını dışarıda bırakarak yerleştirin. Tasarımınız yoksa ücretsiz tasarım desteği isteyebilirsiniz." },
    ],
    seoBolumler: [
      { baslik: "Makam Bayrağı Nedir?", paragraflar: ["Makam bayrağı, kurumun amblemini taşıyan, saçak ve püsküllerle süslenmiş, ayaklı direk üzerinde duran protokol bayrağıdır. Makam odalarında Türk bayrağıyla birlikte masanın arkasında yer alır; belediyeler, kamu kurumları, oda ve borsalar, üniversiteler ve şirket yönetim katları için üretilir.", "Katalogdaki ürün sırma püsküllü saten bayrak, krom veya gold direk ve üçayak tabandan oluşur; saçak gold, gümüş ya da saçaksız seçilir."] },
      { baslik: "Saçak ve Direk Seçimi", paragraflar: ["Saçak rengi ile direk rengi birbiriyle uyumlu seçilir."], tablo: { basliklar: ["Saçak", "Uyumlu direk", "Görünüm"], satirlar: [["Gold saçak", "Gold direk", "Klasik protokol, kamu ve belediye"], ["Gümüş saçak", "Krom direk", "Sade, modern kurumsal"], ["Saçaksız", "Krom direk", "Minimal ofis, teknoloji şirketleri"]] } },
      { baslik: "Protokol Yerleşimi", paragraflar: ["Oturan kişiye göre sağda Türk bayrağı, solda kurum bayrağı durur; direkler eşit yükseklikte, bayraklar aynı ölçü ve kumaştadır. Bayrak yere değmez, direk duvara yaslanmaz. Birden fazla kurum bayrağı varsa ülke bayrağı her zaman ilk sırada kalır."] },
      { baslik: "Tasarım, Fiyat ve Teslimat", paragraflar: ["Kurum amblemi vektör dosya olarak gönderilir ve saten kumaşa çift yüz görünecek şekilde basılır; saçak payı tasarımın dışında bırakılır.", FIYAT, TESLIM("4-5 iş günü")] },
    ],
  },

  kase: {
    seo: { title: "Kaşe Yaptırma — Trodat Otomatik Kaşe, 24 Saatte Teslim, Online Sipariş", description: "Trodat Printy 4912 otomatik kaşe: 47×18 mm dikdörtgen, mavi, siyah veya kırmızı mürekkep. Firma kaşesi, imza kaşesi ve fatura kaşesi 24 saatte üretilir, 1-10 adet." },
    faqs: [
      { q: "Otomatik kaşe ile klasik kaşe arasındaki fark nedir?", a: "Otomatik (self-inking) kaşede mürekkep haznesi gövdenin içindedir; her basışta lastik kendini mürekkepler, ayrıca ıstampa gerekmez. Klasik ahşap kaşe her basışta ıstampaya bastırılır. Günde onlarca kez kaşe basan işletmeler için otomatik kaşe hem hızlı hem temizdir; katalogdaki Trodat Printy 4912 bu tiptedir." },
      { q: "Trodat Printy 4912 ölçüsü nedir, neye uygundur?", a: "Baskı alanı 47×18 mm dikdörtgendir; iki-üç satırlık firma unvanı, adres ve vergi numarası ya da 'aslı gibidir', 'ödendi', 'teslim alındı' gibi işlem kaşeleri için standart boydur. Fatura, irsaliye ve evrak kaşesi olarak en çok tercih edilen ölçüdür." },
      { q: "Kaşe mürekkep rengi nasıl seçilir?", a: "Mavi resmi evraklarda ıslak imzayla birlikte en yaygın renktir; siyah fotokopide net çıkar; kırmızı 'ödendi', 'iptal', 'acele' gibi dikkat çekmesi gereken işlem kaşelerinde kullanılır. Renk sipariş sırasında seçilir; mürekkep bitince aynı renkte yedek hazne takılır." },
      { q: "Kaşe için hangi bilgileri göndermeliyim?", a: "Kaşede yazacak metni satır satır sipariş notuna yazın: firma unvanı, adres, telefon, vergi dairesi ve numarası. Logo istiyorsanız vektör dosya ekleyin. Tasarım ekibimiz metni 47×18 mm alana sığacak şekilde düzenler ve onayınıza sunar." },
      { q: "Kaşe kaç günde teslim edilir?", a: "Kaşe 24 saatte üretilir; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Aynı metinden birden fazla kaşe gerekiyorsa 2, 5 ve 10 adet kademeleri birim fiyatı düşürür." },
      { q: "Kaşe lastiği sonradan değiştirilebilir mi?", a: "Evet. Adres veya unvan değiştiğinde gövde aynı kalır, yalnızca lastik plaka yenilenir. Mürekkep haznesi de ayrı olarak değiştirilebilir; gövde yıllarca kullanılır." },
    ],
    seoBolumler: [
      { baslik: "Kaşe Yaptırırken Neye Dikkat Edilir?", paragraflar: ["Kaşe, işletmenin resmi evrakta kimliğidir: fatura, irsaliye, sözleşme ve dilekçelerde imzanın yanına basılır. Doğru kaşe üç kararla belirlenir: mekanizma (otomatik veya klasik), baskı alanı ölçüsü ve mürekkep rengi. Katalogdaki Trodat Printy 4912, 47×18 mm baskı alanıyla en yaygın firma ve işlem kaşesi ölçüsüdür ve otomatik mürekkeplidir.", "Metin sipariş notuna satır satır yazılır; tasarım ekibi yerleşimi hazırlayıp onaya sunar. Üretim 24 saattir."] },
      { baslik: "Mürekkep Rengi Seçimi", paragraflar: ["Renk, kaşenin görevine göre seçilir."], tablo: { basliklar: ["Renk", "Kullanım"], satirlar: [["Mavi", "Firma kaşesi, ıslak imza yanı, resmi evrak"], ["Siyah", "Fotokopi ve taramada net çıkması gereken kaşe"], ["Kırmızı", "Ödendi, iptal, acele gibi işlem kaşeleri"]] } },
      { baslik: "Kaşe Metni Nasıl Düzenlenir?", paragraflar: ["47×18 mm alana en fazla üç satır rahat sığar: birinci satır unvan, ikinci satır adres, üçüncü satır vergi dairesi ve numarası. Daha uzun metinlerde yazı küçülür ve okunurluk düşer; bu durumda iki kaşe kullanmak daha doğrudur. Logo isteniyorsa sol tarafa küçük bir alan ayrılır ve metin sağa kaydırılır."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyat mürekkep rengi ve adet kademesine (1, 2, 5, 10) göre belirlenir. " + FIYAT, "Kaşe 24 saatte üretilir; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Unvan veya adres değiştiğinde gövde kalır, yalnız lastik yenilenir."] },
    ],
  },

  "antetli-kagit": {
    seo: { title: "Antetli Kağıt Baskı Fiyatları 2026 — 90 gr 1. Hamur, A4 ve A5, Online Sipariş", description: "Antetli kağıt: 90 gr 1. hamur, tek yön renkli baskı, A4 ve A5 ebat, 2.000-12.000 adet. Resmi yazışma, fatura üst yazısı ve sözleşme için 2-3 iş günü üretim." },
    faqs: [
      { q: "Antetli kağıt nedir, üzerinde neler olmalı?", a: "Antetli kağıt, işletmenin kimlik bilgilerinin önceden basılı olduğu yazışma kâğıdıdır. Üst bölümde logo, unvan ve iletişim bilgileri; alt bölümde adres, vergi dairesi ve numarası, ticaret sicil numarası, web sitesi ve e-posta yer alır. Ortadaki alan yazı için boş bırakılır." },
      { q: "Antetli kağıt için neden 90 gr 1. hamur?", a: "1. hamur kâğıt beyaz, mat ve her iki yüzü yazıcı mürekkebini emen bir kâğıttır; lazer ve mürekkep püskürtmeli yazıcıdan sorunsuz geçer. 90 gr, standart 80 gr fotokopi kâğıdından biraz daha tok olduğu için elde daha kurumsal hissedilir ama yazıcıda sıkışmaz." },
      { q: "A4 mü A5 mi seçmeliyim?", a: "Resmi yazışma, teklif, sözleşme ve fatura üst yazısı için A4 standarttır. A5 ise kısa notlar, teşekkür yazıları, fiş ekleri ve kısa bilgilendirmeler için kullanılır. Çoğu işletme A4 ile başlar, A5'i ikinci sipariş olarak ekler." },
      { q: "Antetli kağıt fiyatı adet arttıkça neden düşer?", a: "Ofset baskıda kalıp ve makine hazırlığı sabit maliyettir. 2.000 adet başlangıç kademesidir; 4.000, 6.000, 8.000 ve 12.000 adette birim fiyat belirgin düşer. Yıllık kullanımınızı tahmin edip tek seferde sipariş etmek en ekonomik yoldur; kâğıt kuru ortamda yıllarca bozulmadan durur." },
      { q: "Antetli kağıt yazıcıda kullanılabilir mi?", a: "Evet, 90 gr 1. hamur kâğıt lazer ve mürekkep püskürtmeli yazıcılarda kullanılır. Tasarımda yazıcının baskı yapamadığı kenar payını (yaklaşık 5 mm) boş bırakın ve antet öğelerini bu payın içinde tutun." },
      { q: "Dosyayı nasıl hazırlamalıyım?", a: "A4 için 21×29,7 cm, A5 için 14,8×21 cm ölçüde, 3 mm taşma payıyla, CMYK ve 300 dpi PDF gönderin. Zemin rengi veya kenara dayanan çizgi varsa taşma payına kadar uzatın. Tasarımınız yoksa ücretsiz tasarım desteği talep edebilirsiniz." },
    ],
    seoBolumler: [
      { baslik: "Antetli Kağıt Nedir, Neden Gerekli?", paragraflar: ["Antetli kağıt, işletmenin logo, unvan ve iletişim bilgilerini taşıyan basılı yazışma kâğıdıdır. Teklif, sözleşme, resmi yazı, fatura üst yazısı ve kurumsal bildirimlerde kullanılır; belgeyi kimin gönderdiğini ilk bakışta gösterir ve kurumsal kimliğin kartvizitten sonraki en görünür parçasıdır.", "Katalogdaki antetli kağıt 90 gr 1. hamur kâğıda tek yön renkli basılır; A4 ve A5 ebatlarda, 2.000'den 12.000 adede kadar sipariş edilir."] },
      { baslik: "Antette Neler Olmalı?", paragraflar: ["Antet iki bölgeden oluşur: üst bilgi ve alt bilgi. Aşağıdaki liste standart yerleşimi verir."], tablo: { basliklar: ["Bölge", "İçerik"], satirlar: [["Üst bilgi", "Logo, unvan, slogan (isteğe bağlı)"], ["Alt bilgi", "Adres, telefon, e-posta, web sitesi"], ["Alt bilgi (resmi)", "Vergi dairesi ve numarası, ticaret sicil numarası, Mersis numarası"], ["Orta alan", "Boş; yazıcı çıktısı için"]] } },
      { baslik: "Ebat ve Adet Seçimi", paragraflar: ["A4 resmi yazışma ve sözleşme için standarttır; A5 kısa not ve teşekkür yazıları için kullanılır. Ofset baskıda hazırlık maliyeti sabit olduğundan 2.000 adetten 12.000 adede çıkıldığında birim fiyat belirgin düşer; yıllık ihtiyacı tek seferde sipariş etmek en ekonomik yoldur.", FIYAT] },
      { baslik: "Dosya Hazırlığı ve Teslimat", paragraflar: ["A4 için 21×29,7 cm, A5 için 14,8×21 cm ölçüde, 3 mm taşma payıyla, CMYK ve 300 dpi PDF gönderin; yazıcı kenar payı için antet öğelerini kenardan 5 mm içeride tutun. " + DOSYA, TESLIM("2-3 iş günü")] },
    ],
  },

  zarf: {
    seo: { title: "Zarf Baskı Fiyatları 2026 — Diplomat ve Torba Zarf, Tek Renk veya Renkli", description: "Baskılı zarf: 10,5×24 cm diplomat zarf tek renk veya tam renkli, 24×32 cm torba zarf renkli. 110 gr 1. hamur, 500-10.000 adet, 2-3 iş günü üretim." },
    faqs: [
      { q: "Diplomat zarf ile torba zarf arasındaki fark nedir?", a: "Diplomat zarf 10,5×24 cm'dir; A4 kâğıt üçe katlanarak içine konur, resmi yazışma ve faturanın standart zarfıdır. Torba zarf 24×32 cm'dir; A4 belge katlanmadan, dosya ve katalog olduğu gibi gönderilir. İkisi de 110 gr 1. hamur kâğıttan üretilir." },
      { q: "Tek renk mi renkli baskı mı seçmeliyim?", a: "Tek renk baskı siyah veya tek pantone renkle yapılır; logo ve adres için yeterlidir ve ekonomiktir. Tam renkli (CMYK) baskı çok renkli logo, fotoğraf veya zemin rengi için gerekir. Kurumsal kimliğinde tek renk logo olan işletmeler tek renkle başlar." },
      { q: "Zarfın neresine ne basılır?", a: "Ön yüz sol üst köşeye gönderen bilgisi (logo, unvan, adres), arka yüz kapak şeridine logo ya da web adresi basılır. Alıcı adresi alanı ve pul köşesi boş bırakılır. Posta ve kargo okuyucuları için sağ alt bölgeye koyu zemin koymamak gerekir." },
      { q: "Zarf fiyatı neye göre değişir?", a: "Zarf tipi (diplomat veya torba), baskı türü (tek renk veya renkli) ve adet kademesi fiyatı belirler. Diplomat zarfta 1.000-10.000, torba zarfta 500-5.000 adet kademeleri vardır; adet arttıkça birim fiyat düşer. Konfigüratörde seçim yaptığınızda KDV dahil tutar anında görünür." },
      { q: "Pencereli zarf yapılır mı?", a: "Katalogdaki standart ürünler penceresizdir. Pencereli zarf veya farklı ebat için teklif alma sayfasından talep oluşturabilirsiniz." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 2-3 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Antetli kağıtla aynı siparişte verildiğinde tek kargoyla gelir." },
    ],
    seoBolumler: [
      { baslik: "Baskılı Zarf Çeşitleri", paragraflar: ["Baskılı zarf, kurumsal yazışmanın antetli kağıtla birlikte ikinci parçasıdır; belge daha açılmadan gönderenin kimliğini gösterir. Katalogda iki ebat ve iki baskı türü vardır."], tablo: { basliklar: ["Ürün", "Ebat", "Baskı", "Kullanım"], satirlar: [["Diplomat zarf, tek renk", "10,5×24 cm", "Siyah veya tek pantone", "Fatura, resmi yazı, teklif"], ["Diplomat zarf, renkli", "10,5×24 cm", "Tam renkli CMYK", "Çok renkli logo, davetiye, kampanya"], ["Torba zarf, renkli", "24×32 cm", "Tam renkli CMYK", "Katalog, dosya, katlanmayan A4 belge"]] } },
      { baslik: "Zarf Tasarımı: Neresi Basılır?", paragraflar: ["Ön yüzde sol üst köşe gönderen bilgisine ayrılır: logo, unvan, adres. Arka yüzde kapak şeridine logo veya web adresi basılabilir. Alıcı adresi alanı ve sağ üstteki pul köşesi boş bırakılır; posta okuyucuları için sağ alt bölge açık renk kalmalıdır."] },
      { baslik: "Adet ve Fiyat", paragraflar: ["Diplomat zarfta 1.000, 2.000, 3.000, 5.000 ve 10.000; torba zarfta 500, 1.000, 1.500, 2.500 ve 5.000 adet kademeleri vardır. Ofset baskıda hazırlık sabit olduğundan adet arttıkça birim fiyat düşer.", FIYAT] },
      { baslik: "Dosya ve Teslimat", paragraflar: ["Dosyayı zarfın açık ölçüsünde değil, kapalı ön ve arka yüz için ayrı ayrı, CMYK ve 300 dpi hazırlayın; tek renk baskıda logo %100 siyah ya da tek pantone olmalıdır. " + DOSYA, TESLIM("2-3 iş günü")] },
    ],
  },

  magnet: {
    seo: { title: "Magnet Baskı Fiyatları 2026 — 46×68 mm Buzdolabı Promosyon Magneti", description: "Promosyon magnet: 60 mikron, 46×68 mm kartvizit boyu, özel veya oval kesim, renkli baskı. Eczane, taksi, restoran ve kargo için 1.000-10.000 adet, 3-4 iş günü üretim." },
    faqs: [
      { q: "Magnet nedir, promosyonda neden etkilidir?", a: "Magnet, arkası mıknatıslı baskılı kartçıktır; buzdolabı, pano ve metal yüzeye yapışır. Müşterinin mutfağında aylarca kaldığı için telefon numarasını sürekli göz önünde tutar. Eczane, taksi, restoran paket servis, su bayisi, tesisatçı ve kargo şirketleri için en kalıcı promosyon ürünüdür." },
      { q: "60 mikron ne demek?", a: "Magnetin mıknatıs tabakasının kalınlığıdır. 60 mikron buzdolabı magneti için standart kalınlıktır; hafif, düz yüzeye iyi yapışır ve toplu dağıtımda ekonomiktir. Daha kalın magnetler araç magneti gibi dış mekân kullanımı içindir." },
      { q: "Özel kesim ile oval kesim arasındaki fark nedir?", a: "Oval kesim köşeleri yuvarlatılmış standart kartvizit formudur. Özel kesim, logo veya ürün şekline göre bıçakla kesilir; örneğin damla, ev, araba biçiminde. Özel kesimde kesim çizgisini tasarım dosyasında ayrı katmanda gönderin." },
      { q: "Magnet fiyatı neye göre belirlenir?", a: "Kesim türü ve adet kademesi fiyatı belirler; ebat 46×68 mm, kalınlık 60 mikron sabittir. 1.000 adet başlangıç, 10.000 adet toplu dağıtım kademesidir; adet arttıkça birim fiyat belirgin düşer." },
      { q: "Magnet dosyası nasıl hazırlanır?", a: "46×68 mm ölçüde, 2 mm taşma payıyla, CMYK ve 300 dpi PDF gönderin. Telefon numarasını en büyük öğe yapın; magnetin görevi aranmaktır. Özel kesimde kesim hattını vektör olarak ayrı katmana koyun." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 3-4 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Promosyon Magneti Nedir, Kimler Kullanır?", paragraflar: ["Buzdolabı magneti, telefon numarasının müşterinin mutfağında aylarca kalmasını sağlayan en kalıcı promosyon ürünüdür. Paket servis yapan restoranlar, eczaneler, taksi durakları, su ve tüp bayileri, tesisatçı ve elektrikçiler, kargo şubeleri ve emlak ofisleri en sık kullananlardır.", "Katalogdaki ürün 60 mikron kalınlıkta, 46×68 mm kartvizit boyunda, renkli baskılı magnettir; oval veya özel kesimle 1.000 ve 10.000 adet kademelerinde sipariş edilir."] },
      { baslik: "Oval Kesim mi, Özel Kesim mi?", paragraflar: ["Kesim, magnetin biçimini belirler."], tablo: { basliklar: ["Kesim", "Biçim", "Kime uygun"], satirlar: [["Oval kesim", "Köşeleri yuvarlatılmış kartvizit formu", "Bilgi ağırlıklı, ekonomik toplu dağıtım"], ["Özel kesim", "Logo veya ürün şekline göre bıçak kesim", "Dikkat çekmesi istenen, marka şekilli magnet"]] } },
      { baslik: "Tasarımda Öncelik: Telefon Numarası", paragraflar: ["Magnetin tek görevi aranmaktır. Telefon numarasını en büyük öğe yapın, logo ve hizmet listesini ikinci planda tutun, çalışma saatlerini ekleyin. 46×68 mm alanda üçten fazla bilgi bloğu okunurluğu düşürür. Dosyayı 2 mm taşma payıyla, CMYK ve 300 dpi hazırlayın; özel kesimde kesim hattı ayrı katmanda olmalıdır."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı kesim türü ve adet (1.000 veya 10.000) belirler; adet arttıkça birim fiyat belirgin düşer. " + FIYAT, TESLIM("3-4 iş günü")] },
    ],
  },

  "arac-magneti": {
    seo: { title: "Araç Magneti Fiyatları 2026 — 20×30, 30×40, 40×60 cm UV Baskılı Araç Mıknatısı", description: "Araç magneti: 0,8 mm mıknatıs üzerine UV baskı, 20×30, 30×40 ve 40×60 cm. Boyaya zarar vermeden takılıp çıkarılır; servis, kurye ve kiralık araç için 2 iş günü üretim." },
    faqs: [
      { q: "Araç magneti boyaya zarar verir mi?", a: "Doğru kullanıldığında vermez. Magnet 0,8 mm esnek mıknatıstır; temiz ve kuru boyalı metal yüzeye yapışır. Zarar, magnetin altına kum ve toz girip uzun süre kalmasından olur; bu yüzden haftada bir çıkarıp yüzeyi ve magnetin arkasını silmek gerekir. Plastik tampon ve alüminyum kaputa yapışmaz." },
      { q: "Hangi ebadı seçmeliyim?", a: "20×30 cm binek araç kapısına logo ve telefon için yeterlidir; 30×40 cm hafif ticari araç ve servis araçlarında en yaygın boydur; 40×60 cm panelvan ve kamyonet yan yüzeyleri için seçilir. Kapıdaki çıkıntı ve kabartmalara denk gelmeyen düz bir alan seçin, magnet düz yüzeyde tam tutar." },
      { q: "Yıkamada çıkar mı?", a: "Fırçalı otomatik yıkamada magneti çıkarın; el yıkamasında düşük basınçla sorun olmaz. Otoyol hızlarında düz yüzeyde yerinde kalır; kenarları kalkmış veya altına kir girmiş magnet hızda uçabilir, bu yüzden düzenli temizlik önemlidir." },
      { q: "Neden UV baskı?", a: "Araç sürekli güneş, yağmur ve yıkama görür; UV baskı mürekkebi ultraviyole ışıkla kurutulduğu için solmaz ve çizilmeye dayanır. Standart baskı birkaç ayda solarken UV baskılı magnet mevsimler boyu okunur kalır." },
      { q: "Tasarım dosyası nasıl hazırlanır?", a: "Seçtiğiniz ebatta, 5 mm taşma payıyla, CMYK ve 150-300 dpi PDF gönderin. Telefon numarası ve hizmet adı araç hareket halindeyken okunacak büyüklükte olmalıdır; 30×40 cm magnette numara en az 5 cm yüksekliğinde tasarlanır." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 2 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Çift kapı için iki adet sipariş edin; sağ ve sol kapı için tasarım aynadaki gibi ters çevrilmez, aynı görsel kullanılır." },
    ],
    seoBolumler: [
      { baslik: "Araç Magneti Nedir, Kimler Kullanır?", paragraflar: ["Araç magneti, boyaya yapıştırılmadan mıknatısla tutunan, takılıp çıkarılabilen araç reklamıdır. Kalıcı folyo giydirme istemeyen, aracı mesai dışında özel kullanan servis ve kurye firmaları, emlak ofisleri, tesisatçılar, temizlik şirketleri ve kiralık araç filoları için en pratik çözümdür.", "Katalogdaki ürün 0,8 mm esnek mıknatıs üzerine UV dayanıklı baskıdır; 20×30, 30×40 ve 40×60 cm ebatlarda üretilir."] },
      { baslik: "Ebat Seçimi", paragraflar: ["Ebat, aracın tipine ve kapıdaki düz alana göre seçilir."], tablo: { basliklar: ["Ebat", "Araç tipi", "İçerik"], satirlar: [["20×30 cm", "Binek araç kapısı", "Logo + telefon"], ["30×40 cm", "Hafif ticari, servis aracı", "Logo, telefon, hizmet adı"], ["40×60 cm", "Panelvan, kamyonet yan yüzey", "Logo, telefon, hizmet listesi, web"]] } },
      { baslik: "Kullanım ve Bakım", paragraflar: ["Magneti temiz, kuru ve düz boyalı metal yüzeye yerleştirin; kabartma ve çıkıntılardan kaçının. Haftada bir çıkarıp yüzeyi ve magnetin arkasını silin; altına kum girmesi boyayı çizebilir. Fırçalı otomatik yıkamadan önce çıkarın. Plastik tampon ve alüminyum kaputta tutmaz."] },
      { baslik: "Tasarım, Fiyat ve Teslimat", paragraflar: ["Seçtiğiniz ebatta, 5 mm taşma payıyla, CMYK ve 150-300 dpi PDF gönderin; telefon numarasını hareket halinde okunacak büyüklükte tasarlayın. " + DOSYA, FIYAT, TESLIM("2 iş günü")] },
    ],
  },

  "arac-sticker": {
    seo: { title: "Araç Sticker ve Folyo Yazı Fiyatları 2026 — Kesimli Folyo, m² ile Online Sipariş", description: "Araç sticker: normal, mat, laminasyonlu ve reflektif folyo, kesimli kalıcı yapışkan, m² ile fiyatlanır. Yan cam, kapı yazısı ve logo için 2-3 iş günü üretim." },
    faqs: [
      { q: "Araç sticker ile araç magneti arasındaki fark nedir?", a: "Sticker kalıcı yapışkanlı folyodur; araca yapıştırılır ve yıllarca kalır, sökülürken ısı ve sabır ister. Magnet mıknatısla tutunur, istenince çıkarılır. Filoya ait, sürekli reklam taşıyacak araçlarda sticker; mesai dışı özel kullanılan araçlarda magnet tercih edilir." },
      { q: "Normal, mat, laminasyonlu ve reflektif folyo arasında nasıl seçim yaparım?", a: "Normal folyo parlak yüzeyli standart kesim folyosudur; logo ve yazı için yeterlidir. Mat folyo yansıma yapmaz, sade ve modern görünür. Laminasyonlu folyo baskının üzerine koruyucu katman ekler; yıkama ve güneşe karşı en uzun ömürlü seçenektir. Reflektif folyo gece far ışığında parlar; servis ve iş makinesi araçlarında güvenlik için seçilir." },
      { q: "Araç sticker fiyatı nasıl hesaplanır?", a: "Metrekare üzerinden: en × boy ÷ 10.000 = m², seçilen folyonun m² fiyatıyla çarpılır. Birden fazla parçada toplam alan üzerinden hesaplanır. Ürün sayfasında ölçüyü girdiğinizde KDV dahil tutar anında görünür; uygulama hizmeti ayrıca teklif edilir." },
      { q: "Yan cama sticker yapıştırılır mı?", a: "Evet, kesimli folyo yan cama uygulanır; sürücü görüşünü kısıtlamamak için ön yan camlarda küçük logo ve yazı, arka yan camlarda daha geniş uygulama yapılır. Ön cama uygulama yasal sınırlamalara tabidir; arka cam için delikli one way vision folyo ayrı üründür." },
      { q: "Sticker'ı kendim uygulayabilir miyim?", a: "Kesimli yazı ve logo transfer bandıyla gelir; temiz ve düz yüzeye ıslak ya da kuru yöntemle uygulanabilir. Büyük parçalar ve kavisli yüzeyler için profesyonel uygulama önerilir; sipariş notuna yazarsanız uygulama seçeneği teklif edilir." },
      { q: "Dosya nasıl hazırlanır?", a: "Kesimli yazı ve logo için vektör dosya (AI, PDF, SVG) şarttır; piksel görselden kesim yapılamaz. Yazıları eğriye çevirin, çok ince detaylardan kaçının; 5 mm'den ince çizgiler kesimde kopabilir." },
    ],
    seoBolumler: [
      { baslik: "Araç Sticker Nedir?", paragraflar: ["Araç sticker, kalıcı yapışkanlı folyonun logo ve yazı biçiminde kesilip araca uygulanmasıdır. Tam giydirmeye göre çok daha ekonomiktir; kapı yazısı, telefon numarası, yan cam logosu ve arka kapak yazısıyla aracı her gün gezen bir reklam panosuna çevirir.", "Katalogdaki ürün metrekare ile fiyatlanır ve dört folyo seçeneği sunar: normal, mat, laminasyonlu ve reflektif. Kesimli folyo transfer bandıyla teslim edilir; isteğe bağlı profesyonel uygulama teklif edilir."] },
      { baslik: "Folyo Seçimi", paragraflar: ["Folyo, aracın kullanım süresine ve ortamına göre seçilir."], tablo: { basliklar: ["Folyo", "Özellik", "En uygun kullanım"], satirlar: [["Normal folyo", "Parlak yüzey, standart kesim", "Logo, yazı, kısa-orta vadeli kullanım"], ["Mat folyo", "Yansımasız, sade görünüm", "Kurumsal filo, modern kimlik"], ["Laminasyonlu folyo", "Koruyucu katmanlı, en uzun ömür", "Yoğun yıkama ve güneş gören araçlar"], ["Reflektif folyo", "Far ışığında parlar", "Servis, çekici, iş makinesi, gece çalışan araç"]] } },
      { baslik: "Fiyat ve Uygulama", paragraflar: ["Fiyat metrekare ile hesaplanır: en × boy ÷ 10.000 = m², folyonun m² fiyatıyla çarpılır; birden fazla parçada toplam alan geçerlidir. Kesimli yazılar transfer bandıyla gelir ve temiz yüzeye uygulanır; kavisli yüzey ve büyük parçalarda profesyonel uygulama önerilir.", FIYAT] },
      { baslik: "Dosya ve Teslimat", paragraflar: ["Kesim için vektör dosya şarttır; yazılar eğriye çevrilmiş, 5 mm'den ince detaylardan kaçınılmış olmalıdır. Tasarımınız yoksa ücretsiz tasarım desteği isteyebilirsiniz.", TESLIM("2-3 iş günü")] },
    ],
  },

  "fosforlu-folyo": {
    seo: { title: "Fosforlu Folyo — Karanlıkta Parlayan Acil Çıkış Folyosu, A4, Online Sipariş", description: "Fosforlu acil çıkış folyosu: karanlıkta kendiliğinden parlayan reflektif folyo, A4 ebat, 1-25 adet. Elektrik kesintisinde kaçış yolunu gösterir, 2 iş günü üretim." },
    faqs: [
      { q: "Fosforlu folyo nasıl çalışır?", a: "Fotolüminesan pigment gün ışığı veya ortam aydınlatmasından enerji depolar; ışık kesildiğinde bu enerjiyi yeşilimsi parıltı olarak geri verir. Elektrik ve pil gerektirmez, bakım istemez; gün içinde aydınlık ortamda kalması şarj olması için yeterlidir." },
      { q: "Fosforlu folyo ile reflektif folyo aynı şey mi?", a: "Hayır. Fosforlu folyo kendiliğinden parlar, ışık kaynağı gerekmez. Reflektif folyo yalnızca üzerine gelen ışığı (far, el feneri) geri yansıtır; tamamen karanlıkta görünmez. Elektrik kesintisinde kaçış yolu için fosforlu, gece araç ışığı alan noktalar için reflektif seçilir." },
      { q: "Fosforlu acil çıkış folyosu nereye yapıştırılır?", a: "Çıkış kapısının üstüne veya yanına, koridorlarda yön değişimlerine, merdiven sahanlıklarına ve zemine yakın noktalara. Dumanlı ortamda insanlar eğilerek ilerlediği için alçak seviyeye yapıştırılan folyolar duvardaki levhalardan daha erken fark edilir." },
      { q: "Ne kadar süre parlar?", a: "Parlaklık ışık kesildikten sonraki ilk dakikalarda en yüksektir ve kademeli olarak azalır; gözün karanlığa alışmasıyla birlikte saatlerce fark edilir kalır. Gündüz yeterince aydınlık alan folyo, gece boyunca kaçış yönünü gösterir." },
      { q: "Adet kademeleri nelerdir?", a: "1, 5, 10 ve 25 adet kademeleri vardır; bina genelinde işaretleme için 10 ve 25 adet kademeleri birim fiyatı düşürür. Farklı yön ve metinler için katalogdaki acil durum levhaları kategorisinden seçim yapılabilir." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 2 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Fosforlu Folyo Nedir, Ne İşe Yarar?", paragraflar: ["Fosforlu (fotolüminesan) folyo, ışıkta enerji depolayıp karanlıkta kendiliğinden parlayan yapışkanlı folyodur. Elektrik kesildiğinde acil çıkış ve kaçış yolunu göstermek için kullanılır; kablo, pil ve bakım gerektirmez. Acil aydınlatması olmayan ya da yetersiz binalarda yönetmeliğin 'her koşulda görünür işaret' şartını karşılamanın en pratik yoludur.", "Katalogdaki ürün A4 ebatlı fosforlu acil çıkış folyosudur; 1, 5, 10 ve 25 adet kademelerinde sipariş edilir. Farklı yön ve metinler için acil durum levhaları kategorisinde fotolümenli seçenekler de vardır."] },
      { baslik: "Fosforlu mu, Reflektif mi?", paragraflar: ["İki folyo farklı işler yapar; karıştırılmaması gerekir."], tablo: { basliklar: ["Folyo", "Nasıl çalışır", "Nerede kullanılır"], satirlar: [["Fosforlu (fotolüminesan)", "Işıkta şarj olur, karanlıkta kendiliğinden parlar", "Acil çıkış, kaçış yolu, merdiven, elektrik kesintisi"], ["Reflektif", "Üzerine gelen ışığı geri yansıtır", "Otopark, yol kenarı, gece araç ışığı alan saha"]] } },
      { baslik: "Nereye Yapıştırılır?", paragraflar: ["Çıkış kapısının üstü ve yanı, koridorlardaki yön değişimleri, merdiven sahanlıkları ve kapı kolları temel noktalardır. Dumanlı ortamda eğilerek ilerlendiği için zeminden 30-40 cm yüksekliğe yapıştırılan folyolar özellikle etkilidir. Folyo gün içinde aydınlık kalmalıdır; dolap arkası gibi sürekli karanlık noktalarda şarj olamaz."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı adet kademesi belirler; 10 ve 25 adette birim fiyat düşer. " + FIYAT, TESLIM("2 iş günü")] },
    ],
  },

  plaket: {
    seo: { title: "Plaket Yaptırma — Kristal Plaket Lazer Kazıma, 15-25 cm, Online Sipariş", description: "Kristal plaket: 15, 20 ve 25 cm boy, lazer kazıma ve ahşap taban. Teşekkür, emeklilik, başarı ve sponsorluk plaketi için 1-25 adet, 3-5 iş günü üretim." },
    faqs: [
      { q: "Kristal plaket boyu nasıl seçilir?", a: "15 cm masa üstü teşekkür ve katılım plaketleri için; 20 cm en yaygın ödül ve emeklilik plaketi boyu; 25 cm sponsorluk, yılın çalışanı ve kurumsal prestij ödülleri için seçilir. Boy büyüdükçe kazıma alanı genişler ve daha uzun metin sığar." },
      { q: "Lazer kazıma ile baskı arasındaki fark nedir?", a: "Lazer kazıma kristalin içine veya yüzeyine kalıcı olarak işler; silinmez, solmaz ve dokunulduğunda hissedilir. Baskı ise yüzeye renkli uygulanır. Logo, isim ve tarih için lazer kazıma klasik ve kalıcı tercihtir; renkli logo gerekiyorsa sipariş notuna yazın." },
      { q: "Plakette hangi bilgiler yer almalı?", a: "Üstte veren kurumun logosu, ortada alıcının adı ve ödülün adı (teşekkür, başarı, emeklilik), altta tarih ve veren kurumun adı. Kısa bir teşekkür cümlesi eklenebilir; 20 cm plakette 5-6 satır rahat okunur. Metni sipariş notuna yazın, tasarım ekibi yerleşimi hazırlayıp onaya sunar." },
      { q: "Toplu plaket siparişinde isimler farklı olabilir mi?", a: "Evet. Aynı tasarımda yalnız isim değişen plaketler için isim listesini sipariş notuna ya da dosya olarak ekleyin; 5, 10 ve 25 adet kademeleri birim fiyatı düşürür. Mezuniyet, seminer katılım ve yıl sonu ödül törenleri için en ekonomik yol budur." },
      { q: "Plaket nasıl paketlenir?", a: "Kristal plaket ahşap tabanıyla birlikte köpük korumalı kutuda gönderilir; törende doğrudan takdim edilebilir. Kırılma riskine karşı paket kargo hasarına uygun şekilde hazırlanır." },
      { q: "Kaç günde teslim edilir?", a: "Lazer kazıma ve taban montajı nedeniyle üretim 3-5 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Tören tarihini sipariş notuna yazın." },
    ],
    seoBolumler: [
      { baslik: "Kristal Plaket Nedir, Ne Zaman Verilir?", paragraflar: ["Plaket, bir kişiye veya kuruma teşekkür, başarı ya da anı olarak verilen üzeri yazılı ödül nesnesidir. Kristal plaket, lazerle kazınan metnin ışığı kırarak okunması sayesinde en prestijli plaket türüdür. Emeklilik, yılın çalışanı, sponsorluk teşekkürü, bayi ödülü, mezuniyet ve seminer katılımı en yaygın kullanım nedenleridir.", "Katalogdaki ürün 15, 20 ve 25 cm boylarda kristal plaket, lazer kazıma ve ahşap tabandan oluşur; 1, 5, 10 ve 25 adet kademelerinde sipariş edilir."] },
      { baslik: "Boy Seçimi", paragraflar: ["Boy, plaketin verildiği ortama ve metin uzunluğuna göre seçilir."], tablo: { basliklar: ["Boy", "Kullanım", "Metin kapasitesi"], satirlar: [["15 cm", "Katılım, teşekkür, masa üstü", "Logo + 3-4 satır"], ["20 cm", "Emeklilik, başarı, bayi ödülü", "Logo + 5-6 satır"], ["25 cm", "Sponsorluk, kurumsal prestij, yılın çalışanı", "Logo + 7-8 satır veya uzun mesaj"]] } },
      { baslik: "Plaket Metni Nasıl Yazılır?", paragraflar: ["Klasik düzen üstten alta şöyledir: veren kurumun logosu, ödülün adı, alıcının adı ve unvanı, kısa teşekkür cümlesi, tarih ve veren kurumun adı. Metni sipariş notuna yazın; tasarım ekibi kazıma yerleşimini hazırlayıp onayınıza sunar. Toplu siparişte isim listesi dosya olarak eklenir."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı boy ve adet kademesi belirler; 5, 10 ve 25 adette birim fiyat düşer. " + FIYAT, "Plaket köpük korumalı kutuda, tabanıyla birlikte gönderilir. " + TESLIM("3-5 iş günü")] },
    ],
  },

  madalya: {
    seo: { title: "Madalya Yaptırma — 7 cm Metal Madalya, Kurdele Dahil, Altın-Gümüş-Bronz", description: "Metal madalya: 7 cm, altın, gümüş veya bronz kaplama, kurdele dahil, özel baskı. Turnuva, okul yarışması ve kurumsal etkinlik için 10-250 adet, 5-7 iş günü üretim." },
    faqs: [
      { q: "Madalya ölçüsü ve malzemesi nedir?", a: "Katalogdaki madalya 7 cm çapında metal gövdelidir; altın, gümüş veya bronz kaplama seçilir ve boyun kurdelesi dahildir. Ön yüze etkinliğin logosu veya tasarımı basılır." },
      { q: "Altın, gümüş ve bronz kaplama nasıl seçilir?", a: "Turnuva ve yarışmalarda birinci, ikinci ve üçüncülük için üç kaplama birlikte sipariş edilir. Katılım madalyasında genellikle tek renk, çoğunlukla altın kaplama tercih edilir. Kaplama rengi gövdeyi kaplar; ön yüzdeki baskı renkli olabilir." },
      { q: "En az kaç adet sipariş edilir?", a: "Başlangıç kademesi 10 adettir; 25, 50, 100 ve 250 adet kademelerinde birim fiyat düşer. Okul spor şenliği, koşu ve kurumsal turnuvalar için üç renk karışık siparişte her rengi ayrı satır olarak ekleyin." },
      { q: "Madalya tasarımı nasıl hazırlanır?", a: "Ön yüz için 7 cm çapında daire içinde, CMYK ve 300 dpi tasarım gönderin; etkinlik adı, yıl ve logo standart öğelerdir. Kenardan 3 mm içeride güvenli alan bırakın. Tasarımınız yoksa ücretsiz tasarım desteği isteyebilirsiniz." },
      { q: "Kurdele rengi seçilebilir mi?", a: "Kurdele dahildir; renk tercihinizi sipariş notuna yazın, stok durumuna göre uygulanır. Tek renk ya da kurum renklerinde çizgili kurdele en yaygın seçeneklerdir." },
      { q: "Kaç günde teslim edilir?", a: "Metal gövde, kaplama ve baskı aşamaları nedeniyle üretim 5-7 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Etkinlik tarihini sipariş notuna yazın." },
    ],
    seoBolumler: [
      { baslik: "Özel Baskılı Madalya", paragraflar: ["Madalya, yarışma ve etkinliklerde derece ve katılımı ödüllendiren, boyna takılan metal nişandır. Okul spor şenlikleri, amatör turnuvalar, koşu ve bisiklet etkinlikleri, kurumsal spor günleri ve yaz kampları en sık sipariş veren kesimlerdir.", "Katalogdaki ürün 7 cm çapında metal madalya, altın-gümüş-bronz kaplama seçeneği, kurdele ve ön yüze özel baskıdan oluşur; 10'dan 250 adede kadar sipariş edilir."] },
      { baslik: "Kaplama ve Adet Planlaması", paragraflar: ["Derece madalyalarında üç kaplama, katılım madalyasında tek kaplama sipariş edilir."], tablo: { basliklar: ["Senaryo", "Kaplama", "Adet önerisi"], satirlar: [["Turnuva derecesi", "Altın, gümüş, bronz", "Her renk için kürsüye çıkacak sporcu sayısı"], ["Katılım madalyası", "Genellikle altın", "Katılımcı sayısı + %5 yedek"], ["Kurumsal ödül", "Altın", "Ödül alan kişi sayısı"]] } },
      { baslik: "Tasarım", paragraflar: ["Ön yüz 7 cm çapında daire içinde tasarlanır; etkinlik adı, yıl ve logo standart öğelerdir, kenardan 3 mm güvenli alan bırakılır. Dosya CMYK ve 300 dpi olmalıdır. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı kaplama ve adet kademesi (10, 25, 50, 100, 250) belirler; adet arttıkça birim fiyat düşer. " + FIYAT, TESLIM("5-7 iş günü")] },
    ],
  },

  kupa: {
    seo: { title: "Kupa Baskı — Logolu ve Fotoğraflı 330 ml Seramik Kupa, 1 Adetten Sipariş", description: "Sublimasyon baskılı 330 ml klasik beyaz seramik kupa: kurum logosu, fotoğraf veya özel tasarım. 1, 6, 12, 24 ve 50 adet kademeleri, 2-3 iş günü üretim." },
    faqs: [
      { q: "Sublimasyon baskı nedir, kupa yıkanınca çıkar mı?", a: "Sublimasyon, mürekkebin ısıyla kupanın özel kaplamasına nüfuz ettiği baskı yöntemidir; görsel yüzeyde durmaz, kaplamanın içine işler. Bulaşık makinesinde ve elde yıkamada çıkmaz, çizilmez. Mikrodalgada da kullanılabilir." },
      { q: "Kupa ölçüsü nedir?", a: "Katalogdaki klasik beyaz kupa 330 ml hacimlidir; standart ofis ve promosyon kupası boyudur. Baskı alanı kulp hariç gövdeyi sarar; tek yüz veya çift yüz tasarım uygulanabilir." },
      { q: "Tek adet kupa sipariş edebilir miyim?", a: "Evet, 1 adetten sipariş verilir; hediye ve kişiye özel fotoğraflı kupalar için idealdir. Kurumsal dağıtım ve promosyon için 6, 12, 24 ve 50 adet kademeleri birim fiyatı düşürür." },
      { q: "Fotoğraflı kupa için dosya nasıl olmalı?", a: "Fotoğrafı en az 1.500 piksel genişliğinde, mümkünse orijinal çözünürlükte gönderin. Baskı alanı yaklaşık 20×9 cm'dir; tasarımı bu oranda hazırlayın ve önemli öğeleri kulpun iki yanına denk gelecek şekilde yerleştirin. Tasarımınız yoksa ücretsiz tasarım desteği isteyebilirsiniz." },
      { q: "Renkler ekrandaki gibi mi çıkar?", a: "Sublimasyon canlı renk verir; ancak beyaz zemin üzerine bastığı için çok açık tonlar soluk görünebilir. Koyu ve doygun renkler en iyi sonucu verir. Kurumsal renk kodunuzu paylaşırsanız tasarım ekibi baskıya uygun karşılığını uygular." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 2-3 iş günü sürer; kupalar kırılmaya karşı tek tek köpükle paketlenir ve DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Baskılı Kupa: Hediye ve Promosyonun Her Gün Kullanılanı", paragraflar: ["Kupa, her sabah elde tutulan tek promosyon ürünüdür; logolu kupa ofis masasında yıllarca kalır. Kurumsal hediye, bayi ve müşteri promosyonu, personel hoş geldin seti, doğum günü ve anne-baba günü için fotoğraflı kişiye özel kupa en çok tercih edilen kullanımlardır.", "Katalogdaki ürün 330 ml klasik beyaz seramik kupadır; sublimasyon baskı kaplamanın içine işlediği için bulaşık makinesinde çıkmaz. 1 adetten 50 adede kadar sipariş edilir."] },
      { baslik: "Tasarım İpuçları", paragraflar: ["Baskı alanı kulp hariç gövdeyi sarar, yaklaşık 20×9 cm. Tek yüz tasarımda görsel sağ elle tutulduğunda dışa bakacak şekilde konumlanır; çift yüz tasarımda iki yana aynı ya da farklı görsel uygulanır. Koyu ve doygun renkler en canlı sonucu verir; fotoğrafı orijinal çözünürlükte gönderin."] },
      { baslik: "Adet ve Fiyat", paragraflar: ["Fiyatı adet kademesi belirler: 1, 6, 12, 24 ve 50. Tek adet hediye siparişi mümkündür; kurumsal dağıtımda 24 ve 50 adet kademeleri birim fiyatı belirgin düşürür. " + FIYAT] },
      { baslik: "Paketleme ve Teslimat", paragraflar: ["Kupalar tek tek köpük korumalı olarak paketlenir. " + TESLIM("2-3 iş günü")] },
    ],
  },

  lightbox: {
    seo: { title: "Lightbox LED Tabela Fiyatları 2026 — 60×40, 100×70, 150×100 cm Işıklı Tabela", description: "LED lightbox tabela: alüminyum çerçeve, arkadan LED aydınlatma, gergi membran veya pleksi yüzey. 60×40, 100×70 ve 150×100 cm ebatlarda 5-7 iş günü üretim." },
    faqs: [
      { q: "Lightbox nedir?", a: "Lightbox, arkadan LED ile aydınlatılan, görselin ışıklı göründüğü kutu tabeladır. Alüminyum çerçeve içine LED modüller yerleştirilir, ön yüze gergi membran veya pleksi üzerine basılı görsel takılır. Gece de okunur, vitrin ve iç mekânda dikkat çeker; görsel sonradan değiştirilebilir." },
      { q: "Gergi membran ile pleksi yüzey arasındaki fark nedir?", a: "Gergi membran, çerçeveye silikon şeritle gerilen esnek kumaştır; büyük ebatlarda homojen ışık verir ve görsel dakikalar içinde değiştirilir. Pleksi yüzey sert ve darbeye dayanıklıdır; dış vitrin ve dokunulabilecek yüksekliklerde tercih edilir. Kampanya görseli sık değişecekse membran, kalıcı tabela ise pleksi." },
      { q: "Hangi ebadı seçmeliyim?", a: "60×40 cm tezgâh arkası ve küçük vitrin için; 100×70 cm mağaza içi ve vitrin tanıtımının standart boyu; 150×100 cm AVM vitrini, fuar standı ve geniş cephe için seçilir. Görüş mesafesi arttıkça ebat büyümelidir." },
      { q: "Lightbox dış mekânda kullanılabilir mi?", a: "Korunaklı vitrin içinde ve saçak altında kullanılabilir. Doğrudan yağmur alan cephe için dış mekân sınıfı gövde ve sızdırmaz elektrik bağlantısı gerekir; bu talebi sipariş notuna yazın, teklif ayrıca hazırlanır." },
      { q: "Elektrik tüketimi ve montaj nasıl?", a: "LED modüller düşük tüketimlidir; standart priz ile çalışır, adaptör dahildir. Duvara askı aparatıyla veya vitrin içine ayaklı olarak konur. Görsel değişimi için elektrikçi gerekmez." },
      { q: "Kaç günde teslim edilir?", a: "Çerçeve, LED montajı ve baskı nedeniyle üretim 5-7 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Görsel dosyasını seçtiğiniz ebatta, CMYK ve 150 dpi hazırlayın; ışıklı baskıda renkler bir ton açılır, koyu tonlar tercih edin." },
    ],
    seoBolumler: [
      { baslik: "Lightbox Nedir, Nerede Kullanılır?", paragraflar: ["Lightbox, arkadan LED ile aydınlatılan kutu tabeladır; görsel ışıklı göründüğü için gece ve loş ortamda da okunur. Mağaza vitrinleri, restoran menü panoları, eczane ve optik vitrinleri, fuar standları, otel resepsiyonları ve AVM koridorlarında kullanılır. Görsel sonradan değiştirilebildiği için kampanya dönemlerinde tek gövdeyle yıllarca çalışır.", "Katalogdaki ürün alüminyum çerçeveli, arkadan LED aydınlatmalı lightbox'tır; 60×40, 100×70 ve 150×100 cm ebatlarda, gergi membran veya pleksi yüzeyle üretilir."] },
      { baslik: "Ebat ve Yüzey Seçimi", paragraflar: ["Ebat görüş mesafesine, yüzey ise görselin ne sıklıkla değişeceğine göre seçilir."], tablo: { basliklar: ["Ebat", "Kullanım", "Önerilen yüzey"], satirlar: [["60×40 cm", "Tezgâh arkası, küçük vitrin, menü", "Pleksi"], ["100×70 cm", "Mağaza içi, standart vitrin", "Membran veya pleksi"], ["150×100 cm", "AVM vitrini, fuar, geniş cephe", "Gergi membran"]] } },
      { baslik: "Görsel Hazırlığı", paragraflar: ["Işıklı baskıda arkadan gelen ışık renkleri bir ton açar; koyu ve doygun tonlar, beyaz zemin yerine renkli zemin daha iyi sonuç verir. Dosyayı seçtiğiniz ebatta, 3 cm taşma payıyla, CMYK ve 150 dpi hazırlayın. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı ebat ve adet kademesi (1, 2, 5) belirler; şube zinciri için 5 adet kademesi birim fiyatı düşürür. " + FIYAT, TESLIM("5-7 iş günü")] },
    ],
  },

  "plastik-reklam-dubasi": {
    seo: { title: "Plastik Reklam Dubası — Logolu ve Uyarı Baskılı Duba, Kırmızı-Sarı-Yeşil", description: "İçi doldurulabilir plastik reklam dubası: kırmızı, sarı ve yeşil, özel logo ve uyarı baskısı. Otopark, vale, inşaat ve etkinlik alanı için 1-25 adet, 3-4 iş günü üretim." },
    faqs: [
      { q: "Plastik duba ne için kullanılır?", a: "Otopark ve vale alanı ayırma, şantiye ve yol çalışması çevreleme, etkinlik alanı yönlendirme ve mağaza önü park engelleme için kullanılır. Baskılı olduğunda hem güvenlik hem reklam işlevi görür: AVM, otel, hastane ve araç galerileri logolarını dubaya bastırır." },
      { q: "İçi neden dolduruluyor?", a: "Duba boşken hafiftir ve rüzgârda devrilebilir; alt haznesi su veya kumla doldurulduğunda yerinde sabit durur. Taşınacağı zaman boşaltılır. Sürekli dış mekânda kalacak dubalarda kum, sık taşınacaklarda su tercih edilir." },
      { q: "Renk seçimi neye göre yapılır?", a: "Kırmızı uyarı ve yasak alan (yol çalışması, giriş yasağı), sarı dikkat ve geçici düzenleme (otopark, etkinlik), yeşil izin verilen alan ve yönlendirme için kullanılır. Kurumsal renkle uyumlu seçim de yapılabilir; baskı rengi zeminden bağımsızdır." },
      { q: "Dubaya ne basılır?", a: "Logo, firma adı, 'vale', 'park yapılmaz', 'yetkili araç', 'hoş geldiniz' gibi kısa uyarı ve yönlendirme metinleri. Baskı dubanın ön yüzüne UV dayanıklı olarak uygulanır. Metni sipariş notuna yazın, tasarım ekibi hazırlayıp onaya sunar." },
      { q: "Kaç adet sipariş edilir?", a: "1, 5, 10 ve 25 adet kademeleri vardır. Otopark ve vale alanı için genellikle 5-10 adet, şantiye çevrelemesi ve AVM için 25 adet kademesi seçilir; adet arttıkça birim fiyat düşer." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 3-4 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir. Dubalar boş gönderilir, yerinde doldurulur." },
    ],
    seoBolumler: [
      { baslik: "Baskılı Plastik Duba", paragraflar: ["Plastik duba, alanı ayırmak ve yönlendirmek için kullanılan, içi su veya kumla doldurulan taşınabilir engeldir. Baskılı duba aynı anda güvenlik ve reklam işi görür: otopark ve vale alanlarında, şantiye ve yol çalışmalarında, etkinlik alanlarında ve mağaza önlerinde kurum logosunu taşır.", "Katalogdaki ürün kırmızı, sarı ve yeşil renkte, ön yüzüne özel baskı yapılan plastik dubadır; 1, 5, 10 ve 25 adet kademelerinde sipariş edilir."] },
      { baslik: "Renk ve Kullanım", paragraflar: ["Renk, dubanın vereceği mesaja göre seçilir."], tablo: { basliklar: ["Renk", "Anlam", "Tipik yer"], satirlar: [["Kırmızı", "Uyarı, yasak alan", "Yol çalışması, giriş yasağı, şantiye"], ["Sarı", "Dikkat, geçici düzenleme", "Otopark, vale, etkinlik alanı"], ["Yeşil", "İzinli alan, yönlendirme", "Yetkili park, giriş yönü, hoş geldiniz"]] } },
      { baslik: "Baskı ve Doldurma", paragraflar: ["Logo ve kısa metin dubanın ön yüzüne UV dayanıklı basılır; metni sipariş notuna yazın, tasarım ekibi yerleşimi hazırlayıp onaya sunar. Duba boş gönderilir; yerinde alt haznesi su veya kumla doldurularak sabitlenir, taşınırken boşaltılır."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı renk ve adet kademesi belirler; 10 ve 25 adette birim fiyat düşer. " + FIYAT, TESLIM("3-4 iş günü")] },
    ],
  },

  bloknot: {
    seo: { title: "Bloknot Baskı Fiyatları 2026 — Küp, Spiralli, Kapaklı Bloknot ve Notluk", description: "Promosyon bloknot: küp bloknot 78×78 mm, spiralli ve kapaklı bloknot 9,4×13,3 / 14×20 cm, cep notluk. 80 gr 1. hamur, 100-1.000 adet, 5-7 iş günü üretim." },
    faqs: [
      { q: "Hangi bloknot türü hangi kullanım için?", a: "Küp bloknot masa üstü not için, 250 veya 500 yapraklıdır. Spiralli bloknot yandan spiralli, sayfaları koparılabilen klasik nottur. Kapaklı bloknot Amerikan ciltle üstten yapıştırılmış, kapaklı ve daha kurumsal görünümlüdür. Kapaksız bloknot en ekonomik tutkallı seçenektir. Cep notluğu 7,8×14 cm ile cebe sığar." },
      { q: "9,4×13,3 cm ile 14×20 cm arasındaki fark nedir?", a: "9,4×13,3 cm cep ve çanta boyudur; fuar dağıtımı ve kısa notlar için yeterlidir. 14×20 cm masa boyu A5'e yakındır; toplantı notu, seminer ve eğitim setleri için tercih edilir. İki boy da spiralli, kapaklı ve kapaksız seçeneklerde vardır." },
      { q: "Kapak seçenekleri nelerdir?", a: "Spiralli ve kapaklı bloknotta NK (normal kuşe) kapak, parlak selefon kapak, mat selefon kapak, 400 gr mat lak kapak ve sıvama kapak seçilir. Selefon ve lak kapak yıpranmaya dayanır; sıvama kapak en kalın ve prestijli olanıdır." },
      { q: "İç sayfalar baskılı mı?", a: "İç sayfalar 80 gr 1. hamur kâğıttır; logo, çizgi, kare veya nokta ızgara gibi tek renk baskı uygulanabilir. Notluğun iç sayfası 110 gr renkli basılır. İç sayfa baskısı isteğinizi sipariş notuna yazın." },
      { q: "En az kaç adet sipariş edilir?", a: "Küp bloknotta 100, 250, 500 ve 1.000 adet; spiralli, kapaklı ve kapaksız bloknotta 500 ve 1.000 cilt; notlukta 1.000 adet kademeleri vardır. Adet arttıkça birim fiyat düşer." },
      { q: "Kaç günde teslim edilir?", a: "Cilt ve kapak işlemleri nedeniyle üretim 5-7 iş günü sürer (kapaksız bloknotta 4-5); ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Promosyon Bloknot Çeşitleri", paragraflar: ["Bloknot, üzerinde logonuzla her gün masada duran en kullanışlı promosyon ürünlerinden biridir. Fuar dağıtımı, seminer ve eğitim setleri, personel kırtasiyesi, otel odası ve bayi hediyesi olarak kullanılır. Katalogda beş tür vardır; aşağıdaki tablo seçimi kolaylaştırır."], tablo: { basliklar: ["Ürün", "Ölçü ve yapı", "En uygun kullanım"], satirlar: [["Küp bloknot", "78×78 mm, 250 veya 500 yaprak, 80 gr 1. hamur", "Masa üstü not, resepsiyon, çağrı merkezi"], ["Spiralli bloknot", "9,4×13,3 / 14×20 cm, 50 yaprak, 5 kapak seçeneği", "Fuar, seminer, günlük not"], ["Kapaklı bloknot", "9,4×13,3 / 14×20 cm, Amerikan cilt, 4 kapak seçeneği", "Kurumsal set, bayi ve müşteri hediyesi"], ["Kapaksız bloknot", "9,4×13,3 / 14×20 cm, tutkallı cilt", "En ekonomik toplu dağıtım"], ["Notluk", "7,8×14 cm, 70 yaprak, 350 gr mat selefon dış", "Cep notu, otel ve araç içi"]] } },
      { baslik: "Kapak Seçimi", paragraflar: ["NK kapak en ekonomik, parlak ve mat selefon kapak yıpranmaya dayanıklı, 400 gr mat lak kapak tok ve kurumsal, sıvama kapak en kalın ve prestijli seçenektir. Sık taşınacak bloknotlarda selefon veya lak kapak, hediye setlerinde sıvama kapak tercih edilir."] },
      { baslik: "İç Sayfa ve Tasarım", paragraflar: ["İç sayfalar 80 gr 1. hamurdur; logo, çizgi, kare veya nokta ızgara tek renk basılabilir. Kapak tasarımını seçtiğiniz ölçüde, 3 mm taşma payıyla, CMYK ve 300 dpi hazırlayın; spiral ve cilt payı için üst kenarda 1 cm boşluk bırakın. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı ürün türü, kapak seçeneği ve adet kademesi belirler. " + FIYAT, TESLIM("5-7 iş günü")] },
    ],
  },

  "amerikan-servis": {
    seo: { title: "Amerikan Servis Baskı Fiyatları 2026 — Restoran ve Kafe Tepsi Altlığı", description: "Baskılı amerikan servis: 31×44 cm 90 gr, 27,5×40 cm 100 gr kuşe, 34×49 cm 120 gr; tek yön renkli. Restoran, kafe ve fast food için 2.000-6.000 adet, 2-3 iş günü üretim." },
    faqs: [
      { q: "Amerikan servis nedir?", a: "Restoran ve kafelerde tepsinin veya tabağın altına serilen tek kullanımlık baskılı kâğıttır. Menü, kampanya, marka hikâyesi ve QR kod taşır; masayı korur ve her müşteriye bir reklam yüzeyi sunar. Fast food, kebapçı, kahvaltı salonu, otel restoranı ve kafeler en sık kullananlardır." },
      { q: "Hangi ebat ve gramaj seçilmeli?", a: "31×44 cm 90 gr hamur standart tepsi altlığıdır ve en ekonomik seçenektir. 27,5×40 cm 100 gr kuşe daha parlak baskı verir; fotoğraflı menü ve kampanya için uygundur. 34×49 cm 120 gr hamur büyük tepsi ve masa örtüsü gibi kullanım için seçilir. Tepsi ölçünüzü ölçüp ona en yakın ebadı seçin." },
      { q: "Kâğıt yağa dayanır mı?", a: "Hamur ve kuşe kâğıt tek kullanımlık altlık için tasarlanmıştır; servis süresince yağ ve nem lekesi tutar ama dağılmaz. Uzun süreli kullanım ve yıkanabilir altlık istiyorsanız selefonlu broşür ya da PVC menü ürünlerine bakın." },
      { q: "Amerikan servise ne basılır?", a: "Menü ve fiyat listesi, kampanya duyurusu, marka hikâyesi, sosyal medya ve QR kod, çocuklar için boyama alanı. Tek yön renkli basıldığı için tasarımın tamamı üst yüzdedir; tabağın kapatacağı orta alana önemli bilgi koymayın." },
      { q: "Adet kademeleri nelerdir?", a: "2.000, 4.000 ve 6.000 adet. Günlük servis sayınızı hesaplayıp bir-iki aylık ihtiyacı tek seferde sipariş etmek birim fiyatı düşürür; kâğıt kuru ortamda bozulmaz." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 2-3 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Amerikan Servis Nedir, Neden Kullanılır?", paragraflar: ["Amerikan servis, tepsi veya tabağın altına serilen tek kullanımlık baskılı kâğıt altlıktır. Masayı ve tepsiyi korurken her müşterinin önüne bir reklam yüzeyi koyar: menü, kampanya, QR kod, marka hikâyesi. Fast food zincirleri, kebapçılar, kahvaltı salonları, kafeler ve otel restoranları en sık kullananlardır.", "Katalogdaki ürün üç ebat ve gramajda, tek yön renkli basılır; 2.000, 4.000 ve 6.000 adet kademelerinde sipariş edilir."] },
      { baslik: "Ebat ve Gramaj Seçimi", paragraflar: ["Tepsi ölçüsüne ve baskı kalitesi beklentisine göre seçilir."], tablo: { basliklar: ["Ebat", "Kâğıt", "En uygun kullanım"], satirlar: [["31×44 cm", "90 gr hamur", "Standart tepsi altlığı, en ekonomik"], ["27,5×40 cm", "100 gr kuşe", "Fotoğraflı menü, parlak kampanya görseli"], ["34×49 cm", "120 gr hamur", "Büyük tepsi, masa örtüsü gibi kullanım"]] } },
      { baslik: "Tasarım İpuçları", paragraflar: ["Tabağın kapatacağı orta alanı boş ya da desenli bırakın; menü, kampanya ve QR kodu kenarlara yerleştirin. Çocuklu restoranlarda boyama alanı masada kalış süresini uzatır. Dosyayı seçtiğiniz ebatta, 3 mm taşma payıyla, CMYK ve 300 dpi hazırlayın. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı ebat-gramaj seçeneği ve adet kademesi belirler; 4.000 ve 6.000 adette birim fiyat düşer. " + FIYAT, TESLIM("2-3 iş günü")] },
    ],
  },

  "kapi-aski-brosur": {
    seo: { title: "Kapı Askı Broşür Fiyatları 2026 — Otel ve Mağaza Kapı Kolu Broşürü", description: "Kapı askı broşür: 200 gr kuşe parlak selefon, 350 gr kuşe veya 700 gr Bristol kabartma lak. Otel odası kartı, hizmet listesi ve kapı dağıtımı için 1.000 adet, 3-4 iş günü." },
    faqs: [
      { q: "Kapı askı broşür nedir?", a: "Üst kısmında kapı koluna geçirilecek delik bulunan, kartondan üretilen broşürdür. Otellerde 'rahatsız etmeyin / odayı temizleyin' kartı ve oda servisi menüsü olarak; restoran, market ve hizmet firmalarında ise ev ve iş yeri kapılarına asılarak dağıtılan tanıtım olarak kullanılır." },
      { q: "200, 350 ve 700 gr arasında nasıl seçim yaparım?", a: "200 gr kuşe parlak selefon, tek seferlik kapı dağıtımı için ekonomik ve yeterlidir. 350 gr kuşe mat selefon kabartma lak, otel odası kartı gibi aylarca kullanılan işler için tok ve prestijlidir. 700 gr Bristol mat selefon kabartma lak en kalın seçenektir; lüks otel ve uzun ömürlü hizmet kartları için tercih edilir." },
      { q: "Kabartma lak nedir?", a: "Mat selefon üzerine logo veya başlık alanına uygulanan parlak, dokunulduğunda hissedilen kısmi lak katmanıdır. Mat zemin üzerinde parlak logo etkisi verir; kartın premium görünmesini sağlar." },
      { q: "Kapı askı broşür ölçüsü nedir?", a: "Standart kapı askı ölçüsü kapı koluna uygun delik açılan dikey karttır; ürün sayfasındaki ölçüye göre tasarım hazırlanır. Delik alanına yazı ve logo denk getirmeyin, tasarımı deliğin altında başlatın." },
      { q: "Adet ve fiyat nasıl?", a: "Standart kademe 1.000 adettir; fiyatı seçilen kâğıt-kaplama kombinasyonu belirler. Konfigüratörde seçim yaptığınızda KDV dahil tutar anında görünür." },
      { q: "Kaç günde teslim edilir?", a: "Selefon, lak ve kesim işlemleri nedeniyle üretim 3-4 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Kapı Askı Broşür Nedir, Kimler Kullanır?", paragraflar: ["Kapı askı broşür, üst kısmındaki delikle kapı koluna asılan karton tanıtımdır. Otellerde rahatsız etmeyin kartı, oda servisi menüsü ve hizmet listesi olarak; restoran, market, temizlik ve tesisat firmalarında ise mahalle bazlı kapı dağıtımı olarak kullanılır. Posta kutusuna atılan el ilanından farkı, kapıyı açan herkesin eline alması gerekmesidir.", "Katalogda üç kâğıt-kaplama kombinasyonu vardır; hepsi 1.000 adet kademesinde sipariş edilir."] },
      { baslik: "Kâğıt ve Kaplama Seçimi", paragraflar: ["Kullanım süresi seçimi belirler: tek seferlik dağıtım mı, aylarca asılı kalacak otel kartı mı?"], tablo: { basliklar: ["Seçenek", "Özellik", "En uygun kullanım"], satirlar: [["200 gr kuşe, parlak selefon", "Ekonomik, canlı renk", "Mahalle kapı dağıtımı, kampanya"], ["350 gr kuşe, mat selefon + kabartma lak", "Tok, premium his", "Otel odası kartı, hizmet listesi"], ["700 gr Bristol, mat selefon + kabartma lak", "En kalın, en uzun ömür", "Lüks otel, aylarca kullanılan kart"]] } },
      { baslik: "Tasarım", paragraflar: ["Tasarımı kapı kolu deliğinin altında başlatın; deliğe denk gelen alanda yazı ve logo olmasın. Çift yüz tasarımda bir yüze 'rahatsız etmeyin', diğerine 'odayı temizleyin' gibi karşıt mesajlar konur. Dosyayı ürün sayfasındaki ölçüde, 3 mm taşma payıyla, CMYK ve 300 dpi hazırlayın; kabartma lak alanını ayrı katmanda %100 siyah işaretleyin. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: [FIYAT, TESLIM("3-4 iş günü")] },
    ],
  },

  "cepli-dosya": {
    seo: { title: "Cepli Dosya Baskı Fiyatları 2026 — Kurumsal Teklif ve Avukat Dosyası", description: "Baskılı cepli dosya: kapalı hâli 22,5×31 cm, mat/parlak selefon, kabartma lak, çift yön baskı ve selefonsuz avukat dosyası seçenekleri. 500-1.000 adet, 4-5 iş günü üretim." },
    faqs: [
      { q: "Cepli dosya nedir, kimler kullanır?", a: "İç tarafında belgeleri tutan cebi olan, dıştan baskılı karton sunum dosyasıdır. Kurumsal teklif ve sözleşme sunumu, avukat ve mali müşavir evrakı, emlak portföyü, okul kayıt seti ve fuar dokümanı için kullanılır. Kapalı hâli 22,5×31 cm olduğundan A4 belge rahatça sığar." },
      { q: "Yedi varyant arasında nasıl seçim yaparım?", a: "Mat selefon ve içi tek renk baskı standart kurumsal dosyadır. Mat selefon + kabartma lak logo alanını parlatarak premium görünüm verir. Parlak selefon renkleri canlandırır. Çift yön parlak veya mat selefon iç yüzü de tam renkli basılan seçeneklerdir. 400 gr kuşe mat lak en tok karton, selefonsuz avukat dosyası ise geleneksel, üzerine yazılabilir yüzeydir." },
      { q: "Avukat dosyası neden selefonsuz?", a: "Avukat ve mali müşavir dosyalarına dosya numarası, müvekkil adı ve tarih elle yazılır; selefonlu yüzeyde kalem tutmaz. Selefonsuz kuşe karton hem yazılabilir hem baskılıdır." },
      { q: "Dosyaya kartvizit yuvası eklenir mi?", a: "Cep üzerine kartvizit yuvası kesimi standart tasarımlarda yer alabilir; isteğinizi sipariş notuna yazın, tasarım ekibi bıçak formuna ekleyip onaya sunar." },
      { q: "Adet ve fiyat nasıl?", a: "500 ve 1.000 adet kademeleri vardır; fiyatı varyant ve adet belirler. Yıllık teklif ve sözleşme sayınıza göre 1.000 adet kademesi birim fiyatı düşürür." },
      { q: "Kaç günde teslim edilir?", a: "Selefon, lak, bıçak kesim ve cep yapıştırma aşamaları nedeniyle üretim 4-5 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Cepli Dosya Nedir?", paragraflar: ["Cepli dosya, teklif, sözleşme ve tanıtım belgelerini müşteriye derli toplu sunmak için kullanılan baskılı karton dosyadır. Kapalı hâli 22,5×31 cm, A4 belgeyi cebine alır. Kurumsal satış ekipleri, avukat ve mali müşavirler, emlak ofisleri, okullar ve fuar katılımcıları en sık kullananlardır.", "Katalogda yedi kâğıt-kaplama varyantı vardır; 500 ve 1.000 adet kademelerinde sipariş edilir."] },
      { baslik: "Varyant Seçimi", paragraflar: ["Kaplama, dosyanın görünümünü ve elde bıraktığı izlenimi belirler."], tablo: { basliklar: ["Varyant", "Özellik", "En uygun kullanım"], satirlar: [["Mat selefon, içi tek renk", "Standart kurumsal, sade", "Genel teklif dosyası"], ["Mat selefon + kabartma lak", "Parlak logo, premium his", "Üst segment satış sunumu"], ["Parlak selefon", "Canlı renk", "Ürün kataloğu, emlak portföyü"], ["Çift yön selefon (mat veya parlak)", "İç yüz de tam renkli", "İçi bilgi taşıyan sunum dosyası"], ["400 gr kuşe, mat lak", "En tok karton", "Uzun süre kullanılacak dosya"], ["Avukat dosyası, selefonsuz", "Üzerine yazılabilir", "Hukuk ve muhasebe evrakı"]] } },
      { baslik: "Tasarım", paragraflar: ["Dosya açık hâlde tasarlanır: ön kapak, arka kapak ve sırt tek düzlemde, cep ayrı parça olarak. Bıçak formu ürün sayfasından indirilir; kesim ve pilyaj çizgilerine 3 mm'den yakın yazı koymayın. Kabartma lak alanını ayrı katmanda %100 siyah işaretleyin. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: [FIYAT, TESLIM("4-5 iş günü")] },
    ],
  },

  makbuz: {
    seo: { title: "Makbuz Baskı Fiyatları 2026 — Kendinden Kopyalı Tahsilat ve Teslimat Makbuzu", description: "Kendinden kopyalı makbuz: 54 gr, 1 asıl + 1 suret, 50'lik cilt; 10×14, 10×20, 14×20 ve 20×29 cm; tek renk veya renkli. Esnaf, restoran ve kargo için 10-30 cilt." },
    faqs: [
      { q: "Kendinden kopyalı makbuz nedir?", a: "Karbon kâğıdı gerektirmeden, üstteki yaprağa yazılanın alttaki yaprağa kendiliğinden çıktığı kâğıttır. Katalogdaki makbuz 54 gr kendinden kopyalı kâğıttan, 1 asıl + 1 suret olarak üretilir; asıl müşteriye verilir, suret ciltte kalır." },
      { q: "Hangi ebadı seçmeliyim?", a: "10×14 cm cep boyu tahsilat makbuzu; 10×20 cm uzun tahsilat ve fiş; 14×20 cm birkaç kalem yazılan teslimat ve sipariş makbuzu; 20×29 cm ise çok kalemli irsaliye, servis formu ve ekspertiz formu için seçilir. Kaç satır yazacağınızı düşünüp ebadı ona göre belirleyin." },
      { q: "Tek renk mi renkli mi?", a: "Tek renk siyah baskı, çizgi ve başlıklardan oluşan klasik makbuz için yeterli ve ekonomiktir. Renkli baskı logo ve kurumsal renk isteyen işletmeler içindir; kopyalı kâğıtta renkli baskı da net çıkar." },
      { q: "Makbuz numaralı basılır mı?", a: "Seri numarası, tarih ve imza alanı gibi öğeler tasarıma eklenir; sıralı numaratör talebinizi sipariş notuna yazın. Resmi belge niteliği taşıyan fatura ve irsaliye için mali mühür ve anlaşmalı matbaa şartları geçerlidir; katalogdaki makbuz işletme içi tahsilat ve teslimat belgesi olarak kullanılır." },
      { q: "Cilt nedir, kaç cilt sipariş edilir?", a: "Bir cilt 50 yapraktır (50 asıl + 50 suret). 10, 20 ve 30 cilt kademeleri vardır; adet arttıkça birim fiyat düşer. Günlük makbuz sayınıza göre iki-üç aylık ihtiyacı tek seferde sipariş edin." },
      { q: "Kaç günde teslim edilir?", a: "Kopyalı kâğıt baskısı ve ciltleme nedeniyle üretim 7-10 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Kendinden Kopyalı Makbuz", paragraflar: ["Makbuz, günlük tahsilat ve teslimatın kaydını tutan basılı formdur. Esnaf, restoran ve kafe, oto galerisi ve servis, kargo şubesi, nakliyeci ve tamirciler için müşteriye verilen belge ile işletmede kalan suretin aynı anda oluşması gerekir; kendinden kopyalı kâğıt bunu karbon kâğıdı olmadan sağlar.", "Katalogdaki makbuz 54 gr kendinden kopyalı kâğıttan 1 asıl + 1 suret, 50'lik cilt olarak üretilir; dört ebat ve tek renk veya renkli baskı seçilir."] },
      { baslik: "Ebat Seçimi", paragraflar: ["Ebat, makbuza kaç kalem yazılacağına göre seçilir."], tablo: { basliklar: ["Ebat", "Kullanım"], satirlar: [["10×14 cm", "Cep boyu tahsilat makbuzu, aidat, bağış"], ["10×20 cm", "Uzun tahsilat, fiş, kısa sipariş"], ["14×20 cm", "Birkaç kalemli teslimat ve sipariş makbuzu"], ["20×29 cm", "Çok kalemli irsaliye, servis ve ekspertiz formu"]] } },
      { baslik: "Tasarım", paragraflar: ["Standart makbuzda üstte işletme bilgisi ve logo, ortada tarih, müşteri adı ve tutar satırları, altta imza alanları bulunur. Seri numarası ve numaratör talebini sipariş notuna yazın. Dosyayı seçtiğiniz ebatta, CMYK (tek renkte %100 siyah) ve 300 dpi hazırlayın; tasarımınız yoksa tasarım ekibi işletme bilgilerinizle standart makbuz düzenini ücretsiz hazırlar."] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı ebat, baskı türü ve cilt sayısı (10, 20, 30) belirler. " + FIYAT, TESLIM("7-10 iş günü")] },
    ],
  },

  "oto-paspas": {
    seo: { title: "Baskılı Oto Paspas — Galeri ve Servis İçin Tek Kullanımlık Kraft Paspas", description: "Tek kullanımlık baskılı oto paspas: 85 gr kraft, 34×49 cm, tek renk logo baskı. Oto galerisi, servis, ekspertiz ve kiralama için 1.000-5.000 adet, 7-10 iş günü üretim." },
    faqs: [
      { q: "Tek kullanımlık oto paspas ne işe yarar?", a: "Servis, yıkama, ekspertiz ve galeri müşteri aracının sürücü tarafı zeminine serilir; işlem sırasında paspasın kirlenmesini önler ve aracı teslim ederken müşteriye 'aracınıza özen gösterdik' mesajı verir. Üzerindeki logo ve telefon, müşteri aracı kullandıkça göz önünde kalır." },
      { q: "Paspas ölçüsü ve kâğıdı nedir?", a: "34×49 cm, 85 gr kraft kâğıttır. Binek araç sürücü zeminini kapatacak standart ölçüdür; kraft kâğıt yırtılmaya ve ayakkabı sürtünmesine dayanır, kahverengi zemin kiri gizler." },
      { q: "Baskı renkli mi?", a: "Katalogdaki ürün tek renk baskıdır; kraft zemin üzerine siyah ya da tek pantone renk logo ve metin en net sonucu verir. Logonuzu vektör olarak gönderin." },
      { q: "Kaç adet sipariş etmeliyim?", a: "1.000, 2.000 ve 5.000 adet kademeleri vardır. Günlük araç sayınıza göre iki-üç aylık ihtiyacı tek seferde sipariş etmek birim fiyatı düşürür; kâğıt kuru ortamda bozulmaz." },
      { q: "Paspasa ne yazılmalı?", a: "Logo, servis adı, telefon ve adres; isteğe bağlı olarak 'bir sonraki bakım' hatırlatma alanı, yıkama kampanyası veya QR kod. Sürücü aracı kullanırken paspasa bakar; telefon numarasını büyük tutun." },
      { q: "Kaç günde teslim edilir?", a: "Üretim 7-10 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Baskılı Oto Paspas Nedir?", paragraflar: ["Baskılı oto paspas, servis ve galeri işlemleri sırasında müşteri aracının sürücü zeminine serilen tek kullanımlık kraft kâğıttır. Aracı temiz teslim etmenin göstergesidir ve müşteri aracı kullandıkça logo ile telefon numarası ayağının altında kalır. Oto servisleri, yıkama ve detailing merkezleri, ekspertiz ve kiralama firmaları, galeriler en sık kullananlardır.", "Katalogdaki ürün 85 gr kraft kâğıt, 34×49 cm, tek renk baskıdır; 1.000, 2.000 ve 5.000 adet kademelerinde sipariş edilir."] },
      { baslik: "Neden Kraft Kâğıt?", paragraflar: ["Kraft kâğıt uzun lifli olduğu için yırtılmaya ve ayakkabı sürtünmesine dayanır; kahverengi zemin çamur ve yağ lekesini gizler. 85 gr, sürücü zemininde kaymayacak kadar tok ama toplu siparişte ekonomik gramajdır."] },
      { baslik: "Tasarım", paragraflar: ["Tek renk baskı için logoyu vektör olarak gönderin; siyah ya da tek pantone renk kraft üzerinde en net sonucu verir. Telefon numarasını en büyük öğe yapın; bakım hatırlatma alanı ve kampanya mesajı ekleyebilirsiniz. Dosyayı 34×49 cm ölçüde, 3 mm taşma payıyla hazırlayın. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı adet kademesi belirler; 2.000 ve 5.000 adette birim fiyat düşer. " + FIYAT, TESLIM("7-10 iş günü")] },
    ],
  },

  "canta-kese": {
    seo: { title: "Karton Çanta Baskı Fiyatları 2026 — 210 gr Bristol Selefonlu Mağaza Çantası", description: "Baskılı karton çanta: 210 gr Amerikan Bristol, parlak veya mat selefon, kraft seçenekleri, 6 ebat ve ip rengi. Mağaza, butik ve hediye paketleme için 500-2.000 adet, 5-7 iş günü." },
    faqs: [
      { q: "Karton çanta hangi kâğıttan üretilir?", a: "210 gr Amerikan Bristol kartondan üretilir ve parlak ya da mat selefonla kaplanır; selefon çantayı neme ve sürtünmeye karşı korur, renkleri canlı tutar. Kraft seçenekleri doğal kahverengi görünüm isteyen butik ve kafeler için sunulur." },
      { q: "Ebat nasıl seçilir?", a: "Katalogda altı ebat vardır; ürün sayfasındaki ölçü listesinden taşınacak ürüne göre seçilir. Takı ve kozmetik için küçük, tekstil ve ayakkabı için orta ve büyük, hediye kutusu için kutunun ölçüsüne en yakın ebat tercih edilir. Emin değilseniz bir üst ebadı seçin." },
      { q: "İp rengi seçilebilir mi?", a: "Evet, çanta ipi katalogdaki renk seçeneklerinden seçilir; kurumsal renkle uyumlu ip çantayı tamamlar. İp rengi ürün sayfasındaki seçenek listesinden işaretlenir." },
      { q: "Çantaya lak veya yaldız uygulanır mı?", a: "Logo alanına kabartma lak ve yaldız gibi ekstralar uygulanabilir; premium mağaza ve hediye çantalarında tercih edilir. İsteğinizi sipariş notuna yazın, teklif ayrıca hazırlanır." },
      { q: "En az kaç adet sipariş edilir?", a: "500, 1.000 ve 2.000 adet kademeleri vardır; adet arttıkça birim fiyat düşer. Sezonluk ihtiyacı tek seferde sipariş etmek en ekonomik yoldur; çantalar yassı olarak, az yer kaplayacak şekilde teslim edilir." },
      { q: "Kaç günde teslim edilir?", a: "Selefon, kesim, yapıştırma ve ip takma aşamaları nedeniyle üretim 5-7 iş günü sürer; ardından DHL ile 81 ile 2-4 iş gününde teslim edilir." },
    ],
    seoBolumler: [
      { baslik: "Baskılı Karton Çanta", paragraflar: ["Karton çanta, müşterinin mağazadan çıkarken elinde taşıdığı ve sokakta gezdirdiği markadır. Butikler, kuyumcular, kozmetik ve ayakkabı mağazaları, pastaneler, kitapçılar ve kurumsal hediye paketlemesi yapan firmalar için hem ambalaj hem reklamdır.", "Katalogdaki çanta 210 gr Amerikan Bristol kartondan, parlak veya mat selefonlu üretilir; kraft seçenekleri, altı ebat ve ip rengi seçimi vardır. 500, 1.000 ve 2.000 adet kademelerinde sipariş edilir."] },
      { baslik: "Kaplama ve Ebat", paragraflar: ["Kaplama markanın karakterine, ebat taşınacak ürüne göre seçilir."], tablo: { basliklar: ["Seçim", "Seçenek", "Not"], satirlar: [["Kaplama", "Parlak selefon", "Canlı renk, fotoğraf ve renkli logo"], ["Kaplama", "Mat selefon", "Sade, premium görünüm"], ["Kaplama", "Kraft", "Doğal görünüm, butik ve kafe"], ["Ebat", "6 ebat", "Ürün sayfasındaki ölçü listesinden, emin değilseniz bir üst ebat"], ["İp", "Renk seçimi", "Kurumsal renkle uyumlu"]] } },
      { baslik: "Tasarım", paragraflar: ["Çanta açık hâlde tasarlanır: ön yüz, arka yüz, iki yan körük ve taban tek düzlemde. Bıçak formu ürün sayfasından indirilir; katlama çizgilerine 5 mm'den yakın yazı koymayın, logoyu ön yüzün ortasına ve göz hizasına yerleştirin. Kabartma lak ve yaldız alanlarını ayrı katmanda işaretleyin. " + DOSYA] },
      { baslik: "Fiyat ve Teslimat", paragraflar: ["Fiyatı ebat, kaplama ve adet kademesi belirler. " + FIYAT, TESLIM("5-7 iş günü")] },
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

for (const [slug, icerik] of Object.entries(ICERIK)) {
  const metin = JSON.stringify(icerik).replace(/1\.500 ₺/g, "");
  if (/\d\s?(₺|TL)\b/.test(metin)) { console.error(`✗ ${slug}: içerikte sabit TL rakamı var`); process.exit(1); }
  if (icerik.faqs.length < 6 || icerik.faqs.length > 8) { console.error(`✗ ${slug}: SSS sayısı 6-8 olmalı (${icerik.faqs.length})`); process.exit(1); }
  for (const b of icerik.seoBolumler) if (!b.baslik || !b.paragraflar?.length) { console.error(`✗ ${slug}: boş bölüm`); process.exit(1); }
  if (icerik.seo.title.length > 80 || icerik.seo.description.length > 175) console.warn(`! ${slug}: title ${icerik.seo.title.length} / description ${icerik.seo.description.length} karakter`);
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };
const kategoriler = await fetch(`${API}/api/categories`).then((r) => r.json()).then((j) => (Array.isArray(j) ? j : j.items ?? []));

let ok = 0, hata = 0;
for (const [slug, icerik] of Object.entries(ICERIK)) {
  const cat = kategoriler.find((c) => c.slug === slug);
  if (!cat) { console.warn(`- ${slug}: aktif kategori listesinde yok, atlandı`); continue; }
  const mevcut = cat.content && typeof cat.content === "object" ? cat.content : {};
  const yeniContent = { ...mevcut, ...icerik };
  const ozet = `seoBölüm:${icerik.seoBolumler.length} sss:${icerik.faqs.length} title:${icerik.seo.title.length}k desc:${icerik.seo.description.length}k`;
  if (DRY) { console.log(`[DRY] ${slug} → ${ozet}`); continue; }
  const res = await fetch(`${API}/api/categories/${cat.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ content: yeniContent }) });
  if (!res.ok) { console.error(`✗ ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  const kontrol = await fetch(`${API}/api/categories`).then((r) => r.json()).then((j) => (Array.isArray(j) ? j : j.items ?? []).find((c) => c.slug === slug));
  if (!kontrol?.content?.seoBolumler?.length) { console.error(`✗ ${slug}: PATCH 200 döndü ama içerik YAZILMADI`); hata++; continue; }
  console.log(`✓ ${slug} güncellendi ve doğrulandı — ${ozet}`);
  ok++;
}
console.log(`\nÖzet — güncellenen: ${ok} · hata: ${hata}`);
