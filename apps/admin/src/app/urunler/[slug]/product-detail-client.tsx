"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, FloppyDisk, Eye, Trash, ArrowsClockwise } from "@phosphor-icons/react";
import { ImageGallery } from "@/components/image-uploader";
import { updateProduct, removeProduct } from "./actions";

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
  const router = useRouter();
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
  const [isActive, setIsActive] = useState(product.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(product.seo?.title ?? "");
  const [seoDesc, setSeoDesc] = useState(product.seo?.description ?? "");
  const [keywords, setKeywords] = useState(
    (product.seo?.keywords ?? []).join(", "),
  );
  const [images, setImages] = useState<string[]>(product.images ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const matrixParam = product.parameters.find((p) => p.kind === "matrix");

  // Matris hücre fiyatları controlled state: anahtar `${rowId}-${colId}`, değer string (boş = satışta değil).
  const [cellPrices, setCellPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const cell of matrixParam?.cells ?? []) {
      init[`${cell.rowId}-${cell.colId}`] = cell.price != null ? String(cell.price) : "";
    }
    return init;
  });

  const setCell = (key: string, val: string) =>
    setCellPrices((prev) => ({ ...prev, [key]: val }));

  // "%X Toplu Artır" — mevcut (dolu) hücreleri oransal artırır. Sadece controlled state'i değiştirir,
  // değişiklik "Kaydet"e basınca uygulanır (sahte kayıt yok).
  function handleBulkIncrease() {
    const raw = window.prompt("Tüm dolu hücreleri yüzde kaç artıralım? (örn. 10)");
    if (raw == null) return;
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct === 0) {
      toast.error("Geçerli bir yüzde girin.");
      return;
    }
    setCellPrices((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v === "" || v == null) {
          next[k] = v;
          continue;
        }
        const base = Number(v);
        if (!Number.isFinite(base)) {
          next[k] = v;
          continue;
        }
        next[k] = String(Math.round(base * (1 + pct / 100) * 100) / 100);
      }
      return next;
    });
    toast.info(`Dolu hücreler %${pct} güncellendi. Kaydet'e basınca uygulanır.`);
  }

  /** Controlled matris state'inden updateProduct'a gönderilecek parameters dizisini üretir. */
  function buildParametersPayload() {
    if (!matrixParam) return undefined;
    const updatedMatrix = {
      ...matrixParam,
      cells: (matrixParam.cells ?? []).map((cell) => {
        const key = `${cell.rowId}-${cell.colId}`;
        const raw = cellPrices[key];
        const price = raw === "" || raw == null ? 0 : Number(raw);
        return { ...cell, price: Number.isFinite(price) ? price : 0 };
      }),
    };
    // Diğer parametreleri korur, yalnız matris parametresini günceller.
    return product.parameters.map((p) => (p.id === matrixParam.id ? updatedMatrix : p));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const parameters = buildParametersPayload();
      await updateProduct(product.id, {
        name,
        shortDescription: shortDesc,
        description,
        categoryId: categoryId || undefined,
        productionTime,
        startingPrice,
        bestseller,
        isActive,
        images,
        ...(parameters ? { parameters } : {}),
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

  function handleDelete() {
    if (!confirm(`"${product.name}" ürünü kalıcı olarak silinecek. Emin misiniz?`)) return;
    setDeleting(true);
    (async () => {
      try {
        await removeProduct(product.id);
        toast.success(`"${product.name}" silindi.`);
        router.push("/urunler");
      } catch {
        toast.error("Silme başarısız. Lütfen tekrar deneyin.");
        setDeleting(false);
      }
    })();
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
                          const key = `${r.id}-${c.id}`;
                          // Sadece tanımlı hücreler (cells'te var olan kombinasyonlar) düzenlenebilir;
                          // tanımsız kombinasyon "—" (salt-okunur) kalır.
                          const hasCell = matrixParam.cells?.some(
                            (x) => x.rowId === r.id && x.colId === c.id,
                          );
                          return (
                            <td key={c.id} className="px-1.5 py-1 text-center">
                              {hasCell ? (
                                <input
                                  type="number"
                                  value={cellPrices[key] ?? ""}
                                  onChange={(e) => setCell(key, e.target.value)}
                                  placeholder="—"
                                  className="w-20 px-1.5 py-1 rounded border border-paper-200 text-xs tabular-nums text-center focus:border-ink-900 focus:outline-none"
                                />
                              ) : (
                                <span className="text-ink-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {/* "Satır/Sütun Ekle" şimdilik yok: yeni eksen (id/etiket) tanımlama akışı
                    backend'de güvenli şekilde desteklenmiyor — yanlış vaat vermemek için gizli. */}
                <button
                  type="button"
                  onClick={handleBulkIncrease}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 ml-auto"
                >
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
              <Toggle checked={isActive} onChange={setIsActive} />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
              <span className="text-sm font-medium text-ink-900">
                Çok Satan rozeti
              </span>
              <Toggle checked={bestseller} onChange={setBestseller} />
            </label>
            {/* "Anasayfada öne çıkar" kaldırıldı: backend'de karşılığı yok (yanlış vaat vermemek için). */}
          </Card>

          <Card title="Görseller">
            <ImageGallery value={images} onChange={setImages} />
          </Card>

          <Card title="Tehlikeli Bölge">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium border border-error/30 text-error hover:bg-error/10 disabled:opacity-60"
            >
              <Trash size={14} /> {deleting ? "Siliniyor…" : "Ürünü Sil"}
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
