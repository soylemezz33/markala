/**
 * Blog içerik seed'i — ilk SEO yazıları + "Baskı Rehberi" kategorisi.
 * Idempotent: kategori ve yazılar slug'a göre upsert edilir; tekrar çalıştırmak güvenlidir.
 * Çalıştır: cd apps/api && npx tsx prisma/seed-blog.ts
 *
 * İçerik formatı: storefront blog/[slug] sayfasındaki renderMarkdown ile uyumlu markdown
 * (## / ### başlık, - liste, | tablo, **kalın**, [metin](url)). Ham HTML kaçışlanır.
 * Yazılar YAYINLANMIŞ (published) doğar; admin panelinden düzenlenebilir/geri çekilebilir.
 */
import { PrismaClient, BlogStatus } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHOR = { name: "Hasan Söylemez", role: "324 Ajans · Marka Yöneticisi" };
const CATEGORY = {
  slug: "baski-rehberi",
  name: "Baskı Rehberi",
  description: "Kartvizit, broşür, branda ve matbaa ürünlerinde doğru seçim için pratik rehberler.",
  sortOrder: 1,
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  content: string;
};

const POSTS: Post[] = [
  {
    slug: "kartvizit-tasariminda-10-altin-kural",
    title: "Kartvizit Tasarımında 10 Altın Kural",
    excerpt:
      "İyi bir kartvizit ilk izlenimi belirler. Baskıya gitmeden önce bilmeniz gereken 10 temel kuralı, matbaa gözünden anlattık.",
    seoTitle: "Kartvizit Tasarımında 10 Altın Kural | Markala",
    seoDescription:
      "Kartvizit tasarımı yaparken dikkat edilmesi gereken 10 kural: taşma payı, güvenli alan, font boyutu, CMYK, gramaj ve daha fazlası. Baskıya hazır kartvizit rehberi.",
    tags: ["kartvizit", "tasarım", "baskı rehberi"],
    content: `Kartvizit, çoğu işletmenin ilk fiziksel temas noktasıdır. Küçük bir karton parçası gibi görünse de tasarımdaki bir hata baskıda büyür. Aşağıdaki 10 kural, kartvizitinizin hem şık görünmesini hem de matbaadan sorunsuz çıkmasını sağlar.

## 1. Taşma payı (bleed) bırakın
Zemin rengi ya da görsel kenara kadar gidiyorsa, tasarımı her kenardan 2 mm dışarı taşırın. Kesim sırasında oluşan milimetrik kaymalarda kenarda beyaz çizgi kalmasını bu önler.

## 2. Önemli ögeleri güvenli alanda tutun
Yazı ve logoyu kenardan en az 3 mm içeride bırakın. Kesim toleransı nedeniyle kenara yapışık metinler kırpılabilir.

## 3. Renk uzayı CMYK olsun
Ekran RGB ile çalışır, matbaa CMYK ile basar. RGB dosya gönderirseniz renkler baskıda %15-30 sönük çıkabilir. Tasarımı baştan CMYK modunda hazırlayın.

## 4. Çözünürlük 300 DPI
Baskıya girecek tüm görseller 300 DPI olmalı. Web'den alınan 72 DPI görseller baskıda pikselli görünür.

## 5. Font boyutunu küçültmeyin
Kartvizitte 6 puntonun altındaki yazılar okunmaz ve baskıda dağılabilir. İsim ve iletişim bilgilerini en az 7-8 puntoda tutun.

## 6. Gereğinden fazla bilgi koymayın
İsim, unvan, telefon, e-posta, bir adres ve bir web/sosyal hesap yeter. Kalabalık kart, mesajı zayıflatır.

## 7. Gramajı işine göre seç
Standart kartvizit için 300-350 gr, daha prestijli bir his için 400 gr tercih edilir. Gramaj konusunu ayrı yazımızda detaylandırdık: [Kartvizit Kağıt Gramajı](/blog/kartvizit-kagit-gramaji-350-mi-400-mu).

## 8. Selefon kararını baştan ver
Mat selefon parmak izi göstermez, şık durur; parlak selefon renkleri canlandırır. Selefon aynı zamanda kartı neme ve çizilmeye karşı korur.

## 9. Çift yön mü tek yön mü?
Arka yüzü boş bırakmak yerine slogan, harita ya da bir kampanya notu ekleyin. Çift yön baskı, kartvizitin değerini artırır.

## 10. Baskı öncesi provayı onaylayın
Son dosyayı büyüterek yazım hatalarını, hizaları ve renkleri kontrol edin. Baskı başladıktan sonra düzeltme mümkün olmaz.

## Hazır mısınız?
Bu kuralları uyguladıysanız kartvizitiniz baskıya hazır demektir. Tasarımınız yoksa ücretsiz şablonlarımızdan başlayabilir veya [Klasik Kartvizit](/urun/klasik-kartvizit) ürününden sipariş verebilirsiniz. Kurumsal işler için [teklif alın](/teklif-al).`,
  },
  {
    slug: "kartvizit-kagit-gramaji-350-mi-400-mu",
    title: "Kartvizit Kağıt Gramajı: 350 gr mı, 400 gr mı?",
    excerpt:
      "Kartvizit gramajı kalınlığı ve his değerini belirler. 300, 350 ve 400 gr arasındaki farkları ve hangi işe hangisinin uygun olduğunu anlattık.",
    seoTitle: "350 gr mı 400 gr mı? Kartvizit Kağıt Gramajı Rehberi | Markala",
    seoDescription:
      "Kartvizit kağıt gramajı 300, 350, 400 gr farkı nedir? Hangi gramaj hangi iş için uygun? Selefon ve kabartma ile gramaj ilişkisi — matbaa rehberi.",
    tags: ["kartvizit", "kağıt gramajı", "baskı rehberi"],
    content: `Kartvizit sipariş ederken en çok sorulan sorulardan biri: "Kaç gram kağıt seçmeliyim?" Gramaj (gr/m²) kağıdın kalınlığını ve dolayısıyla kartın eldeki his değerini belirler. İşte pratik bir rehber.

## Gramaj neyi değiştirir?
Gramaj arttıkça kart kalınlaşır, daha sağlam ve prestijli hissedilir. Ama aşırı kalın kağıt bazı kartlıklara sığmayabilir ve maliyeti artırır. Amaç, işinize uygun dengeyi bulmaktır.

## Gramajlara göre kullanım
| Gramaj | His | Uygun olduğu iş |
|---|---|---|
| 300 gr | Standart, ekonomik | Yoğun dağıtılan kartlar, kampanya |
| 350 gr | Dolgun, dengeli | Genel kurumsal kullanım (en popüler) |
| 400 gr | Kalın, prestijli | Avukat, mimar, üst düzey yönetici, VIP |

## 350 gr: güvenli orta yol
Çoğu işletme için 350 gr ideal noktadır. Yeterince dolgun durur, cüzdanda kolay taşınır ve maliyeti makuldür. Kararsızsanız 350 gr ile yanılmazsınız.

## 400 gr: prestij hissi
Kartın "ağırlığı" markanızın ciddiyetini yansıtsın istiyorsanız 400 gr tercih edin. Kabartma (kabartma lak) veya altın yaldız gibi özel uygulamalarla birleştiğinde etkisi katlanır.

## Selefon ve gramaj birlikte çalışır
Selefon kaplama, kağıdın algılanan kalitesini yükseltir. 350 gr + mat selefon kombinasyonu, çıplak 400 gr'dan çoğu zaman daha premium hissedilir. Yani sadece gramaja değil, yüzey işlemine de bakın.

## Özet
- Bütçe öncelikliyse ve kart çok dağıtılacaksa: **300 gr**
- Genel kurumsal kullanım: **350 gr** (önerilen)
- Prestij ve kalıcı izlenim: **400 gr**

Dosya hazırlığı konusunda emin değilseniz [Baskıya Hazır Dosya Nasıl Hazırlanır](/blog/baskiya-hazir-dosya-nasil-hazirlanir) yazımıza göz atın. Hazırsanız [Klasik Kartvizit](/urun/klasik-kartvizit) sayfasından gramaj ve selefon seçeneklerini konfigüratörde deneyebilirsiniz.`,
  },
  {
    slug: "baskiya-hazir-dosya-nasil-hazirlanir",
    title: "Baskıya Hazır Dosya Nasıl Hazırlanır? (CMYK, 300 DPI, Taşma Payı)",
    excerpt:
      "Baskıda renk kayması, pikselli görsel veya kırpılmış yazı istemiyorsanız dosyanızı doğru hazırlamalısınız. Adım adım baskıya hazır dosya rehberi.",
    seoTitle: "Baskıya Hazır Dosya Nasıl Hazırlanır? CMYK & 300 DPI | Markala",
    seoDescription:
      "Baskıya hazır dosya nasıl hazırlanır? CMYK renk uzayı, 300 DPI çözünürlük, 2 mm taşma payı, güvenli alan ve PDF çıktısı — adım adım matbaa rehberi.",
    tags: ["dosya hazırlama", "cmyk", "baskı rehberi"],
    content: `Baskıya giden bir dosyadaki hata, ekranınızda fark edilmese de basılan binlerce üründe ortaya çıkar. Bu rehber, dosyanızı sorunsuz baskıya hazırlamak için gereken her şeyi adım adım anlatır.

## 1. Renk uzayı: CMYK
Web ve ekran RGB kullanır; matbaa ise CMYK mürekkeple basar. Dosyanızı RGB gönderirseniz, özellikle canlı maviler ve yeşiller baskıda sönük çıkar. Tasarım programında belge modunu CMYK seçin.

## 2. Çözünürlük: 300 DPI
Baskıda net görüntü için görseller 300 DPI olmalı. İnternetten indirilen 72 DPI görseller büyütüldüğünde pikselli görünür. Vektörel dosyalar (AI, EPS, SVG) çözünürlükten bağımsızdır ve her ölçekte nettir.

## 3. Taşma payı (bleed): 2 mm
Zemin rengi veya görsel kenara kadar uzanıyorsa, tasarımı her kenardan 2 mm dışarı taşırın. Kesimde oluşan minik kaymalarda kenarda beyaz kalmasını önler.

## 4. Güvenli alan: 3 mm
Önemli yazı ve logoları kenardan en az 3 mm içeride tutun. Kesim toleransı nedeniyle kenara yapışık ögeler kırpılabilir.

## 5. Yazıları eğrilere çevirin (outline)
Kullandığınız fontu matbaa bilgisayarında yoksa yazılar kayabilir. Metinleri "eğriye/outline'a" çevirerek font sorununu tümden ortadan kaldırın.

## 6. Doğru format: baskıya PDF
En güvenli teslim formatı, taşma payı dahil edilmiş yüksek çözünürlüklü PDF'tir. AI ve PSD de kabul edilir; ancak PDF, sürüm ve font sorunlarını en aza indirir.

## Hızlı kontrol listesi
- Belge CMYK modunda mı?
- Görseller 300 DPI mi?
- Her kenarda 2 mm taşma payı var mı?
- Yazılar güvenli alanda ve eğriye çevrili mi?
- Çıktı, taşma paylı PDF olarak mı hazırlandı?

## Yardıma mı ihtiyacınız var?
Tüm bunlar gözünüzü korkuttuysa endişelenmeyin: dosyanızı bize gönderin, baskı öncesi kontrol edip olası sorunları bildirelim. Ayrıntılı teknik anlatım için [Dosya Hazırlama Rehberi](/yardim/dosya-hazirlama) sayfamıza da bakabilirsiniz. Tasarımınız yoksa ücretsiz tasarım desteğimizden yararlanmak için [teklif alın](/teklif-al).`,
  },
  {
    slug: "vinil-branda-mi-mesh-branda-mi",
    title: "Vinil Branda mı, Mesh Branda mı? Doğru Seçim Rehberi",
    excerpt:
      "Dış mekân reklamında yanlış malzeme, rüzgârda yırtılan ya da soluk bir tabelayla sonuçlanır. Vinil ve mesh brandanın farklarını ve nerede hangisini kullanacağınızı anlattık.",
    seoTitle: "Vinil Branda mı Mesh Branda mı? Dış Mekân Baskı Rehberi | Markala",
    seoDescription:
      "Vinil branda ve mesh branda farkı nedir? Rüzgârlı cepheler, bina giydirme, açılış ve etkinlikler için doğru branda seçimi — gramaj ve dayanıklılık rehberi.",
    tags: ["branda", "dış mekan", "baskı rehberi"],
    content: `Bir mağaza açılışı, cephe giydirmesi ya da etkinlik için branda bastıracaksınız. Peki vinil mi, mesh mi? Yanlış seçim, rüzgârda savrulan ya da kısa sürede solan bir tabelayla sonuçlanabilir. İşte pratik karar rehberi.

## Vinil branda nedir?
Vinil (PVC) branda, dolu yüzeyli, dayanıklı ve renkleri canlı gösteren standart dış mekân malzemesidir. Afiş, tabela, açılış brandası ve çoğu genel amaç için ilk tercihtir.

## Mesh branda nedir?
Mesh, üzerinde küçük gözenekler bulunan delikli brandadır. Bu gözenekler rüzgârın brandadan geçmesini sağlar; böylece yüksek katlı binalarda ve rüzgâra açık cephelerde branda savrulmaz, taşıyıcıya yük binmez.

## Hangisini nerede kullanmalı?
| Durum | Önerilen |
|---|---|
| Mağaza içi/dışı tabela, afiş | Vinil |
| Açılış, etkinlik, stant | Vinil |
| Yüksek bina cephesi, iskele giydirme | Mesh |
| Rüzgâra çok açık, açık alan | Mesh |
| Maksimum renk canlılığı gereken görsel | Vinil |

## Gramaj da önemli
Vinil brandalarda 280 gr ekonomik işler için, 440 gr ise uzun ömürlü ve daha opak sonuç için kullanılır. Işıklı kutu harf/pano önünde "ışıklı" özel malzemeler tercih edilir. İhtiyacınıza göre gramaj seçimi maliyeti ve dayanıklılığı doğrudan etkiler.

## Özet
- Renk canlılığı ve genel kullanım istiyorsanız: **vinil branda**
- Rüzgârlı, yüksek cephe ise güvenlik için: **mesh branda**
- Uzun ömür için gramajı yukarı çekin (ör. 440 gr)

Ölçü ve malzemeye göre anlık fiyatı görmek için [Branda / Afiş](/urun/branda-afis) sayfasındaki hesaplayıcıyı kullanabilir, tüm dış mekân seçenekleri için [Vinil & Branda](/kategori/vinil-branda) kategorisine göz atabilirsiniz.`,
  },
  {
    slug: "cmyk-nedir-baskida-renk-modeli",
    title: "CMYK Nedir? Baskıda Doğru Renk Modeli Rehberi",
    excerpt:
      "Ekranda canlı görünen tasarım baskıda neden sönük çıkar? CMYK ile RGB farkını, matbaanın neden CMYK ile bastığını ve Photoshop/Illustrator'da doğru renk ayarını anlattık.",
    seoTitle: "CMYK Nedir? Baskıda Doğru Renk Modeli Rehberi | Markala",
    seoDescription:
      "CMYK nedir, RGB'den farkı ne? Baskıda neden CMYK kullanılır, Photoshop ve Illustrator'da CMYK ayarı nasıl yapılır, en sık renk hataları — matbaa gözünden renk yönetimi rehberi.",
    tags: ["cmyk", "renk yönetimi", "baskı rehberi"],
    content: `Tasarımınız ekranda pırıl pırıl duruyordu ama baskıdan sönük, mavimsi ya da soluk çıktı. Bu, matbaanın en sık karşılaştığı sorundur ve neredeyse her zaman tek bir sebebi vardır: yanlış renk modeli. Bu rehberde CMYK'nın ne olduğunu, RGB'den neden farklı olduğunu ve dosyanızı baskıya doğru renklerle nasıl hazırlayacağınızı adım adım anlatıyoruz.

## CMYK nedir?
CMYK, baskının dört temel mürekkep rengini ifade eder: **C**yan (camgöbeği), **M**agenta (macenta), **Y**ellow (sarı) ve **K**ey (siyah). Matbaa makinesi bu dört rengi üst üste, farklı yoğunluklarda basarak binlerce ara tonu oluşturur. CMYK'ya "eksiltici" (subtractive) renk modeli denir; çünkü kâğıda mürekkep ekledikçe yansıyan ışık azalır ve renk koyulaşır. Dört mürekkebin tamamı yoğun basıldığında sonuç siyaha yaklaşır.

## RGB nedir ve neden ekranların dili?
RGB ise **R**ed (kırmızı), **G**reen (yeşil) ve **B**lue (mavi) ışıklarından oluşur. Ekranlar, telefonlar ve dijital kameralar RGB ile çalışır. Bu model "ekleyici" (additive) çalışır: üç ışığı birlikte açtığınızda beyaz elde edersiniz. RGB, ışık yaydığı için CMYK'dan çok daha geniş ve canlı bir renk aralığı (gamut) gösterebilir. İşte sorun tam da burada başlar.

## CMYK ve RGB arasındaki temel fark
| Özellik | RGB | CMYK |
|---|---|---|
| Nerede kullanılır | Ekran, web, dijital | Baskı, matbaa |
| Renk oluşumu | Işık ekleyerek | Mürekkep ile ışığı eksilterek |
| Renk aralığı | Geniş, canlı | Daha dar |
| Beyaz | Işıkla oluşur | Kâğıdın kendi rengidir |

RGB'nin gösterebildiği bazı canlı renkler (özellikle parlak turkuaz, neon yeşil ve elektrik mavisi) CMYK mürekkeple fiziksel olarak üretilemez. Dosyanızı RGB gönderdiğinizde matbaa yazılımı bu renkleri en yakın CMYK karşılığına çevirir ve işte o "sönükleşme" bu dönüşümde yaşanır.

## Neden baskıda CMYK kullanılır?
Cevap basit: kâğıt ışık yaymaz, ışığı yansıtır. Bir mürekkebi kâğıda koyduğunuzda o mürekkep belirli dalga boylarını emer, kalanını yansıtır ve gözünüz o rengi görür. Bu fiziksel gerçek, baskıyı eksiltici CMYK sistemine mecbur bırakır. Dünyadaki neredeyse tüm ofset ve dijital matbaalar bu dört renk üzerine kuruludur; özel renkler için ayrıca Pantone (spot renk) kullanılır.

## Photoshop'ta CMYK ayarı
Photoshop piksel tabanlı (fotoğraf, raster) çalışır. Doğru yaklaşım şudur:

### Yeni belgede
1. **File > New** ekranında **Color Mode** olarak **CMYK Color** seçin.
2. Çözünürlüğü 300 DPI yapın.

### Mevcut RGB dosyayı çevirirken
1. **Image > Mode > CMYK Color** yolunu izleyin.
2. Dönüşümden sonra canlı renklerin nasıl değiştiğini gözle kontrol edin; gerekiyorsa tonları elle düzeltin.
3. Baskı öncesi **View > Proof Colors** ile CMYK önizlemesini açık tutarak tasarlayın; böylece sürprizle karşılaşmazsınız.

## Illustrator'da CMYK ayarı
Illustrator vektörel (logo, kartvizit, çizim) çalışır ve renk modu belge düzeyinde belirlenir:

1. **File > New** ekranında **Color Mode > CMYK** seçin.
2. Açık bir dosyada modu görmek/değiştirmek için **File > Document Color Mode > CMYK Color**.
3. Renkleri **Swatches** panelinden CMYK değerleriyle tanımlayın; ekrandan pipetle rastgele renk seçmeyin.

## En sık yapılan CMYK hataları
- **RGB dosyayı olduğu gibi göndermek:** En yaygın hata. Sonuç sönük renklerdir.
- **Son anda mod değiştirmek:** Tasarımın tamamını RGB'de bitirip baskıdan hemen önce CMYK'ya çevirmek, ton kayıplarını gizler. Baştan CMYK'da çalışın.
- **Renkli fotoğrafları unutmak:** Belge CMYK olsa bile içine sürüklediğiniz RGB fotoğraf RGB kalabilir. Tüm bağlı görselleri kontrol edin.

## Siyahın tuzağı: %100 K vs zengin siyah
Küçük yazılarda siyahı yalnızca **K %100** ile tanımlayın; aksi halde dört renk üst üste basılınca ince harfler bulanıklaşır. Geniş siyah zeminlerde ise daha derin bir ton için "zengin siyah" (örneğin C40 M30 Y30 K100 civarı) tercih edilir. Bu ayrım, profesyonel baskıyı amatörden ayıran detaylardan biridir.

## Pantone (spot renk) ne zaman gerekir?
CMYK dört mürekkeple çok geniş bir renk yelpazesi üretir; ama bazı renkleri fiziksel olarak karşılayamaz. Markanızın logosunda kesin bir kurumsal renk, metalik bir altın/gümüş ton ya da floresan bir vurgu varsa, bunları CMYK karışımı yerine hazır karışım **Pantone (spot) renk** ile bastırmak gerekir. Spot renk her baskıda birebir aynı tonu garanti eder; bu yüzden kurumsal kimliklerde marka rengi çoğu zaman bir Pantone koduyla tanımlanır. Yalnız her ilave spot renk ayrı kalıp ve masraf demektir; bütçe ile ihtiyacı birlikte değerlendirin.

## Baskı provası neden önemli?
Ekranınız kalibre değilse gördüğünüz renk gerçeği yansıtmaz. İki tür prova vardır: yazılım üzerinden yapılan **yazılımsal prova (soft proof)** ve gerçek makineden/kâğıttan alınan **fiziksel prova (hard proof)**. Renk kritikse (örneğin marka rengi ya da fotoğraf ağırlıklı bir iş), baskı öncesi fiziksel prova istemek, binlerce adedin yanlış basılmasının önüne geçer.

## Kâğıt renginin renge etkisi
CMYK'da beyaz ayrı bir mürekkep değildir; kâğıdın kendi rengidir. Bu yüzden aynı CMYK değerleri parlak beyaz kuşe kâğıtta canlı, kremrengi ya da geri dönüşümlü kâğıtta daha mat ve sıcak görünür. Renk beklentiniz netse kâğıt cinsini baştan belirleyin; çünkü zemin, mürekkebin altından "konuşur".

## Özet
- Ekran **RGB**, matbaa **CMYK** ile çalışır; ikisi aynı renkleri gösteremez.
- Dosyayı **baştan CMYK** modunda hazırlayın, son anda çevirmeyin.
- Küçük yazı siyahı **K %100**, geniş zemin için **zengin siyah** kullanın.

Renk modeli, baskıya hazır dosyanın yalnızca bir parçasıdır. Çözünürlük, taşma payı ve güvenli alan gibi diğer kritik adımlar için [Baskıya Hazır Dosya Nasıl Hazırlanır](/blog/baskiya-hazir-dosya-nasil-hazirlanir) yazımıza göz atın. Renkleriyle emin olmak istediğiniz bir işiniz mi var? Dosyanızı bize gönderin, baskı öncesi renk kontrolünü birlikte yapalım; kurumsal işler için [teklif alın](/teklif-al).`,
  },
  {
    slug: "kurumsal-kartvizit-tasarimi-rehberi",
    title: "Kurumsal Kartvizit Tasarımı: 2024 Rehberi",
    excerpt:
      "Kurumsal bir kartvizit, markanızın cebe giren temsilcisidir. Doğru ölçü, taşma payı, güvenli alan, font boyutu, gramaj ve laminasyon seçimini tek rehberde topladık.",
    seoTitle: "Kurumsal Kartvizit Tasarımı: 2024 Rehberi | Markala",
    seoDescription:
      "Kurumsal kartvizit tasarımı rehberi: 85x55 mm standart ölçü, taşma payı ve güvenli alan, font boyutu, kağıt gramajı ve laminasyon (selefon) seçimi — baskıya hazır kartvizit için.",
    tags: ["kartvizit", "kurumsal", "tasarım", "baskı rehberi"],
    content: `Kurumsal kartvizit, çoğu zaman bir markanın cebe giren tek fiziksel temsilcisidir. Toplantıdan çıkarken bırakılan o küçük karton, e-postadan çok daha uzun süre saklanır. Bu yüzden tasarımı da kurumsal kimliğiniz kadar ciddiye alınmayı hak eder. İşte 2024 için güncel, uçtan uca kartvizit tasarım rehberi.

## Standart kartvizit ölçüleri
Türkiye'de ve dünyada en yaygın kurumsal kartvizit ölçüleri şunlardır:

| Ölçü | Açıklama |
|---|---|
| 85 × 55 mm | Türkiye'nin en yaygın standardı (önerilen) |
| 90 × 50 mm | Avrupa'da sık kullanılan alternatif |
| 85 × 54 mm | Kredi kartı ölçüsü, cüzdana tam oturur |
| 55 × 85 mm | Dikey (portre) kullanım için |

Tasarıma başlarken belgeyi bu net ölçüde açın; sonradan ölçeklemek çözünürlük ve hizalama sorunları çıkarır.

## Taşma payı (bleed) ve güvenli alan
İki kavram kartvizit baskısının kaderini belirler:

- **Taşma payı (bleed):** Zemin rengi veya görsel kenara kadar uzanıyorsa, tasarımı her kenardan **2–3 mm** dışarı taşırın. (Matbaadan matbaaya değişir; bizim standardımız 2 mm'dir, ancak 3 mm de yaygın kabul görür.) Bu pay, kesim sırasındaki milimetrik kaymalarda kenarda beyaz çizgi kalmasını önler.
- **Güvenli alan (safe zone):** İsim, logo ve iletişim bilgisi gibi önemli ögeleri kenardan en az **3 mm** içeride tutun. Kesim toleransı nedeniyle kenara yapışık metinler kırpılabilir.

Kısaca: zemin dışarı taşsın, yazı içeride kalsın.

## Font boyutu ve okunabilirlik
Kartvizit küçük bir yüzeydir; tipografi burada affetmez.

- İsim ve iletişim bilgilerini **en az 7–8 punto** tutun. 6 puntonun altı hem okunmaz hem baskıda dağılır.
- İki fonttan fazlasını karıştırmayın: bir başlık, bir gövde yeter.
- Çok ince (hairline) font ağırlıklarından kaçının; ince çizgiler küçük puntoda baskıda kopar.
- Metin ile zemin arasında yeterli kontrast bırakın; açık gri üstüne beyaz yazı okunmaz.

## Kağıt ve gramaj seçimi
Kartın eldeki his değeri gramajla belirlenir:

| Gramaj | His | Uygun kullanım |
|---|---|---|
| 300 gr | Ekonomik, standart | Yoğun dağıtılan kartlar |
| 350 gr | Dolgun, dengeli | Genel kurumsal kullanım (en popüler) |
| 400 gr | Kalın, prestijli | Üst düzey yönetici, avukat, mimar |

Gramaj seçimini ayrıntılı karşılaştırdığımız [Kartvizit Kağıt Gramajı: 350 gr mı 400 gr mı](/blog/kartvizit-kagit-gramaji-350-mi-400-mu) yazısına da göz atabilirsiniz.

## Laminasyon (selefon) seçimi
Laminasyon, kartı korur ve algılanan kaliteyi yükseltir:

- **Mat selefon:** Parmak izi göstermez, sofistike ve sakin durur. Kurumsal işlerin çoğu için ideal.
- **Parlak selefon:** Renkleri canlandırır, dikkat çeker; görsel ağırlıklı kartlarda etkilidir.
- **Soft-touch (kadife):** Kadifemsi dokusuyla premium bir his verir, dokunuşta akılda kalır.

Laminasyon aynı zamanda kartı neme ve çizilmeye karşı korur; laminasyonsuz bir kart cüzdanda kısa sürede yıpranır.

## Kurumsal kimlikle uyum
Kartvizit tek başına bir tasarım değil, kurumsal kimliğinizin bir parçasıdır. Logonuzun renk kodları (tercihen CMYK ya da Pantone), yazı tipleri ve boşluk mantığı; antetli kâğıt, zarf ve web sitenizle aynı olmalı. Kartı eline alan kişi, markanızın diğer materyalleriyle aynı "dili" hissetmelidir.

## Baskı öncesi son kontrol
- Belge **CMYK** modunda mı, görseller 300 DPI mi?
- Her kenarda taşma payı, önemli ögelerde güvenli alan var mı?
- Yazılar eğriye (outline) çevrildi mi?
- İletişim bilgileri (telefon, e-posta, adres) bir kez daha doğrulandı mı?

## Yatay mı, dikey mi?
Kartvizitlerin büyük çoğunluğu yatay (landscape) tasarlanır; çünkü göz bilgileri soldan sağa tarar ve yatay düzen daha çok bilgiyi rahat sığdırır. Dikey (portre) kartlar ise dikkat çeker ve modern durur; ancak sınırlı genişlik nedeniyle tipografiyi daha dikkatli kurmayı gerektirir. Markanızın karakterine göre seçin: kurumsal ve klasik bir duruş için yatay, yaratıcı ve iddialı bir duruş için dikey.

## Özel uygulamalar: yaldız, kabartma, lak
Kartvizitinizi sıradanlıktan çıkaran, çoğu zaman bu son işlemlerdir:
- **Sıcak yaldız (foil):** Altın, gümüş veya renkli metalik parlaklık; logoyu ve ismi öne çıkarır.
- **Kabartma (emboss) / gömme (deboss):** Yüzeyde çıkıntı ya da girinti; dokunuşta hissedilen bir prestij katar.
- **Nokta lak (spot UV):** Yalnızca seçili bölgeye parlak lak; mat selefon üstünde kullanıldığında güçlü bir kontrast yaratır.

Bu uygulamalar maliyeti artırır ama üst düzey işlerde kartın hatırlanma değerini belirgin biçimde yükseltir.

## Çift yön mü, tek yön mü?
Arka yüzü boş bırakmak, değerli bir alanı çöpe atmaktır. Arka yüze bir slogan, QR kod, kısa hizmet listesi ya da sade bir logo deseni ekleyerek kartı hem daha dolu hem daha profesyonel gösterebilirsiniz. Çift yön baskı, tek yöne göre çok küçük bir maliyet farkıyla belirgin bir değer katar.

## Özet
Kurumsal kartvizitte formül nettir: **doğru ölçü + taşma payı + okunur tipografi + uygun gramaj + doğru laminasyon**. Bunları yerine getirdiğinizde kartınız hem şık görünür hem baskıdan sorunsuz çıkar.

Tasarımınız hazırsa [Klasik Kartvizit](/urun/klasik-kartvizit) sayfasından gramaj ve selefon seçeneklerini konfigüratörde deneyebilir, tüm seçenekler için [Kartvizit](/kategori/kartvizit) kategorisine göz atabilirsiniz. Tasarımı bize bırakmak isterseniz kurumsal işler için [teklif alın](/teklif-al).`,
  },
  {
    slug: "brosur-baskisi-nasil-yapilir",
    title: "Broşür Baskısı Nasıl Yapılır? Adım Adım Kılavuz",
    excerpt:
      "Broşür baskısında katlama türü, kağıt seçimi ve dosya hazırlığı sonucun kalitesini belirler. İkili, üçlü ve akordeon katlamadan minimum siparişe kadar her adımı anlattık.",
    seoTitle: "Broşür Baskısı Nasıl Yapılır? Adım Adım Kılavuz | Markala",
    seoDescription:
      "Broşür baskısı nasıl yapılır? Katlama türleri (ikili, üçlü, akordeon), dosya hazırlama, kağıt ve gramaj seçimi, minimum sipariş adedi — adım adım broşür baskı rehberi.",
    tags: ["broşür", "katlama", "baskı rehberi"],
    content: `Broşür, sınırlı bir alana çok şey sığdırmanız gereken zorlu bir baskı ürünüdür. Doğru katlama, doğru kâğıt ve doğru hazırlanmış bir dosya, broşürü profesyonel bir satış aracına dönüştürür; yanlışları ise para ve zaman kaybına. Bu kılavuz, broşür baskısını adım adım anlatır.

## Broşür türleri: kaç yaprak, kaç kırım?
Broşürler genellikle tek yapraktan oluşur ve kırım (katlama) sayısıyla adlandırılır. En çok tercih edilenler tek kırım (ikiye katlı), iki kırım (üçe katlı) ve akordeon katlamadır. Kırım arttıkça hem tasarım alanı bölünür hem de her sayfanın bağımsız bir mesaj taşıması gerekir.

## Katlama türleri
| Katlama | Panel sayısı | Uygun kullanım |
|---|---|---|
| İkili (tek kırım) | 4 yüz | Menü, basit tanıtım, program |
| Üçlü (rollfold) | 6 yüz | Kurumsal tanıtım, ürün/hizmet listesi |
| Akordeon (Z kırım) | 6 yüz | Adım adım anlatım, harita, zaman çizelgesi |
| Kapılı (gatefold) | 6 yüz | Görsel ağırlıklı, dramatik açılış |

Üçlü katlamada iç panellerden biri diğerinin içine kıvrıldığı için o panel birkaç milimetre daha dar tasarlanır; bu detayı atlarsanız katlama sırasında yazılar kıvrımda sıkışır.

## Doğru boyut seçimi
En yaygın broşür boyutu, açık haldeyken A4 (210 × 297 mm), katlandığında A4'ün üçe bölünmüş halidir. Daha küçük ve ekonomik işler için A5, daha gösterişli işler için A3 tercih edilir. Boyutu, dağıtım şeklinize göre seçin: elde dağıtılacaksa küçük ve hafif, stantta durup incelenecekse büyük.

## Dosya hazırlama
Broşür dosyası, düz bir kartvizitten biraz daha dikkat ister:

- Belgeyi **CMYK** modunda, **300 DPI** çözünürlükte hazırlayın.
- Her dış kenara taşma payı (bleed) bırakın.
- **Katlama çizgilerini** ayrı bir kılavuz katmanda gösterin; matbaanın nereden kıracağını bilmesi gerekir.
- Ön ve arka yüzü, katlandığında hangi panelin nereye denk geldiğini düşünerek yerleştirin. Açık dosyada yan yana duran paneller, üründe arka arkaya gelir.

Renk ve dosya hazırlığının inceliklerini [CMYK Nedir? Baskıda Doğru Renk Modeli Rehberi](/blog/cmyk-nedir-baskida-renk-modeli) yazısında ayrıntılı bulabilirsiniz.

## Kağıt ve gramaj seçimi
Broşürde kâğıt, mesajın tonunu belirler:

- **Kuşe mat:** Yazı ağırlıklı, okunması gereken broşürlerde göz yormaz, şık durur.
- **Kuşe parlak:** Görsel ve fotoğraf ağırlıklı işlerde renkleri canlandırır.
- **Gramaj:** Tek yaprak broşürlerde 130–170 gr dengeli bir seçimdir. Çok ince kâğıt ucuz görünür; çok kalın kâğıt ise katlama çizgisinde çatlayabilir.

## Minimum sipariş ve maliyet mantığı
Baskıda kalıp ve makine hazırlığı maliyeti sabittir; bu yüzden broşür adet arttıkça birim fiyat hızla düşer. 100 adet broşürün birim maliyeti, 1.000 adedin çok üzerindedir. İhtiyacınızı gerçekçi planlayıp tek seferde bastırmak, birkaç kez az adet bastırmaktan neredeyse her zaman ekonomiktir.

## İçerik kurgusu: her panelin bir görevi var
Broşürü panellere bölünmüş bir hikâye gibi düşünün. **Kapak paneli** merakı uyandırır ve markayı tanıtır; ilk açılan **iç paneller** ana mesajı ve faydaları anlatır; **son panel** ise iletişim bilgisi ve net bir harekete geçirici mesaj (CTA) taşır. Okuyucunun broşürü açarken karşılaştığı sırayı düşünerek içeriği yerleştirin; rastgele dağıtılmış bilgi, katlanıp açıldığında karışır.

## Katlama payı ve panel genişliği
Üçlü (rollfold) katlamada içe kıvrılan panel, dıştaki panellerden yaklaşık 2 mm daha dar tasarlanır. Bu küçük fark ihmal edilirse katlama sırasında panel şişer ya da yazılar kıvrımda sıkışır. İyi bir matbaa size hazır bir şablon (die-line) verir; tasarımı bu şablon üzerine kurmak en güvenli yoldur.

## Selefon ve son işlemler
Broşürlerde de selefon hem görünümü hem dayanıklılığı artırır. Sık elden geçecek bir broşürde mat ya da parlak selefon, kâğıdın çabuk yıpranmasını önler. Ayrıca yoğun katlama yapılan işlerde selefon, katlama çizgisinde kâğıdın çatlamasını — özellikle koyu zeminlerde beliren beyaz çizgiyi — azaltır.

## Broşür mü, katalog mu?
Anlatacaklarınız tek yaprağa sığmıyorsa, çok kırımlı bir broşürü zorlamak yerine dikişli/telli bir katalog düşünün. Genel kural: 6 panele kadar broşür pratik ve ekonomiktir; daha fazla içerik, sayfalı bir katalog formatında daha okunur olur.

## Adım adım süreç
1. Amacı ve dağıtım şeklini belirleyin (elde mi, stantta mı?).
2. Katlama türünü ve boyutu seçin.
3. Paneller arası akışı planlayarak tasarımı yapın.
4. Dosyayı CMYK/300 DPI, taşma paylı ve katlama çizgili hazırlayın.
5. Kâğıt, gramaj ve adet seçip baskıya gönderin.

## Özet
Broşürde başarı; **katlama türü + panel akışı + doğru kâğıt + temiz dosya** dörtlüsünde saklıdır. Bu adımları izlerseniz eliniz taşın altındaki broşür, markanızı hak ettiği gibi anlatır.

Hazır mısınız? Ölçü, gramaj ve adete göre anlık fiyatı görmek için [Broşür](/urun/brosur) sayfasını, daha kalın ve prestijli işler için [Pro Broşür](/urun/pro-brosur) ürününü inceleyebilir; tüm seçenekler için [Broşür](/kategori/brosur) kategorisine göz atabilirsiniz. Tasarım desteği isterseniz [teklif alın](/teklif-al).`,
  },
  {
    slug: "roll-up-banner-olculeri-ve-tasarim",
    title: "Roll-Up Banner Ölçüleri ve Tasarım Rehberi",
    excerpt:
      "Roll-up banner, birkaç saniyede mesajını iletmek zorunda olan bir reklam aracıdır. Standart ölçüleri, doğru çözünürlüğü, görsel hiyerarşiyi ve malzeme seçimini anlattık.",
    seoTitle: "Roll-Up Banner Ölçüleri ve Tasarım Rehberi | Markala",
    seoDescription:
      "Roll-up banner standart ölçüleri (85x200, 100x200 cm), doğru çözünürlük (neden 150 DPI yeterli), görsel hiyerarşi ve malzeme seçimi — profesyonel roll-up tasarım rehberi.",
    tags: ["roll-up", "banner", "tasarım", "baskı rehberi"],
    content: `Roll-up banner; fuar, mağaza girişi, etkinlik ve toplantı sahnelerinin vazgeçilmez reklam aracıdır. Ancak izleyicinin ona ayırdığı süre çoğu zaman birkaç saniyedir. Bu yüzden roll-up tasarımı, "az ile çok anlatma" sanatıdır. İşte ölçüden malzemeye kadar bilmeniz gereken her şey.

## Standart roll-up ölçüleri
En yaygın kullanılan roll-up boyutları şunlardır:

| Ölçü (En × Boy) | Kullanım |
|---|---|
| 85 × 200 cm | En yaygın standart, dar alanlar için |
| 100 × 200 cm | Daha geniş, sahne ve giriş için |
| 60 × 160 cm | Masaüstü/kompakt, küçük stantlar |
| 120 × 200 cm | Geniş formatlı, dikkat çekici kullanım |

Boyları genellikle 200 cm'dir; çünkü göz hizası ve üzerindeki alan, ayakta duran izleyici için en etkili bölgedir. Alt 15–20 cm mekanizmanın içine sarıldığı için önemli bilgileri buraya koymayın.

## Çözünürlük: neden 150 DPI yeterli?
Kartvizit gibi elde tutulan işlerde 300 DPI şarttır; ama roll-up metrelerce büyüktür ve en az 1,5–2 metreden izlenir. İzleme mesafesi arttıkça gözün ayırt edebileceği detay azalır. Bu yüzden roll-up için **gerçek boyutta 100–150 DPI** çözünürlük fazlasıyla yeterlidir. Küçük bir görseli 300 DPI'a zorlamak yerine, doğru mesafeye göre optimize edilmiş net bir dosya hazırlamak daha doğrudur. Dosya boyutunu gereksiz büyütmek, baskı sürecini yavaşlatmaktan başka işe yaramaz.

## Görsel hiyerarşi ve göz izi
İzleyicinin gözü roll-up'ta yukarıdan aşağıya akar. Bu doğal akışa göre kurgulayın:

- **Üst bölge:** Logo ve en güçlü başlık. Uzaktan okunabilecek tek cümlelik ana mesaj burada olmalı.
- **Orta bölge:** Destekleyici görsel ve kısa açıklama. Göz hizasına denk geldiği için en çok bakılan alandır.
- **Alt bölge:** İletişim bilgisi, QR kod, web adresi. Ama en alttaki 15–20 cm'i boş bırakın.

Metni cömertçe azaltın. Roll-up bir broşür değildir; paragraf değil, çarpıcı birkaç kelime taşır. Punto boyutlarını, 2 metreden okunabilecek kadar büyük tutun.

## Malzeme: solvent baskı mı, tekstil mi?
Roll-up medyası genellikle iki ana grupta toplanır:

- **PVC / vinil medya (solvent veya lateks baskı):** Standart ve ekonomik seçenektir. Opak yapısı sayesinde arkadan ışık vurduğunda görüntü şeffaflaşmaz; dayanıklı ve renkleri canlıdır.
- **Tekstil (kumaş) medya:** Kadifemsi mat yüzeyiyle ışık yansımasını azaltır, daha premium ve kırışıksız bir görünüm verir. Sahne, fuar ve fotoğraf çekilen ortamlarda parlamadığı için tercih edilir; taşıması da kolaydır.

Seçiminizi kullanım ortamına göre yapın: sık taşınacak, ışık altında kalacak bir kurumsal etkinlik için tekstil; yoğun ve ekonomik kullanım için vinil öne çıkar.

## Mekanizma (kaset) kalitesi
Roll-up'ın gördüğünüz görseli kadar, onu taşıyan alüminyum kaset de önemlidir. Ekonomik standart mekanizmalar tek seferlik etkinlikler için yeterlidir; sık kurulup taşınacak bir roll-up için ise daha ağır tabanlı, sağlam çekirdekli "deluxe" mekanizmalar tercih edilir. Kaliteli mekanizma, brandanın zamanla dalgalanmasını (kırışıp bükülmesini) de geciktirir.

## Kurulum, taşıma ve dosya teslimi
Roll-up'ın en büyük avantajı taşınabilirliğidir: saniyeler içinde kurulur, çantasına sarılıp kolayca taşınır. Tasarımı teslim ederken gerçek boyutta, taşma paylı ve tercihen PDF formatında gönderin; alt kenarda mekanizmaya sarılacak güvenlik payını unutmayın. Yazıları eğriye (outline) çevirmek, font sorunlarını baştan bitirir.

## Nerede etkili kullanılır?
Roll-up; fuar standı, mağaza ve ofis girişi, konferans ve seminer sahnesi, açılış ve lansmanlar ile bayi/showroom içi yönlendirmede iş görür. Aynı etkinlikte birden fazla roll-up kullanacaksanız hepsinde ortak bir görsel dil (aynı renk, tipografi ve logo yerleşimi) kurun; dağınık tasarımlar markayı zayıf gösterir.

## Tasarımda sık hatalar
- **Aşırı metin:** En büyük hata. Roll-up okunmaz, "yakalanır".
- **Önemli bilgiyi en alta koymak:** Alt kısım hem mekanizmaya sarılır hem de göz hizasının altında kalır.
- **Düşük kontrast:** Uzaktan seçilemeyen renkler mesajı yok eder.
- **Kenara yapışık ögeler:** Roll-up'ta da kenar boşluğu ve taşma payı bırakın.

## Özet
Etkili roll-up formülü: **büyük ve tek mesaj + yukarıdan aşağıya hiyerarşi + doğru mesafeye göre çözünürlük + ortama uygun malzeme.** Detayı azalttıkça etkiyi artırırsınız.

Dış mekân ve etkinlik ürünlerini karşılaştırmak isterseniz [Vinil Branda mı, Mesh Branda mı](/blog/vinil-branda-mi-mesh-branda-mi) yazımız da işinize yarar. Ölçü ve malzemeye göre anlık fiyat için [Roll-Up Banner](/urun/rollup-standart) sayfasını, tüm seçenekler için [Roll-Up](/kategori/rollup) kategorisini inceleyebilir; tasarım desteği için [teklif alın](/teklif-al).`,
  },
  {
    slug: "online-matbaa-vs-yerel-matbaa",
    title: "Online Matbaa mı, Yerel Matbaa mı? Hangisi Daha İyi?",
    excerpt:
      "Online matbaa mı, mahalledeki yerel matbaa mı? Fiyat, kalite, hız, minimum adet ve kişiselleştirme başlıklarında ikisini tarafsız karşılaştırdık ve kime hangisinin uyduğunu anlattık.",
    seoTitle: "Online Matbaa mı, Yerel Matbaa mı? Karşılaştırma | Markala",
    seoDescription:
      "Online matbaa ve yerel matbaa karşılaştırması: fiyat, kalite, hız, minimum adet ve kişiselleştirme. Hangisi size uygun? Avantaj ve dezavantajlarıyla tarafsız rehber.",
    tags: ["online matbaa", "karşılaştırma", "baskı rehberi"],
    content: `Bir kartvizit, broşür ya da branda bastırmanız gerektiğinde iki yol var: bilgisayardan birkaç tıkla sipariş verdiğiniz online matbaa ya da adresine gidip yüz yüze konuştuğunuz yerel matbaa. İkisinin de güçlü olduğu alanlar farklı. Bu yazıda hiçbir tarafı kayırmadan, karar vermenizi kolaylaştıracak dürüst bir karşılaştırma sunuyoruz.

## Fiyat
Online matbaalar, siparişleri tek merkezde toplayıp ölçek ekonomisi yakaladığı ve fiziksel dükkân/vitrin maliyeti taşımadığı için genellikle daha rekabetçi fiyat verir. Fiyatı anında, şeffaf biçimde ekranda görürsünüz; pazarlık ya da "sonra ararız" yoktur. Yerel matbaa ise özellikle çok özel, düşük adetli ve elde işçilik gerektiren işlerde esnek fiyatlayabilir.

| Kriter | Online matbaa | Yerel matbaa |
|---|---|---|
| Fiyat şeffaflığı | Anlık, net | Teklife bağlı |
| Standart iş maliyeti | Genelde daha uygun | Değişken |
| Çok özel/düşük adet | Sınırlı | Esnek olabilir |

## Kalite ve tutarlılık
Kaliteyi belirleyen, matbaanın "online" ya da "yerel" olması değil; makine parkı, kâğıt kalitesi ve baskı öncesi kontrol disiplinidir. Kurumsal online matbaalar standart bir kalite akışı ve düzenli renk kalibrasyonu uygular; bu da her siparişte aynı sonucu almanızı sağlar. Yerel matbaada ise ustanın deneyimi ve makinesinin durumu sonucu doğrudan etkiler; iyi bir usta ile mükemmel, bakımsız bir makine ile hayal kırıklığı yaşayabilirsiniz.

## Hız ve teslimat
Online matbaada süreç bellidir: siparişi verirsiniz, üretim ve kargo süresi baştan yazar, iş kapınıza gelir. Şehir dışındaysanız bu büyük avantajdır. Yerel matbaanın avantajı ise acil işlerde ortaya çıkar: kapıdan girip "bugün lazım" diyebileceğiniz, elden teslim alabileceğiniz durumlarda hız kazanırsınız.

## Minimum adet ve esneklik
Yerel matbaa, tek bir tabela ya da 50 kartvizit gibi çok küçük işleri elden çözebilir. Online matbaalar da giderek düşük adetleri destekliyor, ancak çok niş, elde bitirme gerektiren işlerde yerel atölye daha esnek kalabilir. Buna karşılık online tarafta ürün çeşitliliği (farklı gramaj, selefon, ölçü kombinasyonları) çoğu zaman çok daha geniştir.

## Kişiselleştirme ve destek
Yerel matbaanın klasik gücü yüz yüze iletişimdir. Ama bu deneyim artık online tarafta da mümkün: canlı önizleme, konfigüratörle ürünü anında görme, tasarım desteği ve mesai saati fark etmeksizin sipariş verebilme. İyi bir online matbaa, yerel matbaanın samimiyetini dijital konforla birleştirir.

## Baskı öncesi dosya kontrolü
İyi bir matbaa dosyanızı olduğu gibi makineye göndermez; taşma payı, çözünürlük, renk modu ve font sorunlarını baskı öncesi kontrol eder. Kurumsal online matbaalarda bu kontrol çoğu zaman standart bir adımdır ve sorun varsa siz onaylamadan üretim başlamaz. Yerel matbaada da usta bu kontrolü yapar; ancak süreç kişiye bağlı olduğundan, dosyanızı her hâlükârda kendiniz de gözden geçirmeniz en güvenlisidir.

## Kargo ve teslimat
Online siparişte iş kargoyla geldiği için, hassas ürünlerde (örneğin köşeleri kolay ezilen sert kapaklı işler) paketleme kalitesi önem kazanır. Ciddi bir online matbaa, ürünü koruyacak şekilde paketler ve teslim süresini baştan taahhüt eder. Yerel matbaadan elden teslim alırken bu risk yoktur; ama şehir dışıysanız kargo kaçınılmazdır.

## Çevre ve sürdürülebilirlik
Baskıda çevresel etki giderek daha önemli. Online matbaalar siparişleri topladığı için üretim ve lojistiği daha verimli planlayıp fireyi azaltabilir; birçok işletme geri dönüşümlü kâğıt ve düşük çevresel etkili mürekkep seçenekleri sunar. Yerel matbaanın avantajı ise kısa mesafeli teslimatın düşük karbon ayak izidir. Çevresel önceliğiniz varsa, hangi tarafı seçerseniz seçin geri dönüşümlü kâğıt tercih etmek ve gereğinden fazla adetten kaçınmak en somut adımdır.

## Hangisi size uygun?
- **Acil, elden teslim ve çok özel el işi** gereken tek seferlik işler için: **yerel matbaa** pratik olabilir.
- **Şeffaf fiyat, geniş ürün yelpazesi, tutarlı kalite ve kapıya teslim** istiyorsanız: **online matbaa** öne çıkar.

## İki dünyanın en iyisi
Aslında bu bir "ya o ya bu" seçimi olmak zorunda değil. [Markala](/) tam da bu iki dünyayı birleştirmek için kuruldu: fiyatı anında ekranda görürsünüz, ürünü konfigüratörde canlı önizlersiniz, gerektiğinde tasarım desteği alırsınız ve iş kapınıza gelir — üstelik gerçek matbaa kalitesiyle. Yani yerel matbaanın güvenini, online matbaanın konforuyla aynı yerde bulursunuz.

## Özet
Doğru seçim, işinizin niteliğine bağlıdır. Standart ve tekrar eden baskı ihtiyaçlarında online matbaanın şeffaflığı ve tutarlılığı; çok özel ve acil işlerde yerel atölyenin esnekliği öne çıkar.

Ne bastıracağınıza karar verdiyseniz [Kartvizit](/kategori/kartvizit) ve diğer kategorilerde anlık fiyatı görebilir, kurumsal ve toplu işler için [teklif alabilirsiniz](/teklif-al).`,
  },
];

async function main() {
  const category = await prisma.blogCategory.upsert({
    where: { slug: CATEGORY.slug },
    update: {
      name: CATEGORY.name,
      description: CATEGORY.description,
      sortOrder: CATEGORY.sortOrder,
    },
    create: CATEGORY,
  });

  const now = new Date();
  let count = 0;
  for (const post of POSTS) {
    const readingTime = Math.max(1, Math.round(post.content.trim().split(/\s+/).length / 200));
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorName: AUTHOR.name,
      authorRole: AUTHOR.role,
      categoryId: category.id,
      tags: post.tags,
      status: BlogStatus.published,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      readingTime,
    };
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      // publishedAt yalnız CREATE'te set edilir; tekrar seed'de yayın tarihi kaymasın.
      update: data,
      create: { slug: post.slug, publishedAt: now, ...data },
    });
    count += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Blog seed tamam: "${category.name}" kategorisi + ${count} yazı upsert edildi.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
