# Instagram Kampanya Planı — 2026-08

> Hedef: takipçi büyütme (satış değil). Taban: @markala.com.tr — 147 takipçi (20 Ağu).
> Reklam hesabı aktif, IG bağlı, kampanya kurulumu Meta API'den Claude tarafından yapılacak.

---

# KAMPANYA 1 — "Sipariş Hikâyesi" Reel (video)

## Konsept
Gerçek bir siparişin yolculuğu: ekranda sipariş düşer → üretilir → paketlenir → kargoya çıkar.
20-25 saniye, dikey 9:16 (1080×1920), trend ses altta + Türkçe seslendirme üstte.

## Sahne sahne senaryo + AI video prompt'ları

Prompt'lar İngilizce (video modelleri İngilizce'de belirgin daha iyi). Her klip 4-5 sn,
Firefly Video / Kling / Runway hangisini kullanırsan aynı prompt çalışır.
Stil tutarlılığı için her prompt'un sonuna aynı eki koy:
`— warm workshop lighting, shallow depth of field, cinematic, realistic, vertical 9:16`

| # | Süre | Sahne | AI prompt (kopyala) |
|---|---|---|---|
| 1 | 0-3 sn | Bilgisayar ekranında yeni sipariş bildirimi | `close-up of a computer screen in a print shop showing a new e-commerce order notification popping up, cursor clicking it` |
| 2 | 3-8 sn | Geniş format baskı makinesi sarı bayrak kumaşı basıyor | `large format digital printing machine printing a bright yellow flag fabric, ink heads moving fast, mesmerizing macro shot` |
| 3 | 8-13 sn | Kesim/dikiş — bayrağın şekli ortaya çıkıyor | `industrial fabric cutter cutting a teardrop-shaped advertising flag, precise slow motion` |
| 4 | 13-18 sn | Paketleme — rulo yapılıp kutuya, etiket yapıştırılıyor | `hands rolling a colorful advertising flag, placing it into a shipping box, applying a shipping label, satisfying packing video style` |
| 5 | 18-23 sn | Kargo aracına teslim / yola çıkış | `courier loading a package into a delivery van, van driving away from a small print shop, golden hour` |

## Türkçe seslendirme metni (ElevenLabs — "genç, enerjik, samimi erkek/kadın" sesi)

> (0-3) "Sabah 09:14. Denizli'den bir sipariş düştü: yelken bayrak."
> (3-8) "Baskıya giriyor — canlı renkler, dış mekâna dayanıklı kumaş."
> (8-13) "Kesim, dikiş... şekline kavuşuyor."
> (13-18) "Rulo, kutu, etiket. Hazır."
> (18-23) "Aynı gün kargoda. Türkiye'nin 81 iline, kapına kadar."
> (kapanış yazısı) "Her gün bir sipariş hikâyesi → takip et: @markala.com.tr"

Seslendirme ayarı: konuşma hızı doğal, arkadaki müzik -20dB. ElevenLabs'te Türkçe için
"multilingual v2" modeli; alternatif: Play.ht.

## Ekran yazıları (CapCut'ta bindirilecek)
- Açılış (hook, ilk 1 sn): **"Denizli'ye giden bu siparişin hikâyesi 👇"**
- Kapanış (son 3 sn): **"Takip et → her gün bir üretim hikâyesi"** + profil adı

## Montaj (CapCut, ~15 dk)
5 klip sırayla → seslendirme MP3 üstüne → trend ses %20 altta → yazılar → dışa aktar 1080×1920.

## Kampanya 1 reklam ayarları (Claude API'den kuracak)
| Ayar | Değer |
|---|---|
| Hedef | Etkileşim → Instagram profil ziyaretleri |
| Bölge / yaş | Türkiye · 24-50 |
| İlgi | küçük işletme, girişimcilik, e-ticaret, inşaat, iş güvenliği |
| Yerleşim | Yalnız Instagram (Reels + akış) |
| Bütçe | 100 TL/gün |
| Süre | 3 hafta (sonra Kampanya 2'ye geçiş) |

---

# KAMPANYA 2 — Açılış Çekilişi: 3 kişiye 1.000'er adet kartvizit

## Zamanlama
Kampanya 1'in 3. haftasında başlar (kitle ısınmışken), 10 gün sürer.
K1 bütçesi son hafta 50 TL/güne iner, K2'ye 150 TL/gün verilir.

## Neden bu ödül doğru
Kartvizit yalnız işletme sahibinin işine yarar → gelen takipçi birebir hedef kitle.
"iPhone çekilişi" tarzı genel ödül çöp takipçi getirir — bilinçli olarak yapılmıyor.

## Görsel
Tek güçlü kare (veya 5 sn'lik basit animasyon): şık kartvizit destesi + "AÇILIŞA ÖZEL"
şeridi + "3 kişiye 1.000 adet kartvizit". Adobe Express'ten Claude taslak üretebilir.

## Metin (gönderi açıklaması — hazır)

> 🎉 AÇILIŞA ÖZEL ÇEKİLİŞ
> 3 kişiye 1.000'er adet çift yön renkli kartvizit hediye! (kargo bizden)
>
> Katılım:
> 1️⃣ @markala.com.tr'yi takip et
> 2️⃣ Bu gönderiyi beğen
> 3️⃣ Yorumda kartvizitini yenilemek isteyen bir işletmeciyi etiketle
>
> ➕ Hikâyende paylaşana +1 hak
>
> 📅 Sonuçlar [TARİH] günü hikâyede — kazananlar yorumdan rastgele seçilir.
> Katılım ücretsizdir, satın alma şartı yoktur. Bu çekiliş Instagram tarafından
> desteklenmemekte, yönetilmemekte ve Instagram ile ilişkili değildir.

## Kurallar notu (önemli)
- Satın alma ŞARTI YOK → Milli Piyango izni gerektirmez (şarta bağlı olmayan promosyon).
  "Sipariş verene çekiliş hakkı" GİBİ bir koşul ASLA eklenmemeli — izin gerektirir.
- Instagram feragat cümlesi metinde zorunlu (yukarıda mevcut).
- Kazanan seçimi: yorumlar arasından rastgele (comment picker ekran kaydı = şeffaflık).

## Kampanya 2 reklam ayarları
| Ayar | Değer |
|---|---|
| Hedef | Etkileşim (gönderi etkileşimi) |
| Bölge / yaş | Türkiye · 24-50 |
| İlgi | K1 ile aynı + K1 etkileşenleri (birikmiş sıcak kitle) |
| Bütçe | 150 TL/gün × 10 gün |

---

# Takvim ve ölçüm

| Hafta | K1 | K2 |
|---|---|---|
| 1-2 | 100 TL/gün | — |
| 3 | 50 TL/gün | 150 TL/gün başlar |
| 4 | kapanır | devam + sonuç duyurusu |

Haftalık rapor (Claude, API'den): takipçi sayısı (taban 147) · profil ziyareti başı maliyet
(hedef <2 TL) · net takipçi başı maliyet (hedef 3-8 TL) · en iyi içerik.
Aylık toplam bütçe: ~4.000 TL.

# İş bölümü

| İş | Kim |
|---|---|
| 5 AI klip üretimi (prompt'lar yukarıda) | Hasan (~20 dk, Firefly/Kling) |
| Seslendirme (metin yukarıda) | Hasan (~5 dk, ElevenLabs) |
| CapCut montaj | Hasan (~15 dk) |
| Çekiliş görseli taslağı | Claude (Adobe Express) — istenirse |
| Her iki kampanyanın Meta'da kurulumu | Claude (API) |
| Profil hazırlığı (bio, öne çıkanlar, grid) | Hasan — reklam öncesi ŞART |
| Haftalık performans raporu | Claude |
