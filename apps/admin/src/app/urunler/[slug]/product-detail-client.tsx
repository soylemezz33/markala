"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, FloppyDisk, Eye, Trash, Plus, ArrowsClockwise } from "@phosphor-icons/react";
import { updateProduct } from "./actions";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  shortDescription: string;
  description: string;
  basePrice: unknown;
  startingPrice?: unknown | null;
  productionTime: string;
  bestseller?: boolean;
  isActive?: boolean;
  categoryId?: string | null;
  category?: { id: string; slug: string; name: string } | null;
  images: string[];
  seo?: { title?: string; description?: string; keywords?: string[] } | null;
  parameters: Array<{
    id: string;
    kind: string;
    label: string;
    rows?: Array<{ id: string; label: string; sublabel?: string; group?: string }>;
    cols?: Array<{ id: string; label: string }>;
    cells?: Array<{ id: string; rowId: string; colId: string; price: number }>;
  }>;
}

interface Props {
  product: ProductDetail;
  categories: CategoryRow[];
}

export function ProductDetailClient({ product, categories }: Props) {
  const [name, setName] = useState(product.name);
  const [shortDesc, setShortDesc] = useState(product.shortDescription);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(
    product.categoryId ?? product.category?.id ?? "",
  );
  const [productionTime, setProductionTime] = useState(product.productionTime);
  const [startingPrice, setStartingPrice] = useState(
    Number(product.startingPrice ?? product.basePrice),
  );
  const [bestseller, setBestseller] = useState(product.bestseller ?? false);
  const [seoTitle, setSeoTitle] = useState(product.seo?.title ?? "");
  const [seoDesc, setSeoDesc] = useState(product.seo?.description ?? "");
  const [keywords, setKeywords] = useState(
    (product.seo?.keywords ?? []).join(", "),
  );
  const [saving, setSaving] = useState(false);

  const matrixParam = product.parameters.find((p) => p.kind === "matrix");

  async function handleSave() {
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name,
        shortDescription: shortDesc,
        description,
        categoryId: categoryId || undefined,
        productionTime,
        startingPrice,
        bestseller,
        seo: {
          title: seoTitle,
          description: seoDesc,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        },
      });
      toast.success("Değişiklikler kaydedildi.");
    } catch {
      toast.error("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/urunler"
            className="p-2 rounded-md hover:bg-paper-100 text-ink-700"
            aria-label="Geri"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink-900">
              {product.name}
            </h1>
            <p className="text-xs text-ink-500 font-mono">
              {product.slug} · {product.sku ?? "SKU yok"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`https://markala.com.tr/urun/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100"
          >
            <Eye size={14} /> Sitede Gör
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700 disabled:opacity-60"
          >
            <FloppyDisk size={14} weight="bold" />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: temel bilgiler + matrix */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Temel Bilgiler">
            <Field label="Ürün Adı">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Kısa Açıklama (listelerde gösterilir)">
              <input
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Tam Açıklama (HTML/Markdown destekli)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Kategori">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Seçiniz —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Üretim Süresi">
                <input
                  value={productionTime}
                  onChange={(e) => setProductionTime(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Başlangıç Fiyatı (TL)">
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(Number(e.target.value))}
                  className={inputCls + " tabular-nums"}
                />
              </Field>
            </div>
          </Card>

          {/* Matrix Editor */}
          {matrixParam && (
            <Card title="Fiyat Matrisi (Paket × Adet)">
              <p className="text-xs text-ink-500 mb-3">
                Tabloda her hücre düzenlenebilir. Yapılan değişiklikler
                "Kaydet"e basınca uygulanır. Boş bırakırsanız o kombinasyon
                satışa çıkmaz (— işareti).
              </p>
              <div className="overflow-x-auto border border-paper-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-paper-100/60 text-ink-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-paper-100/60 z-10">
                        Paket / Ebat
                      </th>
                      {matrixParam.cols?.map((c) => (
                        <th
                          key={c.id}
                          className="text-center px-2 py-2 font-semibold whitespace-nowrap"
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {matrixParam.rows?.map((r) => (
                      <tr key={r.id} className="hover:bg-paper-100/40">
                        <th
                          scope="row"
                          className="text-left px-3 py-2 font-medium text-ink-900 sticky left-0 bg-paper-50"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs">
                              {r.group && (
                                <span className="text-[9px] text-brand-700 font-bold mr-1">
                                  [{r.group}]
                                </span>
                              )}
                              {r.label}
                            </span>
                            {r.sublabel && (
                              <span className="text-[10px] text-ink-500 font-normal mt-0.5 max-w-[300px] truncate">
                                {r.sublabel}
                              </span>
                            )}
                          </div>
                        </th>
                        {matrixParam.cols?.map((c) => {
                          const cell = matrixParam.cells?.find(
                            (x) => x.rowId === r.id && x.colId === c.id,
                          );
                          return (
                            <td key={c.id} className="px-1.5 py-1 text-center">
                              <input
                                type="number"
                                defaultValue={cell?.price ?? ""}
                                placeholder="—"
                                className="w-20 px-1.5 py-1 rounded border border-paper-200 text-xs tabular-nums text-center focus:border-ink-900 focus:outline-none"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
                  <Plus size={12} weight="bold" /> Satır Ekle
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
                  <Plus size={12} weight="bold" /> Sütun Ekle
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 ml-auto">
                  <ArrowsClockwise size={12} weight="bold" /> %X Toplu Artır
                </button>
              </div>
            </Card>
          )}

          {/* SEO */}
          <Card title="SEO Ayarları">
            <Field label="SEO Başlık (önerilen 50-60 karakter)">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className={inputCls}
              />
              <span className="text-[11px] text-ink-500 mt-1 block">
                {seoTitle.length}/60 karakter
              </span>
            </Field>
            <Field label="Meta Açıklama (önerilen 140-160 karakter)">
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                rows={3}
                className={inputCls}
              />
              <span className="text-[11px] text-ink-500 mt-1 block">
                {seoDesc.length}/160 karakter
              </span>
            </Field>
            <Field label="Anahtar Kelimeler (virgülle ayrılmış)">
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>
          </Card>
        </div>

        {/* Sağ: durum + görseller + ekstra */}
        <div className="space-y-5">
          <Card title="Yayın Durumu">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm font-medium text-ink-900">Yayında</span>
              <Toggle checked={product.isActive ?? true} onChange={() => {}} />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
              <span className="text-sm font-medium text-ink-900">
                Çok Satan rozeti
              </span>
              <Toggle checked={bestseller} onChange={setBestseller} />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
              <span className="text-sm font-medium text-ink-900">
                Anasayfada öne çıkar
              </span>
              <Toggle checked={false} onChange={() => {}} />
            </label>
          </Card>

          <Card title="Görseller">
            <div className="grid grid-cols-3 gap-2">
              {product.images.slice(0, 6).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={
                    img.startsWith("http") || img.startsWith("/api")
                      ? img
                      : `https://markala.com.tr${img}`
                  }
                  alt={`${product.name} ${i + 1}`}
                  className="aspect-square object-cover rounded border border-paper-200"
                />
              ))}
            </div>
            <button className="mt-3 w-full py-2 rounded border-2 border-dashed border-paper-200 text-xs text-ink-500 hover:border-ink-300 hover:bg-paper-100">
              + Yeni görsel yükle (R2)
            </button>
          </Card>

          <Card title="Tehlikeli Bölge">
            <button
              onClick={() =>
                confirm(`"${product.name}" ürünü silinecek. Emin misiniz?`)
              }
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium border border-error/30 text-error hover:bg-error/10"
            >
              <Trash size={14} /> Ürünü Sil
            </button>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
        {label}
      </span>
      {children}
    </label>
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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-none ${
        checked ? "bg-brand-500" : "bg-paper-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
