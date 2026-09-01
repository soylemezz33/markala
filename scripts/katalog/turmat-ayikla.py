# -*- coding: utf-8 -*-
"""
TURMAT HTML AYIKLAYICI (2026-08-29) — urunlerTurmat.txt'teki TÜM fiyat kalemlerini
yapılandırılmış çıkarır: bölüm, kod, fiyat, açıklama, "her X adet için Y" artışı.
Çıktı: /tmp muadili turmat-parsed.txt (§ ayraçlı) — turmat-karsilastir.py okur.

Biçim çeşitliliği: kimi bölümde KOD'dan hemen sonra fiyat, kiminde açıklama arada,
kiminde "Her 2000 Adet için 3000" artışı var. Bu yüzden token akışında KOD görülünce
sonraki ~8 token içinde ilk 3-6 haneli sayı fiyat kabul edilir; ardından gelen
"Her ... için <sayı>" artış olarak bağlanır. Ebat/adet açıklamadan taşınır.
"""
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
KAYNAK = "urunlerTurmat.txt"
HEDEF = r"C:\Users\ADMINI~1\AppData\Local\Temp\turmat-parsed.txt"

h = open(KAYNAK, encoding="utf-8", errors="replace").read()
# NOT: <!-- --> yorumlarını GLOBAL temizleme DENENDİ ve yanlıştı — dengesiz yorumlar
# koca bölümleri yutuyor (78 kaleme düşmüştü). Yorumlu başlık satırlarının token'ları
# (KOD/FİYAT/ÖZELLİKLER) zaten GURULTU filtresinde eleniyor; ham HTML'i olduğu gibi işle.
# Başlıklar h4 ile sınırlı değil (El ilanı/Afişler/Bloknotlar başka seviyede) → h1-h5 hepsi.
bolumler = re.split(r"<h[1-5][^>]*>([^<]{3,60})</h[1-5]>", h)

KOD = re.compile(r"^[0-9]{0,2}[A-ZÇĞİÖŞÜ]{1,8}[0-9]{0,6}(?:-[0-9]{2,6}){0,2}$")
SAYI = re.compile(r"^[0-9]{1,3}(?:[.,][0-9]{3})*$|^[0-9]{3,6}$")
GURULTU = {"KOD", "FİYAT", "ÖZELLİKLER", "SELEFON", "EBAT", "ADET", "CM", "GR", "TL", "PDF", "JPG", "AI", "EPS"}

cikti = []
for i in range(1, len(bolumler), 2):
    ad, govde = bolumler[i].strip(), bolumler[i + 1]
    t = re.sub(r"<[^>]+>", "|", govde)
    tok = [x.strip() for x in t.split("|") if x.strip() and x.strip() != "&nbsp;"]
    j = 0
    while j < len(tok):
        x = tok[j]
        if KOD.fullmatch(x) and x.upper() not in GURULTU and not SAYI.fullmatch(x):
            fiyat = None
            aciklama = []
            k = j + 1
            while k < len(tok) and k <= j + 8:
                s = tok[k].replace(".", "").replace(",", "")
                if fiyat is None and SAYI.fullmatch(tok[k]) and len(s) >= 3:
                    fiyat = int(s)
                elif KOD.fullmatch(tok[k]) and not SAYI.fullmatch(tok[k]) and tok[k].upper() not in GURULTU:
                    break  # sıradaki kod başladı
                else:
                    aciklama.append(tok[k])
                k += 1
            # "Her X Adet için Y" artışı
            artis_adet = artis_fiyat = ""
            kuyruk = " ".join(tok[j + 1 : j + 14])
            m = re.search(r"Her\s*\|?\s*([0-9.]+)\s*\|?\s*Adet\s*\|?\s*için\s*\|?\s*([0-9.]+)", " | ".join(tok[j + 1 : j + 14]))
            if m:
                artis_adet = m.group(1).replace(".", "")
                artis_fiyat = m.group(2).replace(".", "")
            if fiyat is not None:
                acik = " ".join(a for a in aciklama if not a.isdigit() or len(a) < 3)[:120]
                cikti.append(f"{ad}§{x}§{fiyat}§{acik}§{artis_adet}§{artis_fiyat}")
        j += 1

with open(HEDEF, "w", encoding="utf-8") as f:
    f.write("\n".join(cikti))

# Özet: bölüm başına kalem sayısı
from collections import Counter
sayim = Counter(c.split("§")[0] for c in cikti)
print(f"TOPLAM {len(cikti)} kalem, {len(sayim)} bölüm → {HEDEF}")
for ad, n in sayim.items():
    print(f"  {ad}: {n}")
