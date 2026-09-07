/**
 * ZAMANLANMIŞ İŞ AÇMA/KAPAMA ANAHTARI (2026-09-07).
 *
 * NEDEN: 7 Eylül sabahı 08:40'ta Prisma bağlantı havuzu tükendi ve site 45 dakika 500
 * döndü. Kök neden KANITLANAMADI; elimizdeki tek ipucu zamansal örtüşme: bir gece önce
 * devreye giren `retention.service` içindeki 08:30 puan-süresi işi koştu, on dakika sonra
 * havuz öldü. O iş 500 kullanıcıya kadar döngüde tek tek SMTP maili gönderiyor.
 *
 * Hasan'ın kararı: şüphe giderilene kadar iş kapatılsın, emin olunca açılsın.
 *
 * NEDEN KODU SİLMİYORUZ / YORUMA ALMIYORUZ: geri açmak yeni bir deploy gerektirirdi ve
 * "geçici olarak kapatıldı" notu zamanla unutulup kalıcı ölü koda dönüşürdü. Env ile
 * kontrol edilince açmak tek satırlık ayar değişikliği + yeniden başlatma oluyor, kod
 * tarafında hiçbir iz kalmıyor.
 *
 * VARSAYILAN KAPALI: env tanımlı değilse iş ÇALIŞMAZ. Bilinçli tercih — bu anahtarın
 * varlık sebebi bir kesinti şüphesi; "unutulursa kendiliğinden açılsın" davranışı tam da
 * kaçınmak istediğimiz şey.
 */

/**
 * Saf karar: env değeri işi açar mı?
 *
 * Yalnız açık onay ("true"/"1"/"evet", büyük-küçük harf ve boşluk toleranslı) işi açar.
 * "false", boş, tanımsız ya da anlamsız her değer KAPALI sayılır.
 */
export function cronAcikMi(deger: string | undefined | null): boolean {
  const v = String(deger ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "evet";
}
