/**
 * Yasal sayfa içerikleri.
 *
 * Tüzel kişilik:
 *   324 Ajans Bilgi Teknolojileri Ltd. Şti.
 *   markala.com.tr alt markası 324 Ajans tarafından yönetilir.
 *   Tüm yasal sorumluluklar 324 Ajans Bilgi Teknolojileri Ltd. Şti.'nde'dir.
 *
 * NOT: Bu metinler sektör (baskıkapında, bidolubaskı vb.) standartlarına göre
 * derlenmiş örnek metinlerdir. Yayına almadan önce hukuk müşaviri kontrolü zorunludur.
 */

export interface LegalPage {
  slug: string;
  title: string;
  lastUpdated: string;
  body: string;
}

const COMPANY = "324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Tic. Ltd. Şti.";
const BRAND = "markala.com.tr";

// ─────────────────────────────────────────────────────────────────────────────
// 324 Ajans BT resmi bilgileri — galagoai dökümanlarından doğrulandı (2026-05).
// Kaynak: c:\Users\Hasan\Projects\galagoai\docs\legal\KVKK-AYDINLATMA-METNI-2026-05-13.md
// ─────────────────────────────────────────────────────────────────────────────

const ADDRESS = "Çiftlikköy Mah. 32182 Sk. Astoria One No: 13 İç Kapı No: 61, Yenişehir / Mersin";
const TAX_OFFICE = "İstiklal Vergi Dairesi";
const TAX_NUMBER = "0012655788";
const MERSIS = "0001265578800001";
const TRADE_REGISTRY = "Mersin Ticaret Sicil 66377";
// 324 Ajans için resmi KEP henüz alınmadı — alındığında doldur (PTT'den)
const KEP = "[BAŞVURU BEKLEMEDE — PTT'den 324ajans@hs01.kep.tr formatında al]";
const VERBIS_NO = "[BAŞVURU BEKLEMEDE — VERBİS kaydı sonrası eklenecek]";
const ETBIS_NO = "[BAŞVURU BEKLEMEDE — ETBİS kaydı sonrası eklenecek]";

const EMAIL = "merhaba@markala.com.tr";
const PHONE = "0324 433 33 51";

export const legalPages: Record<string, LegalPage> = {
  // ====================================================================
  // KVKK AYDINLATMA METNİ
  // ====================================================================
  kvkk: {
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni",
    lastUpdated: "2026-06-16",
    body: `
      <h2>1. Veri Sorumlusunun Kimliği</h2>
      <p>
        İşbu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK")'nun
        10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve
        Esaslar Hakkında Tebliğ kapsamında veri sorumlusu sıfatıyla
        <strong>${COMPANY}</strong> ("Şirket") tarafından hazırlanmıştır.
      </p>
      <p>
        ${BRAND} alt markası, ${COMPANY} bünyesinde yönetilen bir e-ticaret platformudur.
        Platform üzerinden gerçekleştirilen tüm işlemlerden kaynaklanan kişisel veri işleme
        sorumluluğu Şirket'e aittir.
      </p>
      <p>
        <strong>VERBİS Kaydı:</strong> ${COMPANY}, Kişisel Verileri Koruma Kurulu nezdinde
        tutulan Veri Sorumluları Sicil Bilgi Sistemi'ne (VERBİS) kayıtlı veri sorumlusudur.
        VERBİS kayıt numarası: <strong>${VERBIS_NO}</strong>.
      </p>

      <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
      <ul>
        <li><strong>Kimlik bilgileri:</strong> Ad, soyad, T.C. kimlik no, doğum tarihi (e-arşiv için).</li>
        <li><strong>İletişim bilgileri:</strong> E-posta adresi, telefon numarası, teslimat adresi, fatura adresi.</li>
        <li><strong>Müşteri işlem bilgileri:</strong> Sipariş geçmişi, sipariş tutarları, tasarım dosyaları, talep ve şikayet kayıtları.</li>
        <li><strong>Ödeme bilgileri:</strong> Kart bilgileri tarafımıza ulaşmaz; iyzico Ödeme Hizmetleri A.Ş. tarafından PCI-DSS uyumlu altyapı üzerinden işlenir.</li>
        <li><strong>Pazarlama bilgileri:</strong> Çerezler, IP adresi, cihaz bilgileri, tarayıcı bilgileri (açık rıza ile).</li>
        <li><strong>Hukuki işlem bilgileri:</strong> Yasal süreçler, yetkili makamlardan gelen talepler.</li>
      </ul>

      <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
      <p>Kişisel verileriniz aşağıdaki amaçlarla işlenir:</p>
      <ul>
        <li>Sipariş süreçlerinin yürütülmesi (üretim, paketleme, kargo)</li>
        <li>Müşteri ilişkileri yönetimi ve müşteri memnuniyeti faaliyetleri</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi (e-fatura, e-arşiv, vergi)</li>
        <li>Mesafeli sözleşme kapsamındaki yükümlülüklerin ifası</li>
        <li>Pazarlama ve reklam faaliyetleri (açık rıza ile)</li>
        <li>İstatistiksel analiz ve hizmet kalitesinin geliştirilmesi</li>
        <li>Hukuki süreçlerin yürütülmesi ve yasal taleplere yanıt verilmesi</li>
      </ul>

      <h2>4. Kişisel Verilerin Aktarıldığı Taraflar</h2>
      <p>Kişisel verileriniz, hizmet alımının zorunlu kıldığı kapsamda aşağıdaki kuruluşlara aktarılır:</p>
      <ul>
        <li><strong>iyzico Ödeme Hizmetleri A.Ş.:</strong> Ödeme işlemlerinin gerçekleştirilmesi.</li>
        <li><strong>DHL Türkiye:</strong> Kargo teslimat süreçlerinin yürütülmesi.</li>
        <li><strong>Paraşüt Yazılım A.Ş.:</strong> E-fatura ve e-arşiv süreçlerinin yönetimi.</li>
        <li><strong>SendGrid (Twilio Inc.):</strong> İşlem bildirimi mailleri.</li>
        <li><strong>NetGSM:</strong> Sipariş aşaması SMS bildirimleri.</li>
        <li><strong>Cloudflare R2 (Cloudflare Inc.):</strong> Tasarım dosyalarının güvenli depolanması.</li>
        <li><strong>Yetkili kamu kurum ve kuruluşları:</strong> Yasal talep halinde.</li>
      </ul>

      <h2>4.A. Yurt Dışına Aktarım ve Alt İşleyici Durumu</h2>
      <p>
        Aşağıdaki hizmet sağlayıcılar veri işleme sürecinde yurt dışı sunucular kullanır.
        Her biri ile Veri İşleyen Sözleşmesi (DPA) / Standart Sözleşme Maddeleri (SCC) kapsamında çalışılmaktadır:
      </p>
      <ul>
        <li><strong>Cloudflare R2</strong> (ABD/AB) — dosya depolama; Cloudflare DPA ve SCC imzalı</li>
        <li><strong>Google Analytics 4</strong> (ABD) — anonimleştirilmiş trafik analizi; Google Consent Mode v2 ile IP kısaltması zorunlu</li>
        <li><strong>Microsoft Clarity</strong> (ABD/AB) — oturum kaydı ve ısı haritası; yalnızca kullanıcı "kişiselleştirme" çerezi onayını verirse yüklenir</li>
        <li><strong>Meta Pixel</strong> (ABD) — pazarlama; yalnızca kullanıcı "pazarlama" çerezi onayını verirse aktif</li>
        <li><strong>SendGrid (Twilio Inc.)</strong> (ABD) — transactional e-posta; Twilio DPA ve SCC imzalı</li>
      </ul>
      <p>
        Tüm aktarımlar <strong>standart sözleşme şartları (SCC)</strong> veya
        <strong>yeterli koruma kararı</strong> çerçevesinde, KVKK m.9 hükümleri uyarınca yapılır.
        Aktarım güvenceleri hakkında bilgi talep edebilirsiniz (bkz. Bölüm 8 — Başvuru Yöntemi).
      </p>

      <h2>5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</h2>
      <p>
        Kişisel verileriniz; siteye üyelik formu, sipariş formu, iletişim formu,
        çerezler, sosyal medya entegrasyonları ve müşteri hizmetleri kayıtları
        aracılığıyla otomatik veya kısmen otomatik yollarla elektronik ortamda toplanır.
      </p>
      <p>Hukuki sebepler:</p>
      <ul>
        <li>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</li>
        <li>Hukuki yükümlülüğün yerine getirilmesi (KVKK m.5/2-ç)</li>
        <li>Meşru menfaat (KVKK m.5/2-f)</li>
        <li>Açık rıza (pazarlama amaçlı işlemeler için — KVKK m.5/1)</li>
      </ul>

      <h2>6. Veri Saklama Süreleri</h2>
      <ul>
        <li>Müşteri kimlik ve iletişim bilgileri: <strong>10 yıl</strong> (Türk Ticaret Kanunu)</li>
        <li>Sipariş ve fatura bilgileri: <strong>10 yıl</strong> (Vergi Usul Kanunu)</li>
        <li>Tasarım dosyaları: hesabınız aktif kaldığı sürece + iptal sonrası 30 gün</li>
        <li>Çerez verileri: 12 ay</li>
        <li>Pazarlama izinleri: rıza geri çekilene kadar</li>
      </ul>

      <h2>7. KVKK Kapsamındaki Haklarınız</h2>
      <p>KVKK'nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>Verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme</li>
        <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
        <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme</li>
        <li>Düzeltme/silme/yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
        <li>Otomatik sistemler vasıtasıyla aleyhinize bir sonucun çıkmasına itiraz etme</li>
        <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme</li>
      </ul>

      <h2>8. Başvuru Yöntemi</h2>
      <p>KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki yollarla başvurabilirsiniz:</p>
      <ul>
        <li><strong>Online Form (Önerilen):</strong> <a href="/kvkk-basvuru">markala.com.tr/kvkk-basvuru</a> — Kimlik doğrulamalı dijital başvuru kanalı</li>
        <li><strong>E-posta:</strong> <a href="mailto:${EMAIL}">${EMAIL}</a> (Konu: KVKK Başvuru)</li>
        <li><strong>Yazılı başvuru:</strong> ${COMPANY}, ${ADDRESS}</li>
        <li><strong>KEP:</strong> ${KEP}</li>
      </ul>
      <p>
        Başvurularınız KVKK'nın 13. maddesi gereğince en geç <strong>30 gün</strong>
        içinde sonuçlandırılır. İşlem ücretsizdir; ancak işlem ek bir maliyet gerektiriyorsa
        Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret talep edilebilir.
      </p>
      <p>
        <em>Online formu kullanmanız önerilir: başvurunuza otomatik takip numarası atanır
        ve süreç 30 gün içinde e-posta ile sonuçlandırılır.</em>
      </p>

      <h2>9. Değişiklikler</h2>
      <p>
        Şirket, işbu aydınlatma metnini gerekli gördüğünde tek taraflı olarak güncelleme
        hakkını saklı tutar. Güncel metin daima ${BRAND}/yasal/kvkk adresinde yayınlanır.
      </p>
    `,
  },

  // ====================================================================
  // MESAFELİ SATIŞ SÖZLEŞMESİ
  // ====================================================================
  "mesafeli-satis": {
    slug: "mesafeli-satis",
    title: "Mesafeli Satış Sözleşmesi",
    lastUpdated: "2026-06-16",
    body: `
      <h2>MADDE 1 – TARAFLAR</h2>
      <p><strong>SATICI:</strong></p>
      <ul>
        <li>Unvan: ${COMPANY}</li>
        <li>Adres: ${ADDRESS}</li>
        <li>Vergi Dairesi / No: ${TAX_OFFICE} / ${TAX_NUMBER}</li>
        <li>MERSİS: ${MERSIS}</li>
        <li>Telefon: ${PHONE}</li>
        <li>E-posta: ${EMAIL}</li>
        <li>Marka: ${BRAND} (${COMPANY}'nin yönettiği e-ticaret platformudur)</li>
      </ul>
      <p><strong>ALICI:</strong> Sipariş formunda bilgileri belirtilen müşteri.</p>

      <h2>MADDE 2 – SÖZLEŞMENİN KONUSU</h2>
      <p>
        İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait ${BRAND} alan adlı internet sitesi
        üzerinden elektronik ortamda siparişini yaptığı, niteliği ve satış fiyatı sipariş
        özetinde belirtilen ürünün satışı ve teslimine ilişkin olarak 6502 sayılı
        Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler Yönetmeliği
        hükümleri uyarınca tarafların hak ve yükümlülüklerinin düzenlenmesidir.
      </p>

      <h2>MADDE 3 – SÖZLEŞME KONUSU ÜRÜN, ÖDEME VE TESLİMAT BİLGİLERİ</h2>
      <p>
        Ürün/ürünlerin türü, miktarı, marka/modeli, satış bedeli, ödeme şekli, alıcısı ve
        teslimat bilgileri sipariş özetinde gösterildiği şekildedir. Bu bilgiler işbu
        sözleşmenin ayrılmaz bir parçasıdır.
      </p>

      <h2>MADDE 4 – GENEL HÜKÜMLER</h2>
      <p>
        4.1. ALICI, ${BRAND}'da satışa sunulan sözleşme konusu ürünün temel nitelikleri,
        satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi
        olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul ve beyan eder.
      </p>
      <p>
        4.2. Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşuluyla her bir ürün
        için ALICI'nın yerleşim yerinin uzaklığına bağlı olarak ön bilgiler içinde
        açıklanan süre içinde ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir.
      </p>
      <p>
        4.3. Sözleşme konusu ürünün teslimatı için ALICI, sipariş bedelinin ödenmiş olması
        şartı aranır. Herhangi bir nedenle ürün bedeli ödenmez veya banka kayıtlarında
        iptal edilir ise SATICI ürünün teslimi yükümlülüğünden kurtulmuş kabul edilir.
      </p>
      <p>
        4.4. Ürünün tesliminden sonra ALICI'ya ait kredi kartının ALICI'nın kusurundan
        kaynaklanmayan bir şekilde yetkisiz kişilerce haksız kullanılması nedeni ile ilgili
        banka veya finans kuruluşunun ürün bedelini SATICI'ya ödememesi halinde, ALICI'nın
        kendisine teslim edilmiş olan ürünü 3 (üç) gün içinde SATICI'ya iade etmesi gerekir.
      </p>
      <p>
        4.5. SATICI mücbir sebepler veya nakliyeyi engelleyen olağanüstü durumlar nedeni
        ile sözleşme konusu ürünü süresi içinde teslim edemez ise durumu ALICI'ya
        bildirmekle yükümlüdür.
      </p>

      <h2>MADDE 5 – CAYMA HAKKININ KULLANILAMAYACAĞI ÜRÜNLER</h2>
      <p>
        6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
        Yönetmeliği'nin 15. maddesi gereğince aşağıdaki ürünlerde cayma hakkı kullanılamaz:
      </p>
      <ul>
        <li><strong>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler</strong> (kişiye özel kartvizit, branda, kupa, kaşe, plaket vb. tüm baskı ve matbaa ürünleri)</li>
        <li>Niteliği itibarıyla iade edilemeyecek ürünler</li>
        <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler</li>
      </ul>
      <p>
        ${BRAND} bünyesinde satışa sunulan ürünlerin tamamı kişiye/firmaya özel
        üretildiğinden, <strong>cayma hakkı kullanılamaz</strong>. Üretim hatası veya
        teslimat hasarı halinde ücretsiz değişim/iade hakkı saklıdır (bkz. Madde 7).
      </p>

      <h2>MADDE 6 – TESLİMAT MASRAFLARI</h2>
      <p>
        Kargo ücreti sipariş özetinde gösterilir. ${BRAND} 1.500 TL ve üzeri siparişlerde
        kargo ücretsizdir. İade durumunda kargo ücreti, üretim hatası SATICI'dan
        kaynaklı ise SATICI tarafından, ALICI'nın talebiyle iadelerde ALICI tarafından
        karşılanır.
      </p>

      <h2>MADDE 7 – ÜRÜN HATASI VE GARANTİ</h2>
      <p>
        Üretim hatası, baskı hatası veya teslimat sırasında oluşan hasar durumlarında
        ALICI, ürünü teslim aldığı tarihten itibaren <strong>7 gün</strong> içinde
        ${EMAIL} adresine fotoğraflı bildirim yaparak iade/değişim talep edebilir. Talep
        SATICI tarafından incelendikten sonra haklı bulunması durumunda ürün ücretsiz
        olarak yenilenir veya tutar iade edilir.
      </p>
      <p>
        Şu durumlar SATICI sorumluluğu dışındadır:
      </p>
      <ul>
        <li>ALICI'nın yüklediği tasarım dosyasındaki hata, hatalı renk profili (RGB yerine CMYK gönderilmemesi), düşük çözünürlük, taşma payı eksikliği</li>
        <li>ALICI'nın onay verdiği taslak/proof üzerinden üretilen siparişin sonradan beğenilmemesi</li>
        <li>ALICI'nın hatalı/yanlış adres vermesi sonucu oluşan teslimat sorunları</li>
        <li><strong>Üretim toleransı:</strong> Matbaa üretim süreçlerinin doğası gereği <strong>siparişin renk, adet ve ölçülerinde %1 ila %5 arasında fire</strong> oluşabilir. Bu tolerans aralığı sektör standardıdır ve SATICI sorumluluğu dışındadır; iade/değişim talebine konu edilemez.</li>
      </ul>

      <h2>MADDE 7.A – ÜRETİM TOLERANSI (FİRE)</h2>
      <p>
        Matbaa sektörünün <strong>TSE ve ISO standartlarına uygun olarak</strong>, üretim sürecinde
        aşağıdaki tolerans aralıkları kabul edilir:
      </p>
      <ul>
        <li><strong>Adet toleransı: %1-5 fire</strong> — sipariş edilen miktar üzerinde eksik veya fazla teslimat yapılabilir.</li>
        <li><strong>Renk toleransı: %2-3</strong> — ekran (RGB) ile baskı (CMYK) arasında doğal sapma; Pantone garantili işlerde %0 hedeflenir.</li>
        <li><strong>Kesim toleransı: ±2 mm</strong> — kesim aşamasında oluşabilir.</li>
      </ul>
      <p>
        Bu toleranslar sektörel standart olup sipariş onayında <strong>otomatik kabul edilmiş sayılır</strong>.
        %5'i aşan eksik tesliminde ücretsiz yeniden üretim veya bedel iadesi yapılır.
      </p>
      <p>
        ${BRAND} bünyesindeki tüm matbaa ürünleri (kartvizit, broşür, el ilanı, afiş, antetli kâğıt, zarf,
        etiket, makbuz, bloknot, çanta vb.) profesyonel matbaa üretim süreçlerinde gerçekleştirilir. ALICI
        sipariş verdiğinde işbu sözleşmeyi onaylayarak bu fire toleransını okumuş, anlamış ve kabul etmiş
        sayılır.
      </p>

      <h2>MADDE 8 – TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</h2>
      <p>
        ALICI ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düşmesi halinde,
        kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini
        ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder.
      </p>

      <h2>MADDE 9 – YETKİLİ MAHKEME</h2>
      <p>
        İşbu sözleşmeden doğan uyuşmazlıklarda Sanayi ve Ticaret Bakanlığı'nca her yıl ilan
        edilen değere kadar Tüketici Hakem Heyetleri, bu değeri aşan uyuşmazlıklarda
        Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>MADDE 10 – YÜRÜRLÜK</h2>
      <p>
        ALICI, sipariş onayından sonra işbu sözleşmenin tüm maddelerini okuduğunu, kabul
        ettiğini ve sözleşme gereğince hareket etmeyi kabul ve taahhüt etmiştir. İşbu
        sözleşme elektronik ortamda kurulmuş olup, ALICI'nın siparişi onaylaması ile
        yürürlüğe girer.
      </p>
    `,
  },

  // ====================================================================
  // ÇEREZ POLİTİKASI
  // ====================================================================
  cerez: {
    slug: "cerez",
    title: "Çerez Politikası",
    lastUpdated: "2026-06-16",
    body: `
      <p>
        ${BRAND} ("Site"), ${COMPANY} tarafından yönetilmektedir. İşbu Çerez Politikası,
        Site'de kullanılan çerezler ve benzeri teknolojiler hakkında bilgilendirme amacıyla
        hazırlanmıştır.
      </p>

      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerezler, ziyaret ettiğiniz web sitelerinin tarayıcınız aracılığıyla cihazınıza
        depoladığı küçük metin dosyalarıdır. Site'nin doğru çalışmasını, kullanıcı
        deneyimini iyileştirmeyi ve istatistiksel analiz yapmayı sağlar.
      </p>

      <h2>2. Kullandığımız Çerez Türleri</h2>

      <h3>2.1. Zorunlu Çerezler</h3>
      <p>
        Bu çerezler Site'nin temel işlevleri için zorunludur ve kapatılamaz. Bunlar
        olmadan sepet, oturum yönetimi ve güvenlik gibi özellikler çalışamaz.
      </p>
      <ul>
        <li><code>markala-cart</code>: Sepet içeriğinin saklanması</li>
        <li><code>markala-auth</code>: Oturum yönetimi</li>
        <li><code>markala-orders</code>: Sipariş geçmişi (yerel önbellek)</li>
      </ul>

      <h3>2.2. Performans ve Analitik Çerezler</h3>
      <p>Anonimleştirilmiş trafik verisiyle Site'yi iyileştirmek için kullanılır:</p>
      <ul>
        <li><strong>Google Analytics 4 (GA4):</strong> Ziyaretçi sayısı, sayfa görüntüleme, dönüşüm oranları. IP adresi kısaltılır; kişisel kimlik toplanmaz. Google Consent Mode v2 ile yönetilir.</li>
      </ul>

      <h3>2.3. Kişiselleştirme Çerezleri</h3>
      <p>Kullanıcı deneyimini geliştirmeye yönelik davranışsal analiz çerezleridir:</p>
      <ul>
        <li><strong>Microsoft Clarity:</strong> Isı haritası ve oturum kaydı. Gezinme davranışı anonimleştirilmiş olarak işlenir. KVKK m.4/2-ç kapsamında ayrı rıza gerektirir.</li>
      </ul>

      <h3>2.4. Pazarlama Çerezleri</h3>
      <p>İlgi alanlarınıza yönelik reklam göstermek için kullanılır:</p>
      <ul>
        <li><strong>Meta (Facebook) Pixel:</strong> Yeniden hedefleme reklamları</li>
        <li><strong>Google Ads:</strong> Dönüşüm takibi ve yeniden pazarlama</li>
      </ul>

      <h2>3. Çerez Tercihleri</h2>
      <p>
        Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Ancak
        zorunlu çerezleri devre dışı bırakırsanız Site'nin bazı özellikleri çalışmaz
        (örn. sepet, oturum).
      </p>
      <p>
        Tarayıcılarınızdan çerez ayarlarını yönetme yöntemleri:
      </p>
      <ul>
        <li>Chrome: Ayarlar → Gizlilik ve güvenlik → Çerezler ve diğer site verileri</li>
        <li>Safari: Tercihler → Gizlilik → Çerezleri ve web sitesi verilerini yönet</li>
        <li>Firefox: Tercihler → Gizlilik ve güvenlik → Çerezler ve site verileri</li>
        <li>Edge: Ayarlar → Çerezler ve site izinleri</li>
      </ul>

      <h2>4. Üçüncü Taraf Çerezler</h2>
      <p>
        Site'de Google, Meta, Microsoft gibi üçüncü taraf hizmet sağlayıcıların çerezleri
        de kullanılmaktadır. Bu çerezlerin saklanması ve işlenmesi ilgili sağlayıcının
        kendi gizlilik politikalarına tabidir.
      </p>

      <h2>5. Bizimle İletişim</h2>
      <p>
        Çerez politikamız hakkında sorularınız için ${EMAIL} adresine yazabilirsiniz.
      </p>
    `,
  },

  // ====================================================================
  // GİZLİLİK POLİTİKASI
  // ====================================================================
  gizlilik: {
    slug: "gizlilik",
    title: "Gizlilik Politikası",
    lastUpdated: "2026-06-16",
    body: `
      <p>
        ${COMPANY} ("Şirket"), ${BRAND} alt markası altında işlettiği e-ticaret
        platformunda kullanıcılarının gizliliğini korumayı temel ilke olarak benimser.
        İşbu Gizlilik Politikası, Site üzerinden toplanan verilerin nasıl korunduğunu
        ve işlendiğini açıklar.
      </p>

      <h2>1. Toplanan Bilgiler</h2>
      <p>
        Platform aracılığıyla kullanıcılarımızdan aşağıdaki bilgiler toplanmaktadır:
      </p>
      <ul>
        <li><strong>Üyelik bilgileri:</strong> Ad, soyad, e-posta, telefon, şifre (hash'lenmiş olarak)</li>
        <li><strong>Sipariş bilgileri:</strong> Teslimat adresi, fatura adresi, sipariş geçmişi</li>
        <li><strong>Ödeme bilgileri:</strong> Kart bilgileri tarafımıza ulaşmaz; yalnızca iyzico tarafından PCI-DSS uyumlu şekilde işlenir</li>
        <li><strong>Tasarım dosyaları:</strong> Sipariş için yüklediğiniz dosyalar Cloudflare R2 altyapısında şifrelenmiş olarak saklanır</li>
        <li><strong>İletişim bilgileri:</strong> İletişim formu, WhatsApp, e-posta yazışmaları</li>
        <li><strong>Site kullanım verileri:</strong> IP, tarayıcı, çerez verileri (anonim/agregat)</li>
      </ul>

      <h2>2. Bilgilerin Saklanması</h2>
      <p>
        Kişisel verileriniz Türkiye'de bulunan veri merkezlerinde ve sözleşmeli
        Cloudflare R2 altyapısında saklanır. Veriler, KVKK ve ilgili mevzuat çerçevesinde
        gerekli güvenlik önlemleri (şifreleme, erişim kontrolü, yedekleme) ile korunur.
      </p>

      <h2>3. Bilgilerin Paylaşımı</h2>
      <p>
        Kişisel verileriniz, aşağıdaki haller dışında üçüncü şahıslarla paylaşılmaz:
      </p>
      <ul>
        <li>Hizmet alımının zorunlu kıldığı tedarikçiler (iyzico, DHL, Paraşüt, SendGrid, NetGSM)</li>
        <li>Açık rızanızın bulunduğu pazarlama faaliyetleri</li>
        <li>Yasal yükümlülük (yetkili makam talebi)</li>
        <li>Hukuki süreçlerin yürütülmesi</li>
      </ul>

      <p>
        ${BRAND} kişisel verilerinizi <strong>satmaz, kiralamaz veya
        ticari amaçla üçüncü taraflara aktarmaz.</strong>
      </p>

      <h2>4. Çocukların Gizliliği</h2>
      <p>
        ${BRAND} 18 yaşından küçük kullanıcılara hizmet vermemektedir. 18 yaşından küçük
        olduğunu beyan eden kullanıcılardan toplanan veriler tespit edildiğinde derhal silinir.
      </p>

      <h2>5. Kullanıcı Hakları</h2>
      <p>
        KVKK kapsamındaki tüm haklarınızı kullanmak için
        <a href="/yasal/kvkk">KVKK Aydınlatma Metni</a>'ndeki başvuru yöntemlerinden
        yararlanabilirsiniz.
      </p>

      <h2>6. Güvenlik Önlemleri</h2>
      <ul>
        <li>HTTPS / TLS 1.3 şifreleme</li>
        <li>Argon2 ile şifre hash'lenmesi</li>
        <li>Rate limiting ve DDoS koruması</li>
        <li>Düzenli güvenlik denetimleri</li>
        <li>İki faktörlü kimlik doğrulama (2FA — admin paneli için zorunlu)</li>
        <li>3D Secure ödeme zorunluluğu</li>
      </ul>

      <h2>7. Politika Güncellemeleri</h2>
      <p>
        Şirket, işbu politikayı güncelleme hakkını saklı tutar. Önemli değişiklikler
        e-posta ile veya Site üzerinden bildirilir. Güncel sürüm her zaman bu sayfada
        yayınlanır.
      </p>

      <h2>8. İletişim</h2>
      <p>
        Gizlilik konularındaki sorularınız için: <a href="mailto:${EMAIL}">${EMAIL}</a>
      </p>
    `,
  },

  // ====================================================================
  // KULLANIM KOŞULLARI
  // ====================================================================
  "kullanim-kosullari": {
    slug: "kullanim-kosullari",
    title: "Kullanım Koşulları",
    lastUpdated: "2026-06-16",
    body: `
      <p>
        ${BRAND} alan adı ${COMPANY} ("Şirket") tarafından yönetilmektedir. Site'yi
        ziyaret ederek veya kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
      </p>
      <p>
        <strong>ETBİS Kaydı:</strong> Sitemiz, 6563 sayılı Elektronik Ticaretin Düzenlenmesi
        Hakkında Kanun kapsamında Ticaret Bakanlığı tarafından yürütülen Elektronik Ticaret
        Bilgi Sistemi'ne (ETBİS) kayıtlıdır. ETBİS kayıt numarası: <strong>${ETBIS_NO}</strong>.
      </p>

      <h2>1. Tanımlar</h2>
      <ul>
        <li><strong>Site:</strong> ${BRAND} alan adı altında yayınlanan tüm içerik ve hizmetler</li>
        <li><strong>Kullanıcı:</strong> Site'yi ziyaret eden veya hizmetlerinden yararlanan gerçek/tüzel kişi</li>
        <li><strong>Üye:</strong> Site'ye kayıt olarak hesap oluşturan kullanıcı</li>
        <li><strong>İçerik:</strong> Site'de yayınlanan metin, görsel, video, kod ve diğer her türlü materyal</li>
      </ul>

      <h2>2. Üyelik ve Hesap Güvenliği</h2>
      <p>
        Site'ye üye olabilmek için 18 yaşını doldurmuş olmanız ve doğru/güncel bilgiler
        sağlamanız gerekir. Hesap güvenliğinden kullanıcı sorumludur:
      </p>
      <ul>
        <li>Şifrenizin gizliliğini korumak</li>
        <li>Hesabınızda gerçekleşen tüm faaliyetlerden sorumlu olmak</li>
        <li>Şüpheli aktivite halinde derhal Şirket'i bilgilendirmek</li>
      </ul>

      <h2>3. Telif Hakkı ve Tasarım Sorumluluğu</h2>
      <p>
        Sipariş sırasında yüklediğiniz tasarım, görsel ve metin içeriğinin telif
        haklarının size ait olduğunu veya kullanım izninizin bulunduğunu beyan
        edersiniz. Üçüncü taraf telif haklarının ihlalinden Şirket sorumlu tutulamaz.
      </p>
      <p>
        Şirket, açıkça ihlal teşkil ettiği görülen tasarımları üretmeyi reddetme
        hakkını saklı tutar.
      </p>

      <h2>4. Site İçeriğinin Mülkiyeti</h2>
      <p>
        Site'de yer alan tüm tasarım, logo, marka, metin ve görseller ${COMPANY}'ye
        aittir. İzinsiz çoğaltılması, kopyalanması, dağıtılması veya ticari amaçla
        kullanılması yasaktır.
      </p>

      <h2>5. Yasaklı Kullanımlar</h2>
      <p>Aşağıdaki davranışlar kesinlikle yasaktır:</p>
      <ul>
        <li>Yasalara, ahlaka ve kamu düzenine aykırı içerik yüklemek</li>
        <li>Hakaret, tehdit, taciz, ırkçı veya nefret söylemi içeren tasarımlar</li>
        <li>Telif hakkı veya marka ihlali içeren tasarımlar</li>
        <li>Yanıltıcı bilgi vermek, sahte hesap oluşturmak</li>
        <li>Site'nin altyapısına zarar verici eylemler (DDoS, web scraping, vb.)</li>
        <li>Diğer kullanıcıların verilerine yetkisiz erişim</li>
      </ul>
      <p>
        Bu kuralların ihlali halinde Şirket, hesabı askıya alma veya silme, siparişi
        iptal etme ve yasal yollara başvurma hakkını saklı tutar.
      </p>

      <h2>6. Sipariş ve Ödeme</h2>
      <p>
        Sipariş süreci ile ilgili tüm hak ve yükümlülükler
        <a href="/yasal/mesafeli-satis">Mesafeli Satış Sözleşmesi</a>'nde düzenlenmiştir.
      </p>

      <h2>7. Sorumluluk Sınırlandırması</h2>
      <p>
        Şirket, Site'nin kesintisiz, hatasız veya virüs içermediğini garanti etmez.
        Şirket, dolaylı, özel veya sonuçsal zararlardan, veri kaybından veya kâr
        kaybından sorumlu tutulamaz. Şirket'in toplam sorumluluğu, ilgili siparişin
        bedeli ile sınırlıdır.
      </p>

      <h2>8. Uyuşmazlıkların Çözümü</h2>
      <p>
        İşbu Kullanım Koşulları'ndan doğan uyuşmazlıklarda Türkiye Cumhuriyeti hukuku
        uygulanır. Yetkili mahkeme ve icra daireleri Mersin Mahkemeleri ve İcra
        Daireleri'dir.
      </p>

      <h2>9. Değişiklikler</h2>
      <p>
        Şirket, işbu Kullanım Koşulları'nı tek taraflı olarak güncelleyebilir. Önemli
        değişiklikler kullanıcılara e-posta veya Site bildirimi ile duyurulur.
      </p>

      <h2>10. İletişim</h2>
      <p>
        Sorularınız için: ${EMAIL} | ${PHONE}
      </p>
    `,
  },

  // ====================================================================
  // ÖN BİLGİLENDİRME FORMU
  // ====================================================================
  "on-bilgilendirme": {
    slug: "on-bilgilendirme",
    title: "Ön Bilgilendirme Formu",
    lastUpdated: "2026-06-16",
    body: `
      <p>
        Mesafeli Sözleşmeler Yönetmeliği'nin 5. maddesi gereğince, sipariş onayından
        önce aşağıdaki konularda bilgilendirilmiş sayılırsınız.
      </p>

      <h2>1. Satıcı Bilgileri</h2>
      <ul>
        <li><strong>Unvan:</strong> ${COMPANY}</li>
        <li><strong>Marka:</strong> ${BRAND}</li>
        <li><strong>Adres:</strong> ${ADDRESS}</li>
        <li><strong>Vergi Dairesi/No:</strong> ${TAX_OFFICE} / ${TAX_NUMBER}</li>
        <li><strong>MERSİS:</strong> ${MERSIS}</li>
        <li><strong>Telefon:</strong> ${PHONE}</li>
        <li><strong>E-posta:</strong> ${EMAIL}</li>
      </ul>

      <h2>2. Sipariş Konusu Mal/Hizmet</h2>
      <p>
        Satın aldığınız ürünün temel nitelikleri, miktarı, satış bedeli ve ödeme şekli
        sipariş onayı sırasında detaylı şekilde gösterilir.
      </p>
      <div class="legal-callout">
        ⚠ <strong>Üretim Toleransı:</strong> Lütfen Dikkat — Siparişlerinizin Renk, Adet ve Ölçülerinde
        <strong>%1 ila %5 arasında fire</strong> olabilmektedir. Bu sektör standardı tolerans aralığı
        siparişin sözleşme şartlarındandır; iade/değişime konu edilemez (bkz. Mesafeli Satış Sözleşmesi Madde 7.A).
      </div>

      <h2>3. Ödeme</h2>
      <ul>
        <li>Tüm ödemeler iyzico altyapısı üzerinden 3D Secure ile gerçekleştirilir</li>
        <li>Kart bilgileriniz ${BRAND}'a ulaşmaz</li>
        <li>1, 3, 6 ve 9 taksit seçenekleri kart BIN'ine göre dinamik sunulur</li>
        <li>Havale/EFT ile ödeme talep ediyorsanız müşteri hizmetlerinden bilgi alın</li>
      </ul>

      <h2>4. Teslimat</h2>
      <ul>
        <li>Türkiye'nin 81 iline DHL kargo ile teslimat</li>
        <li>Üretim süresi 1-7 iş günü (ürün bazında değişir)</li>
        <li>Kargo süresi 1-3 iş günü</li>
        <li>1.500 TL üzeri siparişlerde kargo ücretsiz</li>
        <li>1.500 TL altı siparişlerde kargo ücreti sipariş özetinde gösterilir</li>
      </ul>

      <h2>5. Cayma Hakkı</h2>
      <p>
        ${BRAND} bünyesindeki ürünlerin tamamı kişiye/firmaya özel üretildiğinden,
        Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-ç maddesi gereğince
        <strong>cayma hakkı kullanılamaz</strong>.
      </p>
      <p>
        Üretim hatası, baskı hatası veya teslimat hasarı halinde
        <a href="/yasal/iade">İade & Değişim Politikası</a> kapsamında ücretsiz değişim
        veya iade yapılır.
      </p>

      <h2>6. Şikayet ve İtiraz</h2>
      <p>
        Şikayetlerinizi ${EMAIL} adresine veya ${PHONE} numarasına iletebilirsiniz.
        Mesafeli sözleşmelerden doğan uyuşmazlıklarda Tüketici Hakem Heyetleri ve
        Tüketici Mahkemeleri yetkilidir.
      </p>
    `,
  },

  // ====================================================================
  // İADE VE DEĞİŞİM POLİTİKASI
  // ====================================================================
  iade: {
    slug: "iade",
    title: "İade ve Değişim Politikası",
    lastUpdated: "2026-06-16",
    body: `
      <p>
        ${BRAND} ${COMPANY} bünyesinde yönetilmekte olup tüm iade ve değişim süreçleri
        Şirket'in sorumluluğundadır. İşbu politika, müşterilerimize üretim/baskı hatası
        veya teslimat hasarı durumunda sunduğumuz hakları açıklar.
      </p>

      <h2>1. Kişiye Özel Üretim ve Cayma Hakkı</h2>
      <div class="legal-callout">
        ⚠ <strong>Önemli:</strong> ${BRAND} ürünlerinin tamamı kişiye/firmaya özel
        üretildiğinden Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-ç maddesi gereğince
        cayma hakkı kullanılamaz. Bu durum siparişten önce ön bilgilendirme formunda
        açıkça belirtilir.
      </div>

      <h2>2. Üretim/Baskı Hatası Durumunda</h2>
      <p>Aşağıdaki durumlar üretim hatası kapsamında değerlendirilir:</p>
      <ul>
        <li>Onayladığınız taslaktan farklı renk/içerik basılması</li>
        <li>Baskı kayması, mürekkep akması, çift baskı</li>
        <li>Ebat hatası (siparişten farklı ölçü <strong>ve %5 üretim toleransı dışında</strong>)</li>
        <li>Eksik ürün gönderimi (sipariş adedinin <strong>%5'inin altında</strong> teslim)</li>
        <li>Yanlış malzeme (örn. mat yerine parlak)</li>
      </ul>
      <p>
        <strong>Bu durumlarda ürün ücretsiz olarak yenilenir veya tutar iade edilir.</strong>
      </p>

      <h2>2.A Üretim Toleransı (Fire) — Önemli</h2>
      <div class="legal-callout">
        ⚠ <strong>Lütfen Dikkat: Siparişlerinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilmektedir.</strong>
      </div>
      <p>
        Matbaa üretimi profesyonel makinelerde yapılır ve teknik gereği bu toleransa sahiptir:
      </p>
      <ul>
        <li><strong>Renk:</strong> CMYK baskıda kullanılan mürekkep partileri arasında küçük farklar olabilir; ekrandaki RGB tasarım ile basılan CMYK çıktı arasında %5'e kadar renk sapması doğaldır.</li>
        <li><strong>Adet:</strong> Kalite kontrol elemesi sonrası teslim edilen ürün adedi, sipariş edilen adetten %1-5 oranında düşük olabilir.</li>
        <li><strong>Ölçü:</strong> Kâğıt kesim toleransı ±0,5-2 mm (büyük ebatlarda %5'e kadar) olabilir.</li>
      </ul>
      <p>
        Bu tolerans aralıkları sektör standardıdır ve <strong>iade/değişim talebine konu edilemez</strong>.
        Sipariş onayınızda bu koşulları kabul etmiş sayılırsınız.
      </p>

      <h2>3. Teslimat Hasarı Durumunda</h2>
      <p>
        Kargo paketinde gözle görülür hasar varsa <strong>tutanak tutturarak</strong>
        teslim alın veya teslim almayı reddedin. Tutanaksız teslim alınan paketlerdeki
        hasar talepleri kargo şirketinin sorumluluğunda kalabilir.
      </p>

      <h2>4. İade/Değişim Süreci</h2>

      <h3>Adım 1 — Bildirim</h3>
      <p>
        Ürünü teslim aldığınız tarihten itibaren <strong>7 gün içinde</strong> aşağıdaki
        bilgilerle birlikte ${EMAIL} adresine bildirim yapın:
      </p>
      <ul>
        <li>Sipariş numaranız (MK-XXXXX-XXXX)</li>
        <li>Hatanın açıklaması</li>
        <li>Hatayı gösteren <strong>en az 3 fotoğraf</strong> (genel + yakın çekim + kargo etiketi)</li>
        <li>İletişim bilgileriniz</li>
      </ul>

      <h3>Adım 2 — İnceleme</h3>
      <p>
        Müşteri hizmetlerimiz <strong>2 iş günü içinde</strong> talebinizi inceler ve
        sonucu size bildirir. Gerekirse ek bilgi/fotoğraf talep edilebilir.
      </p>

      <h3>Adım 3 — Çözüm</h3>
      <p>İncelemede haklı bulunan talepler için iki seçenek sunulur:</p>
      <ul>
        <li><strong>Yeniden üretim:</strong> Ürün ücretsiz olarak yenilenir, kargo masrafı SATICI'ya aittir</li>
        <li><strong>Para iadesi:</strong> Sipariş bedeli iyzico üzerinden 10 iş günü içinde kart hesabınıza iade edilir</li>
      </ul>

      <h2>5. Müşteri Sorumluluğunda Olan Durumlar (İade YOK)</h2>
      <p>Aşağıdaki durumlar SATICI sorumluluğunun dışındadır:</p>
      <ul>
        <li>ALICI'nın yüklediği tasarım dosyasında bulunan hata (yazım, çözünürlük, renk profili)</li>
        <li>RGB renk profili gönderilen dosyada CMYK'ya dönüşüm sonrası oluşan renk farkları</li>
        <li>300 DPI altı düşük çözünürlüklü tasarımdan kaynaklı bulanıklık</li>
        <li>Taşma payı bırakılmamış tasarımdan kaynaklı kesim hatası</li>
        <li>ALICI tarafından onaylanan taslağın sonradan beğenilmemesi</li>
        <li>Hatalı/eksik teslimat adresi nedeniyle oluşan gecikme veya kargo iadesi</li>
        <li>Ekran ile basılı materyal arasındaki normal renk algı farkı (monitör profili kaynaklı)</li>
      </ul>

      <h2>6. İptal Süreci</h2>
      <p>
        Sipariş henüz <strong>üretime alınmamışsa</strong>, müşteri hizmetlerinden
        iptal talep edebilirsiniz. Üretime alınan siparişler iptal edilemez (kişiye
        özel üretim).
      </p>

      <h2>7. İade Kargo Ücreti</h2>
      <ul>
        <li>SATICI hatası: Kargo SATICI tarafından karşılanır</li>
        <li>ALICI hatası (üretim öncesi iptal vb): Kargo ALICI tarafından karşılanır</li>
      </ul>

      <h2>8. Para İadesi Süresi</h2>
      <p>
        Onaylanan iade taleplerinde tutar, ödemenin yapıldığı yönteme göre iade edilir:
      </p>
      <ul>
        <li>Kredi/banka kartı: <strong>10 iş günü</strong> içinde kart hesabınıza</li>
        <li>Havale/EFT: <strong>5 iş günü</strong> içinde belirttiğiniz IBAN'a</li>
      </ul>
      <p>
        Bankanızın işlem süresi nedeniyle hesabınızda görünmesi 1-3 iş günü daha
        sürebilir. Bu süre Şirket'in sorumluluğu dışındadır.
      </p>

      <h2>9. İletişim</h2>
      <p>
        Tüm iade/değişim talepleriniz için: <a href="mailto:${EMAIL}">${EMAIL}</a> |
        ${PHONE} | <a href="https://wa.me/903244333351">WhatsApp</a>
      </p>
    `,
  },

  // ====================================================================
  // KARGO VE TESLİMAT POLİTİKASI
  // ====================================================================
  kargo: {
    slug: "kargo",
    title: "Kargo ve Teslimat Politikası",
    lastUpdated: "2026-06-16",
    body: `
      <h2>1. Kargo Firması</h2>
      <p>
        ${BRAND} olarak Türkiye geneli teslimatlarda <strong>DHL Türkiye</strong> ile
        çalışmaktayız. DHL'in geniş şube ağı ve takip sistemi sayesinde 81 ile 1-3 iş
        günü içinde teslimat sağlanmaktadır.
      </p>

      <h2>2. Kargo Ücreti</h2>
      <ul>
        <li><strong>1.500 TL ve üzeri siparişler:</strong> Kargo ücretsiz</li>
        <li><strong>1.500 TL altı siparişler:</strong> 79 TL standart kargo ücreti</li>
        <li>Kargo ücreti sepet ve ödeme adımında şeffaf şekilde gösterilir</li>
      </ul>

      <h2>3. Üretim ve Teslimat Süreleri</h2>
      <p>Toplam süre: <strong>üretim süresi + kargo süresi</strong>.</p>
      <ul>
        <li>Hızlı ürünler (kartvizit, broşür, kaşe): 24-48 saat üretim + 1-3 gün kargo</li>
        <li>Standart ürünler (branda, roll-up, bayrak): 2-3 iş günü üretim + 1-3 gün kargo</li>
        <li>Özel ürünler (lightbox, plaket, madalya): 3-7 iş günü üretim + 1-3 gün kargo</li>
      </ul>
      <p>
        Her ürünün detay sayfasında üretim süresi ayrıca belirtilmiştir. Tasarım
        desteği talep eden siparişlerde tasarım onay süreci toplam süreye eklenir.
      </p>

      <h2>4. Sipariş Takibi</h2>
      <p>
        Siparişiniz kargoya verildiğinde DHL takip kodunuz e-posta ve SMS ile
        bildirilir. Aşağıdaki kanallardan takip yapabilirsiniz:
      </p>
      <ul>
        <li><a href="/kargo-takip">${BRAND}/kargo-takip</a> sayfası (sipariş no + e-posta ile)</li>
        <li>Hesabınız varsa <a href="/hesabim/siparislerim">Siparişlerim</a> sayfası</li>
        <li>DHL resmi takip sayfası (size gönderilen takip kodu ile)</li>
      </ul>

      <h2>5. Teslimat Adresi</h2>
      <ul>
        <li>Teslimat adresi sipariş sırasında belirlenir ve sipariş üretime alındıktan sonra değiştirilemez</li>
        <li>Hatalı/eksik adres bilgisi nedeniyle oluşan teslimat sorunlarından SATICI sorumlu tutulamaz</li>
        <li>Kurumsal teslimatlarda firma adı + departman + iletişim kişisi belirtilmelidir</li>
      </ul>

      <h2>6. Teslim Alma</h2>
      <p>
        Kargo paketini teslim alırken:
      </p>
      <ul>
        <li>Paketin gözle görülür hasarı varsa <strong>kargo görevlisi ile birlikte tutanak tutun</strong></li>
        <li>Paket tartım tutarsızlığı varsa tutanak ile teslim alın</li>
        <li>Teslim alma sırasında imza atmadan önce paketi kontrol edin</li>
        <li>Hasar tespit edilirse paketi reddedin veya tutanak ile teslim alın</li>
      </ul>

      <h2>7. Adreste Bulunamama</h2>
      <p>
        DHL kuryesi adreste sizi bulamadığında bildirim bırakır ve 2 deneme daha yapar.
        Üçüncü denemede de teslim edilemeyen kargolar en yakın DHL şubesine yönlendirilir.
        Şubede 7 gün içinde teslim alınmayan kargolar SATICI'ya iade edilir.
      </p>

      <h2>8. Yurt Dışı Teslimat</h2>
      <p>
        ${BRAND} şu anda yalnızca Türkiye geneli teslimat yapmaktadır. Yurt dışı
        teslimat planlanmamaktadır.
      </p>

      <h2>9. Toplu/Kurumsal Teslimat</h2>
      <p>
        100+ adet siparişlerde özel kargo planlaması yapılır. Tek bir adrese veya
        birden fazla adrese parçalı teslimat seçenekleri için müşteri hizmetlerine
        yazın: ${EMAIL}
      </p>

      <h2>10. İletişim</h2>
      <p>
        Kargo ile ilgili sorularınız için: ${EMAIL} | ${PHONE} |
        <a href="https://wa.me/903244333351">WhatsApp</a>
      </p>
    `,
  },
};

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages[slug];
}

export function getAllLegalSlugs(): string[] {
  return Object.keys(legalPages);
}
