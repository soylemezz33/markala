#!/usr/bin/env node
/**
 * SSS tohumlama — panele (POST /api/faqs) soru/cevap ekler.
 *
 * İçerik iki kaynaktan derlendi (2026-08-21):
 *   1. Eski kod-gömülü /yardim/sss makalesinin soruları (sayfa DB'ye taşındı)
 *   2. SEO + AI-alıntı odaklı yeni sorular (cevaplar sitedeki yardım/yasal
 *      sayfalarındaki DOĞRULANMIŞ bilgilerden — uydurma rakam yok)
 *
 * Tekrar çalıştırmak güvenlidir: mevcut soru metniyle birebir eşleşenler atlanır.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/sss/ekle.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

// [kategori, soru, cevap] — kategori DTO enum'u: tasarim|urun|kargo|odeme|iade|genel
const SORULAR = [
  // ─── GENEL ───
  ["genel", "Markala nedir ve nereden hizmet verir?",
    "Markala (markala.com.tr), Mersin'de üretim yapan online matbaadır; 324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Ticaret Limited Şirketi'nin markasıdır ve ETBİS'e kayıtlıdır. Kartvizit, broşür, afiş, branda, etiket ve iş güvenliği levhalarını KDV dahil anlık fiyatla online satışa sunar; siparişler Türkiye'nin 81 iline DHL ile 1-3 iş gününde ulaşır."],
  ["genel", "Fiyatlara KDV dahil mi?",
    "Evet. markala.com.tr'de gördüğünüz tüm fiyatlar KDV dahildir; sepette ve ödeme adımında ek vergi farkı çıkmaz. Ödeme özetinde 'KDV dahildir' notu ayrıca gösterilir."],
  ["genel", "Fiyat neden 'Teklif Al' gösteriyor?",
    "'Teklif Al' ifadesi, o ürün için henüz sabit liste fiyatı girilmediği anlamına gelir. Bu ürünler için ürün sayfasındaki teklif formunu doldurun; 24 iş saati içinde size özel fiyat iletilir. Sipariş büyüklüğü (adet) arttıkça birim fiyat düşer."],
  ["genel", "Adet seçimini konfigüratörde nasıl ayarlarım?",
    "Ürün sayfasındaki konfigüratörde 'Adet' adımından standart paketler (ör. 250, 500, 1.000) arasından seçim yapabilirsiniz. Daha yüksek bir adet girebileceğiniz ürünlerde serbest giriş alanı açılır. Toplu sipariş (1.000+ adet) için kurumsal teklif almanızı öneririz."],
  ["genel", "Sipariş durumumu nasıl takip ederim?",
    "Siparişinizin her aşamasında (tasarım onayı, üretim, kargo) SMS ve e-posta ile bilgilendirilirsiniz. Kargoya verildiğinde DHL takip kodu e-postanıza gelir; ayrıca sitedeki kargo takip sayfasından sipariş numaranız ve e-postanızla sorgulayabilirsiniz."],

  // ─── ÜRÜN & BASKI ───
  ["urun", "Üretim toleransı (fire) ne demek?",
    "Matbaa baskısının doğası gereği siparişinizin renk, adet ve ölçülerinde %1 ila %5 arasında fire olabilir. Bu sektör standardıdır ve sözleşme şartı olarak kabul edilmiştir (Mesafeli Satış Sözleşmesi Madde 7.A)."],
  ["urun", "Minimum sipariş adedi nedir?",
    "Ürünlere göre değişir — kartvizit 1.000 adet, broşür 1.000 adet, kupa 1 adet, kaşe 1 adet. Her ürün sayfasındaki konfigüratörde minimum adet görünür."],
  ["urun", "Selefon nedir? Mat mı parlak mı seçmeliyim?",
    "Selefon, baskı yüzeyine ısıyla yapıştırılan ince bir plastik filmdir. Mat selefon göz yormaz, parmak izi göstermez; kartvizit ve broşür için popülerdir. Parlak selefon renkleri daha canlı yansıtır, fotoğraf ağırlıklı tasarımlarda tercih edilir. İkisi de baskıyı nem ve çizilmeden korur."],
  ["urun", "Tek yön ve çift yön baskı farkı nedir?",
    "Tek yön (1+0) baskıda yalnızca bir yüze baskı yapılır. Çift yön (4+4 veya 1+1) baskıda ön ve arka yüzün ikisi de basılır. Kartvizitlerde çift yön ek fiyat gerektirebilir; konfigüratörde seçtiğinizde fiyat otomatik güncellenir."],
  ["urun", "Ebat/boyut seçimi nasıl yapılır?",
    "Her ürün sayfasındaki konfigüratörde hazır ebat seçenekleri listelenir (örn. 85×55 mm kartvizit, A4 broşür). Standart dışı ebat gerekiyorsa 'Özel Boyut' seçeneğini işaretleyin veya WhatsApp'tan bize ulaşın. Ebat seçimi fiyatı etkiler; konfigüratörde anlık güncellenir."],
  ["urun", "İş güvenliği (İSG) levhalarında renkler ne anlama gelir?",
    "Sağlık ve Güvenlik İşaretleri Yönetmeliği'ne göre: yasaklayıcı işaretler kırmızı, uyarı işaretleri sarı, emredici (zorunluluk) işaretleri mavi, acil çıkış ve ilk yardım işaretleri yeşildir. İşyeri tipine göre zorunlu levha listesi için markala.com.tr/rehber/isg-zorunlu-uyari-levhalari rehberine bakabilirsiniz."],
  ["urun", "İSG levhaları hangi malzemelerden üretiliyor?",
    "Ürüne göre üç ana seçenek sunulur: dekota (sert PVC levha — iç/dış mekân), yapışkanlı folyo/sticker (düz yüzeylere yapıştırma) ve fotolümenli (karanlıkta parlayan — acil çıkış ve yangın işaretlerinde tercih edilir). Malzeme ve ebat, ürün sayfasındaki konfigüratörden seçilir."],

  // ─── TASARIM & DOSYA ───
  ["tasarim", "Tasarım yoksa ne yapacağım?",
    "Ücretsiz şablonlarımızdan birini seçebilir veya 89 TL'den itibaren özel tasarım hizmetimizden yararlanabilirsiniz. Sipariş sırasında 'Tasarım desteği istiyorum' seçeneğini işaretleyin; ekibimiz 24 saat içinde taslak gönderir."],
  ["tasarim", "Taşma payı ve güvenlik alanı ne olmalı?",
    "Kesim sırasında beyaz şerit oluşmaması için tasarımı her kenardan 2 mm taşırın; önemli yazı ve logoları kenardan en az 3 mm içeride tutun. Dosya CMYK renk uzayında ve 300 dpi çözünürlükte olmalıdır."],

  // ─── KARGO ───
  ["kargo", "Kargo ücreti ne kadar?",
    "1.500 TL ve üzeri tüm siparişlerde kargo ücretsizdir. Altındaki siparişlerde 79 TL standart kargo ücreti uygulanır. Hızlı kargo (1 iş günü) sipariş notunda belirtilerek +89 TL ile seçilebilir."],
  ["kargo", "Hangi kargo firmasıyla gönderiyorsunuz?",
    "Türkiye geneli kargolarımızı DHL ile yapıyoruz: 81 il ve 970+ ilçeye 1-3 iş günü içinde teslimat. Büyük şehirlere genellikle 24-48 saat içinde ulaşır. Kargoya verildiğinde DHL takip kodu e-postanıza gönderilir."],

  // ─── ÖDEME ───
  ["odeme", "Hangi ödeme yöntemlerini kullanabilirim? Güvenli mi?",
    "Tüm ödemeler iyzico altyapısı üzerinden 3D Secure ile yapılır; Visa, Mastercard, Troy ve American Express kabul edilir. Kart bilgileriniz Markala'ya hiç ulaşmaz — iyzico'nun PCI-DSS sertifikalı sunucularında işlenir. 100 TL üzeri siparişlerde 3 taksit ücretsizdir."],
  ["odeme", "Faturamı nasıl alırım?",
    "Tüm faturalar e-Arşiv olarak otomatik kesilir ve e-postanıza gönderilir; ayrıca sitede 'Hesabım > Faturalarım' sayfasında arşivlenir. Bireysel müşteriler için TC kimlik numarası, kurumsal müşteriler için vergi numarası ile düzenlenir."],
  ["odeme", "Kurumsal cari hesap nasıl açarım?",
    "İletişim formundan 'Kurumsal Hesap' başlığıyla başvurun; vergi levhası ve imza sirküleri ile 24 saat içinde değerlendirme yapılır. Onay sonrası açık hesap, 30/60/90 gün vadeli fatura ve özel fiyat anlaşması aktif olur."],

  // ─── İADE ───
  ["iade", "Kişiye özel baskı ürünlerinde cayma/iptal hakkım var mı?",
    "Baskı ürünleri kişiye/firmaya özel üretildiğinden Mesafeli Sözleşmeler Yönetmeliği 15/1-ç gereği cayma hakkı kullanılamaz. Ancak üretim başlamadan önce (tasarım onayı aşamasında) siparişi tam iade ile iptal edebilirsiniz. Üretim hatası veya teslimat hasarında ücretsiz yenileme/iade hakkınız her zaman saklıdır."],
  ["iade", "Ürünüm hasarlı veya hatalı geldi, ne yapmalıyım?",
    "Teslimden itibaren 7 gün içinde merhaba@markala.com.tr adresine fotoğraflı bildirim yapın; pakette belirgin hasar varsa kuryeye 'hasarlı teslim alındı' tutanağı tutturmanızı öneririz. Üretim hatası veya teslimat hasarı doğrulanırsa ürün ücretsiz yenilenir ya da tutar 5 iş günü içinde iade edilir."],
];

async function girisYap() {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    console.error("ADMIN_EMAIL + ADMIN_PASSWORD (veya ADMIN_TOKEN) gerekli.");
    process.exit(1);
  }
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error(`Giriş başarısız: ${res.status}`);
    process.exit(1);
  }
  const j = await res.json();
  return j.accessToken || j.access_token || j.token;
}

const token = await girisYap();
const authH = { authorization: `Bearer ${token}` };

const mevcutRes = await fetch(`${API}/api/faqs`, { headers: authH });
if (!mevcutRes.ok) {
  console.error(`Mevcut SSS listesi alınamadı: ${mevcutRes.status}`);
  process.exit(1);
}
const mevcut = await mevcutRes.json();
const mevcutSorular = new Set(
  (Array.isArray(mevcut) ? mevcut : []).map((f) => f.question.trim().toLowerCase()),
);
console.log(`Panelde mevcut: ${mevcutSorular.size} soru`);

let eklendi = 0;
let atlandi = 0;
let hata = 0;
const sira = {}; // kategori başına sortOrder sayacı (mevcutların üstünden başla)
for (const f of Array.isArray(mevcut) ? mevcut : []) {
  sira[f.category] = Math.max(sira[f.category] ?? 0, (f.sortOrder ?? 0) + 10);
}

for (const [category, question, answer] of SORULAR) {
  if (mevcutSorular.has(question.trim().toLowerCase())) {
    console.log(`- atlandı (zaten var): ${question}`);
    atlandi++;
    continue;
  }
  sira[category] = (sira[category] ?? 0) + 10;
  if (DRY) {
    console.log(`[DRY] ${category} #${sira[category]}: ${question}`);
    eklendi++;
    continue;
  }
  const res = await fetch(`${API}/api/faqs`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authH },
    body: JSON.stringify({ question, answer, category, sortOrder: sira[category], isActive: true }),
  });
  if (!res.ok) {
    console.error(`✗ ${question}: ${res.status} ${await res.text()}`);
    hata++;
    continue;
  }
  console.log(`✓ ${category}: ${question}`);
  eklendi++;
}

console.log(`\nÖzet — eklenen: ${eklendi} · atlanan: ${atlandi} · hata: ${hata}`);
if (!DRY && eklendi > 0) {
  console.log("Not: /yardim/sss sayfası ISR 300sn — en geç 5 dk içinde canlıda görünür.");
}
