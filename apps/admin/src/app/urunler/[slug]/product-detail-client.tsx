"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, FloppyDisk, Eye, Trash } from "@phosphor-icons/react";
import { ImageGallery } from "@/components/image-uploader";
import { updateProduct, removeProduct } from "./actions";
import { PricingStructureEditor } from "./pricing-structure-editor";
import { PricingGridEditor } from "./pricing-grid-editor";
import type { OptionInput, ApiPrice } from "@markala/api-client";

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
}

interface Props {
  product: ProductDetail;
  categories: CategoryRow[];
  pricing?: { options: OptionInput[]; prices: ApiPrice[] };
  pricingLoadError?: boolean;
  /** Aynı kategori+yapıdaki kardeş ürün sayısı — "Kategoriye Uygula" için. */
  siblingCount?: number;
}

export function ProductDetailClient({ product, categories, pricing, pricingLoadError, siblingCount = 0 }: Props) {
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
        isActive,
        images,
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
        {/* Sol: temel bilgiler + fiyat yönetimi */}
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

          {/* Fiyat Yönetimi — Konfigüratör Yapısı */}
          <Card title="Fiyat Yönetimi — Konfigüratör Yapısı">
            {pricingLoadError && (
              <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                ⚠️ Fiyat yönetimi yüklenemedi — mevcut yapı gösterilemiyor. Kaydetmeden önce sayfayı yenileyin; aksi hâlde tüm seçenek yapısı silinebilir.
              </div>
            )}
            <p className="text-xs text-ink-500 mb-4">
              Ürün seçenek gruplarını ve seçeneklerini buradan yönetin. Mevcut
              seçeneklerin key&apos;leri fiyat matrisine bağlı olduğu için
              korunur; yalnızca yeni eklenenlere label&apos;dan otomatik key
              atanır.
            </p>
            <PricingStructureEditor
              productId={(product as { id: string }).id}
              initialOptions={pricing?.options ?? []}
            />
          </Card>

          {/* Fiyat Yönetimi — Izgara */}
          <Card title="Fiyat Yönetimi — Izgara (Maliyet + Satış)">
            {pricingLoadError && (
              <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                ⚠️ Fiyat ızgarası yüklenemedi. Kaydetmeden önce sayfayı yenileyin.
              </div>
            )}
            <p className="text-xs text-ink-500 mb-4">
              Seçenek×boyut kombinasyonlarının satış ve maliyet fiyatlarını
              giriniz. Boş bırakılan hücreler satışa çıkmaz. Yapı kaydedilince
              ızgara otomatik güncellenir.
            </p>
            {/* key: yapı (options) değişince ızgara remount edilip hücreler yeni yapıya göre
                yeniden kurulur (router.refresh sonrası stale grid'i önler — final review). */}
            <PricingGridEditor
              key={JSON.stringify(pricing?.options ?? [])}
              productId={(product as unknown as { id: string }).id}
              options={pricing?.options ?? []}
              initialPrices={pricing?.prices ?? []}
              siblingCount={siblingCount}
            />
          </Card>

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
