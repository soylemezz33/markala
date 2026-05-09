"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ArrowLeft, Calculator, ArrowsClockwise, Warning } from "@phosphor-icons/react";
import { products, categories } from "@markala/mock-data";

export default function BulkPriceUpdatePage() {
  const [scope, setScope] = useState<"all" | "category">("all");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [op, setOp] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [round, setRound] = useState<"none" | "5" | "10" | "50" | "100">("10");

  const targetProducts =
    scope === "all" ? products : products.filter((p) => p.categorySlug === categorySlug);

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

  const previews = targetProducts.slice(0, 10).map((p) => {
    const current = p.startingPrice ?? p.basePrice;
    const next = computeNew(current);
    return { slug: p.slug, name: p.name, current, next, diff: next - current };
  });

  function applyChanges() {
    if (
      confirm(
        `${targetProducts.length} ürünün fiyatı güncellenecek.\n\nİşlem: ${
          direction === "increase" ? "Artır" : "Düşür"
        } · ${value}${op === "percent" ? "%" : " ₺"}\nYuvarlama: ${round === "none" ? "Yok" : `En yakın ${round} ₺`}\n\nDevam edilsin mi?`,
      )
    ) {
      alert(
        "Mock: Backend bağlandığında PATCH /api/products/bulk-price endpoint'ine istek atılacak.",
      );
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/urunler" className="p-2 rounded-md hover:bg-paper-100 text-ink-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-ink-900">Toplu Fiyat Güncelleme</h1>
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
              <span className="text-sm text-ink-900">Tüm ürünler ({products.length})</span>
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
                  <option key={c.slug} value={c.slug}>{c.name}</option>
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
              <label className="text-xs font-semibold uppercase text-ink-500">Yuvarlama</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value as typeof round)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
              >
                <option value="none">Yuvarlama yok</option>
                <option value="5">En yakın 5 ₺</option>
                <option value="10">En yakın 10 ₺</option>
                <option value="50">En yakın 50 ₺</option>
                <option value="100">En yakın 100 ₺</option>
              </select>
            </div>
          </Card>

          <Card title="Etkilenen Sayı">
            <div className="text-3xl font-semibold text-ink-900 tabular-nums">
              {targetProducts.length}
            </div>
            <div className="text-sm text-ink-500 mt-1">ürün güncellenecek</div>
            <button
              onClick={applyChanges}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-ink-900 text-paper-50 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-ink-700"
            >
              <Calculator size={14} weight="bold" /> Değişiklikleri Uygula
            </button>
            <div className="mt-3 flex items-start gap-2 text-[11px] text-ink-500">
              <Warning size={14} className="flex-none mt-0.5 text-warning" />
              <span>
                Bu işlem geri alınamaz. Backend bağlandığında işlem öncesi yedek snapshot alınır.
              </span>
            </div>
          </Card>
        </div>

        {/* Sağ: Önizleme */}
        <div className="lg:col-span-2">
          <Card title="Önizleme (ilk 10)">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Ürün</th>
                    <th className="text-right px-3 py-2 font-semibold">Mevcut</th>
                    <th className="text-right px-3 py-2 font-semibold">Yeni</th>
                    <th className="text-right px-3 py-2 font-semibold">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200">
                  {previews.map((p) => (
                    <tr key={p.slug} className="hover:bg-paper-100/40">
                      <td className="px-3 py-2.5 text-ink-900 font-medium truncate max-w-[300px]">{p.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">
                        {p.current.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ink-900">
                        {p.next.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums text-xs font-medium ${
                        p.diff > 0 ? "text-success" : p.diff < 0 ? "text-error" : "text-ink-500"
                      }`}>
                        {p.diff > 0 ? "+" : ""}{p.diff.toLocaleString("tr-TR")} ₺
                      </td>
                    </tr>
                  ))}
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
              <li>• <strong>Yıllık zam:</strong> Tüm ürünlerde +%15 → en yakın 10 ₺ yuvarla</li>
              <li>• <strong>Hammadde artışı:</strong> Sadece "Vinil Branda" kategorisinde +%8</li>
              <li>• <strong>Sezon kampanyası:</strong> "Kupa" kategorisinde -%20 → en yakın 5 ₺</li>
              <li>• <strong>Sabit komisyon:</strong> Tüm ürünlere +25 ₺ (yuvarlama yok)</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40">
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
