# -*- coding: utf-8 -*-
"""
YENİ FİYATLARI UYGULA (2026-08-30) — Hasan onayı: markala-fiyat-guncel-29.08.26.xlsx
"YAYINLANACAK SATIS" kolonu → adet/matris ürünlerde product_prices.price (KDV dahil satış),
m² ürünlerde product_prices.cost (PARA kolonuna göre USD/TL). Teyitli kararlar:
pleksi 5mm 79.2 USD doğru · kapaklı bloknot -%23 rekabet indirimi · gold saçak marj 1.05.

Çıktılar:
  fiyat-uygula.sql   — BEGIN/COMMIT'li güncelleme (ON_ERROR_STOP ile çalıştırılır)
  fiyat-rollback.sql — eski değerlere dönüş (Excel'deki MALİYET/SATIŞ kolonlarından)
"""
import sys
import openpyxl

sys.stdout.reconfigure(encoding="utf-8")
KAYNAK = r"C:\Users\Administrator\Downloads\markala-fiyat-guncel-29.08.26.xlsx"
SQL = r"C:\Users\ADMINI~1\AppData\Local\Temp\fiyat-uygula.sql"
GERI = r"C:\Users\ADMINI~1\AppData\Local\Temp\fiyat-rollback.sql"

def f(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

ws = openpyxl.load_workbook(KAYNAK, data_only=True)["FİYATLAR"]
uygula, geri = ["BEGIN;"], ["BEGIN;"]
n_satis = n_maliyet = atlanan = 0
sluglar = set()
for r in ws.iter_rows(min_row=2, values_only=True):
    kat, urun, tip, grup, sec, kad, para, mal, sat, yeni = r[:10]
    slug, gkey, okey, dim = r[13], r[14], r[15], r[16]
    y = f(yeni)
    if y is None or not slug or not gkey:
        atlanan += 1
        continue
    # Anahtar koşulu — dim boşsa IS NULL/'' toleransı
    kosul = (
        f"pr.product_id=(select id from products where slug={q(slug)}) "
        f"and pr.group_key={q(gkey)} and coalesce(pr.option_key,'')={q(okey or '')} "
        f"and coalesce(pr.dim_key,'')={q(dim if dim is not None else '')}"
    )
    if tip == "m²":
        m = f(mal)
        if m is not None and abs(y - m) < 0.005:
            continue  # değişmemiş
        uygula.append(f"update product_prices pr set cost={y} where {kosul};")
        geri.append(f"update product_prices pr set cost={m if m is not None else 'NULL'} where {kosul};")
        n_maliyet += 1
    else:
        s = f(sat)
        if s is not None and abs(y - s) < 0.005:
            continue
        yy = round(y, 2)
        uygula.append(f"update product_prices pr set price={yy} where {kosul};")
        geri.append(f"update product_prices pr set price={s if s is not None else 'NULL'} where {kosul};")
        n_satis += 1
    sluglar.add(slug)

# Değişen adet/matris ürünlerin "…'den başlar" fiyatını tazele (min satır fiyatı).
uygula.append(
    "update products p set starting_price = sub.m from ("
    "select product_id, min(price) as m from product_prices where price>0 group by product_id) sub "
    "where sub.product_id=p.id and p.pricing_mode<>'area' and p.slug in ("
    + ",".join(q(s) for s in sorted(sluglar)) + ");"
)
uygula.append("COMMIT;")
geri.append("COMMIT;")
open(SQL, "w", encoding="utf-8").write("\n".join(uygula))
open(GERI, "w", encoding="utf-8").write("\n".join(geri))
print(f"satış güncellemesi: {n_satis} · m² maliyet güncellemesi: {n_maliyet} · atlanan(boş): {atlanan}")
print(f"etkilenen ürün: {len(sluglar)}")
print("SLUGLAR:", " ".join(sorted(sluglar)))
