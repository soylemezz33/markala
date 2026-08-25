# Rekabet Planı — Rakipleri Geçmek İçin Yol Haritası (2026-08-25)

> Hazırlayan: SEO/reklam oturumu. Veri kaynakları: GSC (gerçek Google verisi), Ads API,
> sipariş atıf sistemi, site denetimleri. Rakip taraması: web araması (Semrush kotası dolu).

## 1. Durum fotoğrafı (kanıtlarla)

**Güçlü yanlarımız:**
- Ölçüm zinciri rakiplerin çoğundan iyi: gclid yakalama + offline dönüşüm + tam atıf (20 Ağu'dan beri 8 reklam siparişi tek tek kelimesine kadar izlendi)
- Reklam motoru kanıtlı: Reklam & Tabela kampanyası ~4x+ ROAS (branda baskı, yelken bayrak, folyo satıyor)
- İSG niş derinliği: 800+ levha ürünü, hepsi içerikli — büyük rakiplerin zayıf olduğu alan
- İçerik makinesi: 6 fiyat rehberi + günlük otomatik blog (30 konuluk havuz) + 24 soruluk SSS (FAQPage şemalı)
- AI görünürlüğe erken giriş: botlara açık site + llms.txt + alıntılanabilir içerik (rakiplerin çoğu hâlâ Cloudflare engelli)
- Yerel koz: Mersin motor kurye (aynı gün) + 19 şehir sayfası (Gaziantep #7,2'ye çıktı)
- SEO ivmesi: 4 haftadır her metrik yukarı (tık +%62 hafta/hafta, ort. poz 15,9→12,4)

**Zayıf yanlarımız (rakiplerle kıyasla):**
1. **Otorite uçurumu**: AS 2 / ~8 referans domain vs rakiplerin yıllarca birikmiş bin+ backlink'i. En büyük yapısal açık.
2. **Mobil hız**: PSI 52-58 (dev oturumunda P2/P4 bekliyor). Rakipler de mükemmel değil ama biz yavaşız.
3. **Google Merchant askıda** (Misrepresentation) → Shopping reklamları + ücretsiz listelemeler kapalı. Rakipler orada.
4. **GBP (Google İşletme Profili) yok** → "mersin matbaa" yerel paketinde görünmüyoruz; Mersin kampanyası CTR %6-8 ile talebi kanıtlıyor ama harita tarafı boş.
5. **Sosyal kanıt yok**: Google yorumu, site içi yorum akışı, referans logoları yok. Rakiplerde binlerce yorum var.
6. **Tek kanal**: Yalnız kendi sitemiz. Rakipler Trendyol/Hepsiburada'da da satıyor (özellikle İSG levha gibi standart ürünlerde pazar yeri ciddi hacim).
7. **Marka bilinirliği**: "markala" sorgusu bile #2,9 (site adımızda başkaları çıkabiliyor); marka aramaları az.

## 2. Konumlanma kararı

Bidolubaskı/Matbuu ile "kartvizit baskı" gibi kafa kelimelerde kısa vadede savaşamayız (otorite uçurumu 1-2 yıllık iş). Kazanacağımız savaşlar:
- **Niş derinliği**: İSG + GES + sektörel B2B levha/etiket (kanıt: GES #6,5, İSG sorguları ilk sayfaya tırmanıyor)
- **Uzun kuyruk + fiyat şeffaflığı**: "1000 adet a5 broşür fiyatı" tipi sorgular (rehberler + KDV dahil anlık fiyat)
- **Bölgesel**: Mersin/Adana/Gaziantep/Antalya hattı (şehir sayfaları + GBP + aynı gün Mersin)
- **AI cevapları**: ChatGPT/Perplexity kaynak gösterimi (erken davrandık, rakipler kapalı)
- **Hizmet farkı**: ücretsiz tasarım desteği + KDV dahil fiyat + kurumsal cari hesap

## 3. Cepheler ve İŞ BÖLÜMÜ

### CEPHE 1 — Otorite/Backlink (en büyük açık; etki: 3-6 ay, kalıcı)
| Kim | Ne |
|---|---|
| **Hasan** | docs/BACKLINK-PLANI-2026-08.md listesini işle: sektör dizinleri, ticaret odası/MTSO kaydı, tedarikçi "bayilerimiz" sayfaları, yerel basın (açılış haberi), üniversite/etkinlik sponsorlukları |
| **Claude** | Bağlantı mıknatısı içerik üretmeye devam (fiyat rehberleri zaten bunun için); çeyreklik "sektör verisi" içeriği (ör. baskı fiyat endeksi) tasarla; kazanılan linkleri GSC'den izle |

### CEPHE 2 — Yerel/GBP (hızlı kazanım; etki: 2-4 hafta)
| Kim | Ne |
|---|---|
| **Hasan** | Google İşletme Profili aç (Menteş Mah. adresiyle), doğrulama kartını bekle/gir; her teslim edilen siparişe Google yorumu iste (link SMS/e-posta ile) |
| **Claude** | GBP açılınca: kategori/hizmet/ürün alanlarını optimize et, web sitesi bağlantılarını kur, LocalBusiness şemasını GBP ile hizala, yorum linkini sipariş e-postalarına ekleten spec'i dev oturumuna yaz |

### CEPHE 3 — Merchant Center / Shopping (kapalı kanalı aç; etki: itiraz sonucu 1-2 hafta)
| Kim | Ne |
|---|---|
| **Hasan** | Merchant itirazını başlat (adres artık her yerde tutarlı + ETBİS kayıtlı — itiraz şansı yüksek). Panel: Merchant Center → İtiraz |
| **Claude** | İtiraz öncesi son kontrol listesi çıkar (iade/teslimat/iletişim sayfaları, feed alanları); onay gelince feed'i doğrula (`npm run merchant:sync`) ve Shopping kampanya taslağı hazırla (ONAYINLA kurulur) |

### CEPHE 4 — Hız (dönüşüm + sıralama; dev oturumu işi)
| Kim | Ne |
|---|---|
| **Hasan** | Dev oturumuna docs/HIZ-SARTNAME-2026-08-20.md'yi işlet (P2 TBT + P4 hero CLS) — anasayfa mobil 52-58'de duruyor |
| **Claude** | Deploy sonrası saha verisiyle (web-vitals GA4 olayları + PSI) önce/sonra ölçümü |

### CEPHE 5 — İçerik/Niş derinleşme (sürüyor; etki: birikimli)
| Kim | Ne |
|---|---|
| **Claude** | Günlük blog otomasyonu (kuruldu, ilk makale bugün çıktı); havuz bitmeden GSC verisiyle yenile; İSG/GES/sektör kümelerinde rehber ağını genişlet; SSS'yi büyüt |
| **Hasan** | Blog kalitesini ara ara gözden geçir (haftada 5 dk); müşterilerden gelen gerçek soruları bana ilet (SSS+blog malzemesi) |

### CEPHE 6 — Dönüşüm oranı (aynı trafikten daha çok satış)
| Kim | Ne |
|---|---|
| **Hasan** | Karar: hoşgeldin %10 kuponu sepette otomatik görünsün mü? (Murat Alp vakası: kupon vardı, kullanılmadı) · Telefon/WhatsApp siparişlerinde "nereden ulaştınız?" sorusunu alışkanlık yap (İSG kör noktası) |
| **Claude** | Dev oturumuna spec: misafir siparişini üyeliğe bağlama + kupon görünürlüğü + sepet terk e-postası akışı (recoveryMailStage altyapısı zaten var, aktif mi kontrol edilecek) |

### CEPHE 7 — Kanal genişletme (orta vade)
| Kim | Ne |
|---|---|
| **Hasan** | Karar: Trendyol/Hepsiburada'da standart ürünlerle (İSG levha, hazır etiket) mağaza açılsın mı? Komisyon ~%15-20 ama hacim + yorum + marka bilinirliği getirir |
| **Claude** | Karar verilirse: ürün feed'i hazırlama, başlık/açıklama SEO'su, fiyat stratejisi analizi |

### CEPHE 8 — Sosyal kanıt + marka
| Kim | Ne |
|---|---|
| **Hasan** | IG filmini bitir (VO + montaj kaldı) → takipçi kampanyası başlasın; teslim edilen işlerin fotoğraflarını çek/çektir (gerçek ürün fotoğrafları hem sitede hem reklamda mockup'ların yerini alır) |
| **Claude** | IG kampanyasını API'den kur (video hazır olunca); yorum sistemi spec'i; gerçek fotoğraflar gelince reklam görsellerini yenile |

## 4. Sıralama (ilk 90 gün)

**Bu hafta:** GBP başvurusu (Hasan) · Merchant itirazı (Hasan) · hız şartnamesi dev'e (Hasan) · blog otomasyonu izleme + Eylül bütçe geçişi (Claude)
**Bu ay:** Backlink listesinin ilk 10 kaydı (Hasan) · GBP optimizasyonu + yorum akışı (Claude+Hasan) · CRO spec'leri dev'e (Claude) · IG kampanya lansmanı (birlikte)
**90 gün:** Marketplace kararı ve açılışı · Shopping kampanyaları · rehber ağı 15+ sayfa · aylık 10k reklamla ROAS ≥3x hedefi · GSC aylık tık 81 → 400+

## 5. Ölçüm — neyi başarı sayacağız
- GSC: aylık tık (81 → 200 Eylül sonu → 400+ Ekim sonu), ilk sayfa sorgu sayısı (65 → 100+)
- Ads: ölçülen ROAS ≥3x, İSG telefon dönüşümü netliği
- Yerel: GBP görüntülenme + yorum sayısı (0 → 25+)
- Otorite: referans domain 8 → 25+
- Kanal: reklamsız (organik+direkt) sipariş oranı %20 → %40
