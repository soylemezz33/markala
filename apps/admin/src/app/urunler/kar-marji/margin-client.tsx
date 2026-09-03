"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { confirm } from "@/components/confirm-dialog";
import { Percent, FloppyDisk, Eye, CheckCircle, WarningCircle, Info } from "@phosphor-icons/react";
import { marjBilgisi, marjKaydet, marjUygula } from "./actions";
import type { MarginInfoDto, ApplyMarginResultDto } from "@markala/api-client";

interface Urun { id: string; slug: string; name: string; categoryId?: string; categorySlug?: string; profitMargin?: string | number | null }
interface Kategori { id: string; slug: string; name: string; profitMargin?: string | number | null }

const TL = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
/** 1.8 → "%80 kâr" */
const yuzde = (m: number) => `%${Math.round((m - 1) * 100)} kâr`;

export function MarginClient({
  products, categories, globalMarj,
}: { products: Urun[]; categories: Kategori[]; globalMarj: number | null }) {
  const [scope, setScope] = useState<"category" | "product">("category");
  const [targetId, setTargetId] = useState("");
  const [marj, setMarj] = useState("");
  const [bilgi, setBilgi] = useState<MarginInfoDto | null>(null);
  const [onizleme, setOnizleme] = useState<ApplyMarginResultDto | null>(null);
  const [mesaj, setMesaj] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const secilenKategori = categories.find((c) => c.id === targetId);
  const secilenUrun = products.find((p) => p.id === targetId);
  const kategoriUrunSayisi = useMemo(
    () => (scope === "category" && targetId ? products.filter((p) => p.categoryId === targetId).length : 0),
    [scope, targetId, products],
  );

  function secimDegisti(id: string) {
    setTargetId(id);
    setOnizleme(null);
    setMesaj(null);
    setBilgi(null);
    const mevcut = scope === "category"
      ? categories.find((c) => c.id === id)?.profitMargin
      : products.find((p) => p.id === id)?.profitMargin;
    setMarj(mevcut == null ? "" : String(Number(mevcut)));
    // Ürün seçiminde mevcut durum (etkin marj + gerçekleşen ortalama) API'den okunur.
    if (scope === "product" && id) start(async () => { try { setBilgi(await marjBilgisi(id)); } catch { /* sessiz */ } });
  }

  const kaydet = () =>
    start(async () => {
      setMesaj(null);
      const v = marj.trim() === "" ? null : Number(marj.replace(",", "."));
      if (v != null && (!Number.isFinite(v) || v < 1 || v > 20)) {
        setMesaj({ ok: false, text: "Marj 1 ile 20 arasında olmalı (örn. 1.8 = %80 kâr)." });
        return;
      }
      try {
        await marjKaydet({ scope, targetId, margin: v });
        setMesaj({ ok: true, text: v == null ? "Marj kaldırıldı, üst seviyeye düşecek." : `Marj kaydedildi: ${v} (${yuzde(v)}). Fiyatlar DEĞİŞMEDİ; uygulamak için aşağıdaki adımı kullanın.` });
        // Listedeki "(marj x)" etiketleri sunucudan gelir; yenilenmezse eski değer görünür.
        router.refresh();
        if (scope === "product") { try { setBilgi(await marjBilgisi(targetId)); } catch { /* sessiz */ } }
      } catch (e) {
        setMesaj({ ok: false, text: (e as Error).message || "Kaydedilemedi." });
      }
    });

  const onizle = () =>
    start(async () => {
      setMesaj(null);
      try {
        const v = marj.trim() === "" ? undefined : Number(marj.replace(",", "."));
        setOnizleme(await marjUygula({ scope, targetId, margin: v, dryRun: true }));
      } catch (e) {
        setMesaj({ ok: false, text: (e as Error).message || "Önizleme alınamadı." });
      }
    });

  const uygula = () =>
    start(async () => {
      const onay = await confirm({
        title: "Canlı satış fiyatları güncellenecek",
        description: "Bu işlem müşterinin gördüğü fiyatları anında değiştirir.",
        bullets: [`${onizleme?.degisecekSatir} fiyat satırı güncellenecek.`],
        confirmLabel: "Fiyatları güncelle",
        tone: "danger",
      });
      if (!onay) return;
      try {
        const v = marj.trim() === "" ? undefined : Number(marj.replace(",", "."));
        const r = await marjUygula({ scope, targetId, margin: v, dryRun: false });
        setMesaj({ ok: true, text: `${r.degisecekSatir} fiyat satırı güncellendi (marj ${r.marj}).` });
        setOnizleme(null);
      } catch (e) {
        setMesaj({ ok: false, text: (e as Error).message || "Uygulanamadı." });
      }
    });

  const inputCls = "w-full px-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-sm";

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 flex items-center gap-2">
          <Percent size={26} weight="duotone" className="text-brand-600" /> Kâr Marjı
        </h1>
        <p className="text-ink-500 text-sm mt-1">
          Satış fiyatı = maliyet × marj. Marj <strong>ürün</strong>, <strong>kategori</strong> veya{" "}
          <strong>global</strong> seviyede tanımlanır; en özel olan geçerlidir.
          {globalMarj != null && <> Şu anki global marj: <strong>{globalMarj}</strong> ({yuzde(globalMarj)}).</>}
        </p>
      </header>

      <div className="mb-5 flex items-start gap-3 p-4 rounded-lg border border-[#1565C0]/30 bg-[#1565C0]/5 text-sm text-ink-700">
        <Info size={18} weight="fill" className="flex-none text-[#1565C0] mt-0.5" />
        <p>
          Marjı kaydetmek fiyatları <strong>değiştirmez</strong>. Fiyatlar yalnız
          &quot;Fiyatları uygula&quot; dediğinizde maliyetten yeniden hesaplanır, öncesinde
          neyin değişeceğini önizlersiniz. Maliyet ve satış fiyatını ürün sayfasından elle
          girmeye devam edebilirsiniz.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sol: seçim + marj */}
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-5 space-y-4">
          <div>
            <span className="text-sm font-medium text-ink-900">Kapsam</span>
            <div className="mt-2 inline-flex rounded-lg border border-paper-200 p-0.5">
              {(["category", "product"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setScope(s); setTargetId(""); setMarj(""); setOnizleme(null); setBilgi(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium ${scope === s ? "bg-ink-900 text-paper-50" : "text-ink-700 hover:bg-paper-100"}`}
                >
                  {s === "category" ? "Kategori" : "Ürün"}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-ink-900">{scope === "category" ? "Kategori" : "Ürün"}</span>
            <select value={targetId} onChange={(e) => secimDegisti(e.target.value)} className={`${inputCls} mt-1.5`}>
              <option value="">, seçin, </option>
              {scope === "category"
                ? categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.profitMargin != null ? `  (marj ${Number(c.profitMargin)})` : ""}
                    </option>
                  ))
                : products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.profitMargin != null ? `  (marj ${Number(p.profitMargin)})` : ""}
                    </option>
                  ))}
            </select>
          </label>

          {scope === "category" && targetId && (
            <p className="text-xs text-ink-500">Bu kategoride {kategoriUrunSayisi} ürün var.</p>
          )}

          {bilgi && (
            <div className="rounded-lg bg-paper-100 p-3 text-xs space-y-1">
              <div className="font-semibold text-ink-900">Mevcut durum</div>
              <div>Ürün marjı: <strong>{bilgi.productMargin ?? "-"}</strong> · Kategori: <strong>{bilgi.categoryMargin ?? "-"}</strong> · Global: <strong>{bilgi.globalMargin ?? "-"}</strong></div>
              <div>Etkin marj: <strong>{bilgi.etkin}</strong> ({yuzde(bilgi.etkin)}), kaynak: <strong>{bilgi.kaynak}</strong></div>
              <div>
                Fiyatlardan hesaplanan gerçek marj:{" "}
                <strong>{bilgi.gerceklesenOrtalama ?? "maliyet girilmemiş"}</strong>
                {bilgi.gerceklesenOrtalama != null && <> ({yuzde(bilgi.gerceklesenOrtalama)})</>}
                {" · "}{bilgi.fiyatSatiri} fiyat satırı
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium text-ink-900">Marj çarpanı</span>
            <input
              value={marj}
              onChange={(e) => setMarj(e.target.value)}
              placeholder="örn. 1.8"
              inputMode="decimal"
              className={`${inputCls} mt-1.5 tabular-nums`}
            />
            <span className="mt-1 block text-xs text-ink-500">
              {marj && Number(marj.replace(",", ".")) >= 1
                ? `${Number(marj.replace(",", ".")).toFixed(2)} → ${yuzde(Number(marj.replace(",", ".")))} · 100 ₺ maliyet = ${TL(Number(marj.replace(",", ".")) * 100)} satış`
                : "Boş bırakırsanız marj kaldırılır (üst seviyeye düşer)."}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={kaydet}
              disabled={!targetId || pending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-900 text-paper-50 text-sm font-semibold disabled:opacity-40"
            >
              <FloppyDisk size={16} weight="bold" /> Marjı kaydet
            </button>
            <button
              type="button"
              onClick={onizle}
              disabled={!targetId || pending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 disabled:opacity-40"
            >
              <Eye size={16} weight="bold" /> Fiyatları önizle
            </button>
          </div>

          {mesaj && (
            <p className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${mesaj.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
              {mesaj.ok ? <CheckCircle size={16} weight="fill" className="flex-none mt-0.5" /> : <WarningCircle size={16} weight="fill" className="flex-none mt-0.5" />}
              <span>{mesaj.text}</span>
            </p>
          )}
        </div>

        {/* Sağ: önizleme */}
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-5">
          <h2 className="font-semibold text-ink-900">Önizleme</h2>
          {!onizleme ? (
            <p className="mt-2 text-sm text-ink-500">
              &quot;Fiyatları önizle&quot; dediğinizde hangi satırların nasıl değişeceği burada listelenir.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-700">
                Marj <strong>{onizleme.marj}</strong> ({onizleme.marjKaynagi}) · {onizleme.urunSayisi} ürün ·{" "}
                <strong>{onizleme.degisecekSatir}</strong> satır değişecek
                {onizleme.maliyetsizSatir > 0 && (
                  <> · <span className="text-warning">{onizleme.maliyetsizSatir} satır maliyetsiz olduğu için atlanacak</span></>
                )}
              </p>
              {onizleme.degisecekSatir > 0 && (
                <>
                  <div className="mt-3 max-h-[380px] overflow-y-auto rounded-lg border border-paper-200">
                    <table className="w-full text-xs">
                      <thead className="bg-paper-100 text-ink-500 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1.5">Ürün</th>
                          <th className="text-left px-2 py-1.5">Seçenek</th>
                          <th className="text-right px-2 py-1.5">Maliyet</th>
                          <th className="text-right px-2 py-1.5">Eski</th>
                          <th className="text-right px-2 py-1.5">Yeni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-200">
                        {onizleme.degisecek.map((d, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1.5 text-ink-700">{d.productSlug}</td>
                            <td className="px-2 py-1.5 text-ink-500">{d.option} {d.dim}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{TL(d.cost)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-ink-500 line-through">{TL(d.eskiFiyat)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-ink-900">{TL(d.yeniFiyat)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {onizleme.degisecek.length < onizleme.degisecekSatir && (
                    <p className="mt-2 text-xs text-ink-500">
                      Tabloda ilk {onizleme.degisecek.length} satır gösteriliyor; uygulama{" "}
                      {onizleme.degisecekSatir} satırın tamamını günceller.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={uygula}
                    disabled={pending}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold disabled:opacity-40"
                  >
                    <CheckCircle size={18} weight="bold" /> Fiyatları uygula ({onizleme.degisecekSatir} satır)
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
