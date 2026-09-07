"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  Heartbeat,
  Database,
  EnvelopeSimple,
  Clock,
  HardDrives,
  Plugs,
  Warning,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Cpu,
} from "@phosphor-icons/react";

type Seviye = "saglikli" | "uyari" | "arizali";

/** Otomatik yenileme aralığı. Kesinti anında sayfayı elle yenilemek zorunda kalmayın. */
const YENILEME_MS = 30_000;

const SEVIYE_STIL: Record<Seviye, { ad: string; kutu: string; nokta: string; yazi: string }> = {
  saglikli: { ad: "Sağlıklı", kutu: "bg-emerald-50 border-emerald-200", nokta: "bg-emerald-500", yazi: "text-emerald-700" },
  uyari: { ad: "Dikkat", kutu: "bg-amber-50 border-amber-200", nokta: "bg-amber-500", yazi: "text-amber-700" },
  arizali: { ad: "Arızalı", kutu: "bg-red-50 border-red-200", nokta: "bg-red-500", yazi: "text-red-700" },
};

function seviye(v: unknown): Seviye {
  return v === "saglikli" || v === "uyari" || v === "arizali" ? v : "uyari";
}

function tarih(v: unknown): string {
  if (typeof v !== "string" || !v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "medium" });
}

/** "3 sa 14 dk" — çalışma süresi gibi değerler için. */
function sure(saniye: unknown): string {
  const s = Number(saniye);
  if (!Number.isFinite(s) || s < 0) return "—";
  const g = Math.floor(s / 86400);
  const sa = Math.floor((s % 86400) / 3600);
  const dk = Math.floor((s % 3600) / 60);
  if (g > 0) return `${g} gün ${sa} sa`;
  if (sa > 0) return `${sa} sa ${dk} dk`;
  return `${dk} dk`;
}

function sayi(v: unknown): string {
  return typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("tr-TR") : "—";
}

export function SistemSagligiClient() {
  const [rapor, setRapor] = useState<Record<string, any> | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sonCekim, setSonCekim] = useState<Date | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const cek = useCallback(async () => {
    try {
      const r = await fetch("/api/sistem-sagligi", { cache: "no-store" });
      const d = await r.json();
      setRapor(d);
      setHata(null);
    } catch (e) {
      // Ağ tamamen koptuysa bile sayfa ayakta kalsın ve bunu SÖYLESİN.
      setHata((e as Error)?.message ?? "Rapor alınamadı");
    } finally {
      setYukleniyor(false);
      setSonCekim(new Date());
    }
  }, []);

  useEffect(() => {
    void cek();
    const t = setInterval(() => void cek(), YENILEME_MS);
    return () => clearInterval(t);
  }, [cek]);

  const genel = seviye(rapor?.toplam);
  const stil = SEVIYE_STIL[genel];

  const bolumler = useMemo(() => {
    if (!rapor || rapor.ulasilamadi) return [];
    const db = rapor.veritabani ?? {};
    const havuz = db.havuz ?? {};
    const posta = rapor.eposta ?? {};
    const isler = rapor.zamanlanmisIsler ?? {};
    const disk = rapor.depolama ?? {};
    const hatalar = rapor.hatalar ?? {};
    const api = rapor.api ?? {};

    return [
      {
        anahtar: "veritabani",
        baslik: "Veritabanı",
        ikon: Database,
        seviye: seviye(db.seviye),
        ozet: db.baglanti ? `Bağlı · ${sayi(db.gecikmeMs)} ms` : "BAĞLANTI YOK",
        // Bağlantı havuzu en üstte: 7 Eylül kesintisinde dolan tam olarak buydu.
        satirlar: [
          {
            ad: "Bağlantı havuzu",
            deger:
              havuz.acik !== null && havuz.limit
                ? `${sayi(havuz.acik)} / ${sayi(havuz.limit)} (%${sayi(havuz.kullanimYuzde)})`
                : "ölçülemedi",
            vurgu: true,
          },
          { ad: "Boştaki bağlantı", deger: sayi(havuz.bosta) },
          { ad: "Çalışan sorgu", deger: sayi(havuz.aktif) },
          { ad: "İşlem içinde bekleyen", deger: sayi(havuz.islemdeBosta) },
          { ad: "Sunucu bağlantı tavanı", deger: sayi(havuz.sunucuTavani) },
          {
            ad: "Havuz zaman aşımı (15 dk)",
            deger: sayi(db.havuzZamanAsimi15dk),
            vurgu: Number(db.havuzZamanAsimi15dk) > 0,
          },
        ],
        // Havuzun DOLU görünmesi normaldir: Prisma bağlantıları limite kadar açar ve açık
        // tutar. Uyarı yalnız gerçek arıza imzasında (havuz zaman aşımı) gösterilir.
        not:
          Number(db.havuzZamanAsimi15dk) > 0
            ? `Son 15 dakikada ${sayi(db.havuzZamanAsimi15dk)} istek havuzdan bağlantı alamadı — site şu anda hizmet veremiyor olabilir (7 Eylül 2026 kesintisi böyle başladı).`
            : "Havuzun limite kadar dolu görünmesi normaldir; bağlantılar açık tutulur. Arıza göstergesi, zaman aşımı hatalarıdır.",
      },
      {
        anahtar: "eposta",
        baslik: "E-posta",
        ikon: EnvelopeSimple,
        seviye: seviye(posta.seviye),
        ozet: posta.ok === false ? "GÖNDERİM ARIZALI" : "Gönderim çalışıyor",
        satirlar: [
          { ad: "Son 24 saatte başarısız", deger: sayi(posta.failedLast24h), vurgu: Number(posta.failedLast24h) > 0 },
          { ad: "Son 15 dakikada başarısız", deger: sayi(posta.failedLast15m) },
          { ad: "Son başarılı gönderim", deger: tarih(posta.lastSentAt) },
          { ad: "Son hata", deger: tarih(posta.lastFailureAt) },
        ],
        not: typeof posta.lastError === "string" && posta.lastError ? `Son hata: ${posta.lastError}` : null,
      },
      {
        anahtar: "hatalar",
        baslik: "Sunucu hataları (5xx)",
        ikon: Warning,
        seviye: seviye(hatalar.seviye),
        ozet:
          Number(hatalar.son5dk) > 0
            ? `Şu anda hata alınıyor · son 5 dk: ${sayi(hatalar.son5dk)}`
            : "Son 5 dakikada hata yok",
        satirlar: [
          { ad: "Son 5 dakika", deger: sayi(hatalar.son5dk), vurgu: Number(hatalar.son5dk) > 0 },
          { ad: "Son 1 saat", deger: sayi(hatalar.son1saat) },
          { ad: "Son hata anı", deger: tarih(hatalar.sonHataAni) },
        ],
        liste: Array.isArray(hatalar.enSikYollar)
          ? hatalar.enSikYollar.map((y: any) => `${y.yol} · ${y.adet}`)
          : [],
        not: "Sayaç bellekte tutulur; API yeniden başlatılınca sıfırlanır.",
      },
      {
        anahtar: "isler",
        baslik: "Zamanlanmış işler",
        ikon: Clock,
        seviye: seviye(isler.seviye),
        ozet: `${sayi(isler.adet)} iş kayıtlı`,
        isListesi: Array.isArray(isler.isler) ? isler.isler : [],
      },
      {
        anahtar: "disk",
        baslik: "Depolama",
        ikon: HardDrives,
        seviye: seviye(disk.seviye),
        ozet: disk.olculdu ? `%${sayi(disk.kullanimYuzde)} dolu` : "ölçülemedi",
        satirlar: [
          { ad: "Kullanılan", deger: disk.olculdu ? `${sayi(Math.round(Number(disk.kullanilanMb) / 1024))} GB` : "—" },
          { ad: "Boş", deger: disk.olculdu ? `${sayi(Math.round(Number(disk.bosMb) / 1024))} GB` : "—", vurgu: true },
          { ad: "Toplam", deger: disk.olculdu ? `${sayi(Math.round(Number(disk.toplamMb) / 1024))} GB` : "—" },
          { ad: "Dizin", deger: String(disk.yol ?? "—") },
        ],
      },
      {
        anahtar: "api",
        baslik: "API sunucusu",
        ikon: Cpu,
        seviye: seviye(api.seviye),
        ozet: `${sure(api.calismaSuresiSaniye)} çalışıyor`,
        satirlar: [
          { ad: "Çalışma süresi", deger: sure(api.calismaSuresiSaniye) },
          { ad: "Bellek kullanımı", deger: `${sayi(api.bellekMb)} MB` },
          { ad: "Çekirdek", deger: sayi(api.cekirdek) },
          { ad: "Yük ortalaması", deger: Array.isArray(api.yukOrtalamasi) ? api.yukOrtalamasi.join(" · ") : "—" },
          { ad: "Sürüm", deger: String(api.imajEtiketi ?? api.surum ?? "—") },
          { ad: "Saat dilimi", deger: String(api.saatDilimi ?? "—") },
        ],
      },
    ];
  }, [rapor]);

  const entegrasyonlar: Array<[string, boolean]> = useMemo(() => {
    const e = rapor?.entegrasyonlar;
    if (!e || typeof e !== "object") return [];
    const adlar: Record<string, string> = {
      iyzico: "iyzico (ödeme)",
      parasut: "Paraşüt (fatura)",
      smtp: "SMTP (e-posta)",
      whatsapp: "WhatsApp bildirimi",
      googleDrive: "Google Drive",
      metaCapi: "Meta Conversions API",
      dhl: "DHL kargo takibi",
      netgsm: "Netgsm (SMS)",
      r2: "Cloudflare R2",
    };
    return Object.entries(e).map(([k, v]) => [adlar[k] ?? k, Boolean(v)]);
  }, [rapor]);

  return (
    <AdminShell>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Sistem Sağlığı</h1>
          <p className="text-ink-500 text-sm mt-1">
            Sitenin gerçekten çalışıp çalışmadığını gösterir. Her {YENILEME_MS / 1000} saniyede
            kendiliğinden yenilenir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cek()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-paper-200 bg-white text-sm font-medium text-ink-700 hover:bg-paper-50 transition-colors"
        >
          <ArrowsClockwise size={16} weight="bold" />
          Yenile
        </button>
      </header>

      {/* Genel durum şeridi */}
      <div className={`rounded-xl border p-5 mb-6 ${stil.kutu}`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${stil.nokta} ${genel !== "saglikli" ? "animate-pulse" : ""}`} />
          <div className="flex-1">
            <p className={`text-lg font-semibold ${stil.yazi}`}>
              {yukleniyor ? "Durum okunuyor…" : `Genel durum: ${stil.ad}`}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">
              {rapor?.ulasilamadi
                ? "API'ye ulaşılamıyor — site şu anda büyük ihtimalle hizmet veremiyor."
                : hata
                  ? `Rapor alınamadı: ${hata}`
                  : `Son kontrol: ${sonCekim ? sonCekim.toLocaleTimeString("tr-TR") : "—"}`}
            </p>
          </div>
          <Heartbeat size={28} className={stil.yazi} weight="duotone" />
        </div>
        {rapor?.ulasilamadi && typeof rapor.hataMesaji === "string" && (
          <p className="mt-3 text-xs text-red-700 bg-red-100/60 rounded-lg px-3 py-2 break-all">
            {rapor.hataMesaji}
          </p>
        )}
      </div>

      {!rapor?.ulasilamadi && (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            {bolumler.map((b) => {
              const s = SEVIYE_STIL[b.seviye];
              const Ikon = b.ikon;
              return (
                <section key={b.anahtar} className="rounded-xl border border-paper-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Ikon size={20} className="text-ink-400" weight="duotone" />
                    <h2 className="font-semibold text-ink-900 flex-1">{b.baslik}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.kutu} ${s.yazi}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.nokta}`} />
                      {s.ad}
                    </span>
                  </div>

                  <p className="text-sm text-ink-600 mb-3">{b.ozet}</p>

                  {"satirlar" in b && Array.isArray(b.satirlar) && (
                    <dl className="divide-y divide-paper-100">
                      {b.satirlar.map((r: any) => (
                        <div key={r.ad} className="flex items-center justify-between gap-4 py-2">
                          <dt className="text-xs text-ink-500">{r.ad}</dt>
                          <dd
                            className={`text-sm tabular-nums ${r.vurgu ? "font-semibold text-ink-900" : "text-ink-700"}`}
                          >
                            {r.deger}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {"liste" in b && Array.isArray(b.liste) && b.liste.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {b.liste.map((satir: string) => (
                        <li key={satir} className="text-xs text-ink-600 font-mono break-all">
                          {satir}
                        </li>
                      ))}
                    </ul>
                  )}

                  {"isListesi" in b && Array.isArray(b.isListesi) && (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-ink-400 text-left">
                            <th className="font-medium py-1.5 px-1">İş</th>
                            <th className="font-medium py-1.5 px-1">Sonraki</th>
                            <th className="font-medium py-1.5 px-1">Son çalışma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-paper-100">
                          {b.isListesi.map((i: any) => (
                            <tr key={i.ad}>
                              <td className="py-1.5 px-1 text-ink-700 font-mono">{i.ad}</td>
                              <td className="py-1.5 px-1 text-ink-600 whitespace-nowrap">{tarih(i.sonrakiCalisma)}</td>
                              <td className="py-1.5 px-1 text-ink-500 whitespace-nowrap">
                                {i.sonCalisma ? tarih(i.sonCalisma) : "bu açılıştan beri koşmadı"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {"not" in b && b.not && (
                    <p className="mt-3 text-xs text-ink-500 bg-paper-50 rounded-lg px-3 py-2">{b.not}</p>
                  )}
                </section>
              );
            })}
          </div>

          {/* Entegrasyonlar: yalnız "yapılandırıldı mı" — anahtar/sır ASLA gösterilmez. */}
          {entegrasyonlar.length > 0 && (
            <section className="rounded-xl border border-paper-200 bg-white p-5 mt-5">
              <div className="flex items-center gap-3 mb-1">
                <Plugs size={20} className="text-ink-400" weight="duotone" />
                <h2 className="font-semibold text-ink-900">Entegrasyonlar</h2>
              </div>
              <p className="text-xs text-ink-500 mb-4">
                Yalnızca ayarların tanımlı olup olmadığını gösterir; servisin o an çalıştığını
                garanti etmez.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {entegrasyonlar.map(([ad, kurulu]) => (
                  <div
                    key={ad}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-paper-200 bg-paper-50/60"
                  >
                    {kurulu ? (
                      <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={16} weight="fill" className="text-ink-300 shrink-0" />
                    )}
                    <span className="text-sm text-ink-700 flex-1">{ad}</span>
                    <span className="text-[11px] text-ink-400">{kurulu ? "tanımlı" : "yok"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AdminShell>
  );
}
