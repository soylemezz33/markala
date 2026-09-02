"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, Truck, Image as ImageIcon, ArrowSquareOut, Copy } from "@phosphor-icons/react";
import { toast } from "@/components/toast";

/**
 * Kargodaki ürünler — istemci (2026-09-03).
 *
 * Tek amaç: kargoya verilmiş her siparişi kalem kalem GÖRSELİYLE göstermek; operatör
 * paketin üstündeki görselle ekrandakini eşleştirip "bu kimin" sorusunu saniyede kapatsın.
 * Görsel önceliği: tasarımcının yüklediği ÖNİZLEME (en yeni) → müşterinin yüklediği dosya
 * (yalnız JPG/PNG ise; PDF/AI önizlenemez) → yer tutucu ikon.
 *
 * Görseller admin BFF'sinden gelir (/api/tasarim-onizleme/<key>): API ucu auth ister,
 * düz <img src> Authorization gönderemez; BFF çerezle kimliklenir ve yalnız jpg/png servis eder.
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
  const k2 = anahtar(k.uploadedFileUrl);
  if (k2 && GORSEL_EXT.test(k2)) return { src: `/api/tasarim-onizleme/${k2}`, kaynak: "musteri" };
  return undefined;
}

const tarih = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

export function KargodaClient({ orders }: { orders: KargoSiparis[] }) {
  const [q, setQ] = useState("");

  const liste = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    const filtreli = s
      ? orders.filter((o) =>
          [o.orderNumber, o.customerName, o.email, o.trackingNumber, ...o.items.map((i) => i.productName)]
            .filter(Boolean)
            .some((v) => String(v).toLocaleLowerCase("tr").includes(s)),
        )
      : orders;
    // En son kargoya verilen üstte; shippedAt yoksa sipariş tarihine düş.
    return [...filtreli].sort((a, b) =>
      (b.shippedAt ?? b.createdAt) < (a.shippedAt ?? a.createdAt) ? -1 : 1,
    );
  }, [orders, q]);

  const kalemSayisi = liste.reduce((n, o) => n + o.items.reduce((m, i) => m + (i.quantity || 1), 0), 0);

  const kopyala = (v: string) => {
    navigator.clipboard?.writeText(v).then(
      () => toast.success("Takip numarası kopyalandı"),
      () => toast.error("Kopyalanamadı"),
    );
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink-900 flex items-center gap-2">
            <Truck size={26} weight="duotone" className="text-brand-700" /> Kargodaki Ürünler
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Kargoya verilmiş {liste.length} sipariş · {kalemSayisi} adet ürün. Görsele bakıp paketi eşleştirin;
            durum değişikliği sipariş detayından yapılır.
          </p>
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

      {liste.length === 0 ? (
        <div className="rounded-xl border border-dashed border-paper-300 p-10 text-center text-sm text-ink-500">
          {q ? "Aramayla eşleşen kargodaki sipariş yok." : "Şu anda kargoda sipariş yok."}
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
                  <span className="text-xs text-ink-500">Kargoya veriliş: {tarih(o.shippedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
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
                  <Link
                    href={`/siparisler/${o.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-paper-100"
                  >
                    Detay <ArrowSquareOut size={13} />
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
