# -*- coding: utf-8 -*-
"""
HEADER MENÜSÜNE "DİJİTAL BASKI" SEKMESİ (2026-08-28, Hasan).

Menü iki yerde tanımlı: koddaki DEFAULT_NAV ve site_settings.header_nav.
Panelde kayıt VARSA o kazanır — bu yüzden kodu değiştirmek tek başına yetmez,
DB kaydı da güncellenmeli. Bu script DB tarafını yapar.

DEĞİŞİKLİKLER
  1) "Bayrak & Branda" → "Bayrak & Stand"; vinil/mesh branda çıkarılır (taşınıyor)
  2) "Reklam Tabela"tan Dekota, Folyo Çeşitleri, Araç Sticker çıkarılır (taşınıyor)
  3) "Dijital Baskı" sekmesi Reklam Tabela'nın HEMEN YANINA eklenir

ÇAKIŞMA BIRAKILMAZ: taşınan ürünler eski sekmelerinden silinir, iki yerde görünmez.
Çalıştırmadan önce mevcut kayıt yedeklenir (header_nav_yedek_20260828).
"""
import json
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")
SSH = ["ssh", "-i", "/c/Users/Administrator/.ssh/markala_appvm", "root@10.20.33.5"]


def psql(sql: str) -> str:
    """SQL'i DOSYA ile taşır. Doğrudan -c ile göndermek, ssh + sh -c + psql üç kat
    tırnak kaçışı gerektiriyor ve JSON payload'da kaçınılmaz olarak bozuluyor."""
    import os
    import tempfile
    fd, yol = tempfile.mkstemp(suffix=".sql")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(sql)
    try:
        r = subprocess.run(["scp", "-i", "/c/Users/Administrator/.ssh/markala_appvm", "-q",
                            yol, "root@10.20.33.5:/tmp/_nav.sql"], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit(f"scp hatası: {r.stderr}")
        cmd = ("docker cp /tmp/_nav.sql markala-postgres:/tmp/_nav.sql && "
               "docker exec markala-postgres sh -c "
               "'psql -U $POSTGRES_USER -d $POSTGRES_DB -t -A -v ON_ERROR_STOP=1 -f /tmp/_nav.sql'")
        r = subprocess.run(SSH + [cmd], capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            raise SystemExit(f"psql hatası: {r.stderr}")
        return r.stdout.strip()
    finally:
        os.unlink(yol)


nav = json.loads(psql("select value::text from site_settings where key='header_nav'"))
print(f"mevcut: {len(nav)} sekme")

DIJITAL = {
    "label": "Dijital Baskı",
    "href": "/urunler?kategoriler=vinil-branda-afis,folyo,dekota-baski,arac-sticker&grup=Dijital%20Bask%C4%B1",
    "groups": [
        {"title": "Vinil & Branda", "items": [
            {"label": "Vinil Branda 440 gr", "href": "/urun/vinil-branda-440gr", "badge": "POPÜLER"},
            {"label": "Mesh Branda", "href": "/urun/mesh-branda"},
        ]},
        {"title": "Folyo & Levha", "items": [
            {"label": "Folyo Çeşitleri", "href": "/urun/folyo-cesitleri"},
            {"label": "Dekota / Foreks Baskı", "href": "/urun/dekota-baski-5mm"},
            {"label": "Araç Sticker", "href": "/urun/arac-sticker-yan"},
        ]},
    ],
    "featured": [
        {"slug": "vinil-branda-440gr", "label": "Vinil Branda", "theme": "brand"},
        {"slug": "dekota-baski-5mm", "label": "Dekota Baskı", "theme": "paper"},
    ],
}

# Dijital Baskı'ya taşınan ürünlerin adresleri — eski sekmelerden bunlar silinir.
TASINAN = {"/urun/vinil-branda-440gr", "/urun/mesh-branda",
           "/urun/folyo-cesitleri", "/urun/cam-folyosu-kesimli",
           "/urun/dekota-baski-5mm", "/urun/arac-sticker-yan"}

yeni = []
for cat in nav:
    if cat["label"] == "Dijital Baskı":
        continue                                    # tekrar çalıştırılırsa çoğaltma
    # taşınan linkleri temizle, boşalan grubu düşür
    gruplar = []
    for g in cat.get("groups", []):
        kalan = [i for i in g.get("items", []) if i.get("href") not in TASINAN]
        if kalan:
            gruplar.append({**g, "items": kalan})
    cat["groups"] = gruplar
    # taşınan ürün öne çıkan karttaysa onu da çıkar
    cat["featured"] = [f for f in cat.get("featured", [])
                       if f"/urun/{f.get('slug')}" not in TASINAN]

    if cat["label"] == "Bayrak & Branda":
        cat["label"] = "Bayrak & Stand"             # branda kalmadı → ad düzeltilir
        for g in cat["groups"]:
            if g["title"] == "Branda & Stand":
                g["title"] = "Stand"
        if not cat["featured"]:
            cat["featured"] = [{"slug": "rollup-standart", "label": "Roll-Up Banner", "theme": "brand"}]
    if cat["label"] == "Reklam Tabela":
        # Folyo taşınınca "Folyo & Araç" başlığında folyo kalmıyor; kalan iki-üç kalem
        # zaten tek sütuna sığıyor → gruplar tek "Tabela & Levha" altında birleştirilir.
        kalanlar = [i for g in cat["groups"] for i in g["items"]]
        cat["groups"] = [{"title": "Tabela & Levha", "items": kalanlar}] if kalanlar else []
        if not cat["featured"]:
            cat["featured"] = [{"slug": "lightbox-led-100cm", "label": "Lightbox LED", "theme": "ink"}]
        cat["featured"] = (cat["featured"] + [{"slug": "arac-magneti-30x40", "label": "Araç Magneti", "theme": "paper"}])[:2]

    yeni.append(cat)
    if cat["label"] == "Reklam Tabela":
        yeni.append(DIJITAL)                        # HEMEN YANINA

if not any(c["label"] == "Dijital Baskı" for c in yeni):
    yeni.append(DIJITAL)

print(f"\nyeni: {len(yeni)} sekme")
for c in yeni:
    gr = " | ".join(f'{g["title"]}({len(g["items"])})' for g in c.get("groups", []))
    isaret = "  ← YENİ" if c["label"] == "Dijital Baskı" else ""
    print(f"  - {c['label']:24} {gr}{isaret}")

if "--uygula" not in sys.argv:
    print("\n(kuru çalışma — yazılmadı; --uygula ile çalıştır)")
    raise SystemExit

payload = json.dumps(yeni, ensure_ascii=False).replace("'", "''")
# site_settings."group" NOT NULL — yedek satırı da aynı grubu taşımalı.
psql("insert into site_settings(key, value, \"group\", updated_at) "
     "select 'header_nav_yedek_20260828', value, \"group\", now() from site_settings where key='header_nav' "
     "on conflict (key) do update set value = excluded.value, updated_at = now()")
psql(f"update site_settings set value = '{payload}'::jsonb, updated_at = now() where key='header_nav'")
print("\nDB güncellendi (yedek: header_nav_yedek_20260828)")
