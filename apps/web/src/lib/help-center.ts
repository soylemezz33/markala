/**
 * Yardım Merkezi veri katmanı — kategori → makale iki seviyeli yapı.
 *
 * URL şeması: /yardim/[kategori]/[makale]
 * Bidolubaski yardım merkezi mimarisinden uyarlandı (2026-08-28): her soru kendi
 * indekslenebilir sayfasında yaşar → uzun kuyruklu aramalar ("baskı siparişi nasıl
 * iptal edilir" vb.) tekil sayfalarla karşılanır.
 *
 * İçerik KODDA tutulur (SSS'in aksine): sürüm kontrollü, deploy ile yayınlanır.
 * `shortAnswer` hem sayfada görünen "Kısa cevap" kutusudur hem de FAQPage JSON-LD'ye
 * birebir aynı metinle girer — görünen metin/şema eşleşmesi Google şartıdır.
 *
 * Bu dosya JSX içermez ki sitemap.ts UI import'u olmadan tüketebilsin
 * (eski lib/help-articles.ts'in yerini aldı).
 */

export interface HelpSection {
  heading: string;
  body: string;
}

export interface HelpArticle {
  slug: string;
  /** Soru formunda H1 — arama sorgusuyla birebir eşleşme hedeflenir. */
  question: string;
  description: string;
  /** Görünen "Kısa cevap" kutusu + FAQPage JSON-LD cevabı (aynı metin). */
  shortAnswer: string;
  sections: HelpSection[];
  /** İstemci tarafı aramada eşleşme için ek terimler. */
  keywords?: string[];
}

export interface HelpCategory {
  slug: string;
  title: string;
  /** Kategori kartındaki kısa açıklama. */
  short: string;
  /** UI'da ikona map edilen anahtar — veri dosyası JSX içermesin diye string. */
  icon: "package" | "file" | "user" | "tag" | "card" | "truck" | "return" | "building";
  description: string;
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "siparis-sureci",
    title: "Sipariş Süreci",
    short: "Oluşturma, takip, iptal, tekrar sipariş",
    icon: "package",
    description:
      "Sipariş oluşturmadan teslimata kadar tüm süreç: konfigüratör kullanımı, sipariş takibi, iptal koşulları ve tekrar sipariş.",
    articles: [
      {
        slug: "siparis-nasil-olusturulur",
        question: "Sipariş nasıl oluşturulur?",
        description:
          "Markala'da adım adım sipariş süreci: ürün seçimi, konfigüratör, tasarım yükleme, ödeme ve üretim.",
        shortAnswer:
          "Ürün sayfasından ebat, malzeme ve adet seçin; anlık fiyatı görün. Sepete ekleyip tasarımınızı yükleyin veya ücretsiz tasarım desteği isteyin. iyzico ile güvenli ödeme sonrası üretim başlar, ürünler DHL ile adresinize gönderilir.",
        keywords: ["sipariş verme", "nasıl sipariş veririm", "konfigüratör"],
        sections: [
          { heading: "1. Ürün ve Konfigürasyon Seçin", body: "Ürün sayfasından paket, ebat ve adet seçin. Sağdaki konfigüratörde fiyat anlık olarak güncellenir: KDV dahil, sürpriz maliyet yoktur." },
          { heading: "2. Sepete Ekleyin", body: "Farklı ürünleri aynı sepette birleştirebilirsiniz. Sepet sağda panel olarak açılır; 1.500 TL üzeri siparişlerde kargo ücretsizdir." },
          { heading: "3. Tasarım Yükleyin veya Destek İsteyin", body: "Hazır tasarımınız varsa CMYK PDF olarak yükleyin. Yoksa 'Tasarım desteği' seçeneğiyle ücretsiz şablon uyarlaması veya 89 TL'den başlayan özel tasarım hizmeti alabilirsiniz." },
          { heading: "4. Adres ve Ödeme", body: "Teslimat adresinizi seçin veya ekleyin, iyzico altyapısıyla 3D Secure ödeme yapın. Kart bilgileriniz Markala'ya ulaşmaz." },
          { heading: "5. Üretim ve Kargo", body: "Tasarım onayı (varsa) sonrası üretim başlar; ürüne göre 1-7 iş günü sürer. Üretim biter bitmez aynı gün DHL kargoya verilir, takip kodu e-postanıza gelir." },
        ],
      },
      {
        slug: "siparis-durumunu-nereden-takip-edebilirim",
        question: "Sipariş durumumu nereden takip edebilirim?",
        description:
          "Sipariş durumu takibi: hesabım sayfası, SMS/e-posta bilgilendirmeleri ve kargo takip sayfası.",
        shortAnswer:
          "Üye iseniz Hesabım → Siparişlerim sayfasından tüm siparişlerinizin anlık durumunu görebilirsiniz. Ayrıca her aşamada (onay, üretim, kargo) SMS ve e-posta ile bilgilendirilirsiniz. Kargoya verilen siparişler /kargo-takip sayfasından sorgulanabilir.",
        keywords: ["sipariş takibi", "siparişim nerede", "sipariş durumu"],
        sections: [
          { heading: "Hesabım → Siparişlerim", body: "Giriş yaptıktan sonra Siparişlerim sayfasında her siparişin durumu (onay bekliyor, üretimde, kargoda, teslim edildi) anlık görünür." },
          { heading: "SMS ve E-posta Bilgilendirmesi", body: "Sipariş onayı, üretim başlangıcı ve kargoya teslim aşamalarında otomatik bilgilendirme alırsınız. Bildirim tercihlerinizi Hesabım → Bildirim sayfasından yönetebilirsiniz." },
          { heading: "Kargo Takip Sayfası", body: "Kargoya verilen siparişler için sipariş numaranız ve e-postanızla /kargo-takip sayfasından DHL takip durumunu sorgulayabilirsiniz." },
        ],
      },
      {
        slug: "siparisimi-nasil-iptal-edebilirim",
        question: "Siparişimi nasıl iptal edebilirim?",
        description: "Sipariş iptal koşulları: üretim öncesi iptal mümkün, üretim sonrası cayma hakkı istisnası.",
        shortAnswer:
          "Siparişiniz üretime alınmadan önce iptal edilebilir. WhatsApp veya merhaba@markala.com.tr adresine sipariş numaranızı iletmeniz yeterlidir. Üretim başladıktan sonra ürünler kişiye özel üretildiği için iptal mümkün değildir.",
        keywords: ["iptal", "sipariş iptali", "vazgeçtim"],
        sections: [
          { heading: "Üretim Öncesi İptal", body: "Tasarım onayı verilmeden veya üretim başlamadan önce siparişiniz koşulsuz iptal edilir, ödemeniz 5 iş günü içinde aynı karta iade edilir." },
          { heading: "Üretim Başladıktan Sonra", body: "Baskı ürünleri kişiye/firmaya özel üretildiği için üretim başladıktan sonra iptal ve cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği 15/1-ç). Bu nedenle tasarım onayınızı vermeden önce tüm detayları kontrol etmenizi öneririz." },
          { heading: "İptal Talebi Nasıl İletilir?", body: "WhatsApp hattımızdan ya da merhaba@markala.com.tr adresinden sipariş numaranızla birlikte yazmanız yeterli. Mesai saatleri içinde (09:00-18:00) genellikle 1 saat içinde dönüş yapılır." },
        ],
      },
      {
        slug: "onceki-siparisimi-tekrar-verebilir-miyim",
        question: "Önceki siparişimi tekrar verebilir miyim?",
        description: "Tekrar sipariş: kayıtlı tasarımınızla aynı ürünü tek tıkla yeniden sipariş edin.",
        shortAnswer:
          "Evet. Hesabım → Tekrar Sipariş sayfasından geçmiş siparişlerinizi aynı tasarım ve konfigürasyonla tek tıkla yeniden verebilirsiniz. Tasarım dosyalarınız güvenli depolamada saklandığı için yeniden yükleme gerekmez.",
        keywords: ["tekrar sipariş", "yeniden sipariş", "aynı tasarım"],
        sections: [
          { heading: "Tek Tıkla Tekrar Sipariş", body: "Hesabım → Tekrar Sipariş sayfasında geçmiş siparişleriniz listelenir. 'Tekrar sipariş ver' dediğinizde aynı ürün, ebat, adet ve tasarım sepete eklenir; dilerseniz adet veya ebatı değiştirebilirsiniz." },
          { heading: "Tasarımlarınız Saklanır", body: "Yüklediğiniz tasarım dosyaları ve tasarım ekibimizin hazırladığı çalışmalar güvenli bulut depolamada (Cloudflare R2) saklanır. KVKK kapsamında dilediğiniz zaman silinmesini talep edebilirsiniz." },
          { heading: "Fiyat Güncellemesi", body: "Tekrar siparişte güncel fiyat uygulanır; önceki sipariş fiyatı garanti edilmez. Kampanya dönemlerinde tekrar sipariş daha avantajlı olabilir." },
        ],
      },
    ],
  },
  {
    slug: "tasarim-ve-dosya",
    title: "Tasarım & Dosya Hazırlama",
    short: "CMYK, çözünürlük, format, tasarım desteği",
    icon: "file",
    description:
      "Baskıya hazır dosya hazırlama: CMYK renk uzayı, 300 dpi çözünürlük, taşma payı, kabul edilen formatlar ve ücretsiz tasarım desteği.",
    articles: [
      {
        slug: "baskiya-hazir-dosya-nasil-hazirlanir",
        question: "Baskıya hazır dosya nasıl hazırlanır?",
        description:
          "CMYK renk uzayı, 300 dpi çözünürlük, 2 mm taşma payı, PDF formatı: baskıya hazır dosya rehberi.",
        shortAnswer:
          "Dosyanızı CMYK renk profilinde, 300 dpi çözünürlükte ve her kenardan 2 mm taşma payı bırakarak hazırlayın. En güvenli format 'Press Quality' veya PDF/X-1a preset'iyle dışa aktarılmış PDF'dir; fontları outline'a çevirmeyi unutmayın.",
        keywords: ["cmyk", "dpi", "taşma payı", "bleed", "dosya hazırlama", "pdf"],
        sections: [
          { heading: "Renk Uzayı: CMYK Kullanın", body: "Web tasarımı RGB ile yapılır ama matbaa baskısı CMYK ile yapılır. RGB dosya gönderirseniz baskıda renkler %15-30 farklı çıkar. Adobe Illustrator/Photoshop'ta 'CMYK Mode' seçin." },
          { heading: "Çözünürlük: 300 dpi", body: "Baskıda kullanılacak görseller 300 dpi olmalı. 72 dpi (web standardı) baskıda pikselli çıkar. Vektörel dosyalar (SVG, AI, EPS) ölçeklenebilir olduğundan dpi sınırı yoktur." },
          { heading: "Taşma Payı: 2 mm", body: "Kenara kadar uzanan tasarımlarda kesimde beyaz şerit oluşmaması için tasarımı her kenardan 2 mm uzatın. Önemli yazıları kenardan en az 3 mm içeride tutun." },
          { heading: "Pantone mu CMYK mi?", body: "Tek renk kurumsal işlerde Pantone (PMS) referansı renk tutarlılığı sağlar. Tam renkli (4+4) baskıda CMYK yeterlidir." },
          { heading: "Yaygın Hatalar", body: "1) RGB kaydetmek 2) Düşük çözünürlük (72 dpi) 3) Taşma payı bırakmamak 4) Font outline yapmamak 5) Görselleri gömmeyip link olarak bırakmak. Bu beş hata, baskı öncesi kontrolde en sık düzeltme istenen konulardır." },
        ],
      },
      {
        slug: "hangi-dosya-formatlari-kabul-ediliyor",
        question: "Hangi dosya formatları kabul ediliyor?",
        description: "Kabul edilen baskı dosyası formatları: PDF (öncelikli), AI, PSD ve dikkat edilecekler.",
        shortAnswer:
          "En güvenli format PDF'dir, Adobe programlarından 'Press Quality' veya 'PDF/X-1a' preset'iyle dışa aktarın. AI ve PSD dosyaları da kabul edilir; fontları outline'a çevirmeniz ve görselleri dosyaya gömmeniz gerekir.",
        keywords: ["pdf", "ai", "psd", "format", "dosya türü"],
        sections: [
          { heading: "PDF (Öncelikli)", body: "Baskı için endüstri standardı. 'Press Quality' veya 'PDF/X-1a' preset'i renkleri ve fontları doğru gömer. Canva gibi araçlardan da 'PDF - Baskı' seçeneğiyle dışa aktarabilirsiniz." },
          { heading: "AI ve PSD", body: "Adobe Illustrator (.ai) ve Photoshop (.psd) dosyaları kabul edilir. Fontları outline'layın (Type > Create Outlines); aksi hâlde sistemde olmayan font farklı bir yazı tipiyle basılır. Bağlantılı görselleri gömün (Embed)." },
          { heading: "Dosya Boyutu ve Yükleme", body: "Sipariş sırasında dosyanızı doğrudan yükleyebilirsiniz. Çok büyük dosyalar için WeTransfer bağlantısını sipariş notuna ekleyebilir veya WhatsApp'tan iletebilirsiniz." },
        ],
      },
      {
        slug: "tasarim-destegi-nasil-calisir",
        question: "Tasarımım yok, tasarım desteği nasıl çalışır?",
        description: "Ücretsiz şablon uyarlama ve 89 TL'den başlayan özel tasarım hizmeti; 324 Ajans iş birliği.",
        shortAnswer:
          "Sipariş sırasında 'Tasarım desteği istiyorum' seçeneğini işaretleyin: sektörünüze uygun şablon, logonuz ve metinlerinizle 24 saat içinde ücretsiz uyarlanır. Sıfırdan özel tasarım için 89 TL'den başlayan paketler, kapsamlı kurumsal kimlik işleri için 324 Ajans iş birliğimiz vardır.",
        keywords: ["tasarım desteği", "ücretsiz tasarım", "tasarım yaptırma", "324 ajans"],
        sections: [
          { heading: "Ücretsiz Şablon Desteği", body: "Sektörünüze özel hazır şablonlardan birini seçer, logonuzu ve metinlerinizi yüklersiniz. Tasarım ekibimiz 24 saat içinde uyarlanmış hâlini e-postanıza gönderir. Bu hizmet tamamen ücretsizdir." },
          { heading: "Özel Tasarım Hizmeti", body: "Sıfırdan, markanıza özel tasarım için 89 TL'den başlayan paketler sunuyoruz. Brief sonrası 3 iş günü içinde 2 alternatif sunulur; sınırsız revizyon dahildir." },
          { heading: "Kapsamlı Projeler: 324 Ajans", body: "Logo, kurumsal kimlik, web tasarımı gibi geniş kapsamlı projelerde çatı markamız 324 Ajans ile çalışıyoruz. Marka stratejisi dahil paketler 2.500 TL'den başlar, 5-10 iş gününde teslim edilir." },
        ],
      },
      {
        slug: "tasarim-onay-sureci-nasil-isler",
        question: "Tasarım onay süreci nasıl işler?",
        description: "Baskı öncesi tasarım onayı: taslak gönderimi, revizyon ve onay sonrası üretim.",
        shortAnswer:
          "Tasarım desteği aldıysanız 24 saat içinde taslak(lar) e-postanıza gelir. Onay vermeden üretim başlamaz; revizyon talep edebilirsiniz. Onayınızla birlikte dosya üretime alınır, onay sonrası içerik değişikliği yapılamaz.",
        keywords: ["onay", "taslak", "revize", "baskı onayı"],
        sections: [
          { heading: "Taslak Gönderimi", body: "Tasarım ekibimiz hazırladığı çalışmayı (şablon uyarlamasında 1, özel tasarımda 2 alternatif) 24 saat içinde e-postanıza gönderir." },
          { heading: "Revizyon", body: "Beğenmediğiniz noktaları belirtin; düzeltilmiş taslak tekrar gönderilir. Özel tasarım paketlerinde sınırsız revizyon hakkınız vardır." },
          { heading: "Onay ve Sonrası", body: "Onayınız yazılı olarak (e-posta/WhatsApp) alınır ve üretim başlar. Onayladığınız taslaktaki yazım hataları dahil tüm içerik sorumluluğu onayla birlikte kesinleşir, bu yüzden metinleri son kez kontrol edin." },
          { heading: "Kendi Dosyanızı Yüklediyseniz", body: "Baskı öncesi ekibimiz dosyanızı teknik açıdan (çözünürlük, renk uzayı, taşma payı) kontrol eder. Sorun varsa üretime almadan size dönülür." },
        ],
      },
    ],
  },
  {
    slug: "uyelik-ve-hesap",
    title: "Üyelik & Hesap",
    short: "Kayıt, şifre, adres ve bilgi güncelleme",
    icon: "user",
    description:
      "Üyelik işlemleri: kayıt olma, e-posta doğrulama, şifre sıfırlama, adres ve hesap bilgisi yönetimi, misafir sipariş.",
    articles: [
      {
        slug: "nasil-uye-olabilirim",
        question: "Nasıl üye olabilirim?",
        description: "Markala'ya üye olma: kayıt formu, e-posta doğrulama ve üyelik avantajları.",
        shortAnswer:
          "Sağ üstteki 'Giriş' menüsünden veya /kayit sayfasından ad, e-posta ve şifrenizle 1 dakikada üye olabilirsiniz. E-postanıza gelen doğrulama bağlantısına tıkladığınızda hesabınız aktifleşir.",
        keywords: ["üyelik", "kayıt", "hesap açma", "üye ol"],
        sections: [
          { heading: "Kayıt Adımları", body: "Kayıt sayfasında ad-soyad, e-posta ve şifrenizi girin. E-postanıza gelen doğrulama bağlantısına tıklayın, hesabınız kullanıma hazır." },
          { heading: "Üyelik Avantajları", body: "Sipariş takibi, kayıtlı adresler, fatura arşivi, tek tıkla tekrar sipariş, favori listesi ve üyelere özel HOSGELDIN indirim kuponu. Yakında devreye girecek puan programıyla her siparişte puan kazanacaksınız." },
          { heading: "Kurumsal Üyelik", body: "Firmalar için cari hesap, vadeli fatura ve özel fiyat anlaşması sunan kurumsal hesap sistemimiz vardır. Detaylar Kurumsal Hesap kategorisinde." },
        ],
      },
      {
        slug: "sifremi-unuttum-ne-yapmaliyim",
        question: "Şifremi unuttum, ne yapmalıyım?",
        description: "Şifre sıfırlama: e-posta ile sıfırlama bağlantısı alma ve yeni şifre belirleme.",
        shortAnswer:
          "Giriş sayfasındaki 'Şifremi unuttum' bağlantısına tıklayın, e-posta adresinizi girin. Gelen bağlantıyla yeni şifrenizi belirleyebilirsiniz. E-posta birkaç dakika içinde gelmezse spam klasörünü kontrol edin.",
        keywords: ["şifre", "parola", "şifre sıfırlama", "giriş yapamıyorum"],
        sections: [
          { heading: "Sıfırlama Adımları", body: "Giriş sayfasında 'Şifremi unuttum' → e-posta adresinizi girin → e-postanıza gelen bağlantıya tıklayın → yeni şifrenizi belirleyin. Bağlantı güvenlik gereği sınırlı süre geçerlidir." },
          { heading: "E-posta Gelmediyse", body: "Spam/gereksiz klasörünü kontrol edin. Hâlâ yoksa e-posta adresinizi doğru yazdığınızdan emin olup tekrar deneyin; sorun sürerse WhatsApp destek hattımıza yazın." },
          { heading: "Giriş Yaptıktan Sonra Şifre Değiştirme", body: "Hesabım → Şifre sayfasından mevcut şifrenizi girerek dilediğiniz zaman şifrenizi değiştirebilirsiniz." },
        ],
      },
      {
        slug: "hesap-bilgilerimi-ve-adreslerimi-nasil-guncellerim",
        question: "Hesap bilgilerimi ve adreslerimi nasıl güncellerim?",
        description: "Hesap yönetimi: kişisel bilgiler, teslimat adresleri, kayıtlı kartlar ve bildirim tercihleri.",
        shortAnswer:
          "Hesabım panelinden Bilgilerim (ad, telefon, e-posta), Adreslerim (teslimat/fatura adresleri), Kartlarım ve Bildirim sayfalarıyla tüm bilgilerinizi güncelleyebilirsiniz. Değişiklikler anında geçerli olur.",
        keywords: ["adres", "bilgi güncelleme", "telefon değiştirme", "hesap ayarları"],
        sections: [
          { heading: "Kişisel Bilgiler", body: "Hesabım → Bilgilerim sayfasından ad-soyad ve telefon bilgilerinizi güncelleyebilirsiniz. Fatura için TC kimlik veya vergi numarası bilgileriniz de burada yönetilir." },
          { heading: "Adres Yönetimi", body: "Hesabım → Adreslerim'de birden fazla teslimat ve fatura adresi kaydedebilir, sipariş sırasında aralarından seçim yapabilirsiniz." },
          { heading: "Veri Yönetimi ve Hesap Silme", body: "KVKK kapsamında verilerinizi Hesabım → Veri Yönetimi sayfasından talep edebilir, dilerseniz Hesap Sil ile hesabınızı kalıcı olarak kapatabilirsiniz." },
        ],
      },
      {
        slug: "uye-olmadan-siparis-verebilir-miyim",
        question: "Üye olmadan sipariş verebilir miyim?",
        description: "Misafir sipariş imkânı ve üyeliğin sağladığı avantajların karşılaştırması.",
        shortAnswer:
          "Evet, misafir olarak sipariş verebilirsiniz; e-posta ve teslimat bilgileriniz yeterlidir. Ancak HOSGELDIN kuponu yalnız üyelere özeldir; sipariş geçmişi, tekrar sipariş ve fatura arşivi gibi kolaylıklar da üyelikle gelir.",
        keywords: ["misafir", "üyeliksiz", "kayıt olmadan"],
        sections: [
          { heading: "Misafir Sipariş", body: "Sepetten ödeme adımına üye olmadan geçebilirsiniz. Sipariş ve kargo bilgilendirmeleri e-postanıza gönderilir; /kargo-takip sayfasından sipariş numaranızla takip yapabilirsiniz." },
          { heading: "Üyelikle Gelen Farklar", body: "HOSGELDIN indirim kuponu yalnız üye girişiyle kullanılabilir. Ayrıca sipariş geçmişi, kayıtlı adres ve tasarımlarla tek tıkla tekrar sipariş, fatura arşivi ve favori listesi üyelere özeldir." },
        ],
      },
    ],
  },
  {
    slug: "kampanyalar-ve-kuponlar",
    title: "Kampanyalar & Kuponlar",
    short: "Kupon kullanımı, HOSGELDIN, paketler",
    icon: "tag",
    description:
      "İndirim kuponu kullanımı, HOSGELDIN kuponu koşulları, kupon sorunları ve kampanya paketleri.",
    articles: [
      {
        slug: "indirim-kuponu-nasil-kullanilir",
        question: "İndirim kuponu nasıl kullanılır?",
        description: "Kupon kodu uygulama: sepet sayfasındaki kupon alanı ve indirimin ödemeye yansıması.",
        shortAnswer:
          "Sepet sayfasındaki kupon alanına kodunuzu yazıp 'Uygula' deyin. Kupon anında doğrulanır, indirim tutarı sepet özetinde görünür ve ödeme adımına otomatik taşınır.",
        keywords: ["kupon", "indirim kodu", "promosyon kodu"],
        sections: [
          { heading: "Kupon Uygulama", body: "Sepet sayfasında kupon kodu alanına kodu girin. Sistem kodu anında doğrular; geçerliyse indirim sepet özetine yansır ve ödeme sayfasına taşınır." },
          { heading: "İndirim Türleri", body: "Kuponlar yüzde indirim, sabit tutar indirimi veya ücretsiz kargo sağlayabilir. Kuponun sağladığı avantaj sepette açıkça gösterilir." },
          { heading: "Tek Kupon Kuralı", body: "Bir siparişte tek kupon kullanılabilir. Kampanyalı ürünlerle kupon birleşimi kuponun koşullarına bağlıdır." },
        ],
      },
      {
        slug: "hosgeldin-kuponu-kimler-kullanabilir",
        question: "HOSGELDIN kuponunu kimler kullanabilir?",
        description: "İlk sipariş kuponu HOSGELDIN'in koşulları: üyelere özel, tek kullanım.",
        shortAnswer:
          "HOSGELDIN kuponu yalnız üye girişi yapmış ve daha önce sipariş vermemiş müşteriler içindir. Misafir olarak kullanılamaz; ilk siparişinizde sepette uygulayabilirsiniz.",
        keywords: ["hoşgeldin", "ilk sipariş indirimi", "yeni üye kuponu"],
        sections: [
          { heading: "Koşullar", body: "Kupon üyelere özeldir ve yalnız ilk siparişte geçerlidir. Üye girişi yapmadan (misafir) kullanılamaz, bu kural kuponun kötüye kullanımını engellemek içindir." },
          { heading: "Nasıl Kullanılır?", body: "Üye olun veya giriş yapın, ürünlerinizi sepete ekleyin. Sepette HOSGELDIN bandı görünüyorsa tek tıkla, görünmüyorsa kupon alanına yazarak uygulayın." },
        ],
      },
      {
        slug: "kuponum-neden-calismiyor",
        question: "Kuponum neden çalışmıyor?",
        description: "Kupon hatalarının yaygın nedenleri: süre, üyelik şartı, minimum tutar, kullanım limiti.",
        shortAnswer:
          "En yaygın nedenler: kuponun süresi dolmuş, minimum sepet tutarı karşılanmamış, kupon üyelere özel (girişsiz kullanılamaz) veya daha önce kullanılmış olması. Sepetteki hata mesajı nedeni belirtir; çözülemezse WhatsApp'tan yazın.",
        keywords: ["kupon hatası", "kupon geçersiz", "kod çalışmıyor"],
        sections: [
          { heading: "Yaygın Nedenler", body: "1) Kuponun geçerlilik süresi dolmuş 2) Minimum sepet tutarı karşılanmamış 3) Kupon üyelere özel, giriş yapmanız gerekir (HOSGELDIN gibi) 4) Kupon daha önce kullanılmış 5) Kod yanlış yazılmış (büyük/küçük harf ve Türkçe karakter kontrolü yapın)." },
          { heading: "Hata Mesajını Okuyun", body: "Sepette kupon uygulandığında sistem gerçek zamanlı doğrulama yapar ve geçersizse nedenini belirten mesaj gösterir." },
          { heading: "Sorun Devam Ediyorsa", body: "Kuponun görselini/kodunu WhatsApp destek hattımıza iletin; ekibimiz kupon durumunu kontrol edip yardımcı olur." },
        ],
      },
      {
        slug: "kampanya-paketleri-nedir",
        question: "Kampanya paketleri nedir?",
        description: "Avantajlı fiyatlı hazır ürün paketleri: açılış paketi, kurumsal set ve dönemsel kampanyalar.",
        shortAnswer:
          "Kampanya paketleri, birlikte sık sipariş edilen ürünlerin (ör. kartvizit + broşür + kaşe) tek pakette indirimli sunulduğu hazır setlerdir. Güncel paketleri /kampanyalar sayfasında bulabilirsiniz.",
        keywords: ["paket", "set", "kampanya", "avantajlı fiyat"],
        sections: [
          { heading: "Paket Mantığı", body: "Yeni açılan işletmelerin veya kurumsal müşterilerin birlikte ihtiyaç duyduğu ürünler tek pakette, tek tek almaya göre indirimli fiyatla sunulur." },
          { heading: "Güncel Kampanyalar", body: "Aktif paketler ve dönemsel kampanyalar /kampanyalar sayfasında listelenir. Paket içeriğindeki ürünlerin ebat/adet seçenekleri pakete göre önceden belirlenmiştir." },
        ],
      },
    ],
  },
  {
    slug: "odeme-ve-fatura",
    title: "Ödeme & Fatura",
    short: "iyzico, taksit, e-Arşiv fatura, güvenlik",
    icon: "card",
    description:
      "Ödeme yöntemleri, taksit seçenekleri, e-Arşiv fatura süreci ve ödeme güvenliği hakkında her şey.",
    articles: [
      {
        slug: "hangi-odeme-yontemleri-var",
        question: "Hangi ödeme yöntemlerini kullanabilirim?",
        description: "Kabul edilen ödeme yöntemleri: iyzico ile kredi/banka kartı, 3D Secure zorunluluğu.",
        shortAnswer:
          "Tüm ödemeler iyzico altyapısı üzerinden kredi veya banka kartıyla, 3D Secure doğrulamalı olarak alınır. Visa, Mastercard, Troy ve American Express kabul edilir. Kurumsal müşteriler için vadeli açık hesap seçeneği ayrıca mevcuttur.",
        keywords: ["ödeme", "kredi kartı", "banka kartı", "iyzico"],
        sections: [
          { heading: "Kart ile Ödeme (iyzico)", body: "Visa, Mastercard, Troy ve American Express logolu tüm kredi/banka kartları kabul edilir. Ödeme, iyzico'nun 3D Secure doğrulamalı güvenli sayfasında tamamlanır." },
          { heading: "Kurumsal Ödeme", body: "Onaylı kurumsal hesap müşterileri 30/60/90 gün vadeli açık fatura ile çalışabilir. Detaylar Kurumsal Hesap kategorisindedir." },
        ],
      },
      {
        slug: "taksit-secenekleri-neler",
        question: "Taksit seçenekleri neler?",
        description: "Taksit imkânları: 100 TL üzeri 3 taksit ücretsiz, bankaya göre 6-9 taksit.",
        shortAnswer:
          "100 TL ve üzeri siparişlerde 3 taksit komisyonsuz olarak sunulur. Kartınızın bankası destekliyorsa 6 ve 9 taksit seçenekleri (banka komisyonuyla) ödeme sayfasında görünür.",
        keywords: ["taksit", "vade farkı", "taksitli ödeme"],
        sections: [
          { heading: "Ücretsiz 3 Taksit", body: "100 TL üzeri tüm siparişlerde 3 taksit standart ve komisyonsuzdur; kredi kartınızın limiti dahilinde otomatik sunulur." },
          { heading: "6 ve 9 Taksit", body: "Bankanızın anlaşma durumuna göre 6 ve 9 taksit seçenekleri komisyon farkıyla sunulabilir. Taksit tutarları ödeme sayfasında kart bilgilerinizi girdikten sonra net olarak listelenir." },
        ],
      },
      {
        slug: "faturami-nasil-alirim",
        question: "Faturamı nasıl alırım?",
        description: "e-Arşiv fatura: otomatik kesim, e-posta gönderimi ve hesap panelinden arşive erişim.",
        shortAnswer:
          "Her sipariş için e-Arşiv fatura otomatik kesilir ve e-postanıza gönderilir. Üyeler ayrıca Hesabım → Faturalarım sayfasından tüm faturalarına ulaşabilir. Bireysel faturada TC kimlik, kurumsal faturada vergi numarası kullanılır.",
        keywords: ["fatura", "e-arşiv", "e-fatura", "vergi"],
        sections: [
          { heading: "Otomatik e-Arşiv Fatura", body: "Faturanız Paraşüt entegrasyonu ile sipariş sonrası otomatik kesilir ve kayıtlı e-postanıza PDF olarak gönderilir." },
          { heading: "Fatura Arşivi", body: "Üyeyseniz tüm geçmiş faturalarınız Hesabım → Faturalarım sayfasında arşivlenir; dilediğiniz zaman indirebilirsiniz." },
          { heading: "Kurumsal Fatura Bilgileri", body: "Firma adına fatura için sipariş sırasında vergi dairesi ve vergi numaranızı girin. Kayıtlı kurumsal bilgilerinizi Hesabım → Bilgilerim'den yönetebilirsiniz." },
        ],
      },
      {
        slug: "odeme-guvenligi-nasil-saglaniyor",
        question: "Ödeme güvenliği nasıl sağlanıyor?",
        description: "PCI-DSS sertifikalı iyzico altyapısı, 3D Secure ve kart bilgisi saklamama politikası.",
        shortAnswer:
          "Kart bilgileriniz Markala sunucularına hiç ulaşmaz; ödeme, PCI-DSS sertifikalı iyzico altyapısında 3D Secure doğrulamasıyla işlenir. Site genelinde SSL şifreleme kullanılır.",
        keywords: ["güvenlik", "3d secure", "kart güvenliği", "ssl"],
        sections: [
          { heading: "Kart Bilgileriniz Bizde Tutulmaz", body: "Ödeme formu iyzico'nun güvenli altyapısında çalışır; kart numaranız Markala'ya iletilmez ve sistemlerimizde saklanmaz." },
          { heading: "3D Secure Zorunlu", body: "Tüm ödemelerde bankanızın SMS/uygulama doğrulaması (3D Secure) zorunludur, kartınız siz onaylamadan kullanılamaz." },
        ],
      },
    ],
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Kargo & Teslimat",
    short: "DHL, süreler, ücretler, hasar durumu",
    icon: "truck",
    description:
      "DHL ile Türkiye geneli teslimat: kargo ücretleri, teslimat süreleri, takip ve hasarlı teslimat süreci.",
    articles: [
      {
        slug: "kargo-ucreti-ne-kadar",
        question: "Kargo ücreti ne kadar?",
        description: "Kargo ücretleri: 1.500 TL üzeri ücretsiz, standart 79 TL, hızlı kargo seçeneği.",
        shortAnswer:
          "1.500 TL ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde 79 TL standart kargo ücreti uygulanır. Acil işleriniz için +89 TL ile hızlı kargo (1 iş günü) talep edebilirsiniz.",
        keywords: ["kargo ücreti", "ücretsiz kargo", "kargo bedava"],
        sections: [
          { heading: "Ücretsiz Kargo Eşiği", body: "Sepet tutarınız 1.500 TL ve üzerindeyse kargo ücretsizdir; eşiğe ne kadar kaldığı sepette gösterilir." },
          { heading: "Standart ve Hızlı Kargo", body: "1.500 TL altı siparişlerde 79 TL standart kargo ücreti alınır. Hızlı kargo (1 iş günü teslim) +89 TL'dir; sipariş notunda belirtmeniz yeterli." },
        ],
      },
      {
        slug: "kargom-nerede-nasil-takip-ederim",
        question: "Kargom nerede, nasıl takip ederim?",
        description: "DHL takip kodu ile kargo takibi ve sitedeki kargo takip sayfasının kullanımı.",
        shortAnswer:
          "Siparişiniz kargoya verildiğinde DHL takip kodu e-postanıza gönderilir. Bu kodla DHL sitesinden veya sipariş numaranız + e-postanızla sitemizdeki /kargo-takip sayfasından anlık durum sorgulayabilirsiniz.",
        keywords: ["kargo takip", "kargom nerede", "takip kodu", "dhl"],
        sections: [
          { heading: "Takip Kodu", body: "Üretim tamamlanıp paket DHL'e teslim edildiğinde takip kodunuz e-posta ile gönderilir; SMS bilgilendirmesi de yapılır." },
          { heading: "Sitede Takip", body: "/kargo-takip sayfasına sipariş numaranızı ve e-postanızı girerek kargonuzun güncel konumunu görebilirsiniz. Üyeler Hesabım → Siparişlerim'den de aynı bilgiye ulaşır." },
          { heading: "Teslimatta Bulunamazsanız", body: "DHL kuryesi adreste kimseyi bulamazsa paket komşuya bırakılmaz; ertesi iş günü tekrar denenir veya en yakın DHL noktasına bırakılır ve size bilgi verilir." },
        ],
      },
      {
        slug: "teslimat-suresi-ne-kadar",
        question: "Teslimat süresi ne kadar?",
        description: "Üretim + kargo süresi: çoğu üründe toplam 3-6 iş günü; şehirlere göre farklar.",
        shortAnswer:
          "Çoğu üründe üretim 2-3 iş günü sürer; buna DHL kargo süresi (1-3 iş günü) eklenir. Toplamda siparişiniz genellikle 3-6 iş günü içinde elinizde olur. Büyük ebatlı veya özel üretim işlerde süre 7 iş gününe uzayabilir.",
        keywords: ["teslimat süresi", "kaç günde gelir", "ne zaman gelir", "üretim süresi"],
        sections: [
          { heading: "Üretim Süresi", body: "Kartvizit, broşür gibi standart işler 2-3 iş günü; branda, tabela, özel kesim gibi işler 3-7 iş günü sürebilir. Her ürünün sayfasında tahmini üretim süresi belirtilir." },
          { heading: "Kargo Süresi", body: "İstanbul, Ankara, İzmir, Bursa, Mersin gibi büyük şehirlere 24-48 saat; Doğu Anadolu illerine 2-3 iş günü; adalar ve uzak bölgelere 3-5 iş günü." },
          { heading: "Acil İşler", body: "Teslim tarihi kritikse sipariş notuna yazın ve WhatsApp'tan bildirin; üretim planına öncelikli alınması ve hızlı kargo seçeneği için ekibimiz yardımcı olur." },
        ],
      },
      {
        slug: "kargom-hasarli-geldi-ne-yapmaliyim",
        question: "Kargom hasarlı geldi, ne yapmalıyım?",
        description: "Hasarlı teslimat süreci: kurye tutanağı, 7 gün içinde fotoğraflı bildirim, ücretsiz yenileme.",
        shortAnswer:
          "Pakette belirgin hasar varsa teslim sırasında kuryeye 'hasarlı teslim alındı' tutanağı tutturun. 7 gün içinde ürün ve paket fotoğraflarıyla merhaba@markala.com.tr adresine veya WhatsApp'a bildirin, hasar onaylanırsa ürününüz ücretsiz yenilenir.",
        keywords: ["hasar", "kırık", "ezik", "hasarlı paket"],
        sections: [
          { heading: "Teslim Anında", body: "Paketi kurye yanındayken kontrol etmenizi öneririz. Belirgin ezilme/ıslanma varsa tutanak tutturun: bu, sürecin en hızlı ilerlemesini sağlar." },
          { heading: "7 Gün İçinde Bildirim", body: "Hasarı fark ettiğinizde ürünün ve paketin fotoğraflarını çekip 7 gün içinde bize iletin. Müşteri hizmetleri 24 saat içinde değerlendirir." },
          { heading: "Çözüm", body: "Kargo kaynaklı hasar onaylanırsa ürününüz ücretsiz olarak yeniden üretilir ve gönderilir; dilerseniz ücret iadesi de seçilebilir." },
        ],
      },
    ],
  },
  {
    slug: "iade-ve-iptal",
    title: "İade & İptal",
    short: "Cayma hakkı, tolerans, hatalı ürün",
    icon: "return",
    description:
      "Kişiye özel üretimde iade koşulları, üretim toleransı, hatalı/kusurlu ürün süreci ve ücret iadesi.",
    articles: [
      {
        slug: "kisiye-ozel-urunlerde-cayma-hakki-var-mi",
        question: "Kişiye özel ürünlerde cayma hakkı var mı?",
        description: "Mesafeli Sözleşmeler Yönetmeliği 15/1-ç: kişiye özel üretimde cayma hakkı istisnası.",
        shortAnswer:
          "Baskı ürünleri kişiye/firmaya özel üretildiğinden Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-ç maddesi gereği cayma hakkı kapsamı dışındadır. Ancak üretim başlamadan önce siparişinizi koşulsuz iptal edebilirsiniz; üretim veya kargo hatalarında da ücretsiz yenileme/iade hakkınız saklıdır.",
        keywords: ["cayma hakkı", "iade hakkı", "14 gün", "iade edilir mi"],
        sections: [
          { heading: "Yasal Çerçeve", body: "Mesafeli Sözleşmeler Yönetmeliği m.15/1-ç: 'tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallar' cayma hakkının istisnasıdır. Adınıza/firmanıza özel basılan her ürün bu kapsamdadır." },
          { heading: "İstisnanın İstisnaları", body: "Üretim hatası (yanlış renk, kayma, ebat hatası), kargo hasarı veya eksik gönderim durumlarında cayma hakkından bağımsız olarak ücretsiz yenileme veya iade hakkınız her zaman vardır." },
          { heading: "Üretim Öncesi İptal", body: "Sipariş üretime alınmadan iptal ederseniz ödemenizin tamamı 5 iş günü içinde iade edilir." },
        ],
      },
      {
        slug: "uretim-toleransi-nedir",
        question: "Üretim toleransı (%1-5 fire) nedir?",
        description: "Matbaa sektöründe adet, renk ve ölçü toleransı: %1-5 fire standardının anlamı.",
        shortAnswer:
          "Matbaa üretiminde makine kaynaklı olarak adet, renk ve ölçülerde %1-5 arası sapma (fire) olabilir; bu sektör standardıdır ve sipariş onayıyla kabul edilmiş sayılır. Tolerans aralığı içindeki farklar iade/değişim konusu değildir.",
        keywords: ["tolerans", "fire", "eksik adet", "renk farkı"],
        sections: [
          { heading: "Fire Nedir?", body: "Baskı makineleri kalibrasyon ve kesim süreçlerinde küçük sapmalar üretir: sipariş ettiğinizden %1-5 az/fazla adet, ekran-baskı arasında hafif renk tonu farkı veya milimetrik ölçü farkı normaldir." },
          { heading: "Neden Kabul Edilmiş Sayılır?", body: "Bu tolerans matbaa sektörünün teknik gerçeğidir ve satış sözleşmesi şartlarındandır; dünya genelinde de aynı aralık uygulanır." },
          { heading: "Tolerans Dışı Durumlar", body: "%5'i aşan eksik adet, belirgin renk sapması veya ölçü hatası üretim hatası sayılır ve ücretsiz yenileme kapsamındadır, fotoğraflı bildirim yapmanız yeterli." },
        ],
      },
      {
        slug: "hatali-veya-kusurlu-urun-geldi-ne-yapmaliyim",
        question: "Hatalı veya kusurlu ürün geldi, ne yapmalıyım?",
        description: "Üretim hatası süreci: fotoğraflı bildirim, 24 saatte değerlendirme, ücretsiz yenileme veya iade.",
        shortAnswer:
          "Ürün ve hatanın fotoğraflarını merhaba@markala.com.tr adresine veya WhatsApp'a gönderin. Müşteri hizmetleri 24 saat içinde değerlendirir; hata onaylanırsa ürün ücretsiz iade kargosuyla alınır, yenileme veya ücret iadesi 5 iş günü içinde tamamlanır.",
        keywords: ["hatalı ürün", "kusurlu", "yanlış baskı", "baskı hatası"],
        sections: [
          { heading: "Hangi Durumlar Üretim Hatasıdır?", body: "Onayladığınız taslaktan farklı renk basılması, baskı kayması, mürekkep akması, toleransı aşan ebat/adet hatası, yanlış malzeme kullanımı ve eksik gönderim." },
          { heading: "Bildirim Süreci", body: "1) Fotoğraflarla bildirim yapın 2) 24 saat içinde değerlendirme 3) Onaylanırsa ürün ücretsiz iade kargosuyla alınır 4) Yenileme veya iade 5 iş günü içinde tamamlanır." },
          { heading: "İade Tutarının Yansıması", body: "İade, ödediğiniz karta yapılır. Bankanıza bağlı olarak ekstrede görünmesi 1-3 hafta sürebilir." },
        ],
      },
    ],
  },
  {
    slug: "kurumsal-hesap",
    title: "Kurumsal Hesap",
    short: "Cari hesap, vade, özel fiyat anlaşması",
    icon: "building",
    description:
      "B2B müşteriler için kurumsal hesap: avantajlar, başvuru süreci, açık hesap ve vade seçenekleri.",
    articles: [
      {
        slug: "kurumsal-hesap-nedir-avantajlari-neler",
        question: "Kurumsal hesap nedir, avantajları neler?",
        description: "B2B kurumsal hesap: özel fiyat, vadeli fatura, konsolide faturalama, öncelikli üretim.",
        shortAnswer:
          "Kurumsal hesap, düzenli baskı ihtiyacı olan firmalara özel gelişmiş üyeliktir: %5-15 özel fiyat anlaşması, 30/60/90 gün vadeli açık fatura, ay sonu tek konsolide fatura, adanmış müşteri yöneticisi ve öncelikli üretim hattı sunar.",
        keywords: ["kurumsal", "b2b", "firma hesabı", "toplu alım"],
        sections: [
          { heading: "Kimler İçin?", body: "Restoranlar, oteller, klinikler, eczaneler, oto galerileri, eğitim kurumları, belediyeler ve KOBİ'ler, aylık düzenli sipariş veren her firma kurumsal hesap için uygundur." },
          { heading: "Avantajlar", body: "1) %5-15 arası özel fiyat anlaşması 2) 30/60/90 gün vadeli fatura 3) Ay sonu konsolide tek fatura 4) Adanmış müşteri yöneticisi 5) Öncelikli üretim 6) Sipariş öncesi proof onay süreci 7) Panelden cari hesap takibi." },
        ],
      },
      {
        slug: "kurumsal-hesap-basvurusu-nasil-yapilir",
        question: "Kurumsal hesap başvurusu nasıl yapılır?",
        description: "Kurumsal başvuru adımları: belgeler, değerlendirme süresi ve hesap aktivasyonu.",
        shortAnswer:
          "/kurumsal sayfasından veya kurumsal@markala.com.tr adresinden başvurun; vergi levhası ve imza sirküleri yeterlidir. Başvurunuz 24 saat içinde değerlendirilir, onay sonrası anlaşma metni imzalanır ve hesabınız aktive edilir.",
        keywords: ["kurumsal başvuru", "cari hesap açma", "vergi levhası"],
        sections: [
          { heading: "Başvuru Adımları", body: "1) /kurumsal sayfasındaki formu doldurun veya kurumsal@markala.com.tr adresine yazın 2) Vergi levhası ve imza sirkülerinizi yükleyin 3) 24 saat içinde değerlendirme yapılır 4) Onay sonrası özel anlaşma metni hazırlanır 5) İmza sonrası hesabınız aktive edilir." },
          { heading: "Başvuru Sonrası", body: "Size bir müşteri yöneticisi atanır; fiyat anlaşmanız sipariş hacminize göre belirlenir ve tüm siparişlerinizde otomatik uygulanır." },
        ],
      },
      {
        slug: "acik-hesap-ve-vade-nasil-calisir",
        question: "Açık hesap ve vade nasıl çalışır?",
        description: "Kurumsal açık hesap: vadeli fatura, konsolide faturalama ve cari hesap takibi.",
        shortAnswer:
          "Onaylı kurumsal müşteriler siparişlerini anında ödeme yapmadan verir; faturalar anlaşmaya göre 30/60/90 gün vadeyle kesilir. Ay sonunda tüm siparişler tek konsolide faturada birleştirilebilir; bakiyenizi Hesabım → Cari Hesabım sayfasından takip edersiniz.",
        keywords: ["açık hesap", "vade", "cari", "konsolide fatura"],
        sections: [
          { heading: "Vadeli Çalışma", body: "Anlaşmanızdaki vade (30/60/90 gün) fatura tarihinden itibaren işler. Ödemeler havale/EFT ile yapılır; kart ile erken ödeme de mümkündür." },
          { heading: "Cari Hesap Takibi", body: "Hesabım → Cari Hesabım sayfasında güncel bakiye, fatura ve ödeme geçmişinizi görebilirsiniz; ekstre talebi için müşteri yöneticinize yazmanız yeterli." },
        ],
      },
    ],
  },
];

/** Kategori slug → kategori. */
export function getHelpCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug);
}

/** Kategori + makale slug → makale. */
export function getHelpArticle(
  categorySlug: string,
  articleSlug: string,
): { category: HelpCategory; article: HelpArticle } | undefined {
  const category = getHelpCategory(categorySlug);
  const article = category?.articles.find((a) => a.slug === articleSlug);
  return category && article ? { category, article } : undefined;
}

/** Hub'daki "Popüler Sorular" — en çok aranan konular, elle seçildi. */
export const POPULAR_HELP: Array<{ q: string; href: string }> = [
  { q: "Baskıya hazır dosya nasıl hazırlanır?", href: "/yardim/tasarim-ve-dosya/baskiya-hazir-dosya-nasil-hazirlanir" },
  { q: "Teslimat süresi ne kadar?", href: "/yardim/kargo-ve-teslimat/teslimat-suresi-ne-kadar" },
  { q: "Kargo ücreti ne kadar?", href: "/yardim/kargo-ve-teslimat/kargo-ucreti-ne-kadar" },
  { q: "Üretim toleransı (%1-5 fire) nedir?", href: "/yardim/iade-ve-iptal/uretim-toleransi-nedir" },
  { q: "Tasarımım yok, tasarım desteği nasıl çalışır?", href: "/yardim/tasarim-ve-dosya/tasarim-destegi-nasil-calisir" },
  { q: "Siparişimi nasıl iptal edebilirim?", href: "/yardim/siparis-sureci/siparisimi-nasil-iptal-edebilirim" },
  { q: "Kurumsal hesap nedir, avantajları neler?", href: "/yardim/kurumsal-hesap/kurumsal-hesap-nedir-avantajlari-neler" },
  { q: "İndirim kuponu nasıl kullanılır?", href: "/yardim/kampanyalar-ve-kuponlar/indirim-kuponu-nasil-kullanilir" },
];

/**
 * Makale → şehir hub linkleri (SEO iç bağlantı siloları).
 * Yalnız konuyla mantıklı eşleşen makalede basılır (spam değil) — eski
 * yardim/[slug] rotasındaki articleCityLinks mantığının devamı.
 */
export const HELP_CITY_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  "baskiya-hazir-dosya-nasil-hazirlanir": [
    { label: "Mersin'de baskı hizmetimiz", href: "/matbaa/mersin" },
    { label: "Adana matbaa & baskı", href: "/matbaa/adana" },
  ],
  "teslimat-suresi-ne-kadar": [
    { label: "Antalya'ya baskı kargosu", href: "/matbaa/antalya" },
    { label: "Gaziantep'e baskı kargosu", href: "/matbaa/gaziantep" },
  ],
  "siparis-nasil-olusturulur": [
    { label: "Mersin matbaa siparişi", href: "/matbaa/mersin" },
  ],
};

/** Sitemap için tüm yardım merkezi yolları (hub hariç; /yardim zaten statik listede). */
export function getHelpPaths(): Array<{ path: string; priority: number }> {
  const paths: Array<{ path: string; priority: number }> = [{ path: "/yardim/sss", priority: 0.6 }];
  for (const cat of HELP_CATEGORIES) {
    paths.push({ path: `/yardim/${cat.slug}`, priority: 0.6 });
    for (const a of cat.articles) {
      paths.push({ path: `/yardim/${cat.slug}/${a.slug}`, priority: 0.55 });
    }
  }
  return paths;
}
