# Turmat maliyet karşılaştırması — durum notu (2026-08-29)

Hasan talebi: TÜM ürün maliyetleri Turmatsan ile birebir aynı olacak, 0 hata.
Kaynak: `urunlerTurmat.txt` (= Hasan'ın yapıştırdığı güncel fiyat-listesi sayfası, 22 bölüm, 154 kalem).
Araçlar: `scripts/katalog/turmat-ayikla.py` (HTML→parsed.txt) + `turmat-karsilastir.py` (→ Downloads\markala-turmat-maliyet.xlsx).

## Hasan'ın 2 geri bildirimi (2026-08-29 akşam)
1. **Excel okunaklı değil** — kolon sırası kafa karıştırıyor. YENİ DÜZEN: tek sayfa,
   ürün sırasıyla: ÜRÜN | TURMAT KOD | ÖZELLİK | ADET | TURMAT ₺ | BİZDE ₺ | FARK | DURUM.
   Anahtar kolonlar (slug/okey/dim) ayrı GİZLİ sayfaya. Kırmızı=farklı, gri=eşleşmedi.
2. **Kartvizit eşleşmedi** — Turmat kodları ↔ bizim seçenekler köprüsü gerekiyordu.
   Hasan kod eşlemesini gönderecek ("ben sana tekrar atacagım kodu"). GELMEDEN KARTVİZİT MALİYETİ YAZMA.

## Doğrulanmış Turmat verisi (1000 adet bazı, kartvizit 82x52):
NK=220 NKA=240 NSK=200 MNA=260 CYP=320 CYM=310 KL=320 CYML4=400 O-COK=430 S-COK=500
O-SEK=650 EKO-SEK=600 S-SEK=750 A-SEK=1000 AC-SEK=1100 TANK=715 AY=600 GY=620 VIP=800 FAN=450 F-SEK=780

## Yapılan düzeltmeler (canlı DB'ye YAZILDI)
- amerikan-servis 9 satır: SRV1 4000/7000/10000 · SRV2 3000/5450/7900 · SRV3 5350/8475/11600 ✔
- Broşür/El ilanı/Kapı askı maliyetleri Turmat'la birebir DOĞRULANDI (değişiklik gerekmedi).

## Bekleyen adımlar
1. turmat-karsilastir.py: okunaklı yeni Excel düzeni (yukarıdaki kolon sırası).
2. Kesin eşlemeler (adet+ebat determinist): afiş(AF1-6↔afis-*), antetli(ANT1-6), zarf(Z1-3, artışlı),
   makbuz(M/MR1-4), oto paspas(P1-3), etiket(E/ES/EO/EOY/ETM/ETL), dosya(PD/MND/KLD/CYPD/CYMD/CYML4D/AVD*),
   çanta(CNT1-4+KRAFT, artışlı), bloknotlar(NKKB-*, B1-29), notluk, ürün kutuları(KT1-14, ürün görsel bekliyor),
   magnet(MAG1-3, 10+…), pro/selefonlu broşür (CBS/PRO kodları — bizde ayrı seçenek var mı KONTROL ET).
3. Kartvizit: Hasan'ın kod eşlemesi gelince map + karşılaştır.
4. Tüm ✗ satırları tek onay tablosuyla Hasan'a sun → onayla DB'ye yaz → fiyat-inceleme.xlsx'i yeniden üret.

## Dikkat
- Amerikan Servis düzeltmesi sonrası satış marjları 1.19-1.22'ye düştü — Hasan satışları gözden geçirecek
  (markala-fiyat-inceleme.xlsx elinde; o dosyada A.Servis maliyetleri bayat, satırlarına dokunmasın dendi).
- Excel'ler: markala-fiyat-inceleme.xlsx (Hasan dolduruyor) ≠ markala-fiyat-girisi.xlsx (97 yeni kalem)
  ≠ markala-turmat-maliyet.xlsx (bu karşılaştırma).

## GÜNCELLEME (aynı akşam)
- KARTVİZİT ÇÖZÜLDÜ: klasik-kartvizit option_key'leri ZATEN Turmat kodları (nk, kl, s-sek...).
  21/21 karşılaştırıldı; tek fark vip 780→800 DB'de DÜZELTİLDİ. Hasan'dan eşleme beklemeye gerek YOK.
- KALAN İŞ: turmat-dogru-maliyet.py'deki 44 "eşleşmedi" + 4 kırmızı satırı erit (ipucu stringlerini
  DB option_key'lerine bakarak düzelt — kartvizitteki gibi anahtarlar muhtemelen Turmat kodu),
  bitmiş Excel'i yeniden üret, Hasan'a "bitti" diye ilet. Hasan bekliyor.
