/**
 * Sipariş kaynağı (atıf) yakalama — ÇEREZ ONAYINDAN BAĞIMSIZ.
 *
 * Neden gerekli (2026-08-18 denetimi): Reklam tıklama kimliği `gclid` şu ana kadar yalnız
 * iki yoldan yakalanıyordu ve ikisi de onay verilmeyen kullanıcıda ÇALIŞMIYOR:
 *   1. `_gcl_aw` çerezi — gtag bunu YALNIZ `ad_storage: granted` iken yazar.
 *   2. `referer` üzerindeki `?gclid=` — ödeme adımında referer site-içi (`/odeme`) olduğu
 *      için pratikte hiç dolmaz.
 * Sonuç: siparişlerin çoğunda kaynak bilinmiyordu, reklam bütçesi kör harcanıyordu.
 *
 * Bu modül reklam takibi YAPMAZ; üçüncü taraflara hiçbir şey göndermez. Yalnız kullanıcının
 * siteye hangi bağlantıyla geldiğini kendi birinci-taraf depomuza yazar ki kendi siparişimizin
 * kaynağını bilelim. Üçüncü taraf aktarımı (Meta CAPI / Ads) hâlâ `marketingConsent`'e bağlı.
 */

const KEY = "markala_attribution";
/** 90 gün — Ads dönüşüm penceresi varsayılan 30 gün; üst sınır için güvenli pay. */
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface AttributionUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface Attribution {
  /** Google Ads tıklama kimliği. */
  gclid?: string;
  /** iOS/uygulama kampanyalarında gclid YERİNE gelir — atlanırsa o trafik ölçülemez. */
  gbraid?: string;
  wbraid?: string;
  utm?: AttributionUtm;
  /** Yakalama zamanı (ms) — TTL kontrolü için. */
  ts: number;
}

/** Aşırı uzun/bozuk değerleri kes; depoyu ve DB kolonlarını (200 kr) taşırma. */
function clamp(v: string | null | undefined, max = 200): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

/** Boş alanları ayıklar; hiç alan kalmazsa undefined döner (boş nesne yazmayalım). */
function compactUtm(u: AttributionUtm): AttributionUtm | undefined {
  const out: AttributionUtm = {};
  for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
    if (u[k]) out[k] = u[k];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Sayfa açılışında URL'deki reklam/kampanya parametrelerini yakalar.
 *
 * SON-TIKLAMA (last touch): yeni bir tıklama kimliği gelirse eskisinin ÜZERİNE yazılır —
 * Google Ads dönüşümleri `gclid` ile tekilleştirdiği için doğru olan budur. Yalnız UTM gelip
 * tıklama kimliği gelmediğinde de kayıt tazelenir (kaynak değişmiştir).
 * Parametre yoksa mevcut kayda DOKUNULMAZ (site içi gezinme atfı silmemeli).
 */
export function captureFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const gclid = clamp(p.get("gclid"));
    const gbraid = clamp(p.get("gbraid"));
    const wbraid = clamp(p.get("wbraid"));
    const utm = compactUtm({
      source: clamp(p.get("utm_source"), 100),
      medium: clamp(p.get("utm_medium"), 100),
      campaign: clamp(p.get("utm_campaign"), 150),
      term: clamp(p.get("utm_term"), 150),
      content: clamp(p.get("utm_content"), 150),
    });

    if (!gclid && !gbraid && !wbraid && !utm) return; // yeni sinyal yok → mevcut kaydı koru

    const next: Attribution = { ts: Date.now() };
    if (gclid) next.gclid = gclid;
    if (gbraid) next.gbraid = gbraid;
    if (wbraid) next.wbraid = wbraid;
    if (utm) next.utm = utm;

    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage kapalı/dolu (gizli sekme, kota) → atıf kaydı olmadan devam.
    // Akış ASLA kırılmamalı; atıf "olsa iyi olur" verisidir, satışın önüne geçemez.
  }
}

/** Geçerli atıf kaydı; yoksa/süresi dolmuşsa null (ve süresi dolmuşsa temizlenir). */
export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    // En az bir anlamlı sinyal içermeli
    if (!parsed.gclid && !parsed.gbraid && !parsed.wbraid && !parsed.utm) return null;
    return parsed;
  } catch {
    return null;
  }
}
