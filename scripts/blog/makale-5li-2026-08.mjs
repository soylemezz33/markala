#!/usr/bin/env node
/**
 * 5 SEO makalesi — GSC'de zayıf/fırsat kelimelere ve Ads'te SATIŞ GETİRDİĞİ KANITLI
 * kelimelere hedefli (2026-08-24). Hedef gerekçeleri:
 *   - yelken bayrak: organik #43-46, Ads'ten 1.755 TL sipariş geldi (kanıtlı talep)
 *   - branda: "branda baskı" Ads'te 3 sipariş getirdi; organik branda afiş #34
 *   - el ilanı/broşür: organik #58 (gerileyen küme), rehbere destek içeriği
 *   - GES: organik #6,5 niş kazanım, 48 ürünlük kategori
 *   - asansör levhaları: Ads arama terimi (tıklanıyor), İSG kümesine destek
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/blog/makale-5li-2026-08.mjs
 * Tekrar çalıştırmak güvenli: slug zaten varsa atlanır.
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const KAT = {
  rehber: "cmqdrw6w8003fnhx89amxq7ld",
  baskiRehberi: "cmrhygea10000udgx3efnabrq",
  karsilastirma: "cmqdrw6wo003gnhx8rr5e40no",
  sektor: "cmqdrw6x2003hnhx8xx0zhcgu",
};

const MAKALELER = [
  {
    slug: "yelken-bayrak-olculeri-ve-secim-rehberi",
    title: "Yelken Bayrak Ölçüleri ve Seçim Rehberi: Damla mı, Yelken mi?",
    categoryId: KAT.rehber,
    seoTitle: "Yelken Bayrak Ölçüleri ve Seçim Rehberi — Damla mı Yelken mi?",
    seoDescription:
      "Yelken bayrak formları (damla, yelken, dikdörtgen), ölçü seçimi, standlı-standsız fark ve çift taraflı baskı. İşletme önü için doğru bayrağı seçin.",
    excerpt:
      "Cafe, mağaza ve ofis önlerinin vazgeçilmezi yelken bayraklarda form, ölçü ve stand seçimi nasıl yapılır? Damla, yelken ve dikdörtgen formların farkları bu rehberde.",
    tags: ["yelken bayrak", "reklam bayrağı", "dış mekan reklam"],
    content: `<p>İşletme önü görünürlüğünde en yüksek etki/maliyet oranına sahip ürünlerden biri yelken bayraktır: rüzgârda hareket ettiği için gözü yakalar, kaldırımda metrelerce öteden okunur ve tabelaya göre çok daha ekonomiktir. Bu rehberde form, ölçü ve stand seçimini adım adım anlatıyoruz.</p>

<h2>Yelken bayrak formları: damla, yelken, dikdörtgen</h2>
<p>Üç temel form vardır ve seçim büyük ölçüde tasarımınıza ve rüzgâr koşullarınıza bağlıdır:</p>
<ul>
<li><strong>Damla (gözyaşı):</strong> Kumaş her zaman gergin durur; rüzgârsız havada bile tasarımın tamamı okunur. Logo ve kısa mesaj için en garantili formdur.</li>
<li><strong>Yelken (kavisli):</strong> En yaygın form. Yüksekliği sayesinde uzaktan görünürlüğü en iyi olandır; alt kısmı rüzgârda hafifçe dalgalanır.</li>
<li><strong>Dikdörtgen:</strong> En geniş baskı alanını sunar; fiyat listesi, kampanya gibi daha çok metin içeren tasarımlara uygundur.</li>
</ul>

<h2>Ölçü nasıl seçilir?</h2>
<p>Temel kural: bayrağın okunacağı mesafe arttıkça yükseklik de artmalıdır. Kaldırımdan geçen yaya hedefleniyorsa orta boylar yeterlidir; araç trafiğinden görünmek istiyorsanız en yüksek ölçüye çıkın. Bayrağın konulacağı yerde tente, saçak ve elektrik hattı yüksekliğini mutlaka ölçün — en sık yapılan hata, bayrağın saçağa çarpmasıdır. Güncel ölçü seçenekleri ve KDV dahil fiyatlar <a href="/kategori/yelken-bayrak">yelken bayrak sayfasındaki</a> konfigüratörde anlık hesaplanır.</p>

<h2>Standlı mı standsız mı?</h2>
<p>Zemine göre seçim yapın: beton/asfalt üzerinde su veya kum doldurulan <strong>rozet (baza) standlar</strong> kullanılır; toprak ve çim zeminde <strong>toprak vidası</strong> yeterlidir. Rüzgârlı bölgelerde su bazası + beton plaka kombinasyonu devrilmeyi önler. Direkler demonte (parçalı) gelir; kargoyla sorunsuz taşınır ve araçta rahat yer kaplar.</p>

<h2>Tek taraflı mı, çift taraflı baskı mı?</h2>
<p>Tek taraflı baskıda tasarım arka yüzde aynadan (ters) görünür — logo ağırlıklı tasarımlarda çoğu işletme için yeterlidir. Yazı ve fiyat içeren tasarımlarda her iki yönden gelen yayaların da okuyabilmesi için <strong>çift taraflı baskı</strong> önerilir. İki seçenek de <a href="/kategori/yelken-bayrak">ürün sayfasında</a> mevcuttur.</p>

<h2>Yelken bayrak mı, kırlangıç bayrak mı?</h2>
<p>Kırlangıç bayrak daha küçük, direğe dikey asılan üçgen formdur; açılış ve kampanya duyurusu gibi kısa süreli, çok noktalı kullanım için ekonomiktir. Kalıcı işletme önü görünürlüğünde ise yelken bayrak dayanıklılığı ve boyu ile öne çıkar. <a href="/kategori/kirlangic-bayrak">Kırlangıç bayrak seçeneklerine buradan</a> bakabilirsiniz.</p>

<h2>Sık sorulanlar</h2>
<p><strong>Dış mekânda ne kadar dayanır?</strong> Kumaş bayraklar güneş ve rüzgâra maruz kaldıkça yıpranır; yoğun kullanımda sezonluk yenileme yaygındır. <strong>Yıkanır mı?</strong> Düşük ısıda elde yıkanabilir; kurutma makinesi önerilmez. <strong>Kargoyla gelir mi?</strong> Evet — kumaş katlanır, direk parçalı gönderilir; Türkiye geneline kargolanır.</p>

<p>İşletmenize uygun formu seçtiyseniz <a href="/kategori/yelken-bayrak">yelken bayrak modellerini inceleyin</a>; tasarımınız yoksa sipariş sırasında tasarım desteği isteyebilirsiniz.</p>`,
  },
  {
    slug: "branda-afis-olcusu-nasil-secilir-440-510-gr",
    title: "Branda Afiş Ölçüsü Nasıl Seçilir? 440 gr mı 510 gr mı?",
    categoryId: KAT.baskiRehberi,
    seoTitle: "Branda Afiş Ölçüsü Nasıl Seçilir? 440 gr mı 510 gr mı?",
    seoDescription:
      "Branda afiş için doğru ölçü, gramaj (440/510 gr) ve montaj seçimi: cephe ölçme, kuşgözü aralığı, gözenekli branda ne zaman gerekir? Pratik rehber.",
    excerpt:
      "Cepheye, inşaat iskelesine veya panoya asılacak branda afişte ölçü nasıl belirlenir, 440 gr ile 510 gr malzeme farkı nedir, montajda nelere dikkat edilir?",
    tags: ["branda baskı", "branda afiş", "vinil branda"],
    content: `<p>Branda afiş, dış mekân reklamının iş atı: metrekare maliyeti düşük, ömrü uzun, uygulama alanı neredeyse sınırsız. Ama sipariş verirken üç kararı doğru vermek gerekir: <strong>ölçü, gramaj ve montaj detayı</strong>. Bu rehber üçünü de netleştirir.</p>

<h2>1. Ölçüyü yerinden alın, yuvarlamayın</h2>
<p>Branda asılacağı yere göre üretilir; standart ebat zorunluluğu yoktur. Cephe, balkon korkuluğu veya iskele neresi ise <strong>gerçek en × boy ölçüsünü şerit metreyle alın</strong> ve santimetre cinsinden sipariş verin. İki pratik kural:</p>
<ul>
<li>Gergi payı için brandayı asılacak alandan 5-10 cm küçük tutmak montajı kolaylaştırır.</li>
<li>Okunabilirlik için ana başlık harf yüksekliği kabaca "okunma mesafesi (m) / 2 = harf boyu (cm)" hesabıyla seçilebilir: 20 metreden okunacak başlık için ~10 cm harf.</li>
</ul>
<p>Metrekare fiyatının nasıl hesaplandığını <a href="/rehber/branda-baski-m2-fiyati-2026">branda m² fiyat rehberinde</a> tablolu anlattık; sipariş sayfasında en-boy girdiğinizde KDV dahil tutar anlık görünür.</p>

<h2>2. Gramaj: 440 gr mı, 510 gr mı?</h2>
<ul>
<li><strong>440 gr:</strong> Standart tercih. Kısa-orta vadeli kampanyalar, cephe afişleri ve iç mekân kullanımı için ideal denge: hafif, ekonomik, baskı kalitesi yüksek.</li>
<li><strong>510 gr:</strong> Daha sık dokunmuş, ağır malzeme. Uzun süre asılı kalacak brandalar, rüzgâr yükü yüksek cepheler ve tekrar tekrar sökülüp kurulacak işler için doğru seçimdir.</li>
</ul>
<p>Kısa ömürlü kampanya afişine 510 gr ödemek gereksiz; yıllarca asılı kalacak tabela niteliğindeki brandada 440 gr'a gitmek ise yanlış ekonomidir.</p>

<h2>3. Rüzgâr alan yerde gözenekli (mesh) düşünün</h2>
<p>Yüksek katlı cephe ve iskele giydirmelerinde rüzgâr, branda üzerinde ciddi yük oluşturur. Gözenekli (mesh) branda rüzgârı içinden geçirir; yırtılma ve bağlantı noktası kopması riskini büyük ölçüde azaltır. Hangi durumda hangisinin seçileceğini <a href="/blog/vinil-branda-mi-mesh-branda-mi">vinil mi mesh mi karşılaştırmasında</a> ayrıntılı yazdık.</p>

<h2>4. Montaj: kuşgözü (halka) düzeni</h2>
<p>Branda kenarlarına çakılan metal halkalara kuşgözü denir; ip veya plastik kelepçe buradan geçer. Standart uygulama kenar çevresince yaklaşık 50 cm aralıktır; rüzgârlı noktalarda aralığı sıklaştırmak gerginliği artırır. Köşelerden başlayarak çaprazlama gerdirin — tek kenardan başlarsanız branda potluk yapar.</p>

<h2>Sipariş ve teslim</h2>
<p>Tasarım dosyanız hazırsa yükleyin; yoksa sipariş sırasında tasarım desteği isteyebilirsiniz. Branda katlanarak ya da rulo hâlinde paketlenir ve Türkiye geneline kargolanır. Güncel malzeme ve fiyat seçenekleri için <a href="/kategori/vinil-branda-afis">vinil branda afiş sayfasına</a> göz atın.</p>`,
  },
  {
    slug: "el-ilani-mi-brosur-mu-hangisi-ne-zaman",
    title: "El İlanı mı Broşür mü? Farkları ve Hangisinin Ne Zaman Kullanılacağı",
    categoryId: KAT.karsilastirma,
    seoTitle: "El İlanı mı Broşür mü? Fark Nedir, Hangisi Ne Zaman?",
    seoDescription:
      "El ilanı ile broşür arasındaki fark: yaprak-katlama, ebat (A4/A5/A6), maliyet ve kullanım senaryoları. Kampanyanıza hangisinin uyduğunu 3 soruda belirleyin.",
    excerpt:
      "İkisi de kâğıda basılır ama işleri farklıdır: el ilanı hızlı ve ucuz duyurunun, broşür ise ikna eden anlatımın aracıdır. Farkları ve seçim kriterlerini derledik.",
    tags: ["el ilanı", "broşür baskı", "matbaa"],
    content: `<p>"El ilanı ile broşür aynı şey değil mi?" — matbaada en sık duyduğumuz sorulardan. İkisi de kâğıda basılır ama görevleri, maliyetleri ve tasarım mantıkları farklıdır. Yanlış seçim, ya gereksiz maliyet ya da etkisiz kampanya demektir.</p>

<h2>Tanım farkı: yaprak ve katlama</h2>
<ul>
<li><strong>El ilanı (flyer):</strong> Tek yaprak, katlamasız üründür. A5 ve A6 en yaygın ebatlardır; tek veya çift yüz basılır. Amacı tek bakışta mesaj iletmektir: açılış, indirim, etkinlik.</li>
<li><strong>Broşür:</strong> Katlamalı üründür — iki katlama (6 sayfa) ya da üç katlama (8 sayfa yüzü) yaygındır. Amacı anlatmaktır: ürün yelpazesi, hizmet detayı, fiyat listesi, menü.</li>
</ul>

<h2>3 soruda doğru seçim</h2>
<p><strong>1) Mesajınız kaç saniyede anlaşılmalı?</strong> Sokakta elden dağıtılacak, 3 saniyede "ne-nerede-ne kadar" demesi gereken mesaj için el ilanı. Müşterinin eline alıp inceleyeceği, masasında duracak içerik için broşür.</p>
<p><strong>2) Kaç bilgi bloğunuz var?</strong> Tek kampanya, tek fiyat, tek adres → el ilanı. Birden çok ürün grubu, hizmet listesi, sık sorulan sorular → broşürün katlama yüzleri tam bunun için vardır: her yüz bir konu.</p>
<p><strong>3) Bütçe ve adet dengeniz ne?</strong> Aynı tirajda el ilanı her zaman daha ekonomiktir (daha küçük kâğıt, katlama işlemi yok). Geniş alana dağıtım (site posta kutuları, cadde dağıtımı) yapılacaksa el ilanının adet avantajı belirleyicidir. Ebat ve tiraja göre güncel rakamlar için <a href="/rehber/brosur-baski-fiyatlari-2026">broşür ve el ilanı fiyat rehberine</a> bakın.</p>

<h2>İkisinin de ortak kuralları</h2>
<ul>
<li>Kuşe kâğıtta mat yüzey yazı okunurluğunda, parlak yüzey görsel canlılığında avantajlıdır.</li>
<li>Tasarım dosyası CMYK ve 300 dpi olmalı; kenarlardan 2 mm taşma payı bırakılmalıdır.</li>
<li>Kampanyalarda mutlaka tek bir eylem çağrısı kullanın: telefon, adres veya QR kod — hepsi birden değil.</li>
</ul>

<h2>Üçüncü bir seçenek: kapı askılı broşür</h2>
<p>Elden dağıtım ekibiniz yoksa <a href="/kategori/kapi-aski-brosur">kapı askılı broşür</a> pratik bir alternatiftir: kapı koluna asılır, çöpe gitme oranı klasik el ilanına göre düşüktür. Otel oda bilgilendirmeleri ve site içi duyurularda da yaygındır.</p>

<p>Kararınızı verdiyseniz <a href="/kategori/brosur">broşür ve el ilanı seçeneklerini inceleyin</a> — ebat, kâğıt ve tiraj seçiminizle KDV dahil fiyat anlık hesaplanır, siparişiniz Türkiye geneline kargolanır.</p>`,
  },
  {
    slug: "ges-uyari-etiketleri-gunes-santrali-zorunlu-isaretler",
    title: "GES Uyarı Etiketleri: Güneş Enerji Santralinde Zorunlu İşaretler",
    categoryId: KAT.sektor,
    seoTitle: "GES Uyarı Etiketleri — Güneş Santralinde Zorunlu İşaretler",
    seoDescription:
      "Çatı ve arazi GES kurulumlarında kullanılan uyarı etiketleri: PV üreteç levhası, çift besleme uyarısı, DC hat ve topraklama işaretleri. Sektör rehberi.",
    excerpt:
      "Güneş enerji santrallerinde etiketleme estetik değil güvenlik meselesidir: itfaiyeci çatıya çıktığında sistemin gün ışığında gerilim üretmeye devam ettiğini etiketten öğrenir.",
    tags: ["ges", "güneş enerjisi", "isg levhaları", "pv etiket"],
    content: `<p>Güneş enerji santralleri (GES) yaygınlaştıkça kurulumcuların en çok atladığı kalemlerden biri etiketleme oluyor. Oysa GES etiketleri kozmetik değil, <strong>can güvenliği bileşenidir</strong>: yangına müdahale eden itfaiyeci, bakım yapan elektrikçi veya çatıya çıkan usta, sistemin özelliklerini bu etiketlerden öğrenir.</p>

<h2>Neden bu kadar kritik?</h2>
<p>Fotovoltaik sistemlerin diğer elektrik tesisatlarından temel farkı şudur: <strong>şalteri kapatsanız bile paneller gün ışığı aldığı sürece gerilim üretmeye devam eder</strong>. Bu yüzden "elektriği kestim, güvendeyim" varsayımı GES'lerde geçerli değildir — ve bu bilginin sahada görünür olmasının tek yolu doğru etiketlemedir.</p>

<h2>Tipik bir GES kurulumunda bulunması gereken işaretler</h2>
<ul>
<li><strong>Çatıda PV üreteç levhası:</strong> Binaya müdahale edecek ekiplere çatıda fotovoltaik sistem olduğunu bildirir; bina girişine ve pano yanına asılır.</li>
<li><strong>"Gün ışığı boyunca gerilim altında" / çarpılma riski uyarısı:</strong> PV modül ve DC hat güzergâhındaki en kritik uyarıdır.</li>
<li><strong>Çift besleme uyarısı:</strong> Hem şebeke hem PV beslemesi olan panolarda, tek şalterle enerjinin kesilemeyeceğini belirtir.</li>
<li><strong>DC/AC kablo ve pano etiketleri:</strong> İnvertör, sigorta ve kesici noktalarının hızlı ayırt edilmesini sağlar.</li>
<li><strong>Topraklama işaretleri:</strong> Topraklama baralarının ve bağlantı noktalarının işaretlenmesi hem mevzuat hem saha güvenliği gereğidir — ayrıntılar için <a href="/blog/topraklama-isareti-sembolu-anlami-kullanim">topraklama işareti rehberimize</a> bakın.</li>
<li><strong>Yetkisiz giriş ve genel İSG levhaları:</strong> Arazi GES'lerinde saha çevresi için "yetkisiz girilmez", "yüksek gerilim" ve yönlendirme levhaları gerekir.</li>
</ul>

<h2>Malzeme seçimi: dış mekânda solmayan etiket</h2>
<p>GES etiketleri yıllarca güneş altında kalır — sıradan kâğıt etiket aylar içinde okunmaz hâle gelir. Dış mekân için UV dayanımlı yapışkanlı folyo, pano ve konstrüksiyon üzeri için dekota levha tercih edilir. <a href="/kategori/is-guvenligi-ges">GES etiket ve levha kategorimizdeki</a> tüm ürünlerde malzeme ve ebat seçenekleri ürün sayfasında listelenir.</p>

<h2>Renk kodları hangi anlama gelir?</h2>
<p>İş güvenliği işaretlerinde renk dili standarttır: sarı uyarı, kırmızı yasak/tehlike, mavi zorunluluk, yeşil güvenli alan bildirir. Bu sistemin tamamını <a href="/rehber/isg-zorunlu-uyari-levhalari">İSG uyarı levhaları rehberinde</a> işyeri tipine göre listeledik.</p>

<p>Kurulum firmasıysanız proje bazlı toplu etiket ihtiyaçları için teklif alabilirsiniz; tek santral için sipariş veriyorsanız <a href="/kategori/is-guvenligi-ges">kategorideki hazır setlerden</a> seçim yapmanız yeterli. Tüm etiketler Türkiye geneline kargolanır.</p>`,
  },
  {
    slug: "asansor-uyari-levhalari-hangileri-zorunlu",
    title: "Asansör Uyarı Levhaları: Hangileri Zorunlu, Nereye Asılır?",
    categoryId: KAT.sektor,
    seoTitle: "Asansör Uyarı Levhaları — Hangileri Zorunlu, Nereye Asılır?",
    seoDescription:
      "Asansörlerde bulunması gereken uyarı levhaları: yangında asansörü kullanmayın, kullanma talimatı, kapasite etiketi ve şantiye asansörü uyarıları.",
    excerpt:
      "Yangında asansörü kullanmayın levhasından kullanma talimatına: bina yöneticileri, işletmeler ve şantiyeler için asansör etiketleme rehberi.",
    tags: ["asansör levhası", "isg levhaları", "bina yönetimi"],
    content: `<p>Asansör uyarı levhaları; bina yöneticilerinin, işletme sahiplerinin ve şantiye şeflerinin sorumluluk alanındaki en küçük ama en kritik kalemlerden biridir. Acil durumda doğru davranışı saniyeler içinde hatırlatan tek araç, kabin yanındaki o levhadır.</p>

<h2>1. "Yangın halinde asansörü kullanmayın"</h2>
<p>En bilinen ve en kritik asansör uyarısıdır. Yangında asansör kuyusu baca etkisiyle duman çeker ve elektrik kesintisinde kabin katlar arasında kalabilir — bu yüzden yangında tahliye her zaman merdivenle yapılır. Levha, <strong>her katta asansör çağrı butonunun yanına</strong> asılır; acil durum işaretlerinde karanlıkta görünürlük için fotolümenli (karanlıkta parlayan) malzeme tercih edilebilir. <a href="/urun/yangin-halinde-asansoru-kullanma">Yangın halinde asansörü kullanma levhasına buradan</a> ulaşabilirsiniz.</p>

<h2>2. Asansör kullanma talimatı</h2>
<p>Kabin içine veya kat girişine asılan talimat levhası; kapasite aşımı, çocukların yalnız binmemesi, sıkışma durumunda alarm butonu kullanımı gibi temel kuralları listeler. Konut siteleri ve iş merkezlerinde yönetimin sorumluluğundadır. <a href="/urun/asansor-kullanma-talimati">Asansör kullanma talimatı levhası</a> hazır içerikle basılır.</p>

<h2>3. Kapasite ve kişi sayısı bilgisi</h2>
<p>Kabin içinde taşıma kapasitesinin (kg ve kişi sayısı) görünür olması gerekir. Bakım firmanızın taktığı etiket yıpranmış ya da okunmaz hâle gelmişse yenilenmesi yönetimin sorumluluğundadır.</p>

<h2>4. Şantiye ve yük asansörü uyarıları</h2>
<p>İnşaat sahalarında insan ve yük asansörleri için ek uyarılar devreye girer: <a href="/urun/asansore-baretsiz-binmeyin">"Asansöre baretsiz binmeyin"</a> levhası bunun tipik örneğidir. Şantiyede ayrıca yük sınırı, yetkisiz kullanım yasağı ve bakım/arıza etiketleri bulundurulur — arıza hâlinde kabin girişine <a href="/urun/arizalidir">"Arızalıdır" levhası</a> asılmalıdır.</p>

<h2>Malzeme ve montaj önerisi</h2>
<p>Bina içi kullanımda yapışkanlı folyo (sticker) pratik ve ekonomiktir; dış cephe ve şantiye koşullarında dekota levha dayanıklılık sağlar. Acil durum işaretlerinde fotolümenli seçenek, elektrik kesintisinde de görünürlük sağladığı için tercih sebebidir. Renk kodlarının anlamı ve işyeri tipine göre zorunlu levha listeleri için <a href="/rehber/isg-zorunlu-uyari-levhalari">İSG uyarı levhaları rehberimize</a> bakabilirsiniz.</p>

<p>Tüm asansör ve bina güvenliği levhalarını <a href="/kategori/is-guvenligi-uyari-ikaz">İSG uyarı-ikaz kategorisinde</a> malzeme ve ebat seçenekleriyle bulabilirsiniz; siparişler Türkiye geneline kargolanır.</p>`,
  },
];

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) { console.error(`Giriş başarısız: ${res.status}`); process.exit(1); }
  const j = await res.json();
  return j.accessToken || j.access_token || j.token;
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

let ok = 0, atlandi = 0, hata = 0;
for (const m of MAKALELER) {
  // slug zaten yayında mı? (public uç ile kontrol)
  const varMi = await fetch(`${API}/api/blog/posts/${m.slug}`).then((r) => r.ok).catch(() => false);
  if (varMi) { console.log(`- atlandı (zaten var): ${m.slug}`); atlandi++; continue; }

  const res = await fetch(`${API}/api/blog/posts`, {
    method: "POST", headers: H,
    body: JSON.stringify({ ...m, authorName: "Markala Ekibi", status: "draft" }),
  });
  if (!res.ok) { console.error(`✗ ${m.slug}: ${res.status} ${(await res.text()).slice(0, 200)}`); hata++; continue; }
  const post = await res.json();

  const pub = await fetch(`${API}/api/blog/posts/${post.id}/publish`, { method: "POST", headers: H });
  if (!pub.ok) { console.error(`✗ ${m.slug}: publish ${pub.status}`); hata++; continue; }
  console.log(`✓ yayınlandı: /blog/${m.slug}`);
  ok++;
}
console.log(`\nÖzet — yayınlanan: ${ok} · atlanan: ${atlandi} · hata: ${hata}`);
if (ok > 0) console.log("ISR 60sn — makaleler en geç 1 dk içinde canlıda.");
