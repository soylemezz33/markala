"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, Calculator, ArrowsClockwise, Warning, Tag } from "@phosphor-icons/react";
import { bulkAdjustPrices, categorySetPrices } from "./actions";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  basePrice: unknown;
  startingPrice?: unknown | null;
  displayPrice?: number | null; // GERÇEK fiyat = min(product_prices); bulkAdjust SADECE bunu olan ürünleri etkiler
  category?: { id: string; slug: string; name: string } | null;
}

interface Props {
  products: ProductRow[];
  categories: CategoryRow[];
}

export function BulkPriceClient({ products, categories }: Props) {
  const [scope, setScope] = useState<"all" | "category">("all");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [op, setOp] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [round, setRound] = useState<"none" | "1" | "5" | "10">("10");
  const [applying, setApplying] = useState(false);

  // Kategori-tek-fiyat state
  const [setCatSlug, setSetCatSlug] = useState(categories[0]?.slug ?? "");
  const [setPrice, setSetPrice] = useState(0);
  const [isPending, startTransition] = useTransition();

  const targetProducts =
    scope === "all"
      ? products
      : products.filter((p) => p.category?.slug === categorySlug);

  const computeNew = (current: number) => {
    let result = current;
    if (op === "percent") {
      const factor = 1 + (direction === "increase" ? 1 : -1) * (value / 100);
      result = current * factor;
    } else {
      result = current + (direction === "increase" ? 1 : -1) * value;
    }
    if (round !== "none") {
      const r = Number(round);
      result = Math.round(result / r) * r;
    }
    return Math.max(0, Math.round(result));
  };

  // bulkAdjust SADECE fiyatı girilmiş (product_prices satırı olan) ürünleri çarpar.
  // Fiyatsız ürünler etkilenmez → sayım ve önizleme bunu dürüstçe göstermeli.
  const pricedTargets = targetProducts.filter((p) => (p.displayPrice ?? 0) > 0);
  const previews = targetProducts.slice(0, 10).map((p) => {
    const current = p.displayPrice ?? 0;
    const hasPrice = current > 0;
    const next = hasPrice ? computeNew(current) : 0;
    return { slug: p.slug, name: p.name, current, next, diff: next - current, hasPrice };
  });

  async function applyChanges() {
    if (pricedTargets.length === 0) {
      toast.error("Kapsamda fiyatı girilmiş ürün yok — toplu zam/indirim mevcut fiyatı çarpar. Önce fiyat girin.");
      return;
    }
    if (
      !confirm(
        `${pricedTargets.length} fiyatlı ürün güncellenecek (fiyatsız ürünler etkilenmez).\n\nİşlem: ${
          direction === "increase" ? "Artır" : "Düşür"
        } · ${value}${op === "percent" ? "%" : " ₺"}\nYuvarlama: ${round === "none" ? "Yok" : `En yakın ${round} ₺`}\n\nDevam edilsin mi?`,
      )
    ) {
      return;
    }

    setApplying(true);
    try {
      const res = await bulkAdjustPrices({
        scope,
        categoryId:
          scope === "category"
            ? categories.find((c) => c.slug === categorySlug)?.id
            : undefined,
        op,
        direction,
        value,
        round,
      });
      if (res.updated === 0) {
        toast.error("Güncellenen fiyat satırı yok — kapsam boş olabilir.");
      } else {
        toast.success(`${res.updated} fiyat satırı güncellendi.`);
      }
    } catch {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setApplying(false);
    }
  }

  function applyCategorySet() {
    const catId = categories.find((c) => c.slug === setCatSlug)?.id;
    if (!catId) return;
    if (
      !confirm(
        `"${categories.find((c) => c.slug === setCatSlug)?.name}" kategorisindeki basit ürünlerin fiyatı ${setPrice} ₺ yapılacak.\n\nDevam edilsin mi?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await categorySetPrices({ categoryId: catId, price: setPrice });
        toast.success(`${res.set} basit ürün fiyatlandı, ${res.skipped} seçenekli ürün atlandı.`);
      } catch {
        toast.error("Kategori fiyatlandırması sırasında hata oluştu.");
      }
    });
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/urunler"
          className="p-2 rounded-md hover:bg-paper-100 text-ink-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-ink-900">
            Toplu Fiyat Güncelleme
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Kategori veya tüm ürünlerde yüzde ya da sabit tutar bazlı güncelleme
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: Form */}
        <div className="lg:col-span-1 space-y-5">
          <Card title="Kapsam">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="radio"
                checked={scope === "all"}
                onChange={() => setScope("all")}
              />
              <span className="text-sm text-ink-900">
                Tüm ürünler ({products.length})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={scope === "category"}
                onChange={() => setScope("category")}
              />
              <span className="text-sm text-ink-900">Belirli kategori</span>
            </label>
            {scope === "category" && (
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="mt-3 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Card>

          <Card title="İşlem">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setDirection("increase")}
                className={`py-2 rounded-md text-sm font-semibold ${
                  direction === "increase"
                    ? "bg-success text-paper-50"
                    : "bg-paper-100 text-ink-700 hover:bg-paper-200"
                }`}
              >
                ↑ Artır
              </button>
              <button
                onClick={() => setDirection("decrease")}
                className={`py-2 rounded-md text-sm font-semibold ${
                  direction === "decrease"
                    ? "bg-error text-paper-50"
                    : "bg-paper-100 text-ink-700 hover:bg-paper-200"
                }`}
              >
                ↓ Düşür
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm tabular-nums"
              />
              <select
                value={op}
                onChange={(e) => setOp(e.target.value as "percent" | "fixed")}
                className="px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
              >
                <option value="percent">%</option>
                <option value="fixed">₺</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                Yuvarlama
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value as typeof round)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
              >
                <option value="none">Yuvarlama yok</option>
                <option value="1">En yakın 1 ₺</option>
                <option value="5">En yakın 5 ₺</option>
                <option value="10">En yakın 10 ₺</option>
              </select>
            </div>
          </Card>

          <Card title="Etkilenen Sayı">
            <div className="text-3xl font-semibold text-ink-900 tabular-nums">
              {pricedTargets.length}
            </div>
            <div className="text-sm text-ink-500 mt-1">
              fiyatlı ürün güncellenecek
              {targetProducts.length !== pricedTargets.length && (
                <span className="text-ink-400">
                  {" "}· kapsamda toplam {targetProducts.length}
                  {" "}({targetProducts.length - pricedTargets.length} fiyatsız, etkilenmez)
                </span>
              )}
            </div>
            <button
              onClick={applyChanges}
              disabled={applying}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-ink-900 text-paper-50 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-ink-700 disabled:opacity-60"
            >
              <Calculator size={14} weight="bold" />
              {applying ? "Uygulanıyor…" : "Değişiklikleri Uygula"}
            </button>
            <div className="mt-3 flex items-start gap-2 text-[11px] text-ink-500">
              <Warning size={14} className="flex-none mt-0.5 text-warning" />
              <span>
                Bu işlem geri alınamaz. <strong>Yalnız fiyatı girilmiş</strong> ürünlerin
                mevcut fiyatı referans alınır (zam/indirim). Fiyatsız ürünler için önce fiyat
                girin. Değişiklik siteye otomatik yansır.
              </span>
            </div>
          </Card>

          {/* İSG katalog ipucu — bu sayfa fiyat SET etmez, ÇARPArr */}
          <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 text-[12px] text-ink-700 leading-relaxed">
            <strong className="text-brand-700 block mb-1">Fiyatı sıfırdan mı gireceksiniz?</strong>
            Bu sayfa mevcut fiyatlara <strong>zam/indirim</strong> uygular. Seçenekli (İSG levha
            vb.) ürünlerin fiyatını ilk kez girmek için: bir ürünün <strong>Fiyat ızgarasını</strong>{" "}
            doldurun, ardından <strong>“Kategoriye Uygula”</strong> ile aynı yapıdaki tüm kategori
            ürünlerine kopyalayın.
          </div>

          {/* Kategori Tek Fiyat */}
          <Card title="Kategoriye Tek Fiyat">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500 block mb-1">
                  Kategori
                </label>
                <select
                  value={setCatSlug}
                  onChange={(e) => setSetCatSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500 block mb-1">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  min={0}
                  value={setPrice}
                  onChange={(e) => setSetPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm tabular-nums"
                />
              </div>
              <button
                onClick={applyCategorySet}
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 bg-ink-900 text-paper-50 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-ink-700 disabled:opacity-60"
              >
                <Tag size={14} weight="bold" />
                {isPending ? "Uygulanıyor…" : "Uygula"}
              </button>
              <div className="flex items-start gap-2 text-[11px] text-ink-500">
                <Warning size={14} className="flex-none mt-0.5 text-warning" />
                <span>
                  Yalnız seçeneksiz (basit) ürünlere uygulanır; matrisli/konfigüratörlü ürünler atlanır.
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sağ: Önizleme */}
        <div className="lg:col-span-2">
          <Card title={`Önizleme — ${targetProducts.length} ürün etkilenecek`}>
            {targetProducts.length > 10 && (
              <div className="mb-3 px-3 py-2 rounded-md bg-warning/10 border border-warning/20 text-[12px] text-warning font-semibold flex items-center gap-2">
                <Warning size={14} className="flex-none" />
                {targetProducts.length} ürün etkilenecek — aşağıda ilk 10 önizlemesi gösterilmektedir.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Ürün</th>
                    <th className="text-right px-3 py-2 font-semibold">
                      Mevcut
                    </th>
                    <th className="text-right px-3 py-2 font-semibold">Yeni</th>
                    <th className="text-right px-3 py-2 font-semibold">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {previews.map((p) =>
                    p.hasPrice ? (
                      <tr key={p.slug} className="hover:bg-paper-100/40">
                        <td className="px-3 py-2.5 text-ink-900 font-medium truncate max-w-[300px]">
                          {p.name}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">
                          {p.current.toLocaleString("tr-TR")} ₺
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ink-900">
                          {p.next.toLocaleString("tr-TR")} ₺
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right tabular-nums text-xs font-medium ${
                            p.diff > 0
                              ? "text-success"
                              : p.diff < 0
                                ? "text-error"
                                : "text-ink-500"
                          }`}
                        >
                          {p.diff > 0 ? "+" : ""}
                          {p.diff.toLocaleString("tr-TR")} ₺
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.slug} className="hover:bg-paper-100/40">
                        <td className="px-3 py-2.5 text-ink-500 truncate max-w-[300px]">
                          {p.name}
                        </td>
                        <td colSpan={3} className="px-3 py-2.5 text-right text-[11px] font-medium text-warning">
                          fiyatsız — etkilenmez
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            {targetProducts.length > 10 && (
              <p className="mt-3 text-xs text-ink-500 text-center">
                ... ve {targetProducts.length - 10} ürün daha
              </p>
            )}
          </Card>

          <div className="mt-5 p-5 bg-paper-100 border border-paper-200 rounded-lg text-sm text-ink-700">
            <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
              <ArrowsClockwise size={16} className="text-brand-700" />
              İpucu — Toplu Güncelleme Senaryoları
            </h3>
            <ul className="space-y-1.5 text-xs leading-relaxed">
              <li>
                • <strong>Yıllık zam:</strong> Tüm ürünlerde +%15 → en yakın 10
                ₺ yuvarla
              </li>
              <li>
                • <strong>Hammadde artışı:</strong> Sadece "Vinil Branda"
                kategorisinde +%8
              </li>
              <li>
                • <strong>Sezon kampanyası:</strong> "Kupa" kategorisinde -%20 →
                en yakın 5 ₺
              </li>
              <li>
                • <strong>Sabit komisyon:</strong> Tüm ürünlere +25 ₺ (yuvarlama
                yok)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40">
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
