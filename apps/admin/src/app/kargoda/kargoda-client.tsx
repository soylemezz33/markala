"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, Truck, Image as ImageIcon, ArrowSquareOut, Copy, Factory, CheckCircle } from "@phosphor-icons/react";
import { toast } from "@/components/toast";

/**
 * Üretim & Kargo — istemci (2026-09-03).
 *
 * Tek amaç: atölyedeki kişi (kargo rolü) hangi işin hangi aşamada olduğunu KALEM KALEM GÖRSELİYLE
 * görsün: "Üretime hazır" (tasarım onaylandı → üretime alınacak), "Üretimde" (bitince kargoya
 * verilecek), "Kargoda" (takip no). Görsel önceliği: tasarımcının yüklediği ÖNİZLEME (en yeni) →
 * müşterinin yüklediği dosya (yalnız JPG/PNG ise) → yer tutucu ikon.
 *
 * Görseller admin BFF'sinden gelir (/api/tasarim-onizleme/<key>): API ucu auth ister, düz <img src>
 * Authorization gönderemez; BFF çerezle kimliklenir ve yalnız jpg/png servis eder.
 */

export interface KargoKalem {
  id?: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  uploadedFileUrl?: string | null;
  uploadedFileName?: string | null;
  designUploads?: Array<{ id: string; kind: string; fileName: string; fileUrl: string; createdAt: string }>;
}

export interface KargoSiparis {
  id: string;
  orderNumber: string;
  customerName?: string | null;
  email?: string | null;
  createdAt: string;
  shippedAt?: string | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  items: KargoKalem[];
}

type Sekme = "uretime-hazir" | "uretimde" | "kargoda";

/** Dosya URL'inden depolama anahtarını (uuid.uzantı) çıkarır; BFF aynı deseni doğrular. */
function anahtar(url: string | null | undefined): string | undefined {
  const key = String(url ?? "").split("?")[0]?.split("/").pop();
  return key && /^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/i.test(key) ? key : undefined;
}
const GORSEL_EXT = /\.(jpe?g|png)$/i;

/** Kalem için gösterilecek görselin BFF yolu; yoksa undefined (yer tutucu basılır). */
function kalemGorseli(k: KargoKalem): { src: string; kaynak: "onizleme" | "musteri" } | undefined {
  const onizleme = [...(k.designUploads ?? [])]
    .filter((d) => d.kind === "onizleme")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const k1 = anahtar(onizleme?.fileUrl);
  if (k1 && GORSEL_EXT.test(k1)) return { src: `/api/tasarim-onizleme/${k1}`, kaynak: "onizleme" };
  // Set başına müşteri dosyaları (kind=musteri): ilk görsel olan
  for (const d of k.designUploads ?? []) {
    if (d.kind !== "musteri") continue;
    const km = anahtar(d.fileUrl);
    if (km && GORSEL_EXT.test(km)) return { src: `/api/tasarim-onizleme/${km}`, kaynak: "musteri" };
  }
  const k2 = anahtar(k.uploadedFileUrl);
  if (k2 && GORSEL_EXT.test(k2)) return { src: `/api/tasarim-onizleme/${k2}`, kaynak: "musteri" };
  return undefined;
}

const tarih = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const SEKMELER: Array<{ id: Sekme; label: string; Icon: typeof Truck; aciklama: string }> = [
  { id: "uretime-hazir", label: "Üretime hazır", Icon: CheckCircle, aciklama: "Tasarımı onaylanmış, üretime alınmayı bekleyen siparişler. Detaydan 'Üretimde' yapın." },
  { id: "uretimde", label: "Üretimde", Icon: Factory, aciklama: "Basılan/hazırlanan siparişler. Bitince detaydan takip numarasıyla 'Kargoda' yapın." },
  { id: "kargoda", label: "Kargoda", Icon: Truck, aciklama: "Kargoya verilmiş siparişler; görsele bakıp paketi eşleştirin." },
];

export function KargodaClient({ uretimeHazir, uretimde, kargoda }: { uretimeHazir: KargoSiparis[]; uretimde: KargoSiparis[]; kargoda: KargoSiparis[] }) {
  const [q, setQ] = useState("");
  const [sekme, setSekme] = useState<Sekme>(() => (uretimeHazir.length ? "uretime-hazir" : uretimde.length ? "uretimde" : "kargoda"));
  const kaynak: Record<Sekme, KargoSiparis[]> = { "uretime-hazir": uretimeHazir, uretimde, kargoda };

  const liste = useMemo(() => {
    const orders = kaynak[sekme];
    const s = q.trim().toLocaleLowerCase("tr");
    const filtreli = s
      ? orders.filter((o) =>
          [o.orderNumber, o.customerName, o.email, o.trackingNumber, ...o.items.map((i) => i.productName)]
            .filter(Boolean)
            .some((v) => String(v).toLocaleLowerCase("tr").includes(s)),
        )
      : orders;
    // Kargoda: en son kargoya verilen üstte; diğer sekmelerde en eski üstte (sırada bekleyen önce).
    return [...filtreli].sort((a, b) =>
      sekme === "kargoda"
        ? ((b.shippedAt ?? b.createdAt) < (a.shippedAt ?? a.createdAt) ? -1 : 1)
        : (a.createdAt < b.createdAt ? -1 : 1),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uretimeHazir, uretimde, kargoda, sekme, q]);

  const kalemSayisi = liste.reduce((n, o) => n + o.items.reduce((m, i) => m + (i.quantity || 1), 0), 0);
  const aktif = SEKMELER.find((s) => s.id === sekme)!;

  const kopyala = (v: string) => {
    navigator.clipboard?.writeText(v).then(
      () => toast.success("Takip numarası kopyalandı"),
      () => toast.error("Kopyalanamadı"),
    );
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink-900 flex items-center gap-2">
            <Factory size={26} weight="duotone" className="text-brand-700" /> Üretim &amp; Kargo
          </h1>
          <p className="mt-1 text-sm text-ink-500">{aktif.aciklama}</p>
        </div>
        <label className="relative block w-full max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sipariş no, müşteri, takip no, ürün…"
            className="w-full rounded-lg border border-paper-300 bg-paper-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-500"
          />
        </label>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={sekme === s.id}
            onClick={() => setSekme(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              sekme === s.id ? "bg-ink-900 text-paper-50 border-ink-900" : "border-paper-300 text-ink-700 hover:bg-paper-100"
            }`}
          >
            <s.Icon size={15} weight={sekme === s.id ? "fill" : "regular"} />
            {s.label}
            <span className={`ml-0.5 rounded-full px-1.5 text-[11px] ${sekme === s.id ? "bg-paper-50/20" : "bg-paper-200 text-ink-700"}`}>
              {kaynak[s.id].length}
            </span>
          </button>
        ))}
        <span className="text-xs text-ink-500">{liste.length} sipariş · {kalemSayisi} adet ürün</span>
      </div>

      {liste.length === 0 ? (
        <div className="rounded-xl border border-dashed border-paper-300 p-10 text-center text-sm text-ink-500">
          {q ? "Aramayla eşleşen sipariş yok." : "Bu sekmede sipariş yok."}
        </div>
      ) : (
        <div className="space-y-4">
          {liste.map((o) => (
            <section key={o.id} className="rounded-xl border border-paper-200 bg-white p-4 md:p-5">
              <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-paper-100 pb-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link href={`/siparisler/${o.id}`} className="font-mono text-base font-semibold text-ink-900 hover:text-brand-700">
                    {o.orderNumber}
                  </Link>
                  <span className="text-sm text-ink-700">{o.customerName || o.email || "—"}</span>
                  <span className="text-xs text-ink-500">
                    {sekme === "kargoda" ? `Kargoya veriliş: ${tarih(o.shippedAt)}` : `Sipariş: ${tarih(o.createdAt)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {sekme === "kargoda" && (
                    <>
                      <span className="text-ink-500">{o.trackingCarrier || "Kargo firması yok"}</span>
                      {o.trackingNumber ? (
                        <button
                          type="button"
                          onClick={() => kopyala(o.trackingNumber!)}
                          title="Takip numarasını kopyala"
                          className="inline-flex items-center gap-1 rounded-md border border-paper-300 bg-paper-50 px-2 py-1 font-mono text-xs text-ink-900 hover:border-ink-500"
                        >
                          {o.trackingNumber} <Copy size={13} />
                        </button>
                      ) : (
                        <span className="rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">Takip no girilmemiş</span>
                      )}
                    </>
                  )}
                  <Link
                    href={`/siparisler/${o.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-paper-50 hover:bg-ink-700"
                  >
                    {sekme === "uretime-hazir" ? "Üretime al" : sekme === "uretimde" ? "Kargoya ver" : "Detay"} <ArrowSquareOut size={13} />
                  </Link>
                </div>
              </header>

              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {o.items.map((k, i) => {
                  const g = kalemGorseli(k);
                  return (
                    <li key={k.id ?? i} className="flex gap-3 rounded-lg border border-paper-100 bg-paper-50 p-2">
                      {g ? (
                        <a href={g.src} target="_blank" rel="noreferrer" className="shrink-0" title="Büyüt">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.src} alt="" className="h-24 w-24 rounded-md border border-paper-200 bg-white object-contain" loading="lazy" />
                        </a>
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-paper-300 bg-white text-ink-300">
                          <ImageIcon size={26} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink-500">#{i + 1}</p>
                        <p className="truncate text-sm font-medium text-ink-900" title={k.productName}>{k.productName}</p>
                        <p className="text-sm text-ink-700">{k.quantity} adet</p>
                        <p className="mt-1 text-[11px] text-ink-500">
                          {g?.kaynak === "onizleme" ? "Tasarımcı önizlemesi" : g?.kaynak === "musteri" ? "Müşteri dosyası" : "Görsel yok"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
