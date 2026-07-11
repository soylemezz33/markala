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
